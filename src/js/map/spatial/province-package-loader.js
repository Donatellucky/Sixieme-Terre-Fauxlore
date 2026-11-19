
/**
 * Загрузчик геометрического пакета провинций Fauxlore.
 *
 * Отвечает за:
 * - загрузку основного манифеста;
 * - загрузку манифеста тайлов;
 * - загрузку отдельных GeoJSON-тайлов;
 * - кэширование загруженных тайлов;
 * - предотвращение повторных параллельных запросов;
 * - обработку ошибок и повторную загрузку.
 *
 * Не отвечает за:
 * - отрисовку Leaflet;
 * - определение видимых тайлов;
 * - выбор провинций;
 * - игровые данные и владение территориями.
 */

const DEFAULT_PATHS = {
    manifest: 'release/manifest.json',
    tileManifest: 'tiled_release/tile_manifest.json',
    spatialIndex: 'topology/province_spatial_index.json',
    tiles: 'tiled_release/tiles',
};

/**
 * Создаёт загрузчик геометрического пакета.
 *
 * @param {Object} options
 * @param {string} options.baseUrl
 *   Путь к корневой папке геометрического пакета.
 *
 * @param {Function} options.fetchImpl
 *   Функция загрузки. По умолчанию используется fetch браузера.
 *
 * @param {Object} options.paths
 *   Пути к манифестам и папке тайлов.
 *
 * @returns {Object} API загрузчика.
 */
