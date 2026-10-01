import { transformFeatureCollection } from './coords-transform.js';

let provinceLayer = null;
let currentHighlight = null;
let provinceFeatures = [];

export async function loadProvinces(map) {
    const response = await fetch(
    new URL('../../data/province1.geojson', import.meta.url)
);

    if (!response.ok) {
        throw new Error(
            `Не удалось загрузить провинции: ${response.status} ${response.statusText}`
        );
    }

    const data = await response.json();

    data.features = data.features.filter(f =>
        f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0
    );

      // Применяем преобразование координат
      const transformedData = transformFeatureCollection(data);

    console.log('Оригинальные координаты (первые 3 точки):', data.features[0]?.geometry?.coordinates[0]?.slice(0,3));
    console.log('Преобразованные координаты:', transformedData.features[0]?.geometry?.coordinates[0]?.slice(0,3));

    provinceFeatures = transformedData.features;

    // Создаём слой полигонов
    provinceLayer = L.geoJSON(transformedData, {
        renderer: L.canvas(),
        style: (feature) => ({
            color: '#8b0000',        // тёмно-бордовая обводка
            weight: 1.5,             // начальная толщина (будет переопределена динамически)
            fillColor: '#ffb6c1',    // светло-розовая заливка
            fillOpacity: 0.4
        }),
        onEachFeature: (feature, layer) => {
    // --- ОБРАБОТЧИК КЛИКА ---
    layer.on('click', () => {
        if (currentHighlight) {
            // Возвращаем предыдущей провинции обычный стиль
            currentHighlight.setStyle({
                color: '#8b0000',
                fillOpacity: 0.4
            });
            updateOutlineWidthForLayer(currentHighlight);
        }
        // Подсветка текущей
        layer.setStyle({
            weight: 3,
            color: '#ffaa00',
            fillOpacity: 0.7
        });
        currentHighlight = layer;
        showProvinceInfo(feature.properties);
    });

// --- ОБРАБОТЧИК НАВЕДЕНИЯ ---
layer.on('mouseover', () => {
    // Если провинция не выбрана кликом — временно подсвечиваем её
    if (layer !== currentHighlight) {
        layer.setStyle({
            weight: 2.5,
            color: '#ff6666',
            fillOpacity: 0.6
        });
    }
});

layer.on('mouseout', () => {
    // Выбранную провинцию не трогаем
    if (layer !== currentHighlight) {
        layer.setStyle({
            color: '#8b0000',
            fillOpacity: 0.4
        });

        updateOutlineWidthForLayer(layer);
    }
});
}
    }).addTo(map);

    // Функция для установки правильной толщины контура в зависимости от зума
    function updateOutlineWidthForLayer(layer) {
        if (!layer) return;
        const zoom = map.getZoom();
        const minZoom = -2;
        const maxZoom = 3;
        const minWeight = 0.8;
        const maxWeight = 2.2;
        let weight = minWeight + (zoom - minZoom) * (maxWeight - minWeight) / (maxZoom - minZoom);
        weight = Math.min(maxWeight, Math.max(minWeight, weight));
        layer.setStyle({ weight: weight });
    }

    // Функция для обновления всех полигонов (при изменении зума)
    function updateAllOutlines() {
        if (!provinceLayer) return;
        provinceLayer.eachLayer(layer => {
            if (layer !== currentHighlight) {
                updateOutlineWidthForLayer(layer);
            }
        });
    }

    // Подписываемся на событие изменения зума
    map.on('zoomend', () => {
        updateAllOutlines();
        // Также обновляем подсвеченный полигон, если есть
        if (currentHighlight) {
            updateOutlineWidthForLayer(currentHighlight);
            // Но подсветка должна оставаться яркой, поэтому переопределяем
            currentHighlight.setStyle({ 
                weight: 3, 
                color: '#ffaa00', 
                fillOpacity: 0.7 
            });
        }
    });

    // Вызываем один раз для начальной установки
    updateAllOutlines();

    // Сохраняем глобальные ссылки
    window.provinceLayer = provinceLayer;
    window.provinceMap = map;
}

export async function reloadProvinces() {
    if (window.provinceLayer) window.provinceLayer.remove();
    await loadProvinces(window.fauxloreMap);
}

function showProvinceInfo(properties) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    let wikiLink = properties.wiki_url ? `<a href="${properties.wiki_url}" class="wiki-link" target="_blank">📖 Подробнее</a>` : '';
    panel.innerHTML = `
        <div class="info-panel-header">
            <h3>${properties.name || 'Без названия'}</h3>
            <button class="close-panel">✖</button>
        </div>
        <div class="info-panel-content">
            <p><strong>ID:</strong> ${properties.id || properties.fid}</p>
            <p><strong>Страна:</strong> ${properties.country || '—'}</p>
            ${wikiLink}
        </div>
    `;
    panel.style.display = 'block';
panel.querySelector('.close-panel').addEventListener('click', () => {
    panel.style.display = 'none';
    if (currentHighlight) {
        currentHighlight.setStyle({
            color: '#8b0000',
            fillOpacity: 0.4
        });
        currentHighlight = null;
    }
    window.dispatchEvent(new CustomEvent('province:closed'));
});
    const pid = properties.id ?? properties.fid;
    if (pid != null) {
        window.dispatchEvent(new CustomEvent('province:opened', { detail: { id: pid } }));
    }
}

export function getProvincesList() {
    return provinceFeatures;
}

export function highlightProvinceById(id) {
    if (!provinceLayer) return;

    provinceLayer.eachLayer(layer => {
        const properties = layer.feature?.properties || {};
        const layerId = properties.id ?? properties.fid;
        if (String(layerId) === String(id)) {
            // Если ранее была выбрана другая провинция,
            // возвращаем её к обычному стилю
            if (currentHighlight && currentHighlight !== layer) {
                currentHighlight.setStyle({
                    color: '#8b0000',
                    fillOpacity: 0.4
                });
            }
            // Выделяем найденную провинцию
            layer.setStyle({
                weight: 3,
                color: '#ffaa00',
                fillOpacity: 0.7
            });
            currentHighlight = layer;
            showProvinceInfo(properties);
        }
    });
}

export function setProvinceLayerVisible(map, visible) {
    if (!provinceLayer) return;

    const isVisible = map.hasLayer(provinceLayer);

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