
/**
 * Рендерер геометрии провинций Fauxlore.
 *
 * Отвечает за:
 * - определение видимой области карты;
 * - получение необходимых тайлов через Registry;
 * - загрузку GeoJSON через PackageLoader;
 * - создание Leaflet-слоёв;
 * - связь геометрических фрагментов с province_id;
 * - выделение и снятие выделения провинций;
 * - обработку нажатий на провинции.
 *
 * Не отвечает за:
 * - хранение игровых данных;
 * - поиск по названиям;
 * - владение территориями;
 * - управление режимами карты.
 */

import {
    WORLD_WIDTH,
    WORLD_HEIGHT,
} from './new-world-coordinates.js';

/**
 * Преобразует координаты исходного PNG
 * в систему координат Leaflet CRS.Simple.
 *
 * Исходная система:
 * [x, y] — начало сверху слева, Y вниз.
 *
 * Leaflet:
 * [x, WORLD_HEIGHT - y] — Y вверх.
 */
function transformCoordinatesToLeaflet(coordinates) {
    if (typeof coordinates[0] === 'number') {
        const [x, y, ...rest] = coordinates;

        return [
            x,
            WORLD_HEIGHT - y,
            ...rest,
        ];
    }

    return coordinates.map(transformCoordinatesToLeaflet);
}

/**
 * Создаёт копию GeoJSON Feature
 * с координатами, преобразованными для Leaflet.
 *
 * Исходные данные не изменяются.
 */
function transformFeatureToLeaflet(feature) {
    return {
        ...feature,
        geometry: {
            ...feature.geometry,
            coordinates: transformCoordinatesToLeaflet(
                feature.geometry.coordinates
            ),
        },
    };
}
/**
 * Создаёт рендерер провинций.
 *
 * @param {Object} options
 * @param {Object} options.map
 *   Экземпляр Leaflet-карты.
 *
 * @param {Object} options.loader
 *   Экземпляр ProvincePackageLoader.
 *
 * @param {Object} options.registry
 *   Экземпляр ProvinceTileRegistry.
 *
 * @param {Function} options.style
 *   Функция оформления GeoJSON.
 *
 * @param {Function} options.onProvinceClick
 *   Обработчик нажатия на провинцию.
 *
 * @param {Function} options.onTileError
 *   Обработчик ошибки загрузки тайла.
 */
