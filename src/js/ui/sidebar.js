import { mapObjects } from '../data/objects.js';
import { getIcon } from '../map/icons.js';
import { showObjectInfo, translateType } from '../map/markers.js';
import { getProvincesList, highlightProvinceById } from '../data/provinces.js';

let markerGroups = {};

export function initMarkerGroups(map) {
    const groups = {};
    mapObjects.forEach(obj => {
        if (!groups[obj.type]) groups[obj.type] = [];
        groups[obj.type].push(obj);
    });

    for (const [type, objects] of Object.entries(groups)) {
        const group = L.layerGroup();
        objects.forEach(obj => {
            const icon = getIcon(obj.type);
            if (!icon) {
                console.warn(`Иконка для ${obj.type} не найдена`);
                return;
            }
            const marker = L.marker(obj.coords, { icon })
                .on('click', () => showObjectInfo(obj));
            marker.type = obj.type;
            marker.addTo(group);
        });
        group.addTo(map);
        markerGroups[type] = group;
    }
    return markerGroups;
}

export function initSidebar(map) {
    const container = document.getElementById('marker-filters');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');

    // Открытие/закрытие панели
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Если нет контейнера для чекбоксов – выходим
    if (!container) return;

    // Уникальные типы маркеров
    const types = [...new Set(mapObjects.map(obj => obj.type))];
    types.forEach(type => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.type === type) {
                    if (isVisible) map.addLayer(layer);
                    else map.removeLayer(layer);
                }
            });
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(translateType(type)));
        container.appendChild(label);
    });
}

export function setMarkerVisibility(map, type, visible) {
    if (markerGroups[type]) {
        if (visible) markerGroups[type].addTo(map);
        else markerGroups[type].remove();
    }
}

export function updateProvincesList(map) {
    const container = document.getElementById('province-list-panel');
    if (!container) return;

    const provinces = getProvincesList();
    if (!provinces.length) {
        container.innerHTML = `<h3>Список провинций</h3><div class="placeholder">Загрузка...</div>`;
        return;
    }

    const listHtml = `
        <h3>Список провинций</h3>
        <div class="province-list">
            ${provinces.map(prov => `
                <div class="province-item" data-id="${prov.properties.id}">
                    <strong>${prov.properties.name}</strong> (${prov.properties.id})
                </div>
            `).join('')}
        </div>
    `;
    container.innerHTML = listHtml;

    // Добавляем обработчики кликов
    document.querySelectorAll('.province-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id; // переменная item доступна
            highlightProvinceById(id);
            if (window.provinceLayer) {
                window.provinceLayer.eachLayer(layer => {
                    if (layer.feature.properties.id === id) {
                        const bounds = layer.getBounds();
                        console.log('Bounds for', id, bounds);
                        map.fitBounds(bounds);
                    }
                });
            }
        });
    });
}