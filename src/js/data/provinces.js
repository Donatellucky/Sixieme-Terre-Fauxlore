let provinceLayer = null;
let currentHighlight = null;
let provinceFeatures = [];

// ===== НАСТРОЙКИ ПРЕОБРАЗОВАНИЯ КООРДИНАТ (меняйте эти числа) =====
window.CONFIG = {
    swapXY: true,
    invertY: false,
    scaleX: 1,
    scaleY: 1,
    offsetX: 1779,
    offsetY: 0,
    // Дополнительно: можно менять порядок возврата [y, x] или [x, y]
    swapReturn: true, // если true, возвращает [y, x], иначе [x, y]
};

// Преобразование одной точки
function convertPoint(x, y) {
    let newX = x;
    let newY = y;   // ← Убрал принудительный минус

    if (window.CONFIG.swapXY) {
        let tmp = newX;
        newX = newY;
        newY = tmp;
    }

    if (window.CONFIG.invertY) {
        newY = -newY;
    }

    newX = newX * window.CONFIG.scaleX + window.CONFIG.offsetX;
    newY = newY * window.CONFIG.scaleY + window.CONFIG.offsetY;

    if (window.CONFIG.swapReturn) {
        return [newY, newX];   // Leaflet [y, x]
    } else {
        return [newX, newY];
    }
}

// Рекурсивное преобразование геометрии
function recalcGeometry(geom) {
    if (geom.type === 'Polygon') {
        return {
            type: 'Polygon',
            coordinates: geom.coordinates.map(ring => ring.map(coord => convertPoint(coord[0], coord[1])))
        };
    } else if (geom.type === 'MultiPolygon') {
        return {
            type: 'MultiPolygon',
            coordinates: geom.coordinates.map(poly => poly.map(ring => ring.map(coord => convertPoint(coord[0], coord[1]))))
        };
    }
    return geom;
}

export async function loadProvinces(map) {
    const response = await fetch('src/data/province1.geojson');
    let data = await response.json();

    // Удаляем объекты без координат
    data.features = data.features.filter(f => 
        f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0
    );

    // Применяем преобразование координат
    const transformedData = {
        type: 'FeatureCollection',
        features: data.features.map(feature => ({
            type: 'Feature',
            properties: feature.properties,
            geometry: recalcGeometry(feature.geometry)
        }))
    };

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
    // Если есть подсвеченный полигон, но он не текущий, сбросить его
    if (currentHighlight && currentHighlight !== layer) {
        currentHighlight.setStyle({
            color: '#8b0000',
            fillOpacity: 0.4
        });
        updateOutlineWidthForLayer(currentHighlight);
        currentHighlight = null;
    }
    if (layer !== currentHighlight) {
        layer.setStyle({
            weight: 2.5,
            color: '#ff6666',
            fillOpacity: 0.6
        });
    }
});
layer.on('mouseout', () => {
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
            currentHighlight.setStyle({ weight: 1, fillOpacity: 0, color: '#ff0000' });
            currentHighlight = null;
        }
    });
}

export function getProvincesList() {
    return provinceFeatures;
}

export function highlightProvinceById(id) {
    if (!provinceLayer) return;
    provinceLayer.eachLayer(layer => {
        if (layer.feature.properties.id === id || layer.feature.properties.fid == id) {
            if (currentHighlight) {
                currentHighlight.setStyle({ weight: 1, fillOpacity: 0, color: '#ff0000' });
            }
            layer.setStyle({ weight: 3, fillOpacity: 0.2, color: '#ffaa00' });
            currentHighlight = layer;
            showProvinceInfo(layer.feature.properties);
        } else if (layer !== currentHighlight) {
            layer.setStyle({ weight: 1, fillOpacity: 0, color: '#ff0000' });
        }
    });
}