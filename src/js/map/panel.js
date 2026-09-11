import { getProvincesList, highlightProvinceById } from '../data/provinces.js';

// ===== ПОЛНОЭКРАННАЯ ПАНЕЛЬ ПРОВИНЦИЙ =====
const panel = document.getElementById('province-panel');
const closePanelBtn = document.getElementById('close-province-panel');
const panelSearchInput = document.getElementById('panel-search-input');
const panelSearchMode = document.getElementById('panel-search-mode');
const panelSearchSubmit = document.getElementById('panel-search-submit');
const panelResetBtn = document.getElementById('panel-reset-filters');
const panelList = document.getElementById('panel-province-list');
const panelSortToggle = document.getElementById('panel-sort-toggle');
const panelCount = document.getElementById('panel-count');

// ===== ХЕЛПЕР ID =====
// Поддерживает и `id` (province1.geojson), и `fid` (на будущее / другие файлы).
// Всегда возвращает строку или null. Благодаря этому вся остальная логика
// не думает, какое поле пришло из GeoJSON.
function getProvinceId(props) {
    const raw = props?.id ?? props?.fid ?? null;
    return raw == null ? null : String(raw);
}

// Числовой ключ для сортировки: "001" → 1, "319" → 319.
// Ведущие нули срезаются, так как для сравнения они не важны.
// При отсутствии ID — уходит в конец.
function numericId(props) {
    const raw = getProvinceId(props);
    if (raw == null) return Number.MAX_SAFE_INTEGER;
    const n = parseInt(raw.replace(/^0+/, '') || '0', 10);
    return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

// Сортировка списка фич
function sortProvinces(features, mode) {
    const arr = [...features];
    if (mode === 'name') {
        arr.sort((a, b) => {
            const an = (a.properties.name || '').trim();
            const bn = (b.properties.name || '').trim();
            if (an && !bn) return -1;              // именованные — вверх
            if (!an && bn) return 1;               // безымянные — вниз
            if (an && bn) return an.localeCompare(bn, 'ru');
            return numericId(a.properties) - numericId(b.properties);
        });
    } else {
        arr.sort((a, b) => numericId(a.properties) - numericId(b.properties));
    }
    return arr;
}

// ===== СОСТОЯНИЕ =====
let panelSearchModeValue = 'id';   // 'id' | 'name'
let panelSortModeValue = 'id';     // 'id' | 'name'
let panelLastQuery = '';

// ===== UI: синхронизация кнопок с состоянием =====
function syncModeUI() {
    if (!panelSearchMode) return;
    panelSearchMode.textContent = panelSearchModeValue === 'id' ? '🔍 ID' : '🔍 Название';
    panelSearchMode.classList.toggle('active', panelSearchModeValue === 'name');
}

function syncSortUI() {
    if (!panelSortToggle) return;
    panelSortToggle.textContent = panelSortModeValue === 'id' ? 'Сорт: ID' : 'Сорт: A-Z';
    panelSortToggle.classList.toggle('active', panelSortModeValue === 'name');
}

// ===== ОТКРЫТИЕ/ЗАКРЫТИЕ =====
export function openProvincePanel() {
    panel.style.display = 'flex';
    // Восстанавливаем сохранённый запрос И режим
    syncModeUI();
    syncSortUI();
    if (panelLastQuery) {
        panelSearchInput.value = panelLastQuery;
        applyFilter(panelLastQuery);
    } else {
        renderProvinces(getProvincesList());
    }
}

export function closeProvincePanel() {
    panel.style.display = 'none';
}

// ===== РЕНДЕР =====
function updateCounter(shown, total) {
    if (!panelCount) return;
    panelCount.textContent = `${shown} из ${total}`;
}

function renderProvinces(provinces) {
    const total = getProvincesList().length;
    const sorted = sortProvinces(provinces, panelSortModeValue);
    updateCounter(sorted.length, total);

    if (!sorted.length) {
        panelList.innerHTML = `<div class="panel-placeholder">Ничего не найдено</div>`;
        return;
    }

    panelList.innerHTML = sorted.map(prov => {
        const p = prov.properties;
        const id = getProvinceId(p) ?? '—';
        const title = p.name || `Провинция ${id}`;
        return `
            <div class="panel-province-item" data-id="${id}">
                <strong>${title}</strong>
                <span class="panel-province-id">${id}</span>
            </div>
        `;
    }).join('');
}

// ===== ФИЛЬТРАЦИЯ =====
function applyFilter(query) {
    panelLastQuery = query || '';
    const all = getProvincesList();
    if (!panelLastQuery) {
        renderProvinces(all);
        return;
    }
    const q = panelLastQuery.toLowerCase();
    const filtered = all.filter(prov => {
        const p = prov.properties;
        if (panelSearchModeValue === 'id') {
            const id = getProvinceId(p);
            return id?.toLowerCase().includes(q);
        }
        const name = p.name?.toLowerCase();
        return name?.includes(q);
    });
    renderProvinces(filtered);
}

// ===== ДЕЛЕГИРОВАНИЕ КЛИКОВ =====
// Один обработчик на контейнер вместо N обработчиков на каждый item.
// Работает даже для элементов, добавленных после навешивания.
if (panelList) {
    panelList.addEventListener('click', (e) => {
        const item = e.target.closest('.panel-province-item');
        if (!item) return;
        const id = item.dataset.id;
        closeProvincePanel();
        highlightProvinceById(id);
        if (window.provinceLayer) {
            window.provinceLayer.eachLayer(layer => {
                if (String(layer.feature.properties.id) === String(id)) {
                    window.fauxloreMap.fitBounds(layer.getBounds());
                    layer.openPopup();
                }
            });
        }
    });
}

// ===== ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА ПОИСКА (ID ↔ Название) =====
if (panelSearchMode) {
    panelSearchMode.addEventListener('click', () => {
        panelSearchModeValue = panelSearchModeValue === 'id' ? 'name' : 'id';
        syncModeUI();
        applyFilter(panelSearchInput.value.trim());
    });
}

// ===== ПЕРЕКЛЮЧАТЕЛЬ СОРТИРОВКИ (ID ↔ A-Z) =====
if (panelSortToggle) {
    panelSortToggle.addEventListener('click', () => {
        panelSortModeValue = panelSortModeValue === 'id' ? 'name' : 'id';
        syncSortUI();
        applyFilter(panelSearchInput.value.trim());
    });
}

// ===== ВВОД В ПОЛЕ ПОИСКА =====
if (panelSearchInput) {
    panelSearchInput.addEventListener('input', (e) => {
        applyFilter(e.target.value.trim());
    });
}

// ===== ENTER и НАВИГАЦИЯ КЛАВИАТУРОЙ =====
if (panelSearchInput) {
    panelSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveSelection(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveSelection(-1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = panelList?.querySelector('.panel-province-item.selected');
            if (selected) {
                // «Клик» по выбранной провинции
                selected.click();
            } else {
                // Нет выбора — обычная фильтрация
                applyFilter(panelSearchInput.value.trim());
            }
        }
    });
}

