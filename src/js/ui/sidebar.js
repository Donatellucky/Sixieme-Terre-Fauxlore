import { mapObject, mapObjects } from '../data/objects.js'

let markerGroup = {};  // для хранения групп маркеров по типам

// Создание групп маркеров по типам
export function initMarkerGroups(map) {
    // Группируем объекты по типу
    const groups = {};
    mapObjects.forEach(obj => {
        if (!groups[obj.type]) groups[obj.type] = [];
        groups[obj.type].push(obj);
    });

    // Для каждого типа создаём слой и добавляем на карту
    for (const [type, objects] of Object.entries(groups)) {
        const group = L.layerGroup();
        objects.forEach(obj => {
            const marker = L.marker(obj.coords, {icon: geticon(obj.type) })
            .on('click', () => showObjectInfo(obj));
            marker.addTo(group);
        });
        group.addTo(map);
        markerGroup[type] = group
    }

    return markerGroup;
}

export function initSidebar(map) {
    const container = document.getElementById('marker-filters');
    if (!container) return;

    const types = [...new Set(mapObjects.map(obj => obj.type))];
    types.forEach(type => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            // Находим все маркеры этого типа и управляем их видимостью
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.options.icon?.options?.iconUrl?.includes(type)) {
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

// Обновление видимости группы
export function setMarkerVisibility(type, visible) {
    if (markerGroups[type]) {
        if (visible) {
            markerGroups[type].addTo(window.fauxloreMap);
         } else {
            markerGroups[type].remove();
        }
    }
}