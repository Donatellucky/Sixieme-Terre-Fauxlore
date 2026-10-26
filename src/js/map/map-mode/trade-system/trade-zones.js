import { prepareTradeZones } from './trade-data-loader.js';
import { tradeZoneData } from './trade-zones-data.js';
import { closeEntityPanel } from '../../../ui/entity-panel.js';
import { showTradeZoneInfo } from './trade-zone-panel.js';

let tradeZoneLayer = null;
let loadingPromise = null;
let currentHighlight = null;

window.addEventListener(
    'entity-panel:closed',
    () => {
        clearTradeZoneHighlight();
    }
);

const DEFAULT_STYLE = {
    color: '#d8b56a',
    weight: 1.5,
    fillOpacity: 0.12
};

const HOVER_STYLE = {
    color: '#f1dcb7',
    weight: 3,
    fillOpacity: 0.28
};

const SELECTED_STYLE = {
    color: '#ffaa00',
    weight: 4,
    fillOpacity: 0.35
};


export function loadTradeZones(map) {
    if (tradeZoneLayer) return Promise.resolve(tradeZoneLayer);
    if (loadingPromise) return loadingPromise;
    loadingPromise = fetchAndBuildZones(map).catch(error => {
        loadingPromise = null; // разрешаем повторную попытку после ошибки
        throw error;
    });
    return loadingPromise;
}

async function fetchAndBuildZones(map) {
    const { geojson: transformedData } = await prepareTradeZones();

    // Торговые зоны располагаются ниже стандартного overlayPane,
// в котором находятся полигоны провинций.
if (!map.getPane('tradeZonesPane')) {
    map.createPane('tradeZonesPane');
    map.getPane('tradeZonesPane').style.zIndex = 390;
}

tradeZoneLayer = L.geoJSON(transformedData, {
    pane: 'tradeZonesPane',
    renderer: L.canvas({
        pane: 'tradeZonesPane'
    }),

        style: feature => {
            const zoneId = feature.properties?.id;
            const zone = tradeZoneData[zoneId];

        return {
            ...DEFAULT_STYLE,
            fillColor: zone?.color || feature.properties?.color || '#666'
        };
    },

        onEachFeature: (feature, layer) => {
            setupZoneInteraction(feature, layer);
        }
    });

    return tradeZoneLayer;
}


function setupZoneInteraction(feature, layer) {
    layer.on('mouseover', () => {
        if (currentHighlight && currentHighlight !== layer) {
            resetZoneStyle(currentHighlight);
            currentHighlight = null;
        }

        layer.setStyle(HOVER_STYLE);
    });

    layer.on('mouseout', () => {
        if (layer !== currentHighlight) {
            resetZoneStyle(layer);
        }
    });

    layer.on('click', () => {
        if (currentHighlight && currentHighlight !== layer) {
            resetZoneStyle(currentHighlight);
        }

        layer.setStyle(SELECTED_STYLE);
        currentHighlight = layer;

        const zoneId = feature.properties?.id;
        const zone = tradeZoneData[zoneId];

        if (!zone) {
            console.warn(
                `Для торговой зоны "${zoneId}" нет экономических данных.`
            );
            return;
        }

        showTradeZoneInfo(zone, zoneId);
    });
}


function resetZoneStyle(layer) {
    const zoneId = layer.feature?.properties?.id;
    const zone = tradeZoneData[zoneId];

    layer.setStyle({
        ...DEFAULT_STYLE,
        fillColor: zone?.color ||
            layer.feature?.properties?.color ||
            '#666'
    });
}


export function clearTradeZoneHighlight() {
    if (!currentHighlight) return;

    resetZoneStyle(currentHighlight);
    currentHighlight = null;
}


export function setTradeZonesVisible(map, visible) {
    if (!tradeZoneLayer) return;

    const isVisible = map.hasLayer(tradeZoneLayer);
    const pane = map.getPane('tradeZonesPane');
    if (pane) pane.style.pointerEvents = visible ? 'auto' : 'none';

    if (visible && !isVisible) {
        tradeZoneLayer.addTo(map);
    }

    if (!visible && isVisible) {
        clearTradeZoneHighlight();
        map.removeLayer(tradeZoneLayer);
    }

if (!visible) {
    closeEntityPanel();
}
}


export function getTradeZoneLayer() {
    return tradeZoneLayer;
}