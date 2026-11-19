
import { WORLD_BOUNDS } from './spatial/new-world-coordinates.js';

export default function initFauxloreMap() {
    console.log('Инициализация карты...');

    const map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 1.5,
        zoomControl: true,
        maxBounds: WORLD_BOUNDS,
        maxBoundsViscosity: 1.0,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.fitBounds(WORLD_BOUNDS);

    window.fauxloreMap = map;
    window.mapBounds = WORLD_BOUNDS;

    return map;
}
