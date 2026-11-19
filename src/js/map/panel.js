
/**
 * Полноэкранная панель провинций Fauxlore.
 *
 * Использует новую ProvinceSystem:
 * - Registry — получение списка и метаданных;
 * - Controller — выбор провинции;
 * - Renderer — подсветка и фокусировка геометрии.
 *
 * Игровые названия пока не входят в геометрический пакет.
 */

// ===== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА =====

const panel = document.getElementById('province-panel');
const closePanelBtn = document.getElementById('close-province-panel');
const panelSearchInput = document.getElementById('panel-search-input');
const panelSearchMode = document.getElementById('panel-search-mode');
const panelSearchSubmit = document.getElementById('panel-search-submit');
const panelResetBtn = document.getElementById('panel-reset-filters');
const panelList = document.getElementById('panel-province-list');
const panelSortToggle = document.getElementById('panel-sort-toggle');
const panelCount = document.getElementById('panel-count');

// ===== ДОСТУП К НОВОЙ СИСТЕМЕ =====

function getProvinceSystem() {
    const system = window.provinceSystem;

    if (!system?.registry || !system?.controller) {
        console.warn(
            'ProvincePanel: новая система провинций ещё не готова.'
        );

        return null;
    }

    return system;
}

// ===== ПОЛУЧЕНИЕ ДАННЫХ =====

/**
 * Получает все провинции из нового реестра.
 *
 * Registry возвращает записи вида:
 * {
 *     id: 'STF-00001',
 *     bbox: [...],
 *     tileIds: [...],
 *     provinceClass: ...,
 *     regionRole: ...,
 *     reviewStatus: ...
 * }
 */
function getProvincesList() {
    const system = getProvinceSystem();

    if (!system) {
        return [];
    }

    return system.registry.getAllProvinces();
}

/**
 * Возвращает постоянный ID провинции.
 */
function getProvinceId(province) {
    return province?.id == null
        ? null
        : String(province.id);
}

/**
 * Возвращает название провинции, если оно доступно.
 *
 * В будущем сюда можно будет подключить
 * отдельный источник игровых данных.
 */
function getProvinceName(province) {
    return (
        province?.name ||
        province?.displayName ||
        province?.properties?.name ||
        null
    );
}

// ===== СОРТИРОВКА =====

function sortProvinces(provinces, mode) {
    const sorted = [...provinces];

    if (mode === 'name') {
        sorted.sort((a, b) => {
            const nameA = getProvinceName(a);
            const nameB = getProvinceName(b);

            // Именованные провинции идут первыми.
            if (nameA && !nameB) return -1;
            if (!nameA && nameB) return 1;

            // Сравниваем названия.
            if (nameA && nameB) {
                const result = nameA.localeCompare(
                    nameB,
                    'ru'
                );

                if (result !== 0) {
                    return result;
                }
            }

            // При одинаковых или отсутствующих названиях
            // используем постоянный ID.
            return getProvinceId(a).localeCompare(
                getProvinceId(b),
                'en',
                { numeric: true }
            );
        });
    } else {
        sorted.sort((a, b) => {
            return getProvinceId(a).localeCompare(
                getProvinceId(b),
                'en',
                { numeric: true }
            );
        });
    }

    return sorted;
}

// ===== СОСТОЯНИЕ ПАНЕЛИ =====

let panelSearchModeValue = 'id';
let panelSortModeValue = 'id';
let panelLastQuery = '';

// ===== СИНХРОНИЗАЦИЯ ИНТЕРФЕЙСА =====

function syncModeUI() {
    if (!panelSearchMode) return;

    panelSearchMode.textContent =
        panelSearchModeValue === 'id'
            ? '🔍 ID'
            : '🔍 Название';

    panelSearchMode.classList.toggle(
        'active',
        panelSearchModeValue === 'name'
    );
}

function syncSortUI() {
    if (!panelSortToggle) return;

    panelSortToggle.textContent =
        panelSortModeValue === 'id'
            ? 'Сорт: ID'
            : 'Сорт: A-Z';

    panelSortToggle.classList.toggle(
        'active',
        panelSortModeValue === 'name'
    );
}

// ===== ОТКРЫТИЕ И ЗАКРЫТИЕ =====

export function openProvincePanel() {
    if (!panel) return;

    panel.style.display = 'flex';

    syncModeUI();
    syncSortUI();

    if (panelLastQuery) {
        if (panelSearchInput) {
            panelSearchInput.value = panelLastQuery;
        }

        applyFilter(panelLastQuery);
    } else {
        renderProvinces(getProvincesList());
    }
}

export function closeProvincePanel() {
    if (!panel) return;

    panel.style.display = 'none';
}

// ===== СЧЁТЧИК =====

function updateCounter(shown, total) {
    if (!panelCount) return;

    panelCount.textContent = `${shown} из ${total}`;
}

// ===== ОТОБРАЖЕНИЕ СПИСКА =====

