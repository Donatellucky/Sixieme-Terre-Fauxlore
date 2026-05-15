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
    // Инициализация маркеров (чекбоксы)
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

// Глобальное хранилище активных фильтров
let activeFilters = { country: new Set(), zone: new Set(), relig: new Set(), resource: new Set() };

// Сбор уникальных значений из загруженных провинций
function collectFilterValues(provinces) {
    const values = { country: new Set(), zone: new Set(), relig: new Set(), resource: new Set() };
    provinces.forEach(f => {
        if (f.properties.country) values.country.add(f.properties.country);
        if (f.properties.zone) values.zone.add(f.properties.zone);
        if (f.properties.relig) values.relig.add(f.properties.relig);
        if (f.properties.resource) values.resource.add(f.properties.resource);
    });
    return values;
}

// Применение фильтров к слою провинций
function applyFilters() {
    if (!window.provinceLayer) return;
    window.provinceLayer.eachLayer(layer => {
        const props = layer.feature.properties;
        let visible = true;
        if (activeFilters.country.size && !activeFilters.country.has(props.country)) visible = false;
        if (activeFilters.zone.size && !activeFilters.zone.has(props.zone)) visible = false;
        if (activeFilters.relig.size && !activeFilters.relig.has(props.relig)) visible = false;
        if (activeFilters.resource.size && !activeFilters.resource.has(props.resource)) visible = false;
        if (visible) {
            if (!window.provinceLayer.hasLayer(layer)) window.provinceLayer.addLayer(layer);
        } else {
            if (window.provinceLayer.hasLayer(layer)) window.provinceLayer.removeLayer(layer);
        }
    });
}

// Создание секции чекбоксов
function createFilterSection(container, title, filterKey, values) {
    const section = document.createElement('div');
    section.className = 'filter-section';
    section.innerHTML = `<h4>${title}</h4>`;
    const sorted = Array.from(values).sort();
    sorted.forEach(val => {
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = val;
        cb.checked = true;
        cb.addEventListener('change', () => {
            if (cb.checked) activeFilters[filterKey].add(val);
            else activeFilters[filterKey].delete(val);
            applyFilters();
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(val));
        section.appendChild(label);
    });
    container.appendChild(section);
}

// Инициализация фильтров (вызывается после загрузки провинций)
export function initFilters(provinces) {
    const container = document.getElementById('filters-container');
    if (!container) return;
    container.innerHTML = '';
    const values = collectFilterValues(provinces);
    if (values.country.size) createFilterSection(container, 'Страны', 'country', values.country);
    if (values.zone.size) createFilterSection(container, 'Торговые зоны', 'zone', values.zone);
    if (values.relig.size) createFilterSection(container, 'Религии', 'relig', values.relig);
    if (values.resource.size) createFilterSection(container, 'Ресурсы', 'resource', values.resource);
}


export function updateProvincesList(map, target = 'sidebar') {
    let container;
    if (target === 'sidebar') {
        container = document.getElementById('province-list-panel-bottom');
    } else {
        container = document.getElementById('province-list-panel');
    }
    if (!container) {
        console.warn('Контейнер для списка провинций не найден');
        return;
    }

    const provinces = getProvincesList();
    if (!provinces.length) {
        container.innerHTML = `<div class="placeholder">Список провинций пуст</div>`;
        return;
}

    const listHtml = `
        <h3>Список провинций</h3>
        <div class="province-list">
            ${provinces.map(prov => `
                <div class="province-item" data-id="${prov.properties.id}">
                    <strong>${prov.properties.name || prov.properties.id}</strong>
                </div>
            `).join('')}
        </div>
    `;
    container.innerHTML = listHtml;

    // Добавляем обработчики кликов
    document.querySelectorAll('.province-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            if (window.provinceLayer) {
                window.provinceLayer.eachLayer(layer => {
                    if (layer.feature.properties.id === id) {
                        map.fitBounds(layer.getBounds());
                        layer.openPopup();
                        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
        });
    });
}