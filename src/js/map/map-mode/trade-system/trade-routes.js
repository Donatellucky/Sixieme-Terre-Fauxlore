import { prepareTradeRoutes } from './trade-data-loader.js';
import { tradeRouteData } from './trade-routes-data.js';
import { TradeRouteCanvasRenderer } from './trade-route-renderer.js';
import { closeEntityPanel } from '../../../ui/entity-panel.js';
import { showTradeRouteInfo } from './trade-route-panel.js';
import { getTradeSvgRenderer } from './trade-svg-renderer-instance.js';

let tradeRouteLayer = null;
let loadingPromise = null;
let tradeRouteRenderer = null;

export function loadTradeRoutes(map) {
    if (tradeRouteLayer && tradeRouteRenderer) return Promise.resolve(tradeRouteLayer);
    if (loadingPromise) return loadingPromise;
    loadingPromise = fetchAndBuildRoutes(map).catch(error => {
        loadingPromise = null;
        throw error;
    });
    return loadingPromise;
}

async function fetchAndBuildRoutes(map) {
    const { routes } = await prepareTradeRoutes();
    const svgRenderer = getTradeSvgRenderer(map);

    svgRenderer.onRouteClick = route => showTradeRouteInfo(route.id);
    svgRenderer.onRouteHover = () => {};

    tradeRouteRenderer = new TradeRouteCanvasRenderer(map);
    tradeRouteRenderer.renderer = svgRenderer;
    tradeRouteRenderer.init();
    tradeRouteRenderer.setRoutes(routes);

    tradeRouteLayer = {
        visible: false,
        addTo() { this.visible = true; svgRenderer.setVisible(true); return this; },
        remove() { this.visible = false; svgRenderer.setVisible(false); },
        _d3TradeLayer: true
    };

    console.info('[Trade Routes] Загружено:', {
        routes: routes.length,
        renderer: 'D3/SVG',
        ids: routes.map(route => route.id)
    });
    return tradeRouteLayer;
}

export function setTradeRoutesVisible(map, visible) {
    if (!tradeRouteLayer || !tradeRouteRenderer) return;
    tradeRouteLayer.visible = Boolean(visible);
    tradeRouteRenderer.setVisible(visible);
    if (!visible) {
        tradeRouteRenderer.clearSelection();
        closeEntityPanel();
        map.getContainer().style.cursor = '';
    }
}

export function getTradeRouteLayer() {
    return tradeRouteLayer;
}
