
import { switchLayer } from "../map/layers.js";

import {
    mapModes,
    DEFAULT_MAP_MODE
} from "../data/map-modes.js";

import {
    setProvinceLayerVisible
} from "../data/provinces.js";

import { getMapModeId, getMapMode, setMapMode, syncMapModeToDOM } from "../data/map-mode-state.js";
let currentBaseLayer = null;


/**
 * Инициализирует панель режимов карты.
 */
export function initMapModeControls(map) {
    const toggleButton =
        document.getElementById('map-modes-toggle');

    const panel =
        document.getElementById('map-modes-panel');

    const list =
        document.getElementById('map-mode-list');

    if (!toggleButton || !panel || !list) {
        console.warn(
            'Не найдены элементы панели режимов карты.'
        );

        return {
            syncModeFeatures,
            getActiveMode
        };
    }

    // Создаём карточки на основе конфигурации режимов.
    renderModeCards(list);

    // Фоновые изображения загружаем только при открытии панели.
    toggleButton.addEventListener('click', () => {
        loadCardBackgrounds(list);
    });

    // Выбор режима через единый обработчик карточек.
    list.addEventListener('click', event => {
        const card = event.target.closest('.map-mode-card');

        if (!card || !list.contains(card)) {
            return;
        }

        const modeId = card.dataset.mode;

        if (!mapModes[modeId]) {
            console.warn(
                `Неизвестный режим карты: ${modeId}`
            );

            return;
        }

        switchMapMode(map, modeId);

        // После выбора возвращаем пользователя к карте.
        panel.classList.remove('open');
        toggleButton.focus();
    });

    // Escape закрывает панель без изменения режима.
    document.addEventListener('keydown', event => {
        if (
            event.key !== 'Escape' ||
            !panel.classList.contains('open')
        ) {
            return;
        }

        panel.classList.remove('open');
        toggleButton.focus();
    });

    // Инициализируем карту режимом по умолчанию.
    switchMapMode(map, DEFAULT_MAP_MODE, false);

    /**
     * Повторно синхронизирует элементы интерфейса
     * с текущим режимом.
     *
     * Вызывается после загрузки провинций.
     */
    function syncModeFeatures() {
        const mode = getMapMode();

        if (!mode) {
            return;
        }

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

    /**
     * Возвращает конфигурацию активного режима.
     */
    function getActiveMode() {
        return getMapMode();
    }

    return {
        syncModeFeatures,
        getActiveMode
    };
}


/**
 * Переключает базовую карту и синхронизирует интерфейс.
 */
function switchMapMode(map, modeId, announce = true) {
    const mode = mapModes[modeId];

    if (!mode) {
        console.warn(
            `Режим "${modeId}" не найден.`
        );

        return false;
    }

    // Состояние обновляется после успешной смены фона.

    // Меняем фоновое изображение карты.
    currentBaseLayer = switchLayer(
        map,
        mode.imagePath,
        currentBaseLayer
    );

    // Синхронизируем карточки и связанные инструменты.
    setActiveCard(modeId);

    updateProvinceTools(
        mode.features.provinceTools
    );

    updateChronology(
        mode.features.chronology
    );

    setProvinceLayerVisible(
        map,
        mode.features.provinces
    );

    // Единый источник состояния рассылает событие только при реальном изменении.
    if (announce) {
        setMapMode(modeId);
    } else {
        syncMapModeToDOM();
    }

    return true;
}


/**
 * Создаёт карточки из конфигурации mapModes.
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
                <div class="map-mode-card-content">
                    <span
                        class="material-icons map-mode-icon"
                        aria-hidden="true"
                    >${mode.icon}</span>

                    <h3>${mode.title}</h3>

                    <p>${mode.description}</p>
                </div>
            </button>
        `)
        .join('');

    setActiveCard(getMapModeId());
}


/**
 * Обновляет активное состояние карточек.
 */
function setActiveCard(modeId) {
    document
        .querySelectorAll('.map-mode-card')
        .forEach(card => {
            const isActive =
                card.dataset.mode === modeId;

            card.classList.toggle(
                'active',
                isActive
            );

            card.setAttribute(
                'aria-pressed',
                String(isActive)
            );
        });
}


/**
 * Подключает фоновые изображения к карточкам.
 * Повторно уже загруженные изображения не обрабатываем.
 */
function loadCardBackgrounds(container) {
    container
        .querySelectorAll('.map-mode-card')
        .forEach(card => {
            if (
                card.dataset.backgroundLoaded === 'true'
            ) {
                return;
            }

            const mode = mapModes[card.dataset.mode];

            if (!mode) {
                return;
            }

            const imageUrl = new URL(
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
 * Показывает или скрывает инструменты провинций.
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
 * Показывает или скрывает информацию о ходе и сезоне.
 */
function updateChronology(visible) {
    const turnInfo =
        document.querySelector('.turn-info');

    if (!turnInfo) {
        return;
    }

    turnInfo.style.display =
        visible ? 'flex' : 'none';
}
