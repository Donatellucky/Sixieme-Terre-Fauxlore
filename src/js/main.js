
import initFauxloreMap from "./map/init.js";

import { initMapModeControls } from "./ui/map-mode-control.js";
import { initMarkerGroups, initSidebar, initFilters } from "./ui/sidebar.js";

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

    await loadProvinces(map);

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
