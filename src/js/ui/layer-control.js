import { switchLayer } from "../map/layers.js";

export function initLayerControls(map) {
    const layerButtons = document.querySelectorAll('.layer-btn');
    let currentLayer = null;

    const layerPaths = {
        political: 'src/assets/maps/newfauxpolit.png',
        geographic: 'src/assets/maps/newfaux.png',
        trade: 'src/assets/maps/newfauxtrade.png',
        resources: 'src/assets/maps/newfauxresource_actual_hod_0.png'
    }

    const defaultLayer = 'political';
    const defaultButton = document.querySelector(`.layer-btn[data-layer="${defaultLayer}]`);
        if (defaultButton) {
        defaultButton.classList.add('active')
        currentLayer = null(map, layerPaths[defaultLayer]);
    }

    layerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const layer = btn.dataset.layer;

            layerButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentLayer = switchLayer(map, layerPaths[layer], currentLayer)
        })
    })
}