function renderProvinces(provinces) {
    if (!panelList) return;

    const total = getProvincesList().length;

    const sorted = sortProvinces(
        provinces,
        panelSortModeValue
    );

    updateCounter(sorted.length, total);

    if (sorted.length === 0) {
        const message =
            panelSearchModeValue === 'name'
                ? 'Названия провинций пока не загружены'
                : 'Ничего не найдено';

        panelList.innerHTML = `
            <div class="panel-placeholder">
                ${message}
            </div>
        `;

        return;
    }

    panelList.innerHTML = sorted.map(province => {
        const id = getProvinceId(province) ?? '—';

        const title =
            getProvinceName(province) ||
            `Провинция ${id}`;

        return `
            <div
                class="panel-province-item"
                data-id="${id}"
            >
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

    const normalizedQuery = panelLastQuery.toLowerCase();

    const filtered = all.filter(province => {
        if (panelSearchModeValue === 'id') {
            const id = getProvinceId(province);

            return id?.toLowerCase().includes(
                normalizedQuery
            );
        }

        const name = getProvinceName(province);

        return name?.toLowerCase().includes(
            normalizedQuery
        );
    });

    renderProvinces(filtered);
}

// ===== ВЫБОР ПРОВИНЦИИ =====

async function selectProvinceFromPanel(provinceId) {
    const system = getProvinceSystem();

    if (!system) return;

    closeProvincePanel();

    try {
        const selected = await system.controller.selectProvince(
            provinceId,
            {
                focus: true,
                source: 'panel',
            }
        );

        if (!selected) {
            console.warn(
                `ProvincePanel: не удалось выбрать провинцию ${provinceId}.`
            );
        }
    } catch (error) {
        console.error(
            `ProvincePanel: ошибка выбора провинции ${provinceId}:`,
            error
        );
    }
}

// ===== ОБРАБОТЧИК СПИСКА =====

if (panelList) {
    panelList.addEventListener('click', event => {
        const item = event.target.closest(
            '.panel-province-item'
        );

        if (!item || !panelList.contains(item)) {
            return;
        }

        const provinceId = item.dataset.id;

        if (!provinceId) return;

        selectProvinceFromPanel(provinceId);
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ ПОИСКА =====

if (panelSearchMode) {
    panelSearchMode.addEventListener('click', () => {
        panelSearchModeValue =
            panelSearchModeValue === 'id'
                ? 'name'
                : 'id';

        syncModeUI();

        applyFilter(
            panelSearchInput?.value.trim() || ''
        );
    });
}

// ===== ПЕРЕКЛЮЧЕНИЕ СОРТИРОВКИ =====

if (panelSortToggle) {
    panelSortToggle.addEventListener('click', () => {
        panelSortModeValue =
            panelSortModeValue === 'id'
                ? 'name'
                : 'id';

        syncSortUI();

        applyFilter(
            panelSearchInput?.value.trim() || ''
        );
    });
}

// ===== ВВОД ПОИСКОВОГО ЗАПРОСА =====

if (panelSearchInput) {
    panelSearchInput.addEventListener('input', event => {
        applyFilter(event.target.value.trim());
    });
}

// ===== КЛАВИАТУРНОЕ УПРАВЛЕНИЕ =====

if (panelSearchInput) {
    panelSearchInput.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveSelection(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveSelection(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();

            const selected = panelList?.querySelector(
                '.panel-province-item.selected'
            );

            if (selected) {
                selected.click();
            } else {
                applyFilter(
                    panelSearchInput.value.trim()
                );
            }
        }
    });
}

// ===== ПЕРЕМЕЩЕНИЕ ПО СПИСКУ =====

function moveSelection(delta) {
    if (!panelList) return;

    const items = panelList.querySelectorAll(
        '.panel-province-item'
    );

    if (!items.length) return;

    let index = -1;

    items.forEach((item, i) => {
        if (item.classList.contains('selected')) {
            index = i;
        }
    });

    if (index === -1) {
        index = delta > 0
            ? 0
            : items.length - 1;
    } else {
        index = Math.max(
            0,
            Math.min(items.length - 1, index + delta)
        );
    }

    items.forEach((item, i) => {
        item.classList.toggle(
            'selected',
            i === index
        );
    });

    items[index].scrollIntoView({
        block: 'nearest',
    });
}

// ===== КНОПКА ПОИСКА =====

if (panelSearchSubmit) {
    panelSearchSubmit.addEventListener('click', () => {
        applyFilter(
            panelSearchInput?.value.trim() || ''
        );
    });
}

// ===== СБРОС ФИЛЬТРОВ =====

if (panelResetBtn) {
    panelResetBtn.addEventListener('click', () => {
        if (panelSearchInput) {
            panelSearchInput.value = '';
        }

        panelLastQuery = '';
        panelSearchModeValue = 'id';
        panelSortModeValue = 'id';

        syncModeUI();
        syncSortUI();

        renderProvinces(getProvincesList());
    });
}

// ===== ЗАКРЫТИЕ ПАНЕЛИ =====

if (closePanelBtn) {
    closePanelBtn.addEventListener(
        'click',
        closeProvincePanel
    );
}