export function createProvincePackageLoader({
    baseUrl,
    fetchImpl = fetch,
    paths = {},
} = {}) {
    if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
        throw new Error(
            'ProvincePackageLoader: необходимо указать baseUrl.'
        );
    }

    if (typeof fetchImpl !== 'function') {
        throw new Error(
            'ProvincePackageLoader: fetchImpl должен быть функцией.'
        );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    const packagePaths = {
        ...DEFAULT_PATHS,
        ...paths,
    };

    // Кэш успешно загруженных тайлов.
    const tileCache = new Map();

    // Активные запросы тайлов.
    // Нужен, чтобы два одновременных запроса
    // одного тайла использовали одну загрузку.
    const pendingTiles = new Map();

    // Кэш манифестов.
    let manifestPromise = null;
    let tileManifestPromise = null;
    let spatialIndexPromise = null;

    /**
     * Формирует полный путь к файлу пакета.
     */
    function buildUrl(path) {
        const normalizedPath = String(path).replace(/^\/+/, '');

        return `${normalizedBaseUrl}/${normalizedPath}`;
    }

    /**
     * Загружает JSON и проверяет HTTP-ответ.
     */
    async function fetchJson(path) {
        const url = buildUrl(path);

        let response;

        try {
            response = await fetchImpl(url);
        } catch (error) {
            throw new Error(
                `Не удалось выполнить запрос: ${url}`,
                { cause: error }
            );
        }

        if (!response.ok) {
            throw new Error(
                `Ошибка загрузки ${url}: HTTP ${response.status}`
            );
        }

        try {
            return await response.json();
        } catch (error) {
            throw new Error(
                `Не удалось прочитать JSON: ${url}`,
                { cause: error }
            );
        }
    }

    /**
     * Загружает основной манифест пакета.
     *
     * Содержит общую информацию о геометрии.
     */
    function loadManifest() {
        if (!manifestPromise) {
            manifestPromise = fetchJson(packagePaths.manifest)
                .catch((error) => {
                    // При ошибке разрешаем повторную попытку.
                    manifestPromise = null;
                    throw error;
                });
        }

        return manifestPromise;
    }

    /**
     * Загружает манифест тайлов.
     *
     * Содержит информацию о разбиении карты на тайлы.
     */
    function loadTileManifest() {
        if (!tileManifestPromise) {
            tileManifestPromise = fetchJson(
                packagePaths.tileManifest
            ).catch((error) => {
                // При ошибке разрешаем повторную попытку.
                tileManifestPromise = null;
                throw error;
            });
        }

        return tileManifestPromise;
    }

    function loadSpatialIndex() {
        if (!spatialIndexPromise) {
            spatialIndexPromise = fetchJson(packagePaths.spatialIndex)
                .catch((error) => {
                    spatialIndexPromise = null;
                    throw error;
                });
        }

        return spatialIndexPromise;
    }

    /**
     * Загружает оба манифеста.
     */
    async function loadMetadata() {
        const [manifest, tileManifest, spatialIndex] = await Promise.all([
            loadManifest(),
            loadTileManifest(),
            loadSpatialIndex(),
        ]);

        return {
            manifest,
            tileManifest,
            spatialIndex,
        };
    }

    /**
     * Формирует идентификатор тайла.
     *
     * Внутренний формат:
     * x_y
     *
     * Например:
     * 3_5
     */
    function createTileId(x, y) {
        if (
            !Number.isInteger(x) ||
            !Number.isInteger(y) ||
            x < 0 ||
            y < 0
        ) {
            throw new Error(
                `Некорректные координаты тайла: x=${x}, y=${y}`
            );
        }

        return `${x}_${y}`;
    }

    /**
     * Формирует путь к GeoJSON тайла.
     *
     * Важно:
     * ID тайла записывается как x_y,
     * а путь к файлу имеет порядок y/x.
     *
     * tiled_release/tiles/{y}/{x}.geojson
     */
    function getTileUrl(x, y) {
        createTileId(x, y);

        return buildUrl(
            `${packagePaths.tiles}/${y}/${x}.geojson`
        );
    }

    /**
     * Проверяет загруженную геометрию.
     */
    function validateTile(data, tileId) {
        if (!data || typeof data !== 'object') {
            throw new Error(
                `Тайл ${tileId}: получены некорректные данные.`
            );
        }

        if (data.type !== 'FeatureCollection') {
            throw new Error(
                `Тайл ${tileId}: ожидался GeoJSON FeatureCollection.`
            );
        }

        if (!Array.isArray(data.features)) {
            throw new Error(
                `Тайл ${tileId}: отсутствует массив features.`
            );
        }

        return data;
    }

    /**
     * Загружает один тайл.
     *
     * Повторный запрос уже загруженного тайла
     * возвращает данные из кэша.
     *
     * Одновременные запросы одного тайла
     * используют один Promise.
     */
    async function loadTile(x, y) {
        const tileId = createTileId(x, y);

        // Тайлы, которые уже загружены.
        if (tileCache.has(tileId)) {
            return tileCache.get(tileId);
        }

        // Тайлы, которые уже загружаются.
        if (pendingTiles.has(tileId)) {
            return pendingTiles.get(tileId);
        }

        const url = getTileUrl(x, y);

        const requestPromise = (async () => {
            try {
                const response = await fetchImpl(url);

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data = await response.json();

                validateTile(data, tileId);

                tileCache.set(tileId, data);

                return data;
            } catch (error) {
                throw new Error(
                    `Не удалось загрузить тайл ${tileId}: ${error.message}`,
                    { cause: error }
                );
            } finally {
                pendingTiles.delete(tileId);
            }
        })();

        pendingTiles.set(tileId, requestPromise);

        return requestPromise;
    }

    /**
     * Загружает тайл по строковому ID.
     *
     * Например:
     * loadTileById('3_5')
     */
    function loadTileById(tileId) {
        if (typeof tileId !== 'string') {
            throw new Error(
                'ID тайла должен быть строкой.'
            );
        }

        const match = tileId.match(/^(\d+)_(\d+)$/);

        if (!match) {
            throw new Error(
                `Некорректный ID тайла: ${tileId}`
            );
        }

        const x = Number(match[1]);
        const y = Number(match[2]);

        return loadTile(x, y);
    }

    /**
     * Проверяет, находится ли тайл в кэше.
     */
    function isTileCached(x, y) {
        return tileCache.has(createTileId(x, y));
    }

    /**
     * Удаляет один тайл из кэша.
     *
     * Используется при необходимости освободить память
     * или принудительно обновить геометрию.
     */
    function removeTileFromCache(x, y) {
        const tileId = createTileId(x, y);

        return tileCache.delete(tileId);
    }

    /**
     * Полностью очищает кэш загруженных тайлов.
     *
     * Уже выполняющиеся запросы не отменяются.
     */
    function clearTileCache() {
        tileCache.clear();
    }

    /**
     * Возвращает статистику загрузчика.
     */
    function getStats() {
        return {
            cachedTiles: tileCache.size,
            pendingTiles: pendingTiles.size,
            manifestsLoaded: Boolean(manifestPromise),
            tileManifestLoaded: Boolean(tileManifestPromise),
        };
    }

    return {
        loadManifest,
        loadTileManifest,
        loadSpatialIndex,
        loadMetadata,

        loadTile,
        loadTileById,

        getTileUrl,
        createTileId,

        isTileCached,
        removeTileFromCache,
        clearTileCache,

        getStats,
    };
}
