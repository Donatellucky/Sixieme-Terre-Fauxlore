function initFauxloreMap() {
    console.log('Инициализация карты...')

    const MAP_WIDTH = 3819;
    const MAP_HEIGHT = 2455;
    const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

    const map = L.map('map', {
        crs: L.crs.simple,
        minZoom: -2,
        maxZoom: 3
    })

    map.fitBounds(bounds);

    window.fauxloreMap = map;
    window.mapBounds = bounds;

    console.log('Карта создана', map);

    return map;
}

export default initFauxloreMap;