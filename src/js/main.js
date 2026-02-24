// import initFauxloreMap from "./map/init.js";
// import { loadBaseLayer, switchLayer } from "./map/layers.js";

// Вставь сюда код init.js
function initFauxloreMap() {
    console.log('Инициализация карты...');
    const MAP_WIDTH = 3819;
    const MAP_HEIGHT = 2455;
    const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 3
    });
    map.fitBounds(bounds);
    window.fauxloreMap = map;
    window.mapBounds = bounds;
    return map;
}

// Вставь сюда код layers.js
function loadBaseLayer(map, imagePath) {
    console.log('Загружаем слой:', imagePath);
    const bounds = window.mapBounds;
    const imageLayer = L.imageOverlay(imagePath, bounds);
    imageLayer.addTo(map);
    return imageLayer;
}

function switchLayer(map, newImagePath, currentLayer) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    return loadBaseLayer(map, newImagePath);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    loadBaseLayer(map, 'src/assets/maps/newfauxpolit.png');
});