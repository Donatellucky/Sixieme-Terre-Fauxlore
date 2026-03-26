import { mapObjects } from '../data/objects.js';
import { getIcon } from '../map/icons.js';
import { showObjectInfo, translateType } from '../map/markers.js';

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
            marker.type = obj.type;   // добавляем тип
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

    // остальной код (создание чекбоксов) остаётся
    if (!container) return;
    // ... создание чекбоксов ...
}
    if (!container) return;

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