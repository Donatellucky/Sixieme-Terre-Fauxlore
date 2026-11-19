
import initFauxloreMap from "./map/init.js";

import { initMapModeControls } from "./ui/map-mode-control.js";
import { initMarkerGroups, initSidebar, initFilters } from "./ui/sidebar.js";

import {
    createProvinceSystem
} from './map/spatial/province-system.js';

import {
    loadProvinces,
    getProvincesList
} from "./data/provinces.js";

import {
    applyProvinceHash,
    initHashListener
} from "./ui/url-hash.js";

import {
    initTradeSystem
} from "./map/map-mode/trade-system/trade-system.js";

import {
    initMeasurementTool
} from "./map/measurement-tool.js";

// Новые модули интерфейса
import {
    initCoordinatesControl
} from "./ui/coordinates-control.js";

import {
    initToolPanels
} from "./ui/tool-panels.js";

import {
    initFullscreenControl
} from "./ui/fullscreen-control.js";


document.addEventListener('DOMContentLoaded', async () => {
    console.log('Sixième Terre запущен');

    // ===== 1. СОЗДАНИЕ КАРТЫ =====

    const map = initFauxloreMap();

    // ===== 2. СИСТЕМЫ КАРТЫ =====

    initMeasurementTool(map);

    const mapModeControls = initMapModeControls(map);

    initTradeSystem(map);

    // ===== 3. МАРКЕРЫ =====

    const markerGroups = initMarkerGroups(map);

    window.markerGroups = markerGroups;

    initSidebar(map);

    // ===== 4. ПРОВИНЦИИ =====

    // 4.1. Запускаем старую систему.
    // Пока сохраняем её для совместимости
    // с существующими панелями и фильтрами.

    await loadProvinces(map);

    // 4.2. Запускаем новую систему геометрии.

    try {
        const provinceSystem = await createProvinceSystem({
            map,

            baseUrl: './src/data/provinces/geometry/',

            // Основное оформление новой геометрии.
            style: () => ({
                color: '#b9a3d6',
                weight: 0.8,
                opacity: 0.8,
                fillColor: '#8b72a8',
                fillOpacity: 0.12,
            }),

            // Ошибки отдельных тайлов не должны
            // останавливать работу всей карты.
            onTileError: ({ tileId, error }) => {
                console.error(
                    `Ошибка загрузки тайла ${tileId}:`,
                    error
                );
            },
        });

        // Сохраняем доступ к системе для других модулей.
        window.provinceSystem = provinceSystem;

        console.log(
            'Новая система провинций запущена',
            provinceSystem.getStats()
        );

    } catch (error) {
        console.error(
            'Не удалось запустить новую систему провинций:',
            error
        );
    }

    // 4.3. Синхронизируем старые функции режимов карты.
    mapModeControls.syncModeFeatures();


    // ===== 5. URL И ФИЛЬТРЫ =====

    applyProvinceHash(map);
    initHashListener(map);

    const provinceFeatures = getProvincesList();

    if (typeof initFilters === 'function') {
        initFilters(provinceFeatures);
    }

    // ===== 6. ИНТЕРФЕЙС =====

    initCoordinatesControl(map);

    initToolPanels();

    initFullscreenControl();

    console.log('Инициализация Sixième Terre завершена');
});
