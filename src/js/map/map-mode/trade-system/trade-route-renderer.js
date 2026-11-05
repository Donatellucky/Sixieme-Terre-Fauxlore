/**
 * Compatibility wrapper: route rendering is handled by shared D3/SVG overlay.
 */
export class TradeRouteCanvasRenderer {
    constructor(map) {
        this.map = map;
        this.visible = false;
        this.hoveredRouteId = null;
        this.selectedRouteId = null;
        this.routes = [];
        this.renderer = window.tradeSvgRenderer || null;
    }

    init() {
        if (!this.renderer) throw new Error('Shared D3 renderer must be initialized before routes.');
    }

    destroy() {}

    setRoutes(routes) {
        this.routes = routes || [];
        this.renderer?.setRoutes(this.routes);
    }

    setVisible(visible) {
        this.visible = Boolean(visible);
        this.renderer?.setVisible(this.visible);
    }

    setHoveredRoute(routeId) {
        this.hoveredRouteId = routeId;
        this.renderer?.setRouteState({ hoveredId: routeId });
    }

    setSelectedRoute(routeId) {
        this.selectedRouteId = routeId;
        this.renderer?.setRouteState({ selectedId: routeId });
    }

    clearSelection() {
        this.hoveredRouteId = null;
        this.selectedRouteId = null;
        this.renderer?.setRouteState({ hoveredId: null, selectedId: null });
    }
}