// ===== НАВИГАЦИЯ ↑/↓ ПО РЕЗУЛЬТАТАМ =====
function moveSelection(delta) {
    if (!panelList) return;
    const items = panelList.querySelectorAll('.panel-province-item');
    if (!items.length) return;

    let idx = -1;
    items.forEach((it, i) => {
        if (it.classList.contains('selected')) idx = i;
    });

    if (idx === -1) {
        // Первый раз нажали — выделяем первый (или последний, если ↑)
        idx = delta > 0 ? 0 : items.length - 1;
    } else {
        idx = Math.max(0, Math.min(items.length - 1, idx + delta));
    }

    items.forEach((it, i) => it.classList.toggle('selected', i === idx));
    items[idx].scrollIntoView({ block: 'nearest' });
}

// ===== КНОПКА «НАЙТИ» =====
if (panelSearchSubmit) {
    panelSearchSubmit.addEventListener('click', () => {
        applyFilter(panelSearchInput.value.trim());
    });
}

// ===== СБРОС =====
if (panelResetBtn) {
    panelResetBtn.addEventListener('click', () => {
        panelSearchInput.value = '';
        panelLastQuery = '';
        panelSearchModeValue = 'id';
        panelSortModeValue = 'id';
        syncModeUI();
        syncSortUI();
        renderProvinces(getProvincesList());
    });
}

// ===== КНОПКА ЗАКРЫТИЯ =====
if (closePanelBtn) {
    closePanelBtn.addEventListener('click', closeProvincePanel);
}