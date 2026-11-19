
/**
 * Реестр тайлов и пространственных данных Fauxlore.
 *
 * Отвечает за:
 * - хранение информации о тайлах;
 * - поиск тайлов по координатам;
 * - поиск провинций по постоянному ID;
 * - определение тайлов, в которых находится провинция;
 * - получение списка провинций, затрагивающих область карты;
 * - устранение повторяющихся province_id.
 *
 * Не отвечает за:
 * - сетевую загрузку GeoJSON;
 * - отрисовку Leaflet;
 * - выбор и подсветку провинций;
 * - игровые данные.
 *
 * Все координаты bounds и bbox:
 * [minX, minY, maxX, maxY]
 *
 * Система координат:
 * пиксели исходного изображения, начало сверху слева.
 */

/**
 * Проверяет корректность ограничивающего прямоугольника.
 */
function isValidBounds(bounds) {
    return (
        Array.isArray(bounds) &&
        bounds.length === 4 &&
        bounds.every(Number.isFinite) &&
        bounds[0] <= bounds[2] &&
        bounds[1] <= bounds[3]
    );
}

/**
 * Проверяет пересечение двух прямоугольников.
 */
function boundsIntersect(a, b) {
    return !(
        a[2] < b[0] ||
        a[0] > b[2] ||
        a[3] < b[1] ||
        a[1] > b[3]
    );
}

/**
 * Проверяет, содержит ли прямоугольник точку.
 */
function boundsContainPoint(bounds, x, y) {
    return (
        x >= bounds[0] &&
        x <= bounds[2] &&
        y >= bounds[1] &&
        y <= bounds[3]
    );
}

/**
 * Создаёт реестр пространственных данных.
 *
 * @param {Object} options
 * @param {Object} options.loader
 *   Экземпляр ProvincePackageLoader.
 *
 * @returns {Promise<Object>} Готовый реестр.
 */
