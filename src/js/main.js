import initFauxloreMap from "./map/init";
import { loadBaseLayer } from "./map/layers";

document.addEventListener('DOMContentLoaded',) {
    console.log('Sixième Terre запущен');

    const map = initFauxloreMap();

     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}