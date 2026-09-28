import { switchLayer } from "../map/layers.js";
import {
    mapModes,
    DEFAULT_MAP_MODE
} from "../data/map-modes.js";
import { setProvinceLayerVisible } from "../data/provinces.js";

let activeModeId = DEFAULT_MAP_MODE;
let currentBaseLayer = null;

export function initMapModeControls(map) {
    const toggleButton = document.getElementById('map-modes-toggle');
    const panel = document.getElementById('map-modes-panel');
    const list = document.getElementById('map-mode-list');

    if (!toggleButton || !panel || !list) {
        console.warn('Не найдены элементы панели режимов карты.');
        return {
            syncModeFeatures,
            getActiveMode
        };
    }

    renderModeCards(list);

    // Фоновые изображения карточек загружаем
    // только при первом открытии панели.
    toggleButton.addEventListener('click', () => {
        loadCardBackgrounds(list);
    });

    // Делегирование кликов:
    // один обработчик вместо отдельного на каждую карточку.
    list.addEventListener('click', (event) => {
        const card = event.target.closest('.map-mode-card');

        if (!card) return;

        const modeId = card.dataset.mode;

        if (!mapModes[modeId]) {
            console.warn(`Неизвестный режим карты: ${modeId}`);
            return;
        }

        switchMapMode(map, modeId);

        // После выбора возвращаем пользователя на карту.
        panel.classList.remove('open');
    });

    // Загружаем режим по умолчанию.
    switchMapMode(map, DEFAULT_MAP_MODE, false);

    function syncModeFeatures() {
        const mode = mapModes[activeModeId];

        if (!mode) return;

        setProvinceLayerVisible(
            map,
            mode.features.provinces
        );

        updateProvinceTools(
            mode.features.provinceTools
        );

        updateChronology(
            mode.features.chronology
        );
    }

    function getActiveMode() {
        return mapModes[activeModeId];
    }
    
    return {
        syncModeFeatures,
        getActiveMode
    };
}

/**
 * Переключает текущий режим карты.
 */
function switchMapMode(map, modeId, announce = true) {
    const mode = mapModes[modeId];

    if (!mode) {
        console.warn(`Режим "${modeId}" не найден.`);
        return;
    }

    activeModeId = modeId;

    // Меняем базовую PNG-карту.
    currentBaseLayer = switchLayer(
        map,
        mode.imagePath,
        currentBaseLayer
    );

    // Обновляем элементы интерфейса.
    setActiveCard(modeId);
    updateProvinceTools(mode.features.provinceTools);
    updateChronology(mode.features.chronology);

    // Показываем / скрываем слой провинций.
    setProvinceLayerVisible(
        map,
        mode.features.provinces
    );

    // Сохраняем состояние режима в DOM.
    document.body.dataset.mapMode = modeId;

    // Сообщаем другим системам:
    // "режим карты изменился".
    if (announce) {
        window.dispatchEvent(
            new CustomEvent('map:modechange', {
                detail: {
                    id: mode.id,
                    mode
                }
            })
        );
    }
}

/**
 * Создаёт три карточки режимов.
 */
function renderModeCards(container) {
    container.innerHTML = Object.values(mapModes)
        .map(mode => `
            <button
                type="button"
                class="map-mode-card"
                data-mode="${mode.id}"
                aria-pressed="false"
            >
                <div class="map-mode-card-overlay"></div>

                <div class="map-mode-card-content">
                    <span class="material-icons map-mode-icon">
                        ${mode.icon}
                    </span>

                    <h3>${mode.title}</h3>

                    <p>${mode.description}</p>
                </div>
            </button>
        `)
        .join('');

    setActiveCard(activeModeId);
}

/**
 * Активная карточка получает визуальное выделение.
 */
function setActiveCard(modeId) {
    document
        .querySelectorAll('.map-mode-card')
        .forEach(card => {
            const isActive = card.dataset.mode === modeId;

            card.classList.toggle('active', isActive);
            card.setAttribute('aria-pressed', String(isActive));
        });
}

/**
 * Добавляет фоновые PNG только при необходимости.
 */
function loadCardBackgrounds(container) {
    container
        .querySelectorAll('.map-mode-card')
        .forEach(card => {
            if (card.dataset.backgroundLoaded === 'true') {
                return;
            }

            const modeId = card.dataset.mode;
            const mode = mapModes[modeId];

            if (!mode) return;

            const imageUrl =
                new URL(
                    mode.imagePath,
                    document.baseURI
                ).href;

            card.style.setProperty(
                '--mode-background',
                `url("${imageUrl}")`
            );

            card.dataset.backgroundLoaded = 'true';
        });
}

/**
 * Управление инструментами, связанными с провинциями.
 */
function updateProvinceTools(visible) {
    const provinceButton =
        document.getElementById('open-province-panel');

    const filtersButton =
        document.getElementById('filters-toggle');

    if (provinceButton) {
        provinceButton.style.display =
            visible ? 'flex' : 'none';
    }

    if (filtersButton) {
        filtersButton.style.display =
            visible ? 'flex' : 'none';
    }
}

/**
 * Показывает / скрывает блок хода и сезона.
 */
function updateChronology(visible) {
    const turnInfo =
        document.querySelector('.turn-info');

    if (!turnInfo) return;

    turnInfo.style.display =
        visible ? 'flex' : 'none';
}