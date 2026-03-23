import initFauxloreMap from "./map/init.js";
import { loadBaseLayer, switchLayer } from "./map/layers.js";
import { initLayerControls } from "./ui/layer-control.js";
import { addMarkers } from "./map/markers.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    initLayerControls(map);
    addMarkers(map);
});