export function createProvinceRenderer({
    map,
    loader,
    registry,
    paneName = 'newProvincePane',
    paneZIndex = 420,
    style = () => ({
        color: '#d8d0e8',
        weight: 1,
        opacity: 0.8,
        fillColor: '#8b72a8',
        fillOpacity: 0.15,
    }),
    onProvinceClick = null,
    onTileError = null,
} = {}) {
    if (!map || typeof map.getBounds !== 'function') {
        throw new Error(
            'ProvinceRenderer: необходим экземпляр Leaflet-карты.'
        );
    }

    if (!loader || typeof loader.loadTileById !== 'function') {
        throw new Error(
            'ProvinceRenderer: необходим ProvincePackageLoader.'
        );
    }

    if (!registry || typeof registry.getTilesForBounds !== 'function') {
        throw new Error(
            'ProvinceRenderer: необходим ProvinceTileRegistry.'
        );
    }

        // Отдельный слой Leaflet для новой геометрии.
    // Он располагается выше старого слоя провинций (zIndex 410).
    let provincePane = map.getPane(paneName);

    if (!provincePane) {
        provincePane = map.createPane(paneName);
    }

    provincePane.style.zIndex = String(paneZIndex);
    provincePane.style.pointerEvents = 'auto';
    
    // Leaflet-слои отдельных тайлов.
    const tileLayers = new Map();

    // Активные запросы тайлов.
    const pendingTiles = new Map();

    // Связь постоянного ID провинции с её фрагментами.
    const provinceLayers = new Map();

    // Последняя выделенная провинция.
    let highlightedProvinceId = null;
    // Защита от гонок при одновременном выборе провинций.
    let highlightRequestId = 0;

    // Управление видимостью всей новой геометрии.
    let visible = true;

    // После destroy новые операции запрещены.
    let destroyed = false;

    /**
     * Преобразует границы Leaflet в координаты изображения.
     *
     * Leaflet CRS.Simple:
     * [lat, lng]
     *
     * Координаты изображения:
     * [x, y]
     */
    function getImageBounds() {
        const bounds = map.getBounds();

        const west = Math.max(0, bounds.getWest());
        const east = Math.min(WORLD_WIDTH, bounds.getEast());

        const north = Math.min(
            WORLD_HEIGHT,
            bounds.getNorth()
        );

        const south = Math.max(
            0,
            bounds.getSouth()
        );

        return [
            west,
            WORLD_HEIGHT - north,
            east,
            WORLD_HEIGHT - south,
        ];
    }

    /**
     * Создаёт стиль провинции.
     *
     * Если провинция выделена, применяем
     * специальное оформление.
     */
    function getFeatureStyle(feature) {
        const provinceId = feature?.properties?.province_id;

        if (provinceId === highlightedProvinceId) {
            return {
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillColor: '#c9a7ff',
                fillOpacity: 0.55,
            };
        }

        return style(feature);
    }

    /**
     * Добавляет Leaflet-слой в реестр провинций.
     */
    function registerProvinceLayer(provinceId, layer) {
        if (!provinceId) {
            return;
        }

        if (!provinceLayers.has(provinceId)) {
            provinceLayers.set(provinceId, []);
        }

        provinceLayers.get(provinceId).push(layer);
    }

    /**
     * Создаёт Leaflet GeoJSON-слой для тайла.
     */
    function createTileLayer(tileId, geojson) {
        const leafletGeoJSON = {
            ...geojson,
            features: geojson.features.map(transformFeatureToLeaflet),
        };

        const layer = L.geoJSON(leafletGeoJSON, {
            pane: paneName,
            style: getFeatureStyle,

            onEachFeature(feature, featureLayer) {
                const provinceId =
                    feature?.properties?.province_id;

                registerProvinceLayer(
                    provinceId,
                    featureLayer
                );

                if (typeof onProvinceClick === 'function') {
                    featureLayer.on('click', (event) => {
                        onProvinceClick({
                            provinceId,
                            feature,
                            layer: featureLayer,
                            event,
                        });
                    });
                }
            },
        });

        return layer;
    }

    /**
     * Загружает и отображает один тайл.
     *
     * Если тайл уже отображён или загружается,
     * повторная операция не создаётся.
     */
    async function loadAndRenderTile(tileId) {
        if (destroyed) {
            return null;
        }

        if (tileLayers.has(tileId)) {
            return tileLayers.get(tileId);
        }

        if (pendingTiles.has(tileId)) {
            return pendingTiles.get(tileId);
        }

        const requestPromise = (async () => {
            try {
                const geojson = await loader.loadTileById(tileId);

                if (destroyed) {
                    return null;
                }

                const layer = createTileLayer(
                    tileId,
                    geojson
                );

                tileLayers.set(tileId, layer);

                if (visible) {
                    layer.addTo(map);
                }

                return layer;
            } catch (error) {
                if (typeof onTileError === 'function') {
                    onTileError({
                        tileId,
                        error,
                    });
                }

                throw error;
            } finally {
                pendingTiles.delete(tileId);
            }
        })();

        pendingTiles.set(tileId, requestPromise);

        return requestPromise;
    }
    
    /**
     * Загружает все тайлы, в которых находится провинция.
     *
     * Провинция может пересекать несколько тайлов.
     * Поэтому одного загруженного фрагмента недостаточно.
     *
     * @param {string} provinceId
     * @returns {Promise<Array>}
     */
    async function loadProvince(provinceId) {
        if (destroyed) {
            return [];
        }

        const tileIds = registry.getTileIdsForProvince(provinceId);

        if (!tileIds || tileIds.length === 0) {
            return [];
        }

        const results = await Promise.allSettled(
            tileIds.map((tileId) => loadAndRenderTile(tileId))
        );

        if (destroyed) {
            return [];
        }

        const failedTiles = results
            .map((result, index) => ({
                result,
                tileId: tileIds[index],
            }))
            .filter(({ result }) => result.status === 'rejected');

        if (failedTiles.length > 0) {
            console.warn(
                `ProvinceRenderer: не удалось загрузить ${failedTiles.length} тайлов провинции ${provinceId}.`,
                failedTiles
            );
        }

        return provinceLayers.get(provinceId) ?? [];
    }

    /**
     * Загружает все тайлы, пересекающие
     * текущую область просмотра.
     */
    async function refreshVisibleTiles() {
        if (destroyed || !visible) {
            return [];
        }

        const bounds = getImageBounds();

        const tiles = registry.getTilesForBounds(bounds);

        const results = await Promise.allSettled(
            tiles.map((tile) => loadAndRenderTile(tile.id))
        );

        return results;
    }

/**
 * Выделяет провинцию по постоянному ID.
 *
 * Перед выделением загружает все её фрагменты.
 *
 * @param {string} provinceId
 * @returns {Promise<boolean>}
 */
async function highlightProvince(provinceId) {
    if (destroyed || !provinceId) {
        return false;
    }

    const requestId = ++highlightRequestId;

    const layers = await loadProvince(provinceId);

    // Защита от устаревшего запроса.
    if (
        destroyed ||
        requestId !== highlightRequestId
    ) {
        return false;
    }

    if (layers.length === 0) {
        return false;
    }

    resetHighlight();

    highlightedProvinceId = provinceId;

    for (const layer of layers) {
        layer.setStyle({
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillColor: '#c9a7ff',
            fillOpacity: 0.55,
        });

        if (typeof layer.bringToFront === 'function') {
            layer.bringToFront();
        }
    }

    return true;
}

    /**
     * Внутренний сброс выделения.
     */
    function resetHighlight() {
        if (!highlightedProvinceId) {
            return;
        }

        const layers = provinceLayers.get(highlightedProvinceId);

        if (layers) {
            for (const layer of layers) {
                layer.setStyle(style(layer.feature));
            }
        }

        highlightedProvinceId = null;
    }

    /**
     * Публичный сброс выделения.
     */
    function clearHighlight() {
        highlightRequestId += 1;
        resetHighlight();
    }

    /**
     * Получает Leaflet-слои провинции.
     */
    function getProvinceLayers(provinceId) {
        return provinceLayers.get(provinceId) ?? [];
    }

    /**
     * Проверяет, отображён ли тайл.
     */
    function isTileRendered(tileId) {
        return tileLayers.has(tileId);
    }

    /**
     * Показывает или скрывает новую геометрию.
     */
    function setVisible(nextVisible) {
        visible = Boolean(nextVisible);

        if (visible) {
            for (const layer of tileLayers.values()) {
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                }
            }

            refreshVisibleTiles();
        } else {
            for (const layer of tileLayers.values()) {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            }
        }
    }

        /**
     * Перемещает карту к провинции по её пространственному индексу.
     *
     * Bbox хранится в координатах исходного PNG:
     * [minX, minY, maxX, maxY].
     */
    function focusProvince(provinceId, options = {}) {
        const province = registry.getProvince(provinceId);

        if (!province) {
            return false;
        }

        const [minX, minY, maxX, maxY] = province.bbox;

        const leafletBounds = [
            [WORLD_HEIGHT - maxY, minX],
            [WORLD_HEIGHT - minY, maxX],
        ];

        map.fitBounds(leafletBounds, {
            padding: [40, 40],
            maxZoom: 3,
            ...options,
        });

        return true;
    }

    /**
     * Возвращает статистику рендерера.
     */
    function getStats() {
        return {
            renderedTiles: tileLayers.size,
            pendingTiles: pendingTiles.size,
            registeredProvinces: provinceLayers.size,
            highlightedProvinceId,
            visible,
        };
    }

    /**
     * Полностью уничтожает рендерер.
     *
     * Удаляет обработчики событий и слои.
     */
    function destroy() {
        highlightRequestId += 1;
        destroyed = true;

        map.off('moveend', refreshVisibleTiles);

        for (const layer of tileLayers.values()) {
            map.removeLayer(layer);
        }

        tileLayers.clear();
        provinceLayers.clear();
        pendingTiles.clear();

        highlightedProvinceId = null;
    }

    // При перемещении и масштабировании карты
    // проверяем, нужны ли дополнительные тайлы.
    map.on('moveend', refreshVisibleTiles);

    // Первоначальная загрузка видимой области.
    refreshVisibleTiles();

    return {
        refreshVisibleTiles,
        loadAndRenderTile,
        loadProvince,

        highlightProvince,
        clearHighlight,
        focusProvince,
        getProvinceLayers,

        isTileRendered,
        setVisible,

        getStats,
        destroy,
    };
}
