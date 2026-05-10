import initFauxloreMap from "./map/init.js";
import { initLayerControls } from "./ui/layer-control.js";
import { addMarkers } from "./map/markers.js";
import { initSidebar } from "./ui/sidebar.js";
import { loadProvinces } from "./data/provinces.js";
import { updateProvincesList } from "./ui/sidebar.js";
import { initFilters } from "./ui/sidebar.js";
import { loadBaseLayer } from "./map/layers.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    initLayerControls(map);
    loadBaseLayer(map, 'src/assets/maps/newfauxpolit.png');
    addMarkers(map);
    initSidebar(map);
    
    // Загружаем провинции и после завершения обновляем список
    loadProvinces(map).then(() => {
        updateProvincesList(map);
        initFilters(provinceFeatures); //передаем массив провинции
    });
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
        // Можно менять иконку кнопки, если нужно
        // toggleBtn.textContent = sidebar.classList.contains('closed') ? '☰' : '✕';
    });
}
});