export async function createProvinceTileRegistry({ loader } = {}) {
    if (!loader || typeof loader.loadMetadata !== 'function') {
        throw new Error(
            'ProvinceTileRegistry: необходим корректный loader.'
        );
    }

    // Получаем метаданные пакета.
    // Сами GeoJSON-тайлы здесь не загружаются.
    const metadata = await loader.loadMetadata();

    const { tileManifest, spatialIndex } = metadata;

    if (!Array.isArray(tileManifest?.tiles)) {
        throw new Error(
            'ProvinceTileRegistry: в tile_manifest отсутствует массив tiles.'
        );
    }

    if (
        !spatialIndex?.provinces ||
        typeof spatialIndex.provinces !== 'object'
    ) {
        throw new Error(
            'ProvinceTileRegistry: некорректный spatial index.'
        );
    }

    // Реестр тайлов по их ID.
    const tiles = new Map();

    // Реестр провинций по постоянному province_id.
    const provinces = new Map();

    /**
     * Регистрируем тайлы.
     */
    for (const tile of tileManifest.tiles) {
        if (
            !tile ||
            typeof tile.tile_id !== 'string' ||
            !isValidBounds(tile.bounds)
        ) {
            throw new Error(
                'ProvinceTileRegistry: обнаружена некорректная запись тайла.'
            );
        }

        if (tiles.has(tile.tile_id)) {
            throw new Error(
                `ProvinceTileRegistry: повторный ID тайла ${tile.tile_id}.`
            );
        }

        tiles.set(tile.tile_id, {
            id: tile.tile_id,
            path: tile.path,
            bounds: [...tile.bounds],
            featureFragments: tile.feature_fragments,
            uniqueSourceComponents: tile.unique_source_components,
        });
    }

    /**
     * Регистрируем провинции.
     */
    for (const [provinceId, province] of Object.entries(
        spatialIndex.provinces
    )) {
        if (
            !province ||
            !isValidBounds(province.bbox) ||
            !Array.isArray(province.tile_ids)
        ) {
            throw new Error(
                `ProvinceTileRegistry: некорректная запись ${provinceId}.`
            );
        }

        // Проверяем, что все указанные тайлы существуют.
        const missingTiles = province.tile_ids.filter(
            (tileId) => !tiles.has(tileId)
        );

        if (missingTiles.length > 0) {
            throw new Error(
                `ProvinceTileRegistry: провинция ${provinceId} ссылается на отсутствующие тайлы: ${missingTiles.join(', ')}.`
            );
        }

        provinces.set(provinceId, {
            id: provinceId,
            bbox: [...province.bbox],
            tileIds: [...province.tile_ids],
            provinceClass: province.province_class,
            regionRole: province.region_role,
            reviewStatus: province.review_status,
        });
    }

    /**
     * Получить информацию о тайле.
     */
    function getTile(tileId) {
        return tiles.get(tileId) ?? null;
    }

    /**
     * Получить информацию о провинции.
     */
    function getProvince(provinceId) {
        return provinces.get(provinceId) ?? null;
    }

    /**
     * Получить все зарегистрированные тайлы.
     */
    function getAllTiles() {
        return Array.from(tiles.values());
    }

    /**
     * Получить все зарегистрированные провинции.
     */
    function getAllProvinces() {
        return Array.from(provinces.values());
    }

    /**
     * Найти тайлы, пересекающие заданную область.
     *
     * bounds:
     * [minX, minY, maxX, maxY]
     *
     * Координаты исходного изображения.
     */
    function getTilesForBounds(bounds) {
        if (!isValidBounds(bounds)) {
            throw new Error(
                'ProvinceTileRegistry: переданы некорректные bounds.'
            );
        }

        const result = [];

        for (const tile of tiles.values()) {
            if (boundsIntersect(tile.bounds, bounds)) {
                result.push(tile);
            }
        }

        return result;
    }

    /**
     * Найти ID тайлов, пересекающих область.
     */
    function getTileIdsForBounds(bounds) {
        return getTilesForBounds(bounds).map((tile) => tile.id);
    }

    /**
     * Найти тайл, содержащий указанную точку.
     *
     * В некоторых случаях точка на границе может
     * принадлежать сразу нескольким тайлам.
     * Поэтому возвращается массив.
     */
    function getTilesForPoint(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error(
                'ProvinceTileRegistry: координаты точки должны быть числами.'
            );
        }

        const result = [];

        for (const tile of tiles.values()) {
            if (boundsContainPoint(tile.bounds, x, y)) {
                result.push(tile);
            }
        }

        return result;
    }

    /**
     * Получить ID тайлов, в которых находится провинция.
     */
    function getTileIdsForProvince(provinceId) {
        const province = getProvince(provinceId);

        return province ? [...province.tileIds] : [];
    }

    /**
     * Получить уникальные ID провинций,
     * находящихся в заданных тайлах.
     */
    function getProvinceIdsForTiles(tileIds) {
        if (!Array.isArray(tileIds)) {
            throw new Error(
                'ProvinceTileRegistry: tileIds должен быть массивом.'
            );
        }

        const result = new Set();

        for (const tileId of tileIds) {
            const tile = getTile(tileId);

            if (!tile) {
                continue;
            }

            // Проверяем пространственный индекс.
            for (const [provinceId, province] of provinces) {
                if (province.tileIds.includes(tileId)) {
                    result.add(provinceId);
                }
            }
        }

        return Array.from(result);
    }

    /**
     * Получить провинции, чьи bbox пересекают область.
     *
     * Сначала определяем подходящие тайлы,
     * затем отбираем провинции по bbox.
     *
     * Это быстрый предварительный поиск.
     * Точную принадлежность точки полигону
     * будет определять отдельная геометрическая логика.
     */
    function getProvinceIdsForBounds(bounds) {
        const tileIds = getTileIdsForBounds(bounds);

        const candidates = getProvinceIdsForTiles(tileIds);

        return candidates.filter((provinceId) => {
            const province = getProvince(provinceId);

            return (
                province &&
                boundsIntersect(province.bbox, bounds)
            );
        });
    }

    /**
     * Получить провинции, содержащие точку в своём bbox.
     *
     * Это ещё не проверка попадания внутрь полигона.
     */
    function getProvinceIdsForPoint(x, y) {
        const tilesAtPoint = getTilesForPoint(x, y);
        const tileIds = tilesAtPoint.map((tile) => tile.id);

        const candidates = getProvinceIdsForTiles(tileIds);

        return candidates.filter((provinceId) => {
            const province = getProvince(provinceId);

            return (
                province &&
                boundsContainPoint(province.bbox, x, y)
            );
        });
    }

    /**
     * Статистика реестра.
     */
    function getStats() {
        let multiTileProvinces = 0;

        for (const province of provinces.values()) {
            if (province.tileIds.length > 1) {
                multiTileProvinces += 1;
            }
        }

        return {
            tileCount: tiles.size,
            provinceCount: provinces.size,
            multiTileProvinces,
        };
    }

    return {
        getTile,
        getProvince,

        getAllTiles,
        getAllProvinces,

        getTilesForBounds,
        getTileIdsForBounds,
        getTilesForPoint,

        getTileIdsForProvince,
        getProvinceIdsForTiles,
        getProvinceIdsForBounds,
        getProvinceIdsForPoint,

        getStats,
    };
}
