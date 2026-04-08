import initFauxloreMap from "./map/init.js";
import { initLayerControls } from "./ui/layer-control.js";
import { addMarkers } from "./map/markers.js";
import { initSidebar } from "./ui/sidebar.js";
import { loadProvinces } from "./data/provinces.js";
import { updateProvincesList } from "./ui/sidebar.js";
import { initFilters } from "./ui/sidebar.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    initLayerControls(map);
    addMarkers(map);
    initSidebar(map);
    
    // Загружаем провинции и после завершения обновляем список
    loadProvinces(map).then(() => {
        updateProvincesList(map);
        initFilters(provinceFeatures); //передаем массив провинции
    });
});