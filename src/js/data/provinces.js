
import { transformFeatureCollection } from './coords-transform.js';

let provinceLayer = null;
let currentHighlight = null;
let provinceFeatures = [];

let provinceMap = null;
let zoomHandler = null;

// ===== СТИЛИ ПРОВИНЦИЙ =====

const NORMAL_STYLE = {
    color: '#8b0000',
    fillColor: '#ffb6c1',
    fillOpacity: 0.4
};

const HOVER_STYLE = {
    color: '#ff6666',
    fillOpacity: 0.6,
    weight: 2.5
};

const SELECTED_STYLE = {
    color: '#ffaa00',
    fillOpacity: 0.7,
    weight: 3
};

// Толщина обычного контура зависит от масштаба.
function getOutlineWeight(map) {
    const zoom = map.getZoom();

    const minZoom = -2;
    const maxZoom = 3;
    const minWeight = 0.8;
    const maxWeight = 2.2;

    const weight = minWeight +
        (zoom - minZoom) *
        (maxWeight - minWeight) /
        (maxZoom - minZoom);

    return Math.min(maxWeight, Math.max(minWeight, weight));
}

function getNormalStyle() {
    return {
        ...NORMAL_STYLE,
        weight: provinceMap
            ? getOutlineWeight(provinceMap)
            : 1.5
    };
}

function resetProvinceStyle(layer) {
    if (!layer) return;

    layer.setStyle(getNormalStyle());
}

function applySelectedStyle(layer) {
    if (!layer) return;

    layer.setStyle(SELECTED_STYLE);
}

// ===== ЕДИНОЕ СОСТОЯНИЕ ВЫДЕЛЕНИЯ =====

function clearHighlight() {
    if (!currentHighlight) return;

    resetProvinceStyle(currentHighlight);
    currentHighlight = null;
}

function selectProvinceLayer(layer, options = {}) {
    if (!layer) return false;

    const {
        showInfo = true,
        emitEvent = true
    } = options;

    if (currentHighlight && currentHighlight !== layer) {
        resetProvinceStyle(currentHighlight);
    }

    currentHighlight = layer;
    applySelectedStyle(layer);

    if (showInfo) {
        showProvinceInfo(layer.feature.properties);
    }

    if (emitEvent) {
        const properties = layer.feature.properties;
        const id = properties.id ?? properties.fid;

        if (id != null) {
            window.dispatchEvent(
                new CustomEvent('province:opened', {
                    detail: { id }
                })
            );
        }
    }

    return true;
}

// Единая функция закрытия выбранной провинции.
// emitEvent=false используется при навигации по истории.
export function clearProvinceSelection(options = {}) {
    const { emitEvent = true } = options;

    const panel = document.getElementById('info-panel');

    if (panel) {
        panel.style.display = 'none';
    }

    clearHighlight();

    if (emitEvent) {
        window.dispatchEvent(
            new CustomEvent('province:closed')
        );
    }
}

// ===== ЗАГРУЗКА ПРОВИНЦИЙ =====

export async function loadProvinces(map) {
    // Если слой уже существует, удаляем его.
    if (provinceLayer && provinceMap) {
        provinceMap.removeLayer(provinceLayer);
    }

    // Удаляем предыдущий обработчик масштабирования.
    if (provinceMap && zoomHandler) {
        provinceMap.off('zoomend', zoomHandler);
        zoomHandler = null;
    }

    provinceMap = map;
    currentHighlight = null;

    const response = await fetch(
        new URL('../../data/province1.geojson', import.meta.url)
    );

    if (!response.ok) {
        throw new Error(
            `Не удалось загрузить провинции: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    data.features = data.features.filter(feature =>
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length > 0
    );

    const transformedData = transformFeatureCollection(data);

    provinceFeatures = transformedData.features;

    // Собственный Canvas: события провинций не смешиваются с торговлей.
    if (!map.getPane('provinceInteractionPane')) {
        map.createPane('provinceInteractionPane');
        map.getPane('provinceInteractionPane').style.zIndex = 410;
    }
    provinceLayer = L.geoJSON(transformedData, {
        pane: 'provinceInteractionPane',
        renderer: L.canvas({ pane: 'provinceInteractionPane' }),

        style: () => getNormalStyle(),

        onEachFeature: (feature, layer) => {
            // Выбор провинции кликом
            layer.on('click', () => {
                selectProvinceLayer(layer);
            });

            // Подсветка при наведении
            layer.on('mouseover', () => {
                if (layer !== currentHighlight) {
                    layer.setStyle(HOVER_STYLE);
                }
            });

            // Восстановление обычного стиля
            layer.on('mouseout', () => {
                if (layer !== currentHighlight) {
                    resetProvinceStyle(layer);
                }
            });
        }
    }).addTo(map);

    // Обновление толщины контуров при масштабировании
    zoomHandler = () => {
        if (!provinceLayer) return;

        provinceLayer.eachLayer(layer => {
            if (layer === currentHighlight) {
                applySelectedStyle(layer);
            } else {
                resetProvinceStyle(layer);
            }
        });
    };

    map.on('zoomend', zoomHandler);

    // Сохраняем глобальные ссылки для совместимости.
    window.provinceLayer = provinceLayer;
    window.provinceMap = map;
}

// ===== ПЕРЕЗАГРУЗКА =====

export async function reloadProvinces() {
    const map = provinceMap || window.fauxloreMap;

    if (!map) {
        console.warn('Невозможно перезагрузить провинции: карта не найдена.');
        return;
    }

    await loadProvinces(map);
}

// ===== ДОСТУП К ДАННЫМ =====

export function getProvincesList() {
    return provinceFeatures;
}

// ===== ВЫБОР ПО ID =====

export function highlightProvinceById(id, options = {}) {
    if (!provinceLayer) return false;

    let foundLayer = null;

    provinceLayer.eachLayer(layer => {
        const properties = layer.feature?.properties || {};
        const layerId = properties.id ?? properties.fid;

        if (String(layerId) === String(id)) {
            foundLayer = layer;
        }
    });

    if (!foundLayer) return false;

    return selectProvinceLayer(foundLayer, options);
}

// ===== ИНФОРМАЦИОННАЯ ПАНЕЛЬ =====

function showProvinceInfo(properties) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;

    const wikiLink = properties.wiki_url
        ? `<a href="${properties.wiki_url}" class="wiki-link" target="_blank">📖 Подробнее</a>`
        : '';

    panel.innerHTML = `
        <div class="info-panel-header">
            <h3>${properties.name || 'Без названия'}</h3>
            <button class="close-panel">✖</button>
        </div>

        <div class="info-panel-content">
            <p><strong>ID:</strong> ${properties.id ?? properties.fid ?? '—'}</p>
            <p><strong>Страна:</strong> ${properties.country || '—'}</p>
            ${wikiLink}
        </div>
    `;

    panel.style.display = 'block';

    const closeButton = panel.querySelector('.close-panel');

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            clearProvinceSelection();
        });
    }
}

// ===== ВИДИМОСТЬ СЛОЯ =====

export function setProvinceLayerVisible(map, visible) {
    if (!provinceLayer) return;

    const isVisible = map.hasLayer(provinceLayer);
    const pane = map.getPane('provinceInteractionPane');
    if (pane) pane.style.pointerEvents = visible ? 'auto' : 'none';

    if (visible) {
        if (!isVisible) {
            provinceLayer.addTo(map);
        }

        provinceLayer.eachLayer(layer => {
            if (layer.bringToFront) {
                layer.bringToFront();
            }
        });
    } else {
        if (isVisible) {
            map.removeLayer(provinceLayer);
        }
    }
}
