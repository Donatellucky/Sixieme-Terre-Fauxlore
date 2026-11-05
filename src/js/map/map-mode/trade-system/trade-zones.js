import { prepareTradeZones } from './trade-data-loader.js';
import { tradeZoneData } from './trade-zones-data.js';
import { closeEntityPanel } from '../../../ui/entity-panel.js';
import { showTradeZoneInfo } from './trade-zone-panel.js';
import { getTradeSvgRenderer } from './trade-svg-renderer-instance.js';

let tradeZoneLayer = null;
let loadingPromise = null;
let currentHighlightId = null;

window.addEventListener('entity-panel:closed', clearTradeZoneHighlight);

export function loadTradeZones(map) {
    if (tradeZoneLayer) return Promise.resolve(tradeZoneLayer);
    if (loadingPromise) return loadingPromise;
    loadingPromise = fetchAndBuildZones(map).catch(error => {
        loadingPromise = null;
        throw error;
    });
    return loadingPromise;
}

async function fetchAndBuildZones(map) {
    const { geojson } = await prepareTradeZones();
    const renderer = getTradeSvgRenderer(map);
    renderer.onZoneHover = (_feature, _hovered) => {};
    renderer.onZoneClick = feature => {
        const id = feature.properties?.id;
        if (!id) return;
        currentHighlightId = id;
        const zone = tradeZoneData[id] || fallbackZone(feature);
        showTradeZoneInfo(zone, id);
    };
    renderer.setZones(geojson.features);
    tradeZoneLayer = {
        visible: false,
        addTo() { this.visible = true; renderer.setVisible(true); return this; },
        remove() { this.visible = false; renderer.setVisible(false); },
        _d3TradeLayer: true
    };
    console.info('[Trade Zones] Загружено:', {
        features: geojson.features.length,
        renderer: 'D3/SVG',
        ids: geojson.features.map(feature => feature.properties?.id)
    });
    return tradeZoneLayer;
}

function fallbackZone(feature) {
    return {
        name: feature.properties?.name || feature.properties?.id || 'Торговая зона',
        participants: 0,
        totalTradeInfluence: 0,
        totalValue: 0,
        activeFlows: 0,
        connectedMarkets: 0,
        monopolist: null,
        totalProduction: 0,
        totalImport: 0,
        totalExport: 0
    };
}

export function clearTradeZoneHighlight() {
    currentHighlightId = null;
    const renderer = window.tradeSvgRenderer;
    renderer?.setZoneState({ hoveredId: null, selectedId: null });
}

export function setTradeZonesVisible(map, visible) {
    if (!tradeZoneLayer) return;
    const renderer = window.tradeSvgRenderer;
    tradeZoneLayer.visible = Boolean(visible);
    renderer?.setVisible(Boolean(visible));
    if (!visible) {
        clearTradeZoneHighlight();
        closeEntityPanel();
    }
}

export function getTradeZoneLayer() {
    return tradeZoneLayer;
}
