let provinceLayer = null;
let currentHighlight = null;
let provinceFeatures = [];

export async function loadProvinces(map) {
    const response = await fetch('src/data/test-provinces.geojson');
    const data = await response.json();
    provinceFeatures = data.features;

    provinceLayer = L.geoJSON(data, {
        renderer: L.canvas(),
        style: (feature) => ({
            color: '#ff0000',          // красная обводка
            weight: 1,                 // толщина
            fillOpacity: 0,            // полностью прозрачная заливка
            fillColor: 'transparent'
        }),
        onEachFeature: (feature, layer) => {
            // --- ОБРАБОТЧИК КЛИКА ---
            layer.on('click', () => {
                // Сброс предыдущей подсветки
                if (currentHighlight) {
                    currentHighlight.setStyle({
                        weight: 1,
                        fillOpacity: 0,
                        color: '#ff0000'
                    });
                }
                // Подсветка текущей
                layer.setStyle({
                    weight: 3,
                    fillOpacity: 0.2,
                    color: '#ffaa00'
                });
                currentHighlight = layer;
                showProvinceInfo(feature.properties);
            });

            // --- ОБРАБОТЧИК НАВЕДЕНИЯ ---
            layer.on('mouseover', () => {
                if (layer !== currentHighlight) {
                    layer.setStyle({
                        weight: 2,
                        color: '#ffaa00',
                        fillOpacity: 0.1
                    });
                }
            });
            layer.on('mouseout', () => {
                if (layer !== currentHighlight) {
                    layer.setStyle({
                        weight: 1,
                        color: '#ff0000',
                        fillOpacity: 0
                    });
                }
            });
        }
    }).addTo(map);

    // Сохраняем слой и карту в глобальную переменную для доступа из других модулей
    window.provinceLayer = provinceLayer;
    window.provinceMap = map;
}

function showProvinceInfo(properties) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    panel.innerHTML = `
        <div class="info-panel-header">
            <h3>${properties.name || 'Без названия'}</h3>
            <button class="close-panel">✖</button>
        </div>
        <div class="info-panel-content">
            <p><strong>ID:</strong> ${properties.id}</p>
            <p><strong>Страна:</strong> ${properties.country || '—'}</p>
            <p><strong>Ресурсы:</strong> ${properties.resources || '—'}</p>
            <p>${properties.description || ''}</p>
        </div>
    `;
    panel.style.display = 'block';
    panel.querySelector('.close-panel').addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

export function getProvincesList() {
    return provinceFeatures;
}

export function highlightProvinceById(id) {
    if (!provinceLayer) return;
    provinceLayer.eachLayer(layer => {
        if (layer.feature.properties.id === id) {
            if (currentHighlight) {
                currentHighlight.setStyle({ weight: 1, fillOpacity: 0, color: '#ff0000' });
            }
            layer.setStyle({ weight: 3, fillOpacity: 0.2, color: '#ffaa00' });
            currentHighlight = layer;
            showProvinceInfo(layer.feature.properties);
        } else {
            // Сбрасываем стиль для остальных (но не трогаем currentHighlight)
            if (layer !== currentHighlight) {
                layer.setStyle({ weight: 1, fillOpacity: 0, color: '#ff0000' });
            }
        }
    });
}