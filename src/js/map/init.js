export default function initFauxloreMap() {
    console.log('Инициализация карты...');
    const MAP_WIDTH = 3478;
    const MAP_HEIGHT = 2271;
    const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 1.5,
        zoomControl: true,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.fitBounds(bounds);
    window.fauxloreMap = map;
    window.mapBounds = bounds;
    return map;
}