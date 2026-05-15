import initFauxloreMap from "./map/init.js";
import { initLayerControls } from "./ui/layer-control.js";
import { addMarkers } from "./map/markers.js";
import { initSidebar, updateProvincesList, initFilters } from "./ui/sidebar.js";
import { loadProvinces, getProvincesList } from "./data/provinces.js";
import { loadBaseLayer } from "./map/layers.js";

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    initLayerControls(map);
    loadBaseLayer(map, 'src/assets/maps/newfauxpolit.png');
    addMarkers(map);
    initSidebar(map);
    
    // Загружаем провинции
    await loadProvinces(map);
    const provinceFeatures = getProvincesList();
    
    // Обновляем список провинций в НИЖНЕЙ панели
    updateProvincesList(map, 'bottom');
    
    // Инициализируем фильтры
    if (typeof initFilters === 'function') {
        initFilters(provinceFeatures);
    }

// ===== УПРАВЛЕНИЕ ПАНЕЛЯМИ =====
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const bottomPanel = document.querySelector('.bottom-panel');
const bottomToggle = document.getElementById('bottom-toggle');

function closeAllPanels() {
    if (sidebar) sidebar.classList.remove('open');
    if (bottomPanel) bottomPanel.classList.remove('open');
}

function openOnlyThisPanel(panelToOpen) {
    closeAllPanels();
    if (panelToOpen) panelToOpen.classList.add('open');
}

function toggleThisPanel(panel) {
    if (panel.classList.contains('open')) {
        closeAllPanels();
    } else {
        openOnlyThisPanel(panel);
    }
}

if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleThisPanel(sidebar));
}
if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => closeAllPanels());
}
if (bottomToggle && bottomPanel) {
    bottomToggle.addEventListener('click', () => toggleThisPanel(bottomPanel));
}
});