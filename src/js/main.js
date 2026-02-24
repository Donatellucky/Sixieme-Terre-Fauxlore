import initFauxloreMap from "./map/init.js";
import { loadBaseLayer, switchLayer } from "./map/layers.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sixième Terre запущен');

    const map = initFauxloreMap();

     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}