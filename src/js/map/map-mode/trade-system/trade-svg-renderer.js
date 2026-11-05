/**
 * Shared D3/SVG overlay for trade geography.
 * Leaflet remains responsible for the map; this renderer projects coordinates
 * into container pixels and redraws on map movement/zoom.
 */
export class TradeSvgRenderer {
    constructor(map) {
        if (!window.d3) {
            throw new Error('D3 не загружена. Проверьте подключение d3.min.js в map.html.');
        }

        this.map = map;
        this.d3 = window.d3;
        this.svg = null;
        this.root = null;
        this.zoneGroup = null;
        this.routeGroup = null;
        this.zones = [];
        this.routes = [];
        this.visible = false;
        this.hoveredZoneId = null;
        this.selectedZoneId = null;
        this.hoveredRouteId = null;
        this.selectedRouteId = null;
        this.onZoneHover = null;
        this.onZoneClick = null;
        this.onRouteHover = null;
        this.onRouteClick = null;
        this._redrawPending = false;

        this._boundRedraw = () => this.requestRedraw();
        this._boundZoomAnim = event => this.handleZoomAnimation(event);
        this._boundZoomEnd = () => this.finishZoomAnimation();
    }

    init() {
        if (this.svg) return;

        const d3 = this.d3;
        const size = this.map.getSize();

        this.svg = d3.select(this.map.getContainer())
            .append('svg')
            .attr('class', 'trade-d3-overlay')
            .attr('width', size.x)
            .attr('height', size.y)
            .attr('viewBox', `0 0 ${size.x} ${size.y}`)
            .attr('aria-label', 'Торговые зоны и маршруты');

        this.root = this.svg.append('g').attr('class', 'trade-d3-root');
        this.zoneGroup = this.root.append('g')
            .attr('class', 'trade-d3-zones')
            .attr('pointer-events', 'all');
        this.routeGroup = this.root.append('g')
            .attr('class', 'trade-d3-routes')
            .attr('pointer-events', 'all');

        this.map.on('move zoom resize viewreset', this._boundRedraw);
        this.map.on('zoomanim', this._boundZoomAnim);
        this.map.on('zoomend', this._boundZoomEnd);

        this.redraw();
    }

    destroy() {
        if (!this.svg) return;
        this.map.off('move zoom resize viewreset', this._boundRedraw);
        this.map.off('zoomanim', this._boundZoomAnim);
        this.map.off('zoomend', this._boundZoomEnd);
        this.svg.remove();
        this.svg.remove();
        this.svg = null;
        this.root = null;
        this.zoneGroup = null;
        this.routeGroup = null;
    }

    setZones(zones) {
        this.zones = zones || [];
        this.renderZones();
    }

    setRoutes(routes) {
        this.routes = routes || [];
        this.renderRoutes();
    }

    setVisible(visible) {
        this.visible = Boolean(visible);
        if (this.svg) this.svg.style('display', this.visible ? 'block' : 'none');
        if (this.visible) this.requestRedraw();
    }

    setZoneState({ hoveredId = this.hoveredZoneId, selectedId = this.selectedZoneId } = {}) {
        this.hoveredZoneId = hoveredId;
        this.selectedZoneId = selectedId;
        this.updateZoneStyles();
    }

    setRouteState({ hoveredId = this.hoveredRouteId, selectedId = this.selectedRouteId } = {}) {
        this.hoveredRouteId = hoveredId;
        this.selectedRouteId = selectedId;
        this.updateRouteStyles();
    }

    clearSelection() {
        this.hoveredZoneId = null;
        this.selectedZoneId = null;
        this.hoveredRouteId = null;
        this.selectedRouteId = null;
        this.updateZoneStyles();
        this.updateRouteStyles();
    }

    requestRedraw() {
        if (!this.visible || this._redrawPending) return;
        this._redrawPending = true;
        requestAnimationFrame(() => {
            this._redrawPending = false;
            this.redraw();
        });
    }

    handleZoomAnimation(event) {
        if (!this.svg || !this.visible) return;

        const size = this.map.getSize();
        const currentZoom = this.map.getZoom();

        const scale = this.map.getZoomScale(event.zoom, currentZoom);

        // Смещение целевого центра относительно текущего центра карты.
        const centerOffset = this.map.project(event.center, currentZoom)
            .subtract(this.map.project(this.map.getCenter(), currentZoom));

        // Рассчитываем смещение SVG относительно контейнера карты.
        const offset = size.divideBy(2)
            .subtract(size.divideBy(2).multiplyBy(scale))
            .subtract(centerOffset.multiplyBy(scale));

        this.svg
            .style('transform-origin', '0 0')
            .style('transition', 'transform 0.25s cubic-bezier(0,0,0.25,1)')
            .style(
                'transform',
                `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
            );
    }

    /**
     * Возвращает SVG в обычную систему координат после зума.
     */
    finishZoomAnimation() {
        if (!this.svg) return;

        this.svg
            .style('transition', 'none')
            .style('transform', 'none');

        // Пересчитываем точные координаты уже для нового масштаба.
        this.redraw();
    }

    redraw() {
        if (!this.svg) return;
        const size = this.map.getSize();
        this.svg
            .attr('width', size.x)
            .attr('height', size.y)
            .attr('viewBox', `0 0 ${size.x} ${size.y}`);

        this.zoneGroup.selectAll('path.trade-zone')
            .attr('d', feature => this.geometryPath(feature.geometry));
        this.routeGroup.selectAll('path.trade-route')
            .attr('d', route => this.routePath(route));

        this.updateZoneStyles();
        this.updateRouteStyles();
    }

    geometryPath(geometry) {
        if (!geometry) return '';
        const paths = [];
        const polygonPath = polygon => {
            for (const ring of polygon || []) {
                if (!ring.length) continue;
                const points = ring.map(([lng, lat]) => this.map.latLngToContainerPoint([lat, lng]));
                if (!points.length) continue;
                paths.push(`M${points.map(p => `${p.x},${p.y}`).join('L')}Z`);
            }
        };

        if (geometry.type === 'Polygon') polygonPath(geometry.coordinates);
        else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(polygonPath);
        else console.warn(`D3 trade overlay: unsupported zone geometry ${geometry.type}`);

        return paths.join('');
    }

    routePath(route) {
        const coordinatePaths = route.coordinatePaths || [];
        return coordinatePaths.map(path => {
            const points = path.map(([lng, lat]) => this.map.latLngToContainerPoint([lat, lng]));
            if (points.length < 2) return '';
            return `M${points.map(p => `${p.x},${p.y}`).join('L')}`;
        }).join('');
    }

    renderZones() {
        if (!this.zoneGroup) return;
        const renderer = this;

        const selection = this.zoneGroup.selectAll('path.trade-zone')
            .data(this.zones, d => d.properties?.id);

        selection.exit().remove();

        selection.enter()
            .append('path')
            .attr('class', 'trade-zone')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('fill-rule', 'evenodd')
            .attr('pointer-events', 'visiblePainted')
            .on('mouseenter', function(event, feature) {
                renderer.hoveredZoneId = feature.properties?.id;
                renderer.updateZoneStyles();
                renderer.onZoneHover?.(feature, true);
            })
            .on('mouseleave', function(event, feature) {
                if (renderer.hoveredZoneId === feature.properties?.id) {
                    renderer.hoveredZoneId = null;
                }
                renderer.updateZoneStyles();
                renderer.onZoneHover?.(feature, false);
            })
            .on('click', function(event, feature) {
                event.stopPropagation();
                renderer.selectedZoneId = feature.properties?.id;
                renderer.updateZoneStyles();
                renderer.onZoneClick?.(feature);
            });

        this.redraw();
    }

    renderRoutes() {
        if (!this.routeGroup) return;
        const renderer = this;

        const selection = this.routeGroup.selectAll('path.trade-route')
            .data(this.routes, d => d.id);

        selection.exit().remove();

        selection.enter()
            .append('path')
            .attr('class', 'trade-route')
            .attr('fill', 'none')
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('pointer-events', 'stroke')
            .on('mouseenter', function(event, route) {
                renderer.hoveredRouteId = route.id;
                renderer.updateRouteStyles();
                renderer.onRouteHover?.(route, true);
            })
            .on('mouseleave', function(event, route) {
                if (renderer.hoveredRouteId === route.id) renderer.hoveredRouteId = null;
                renderer.updateRouteStyles();
                renderer.onRouteHover?.(route, false);
            })
            .on('click', function(event, route) {
                event.stopPropagation();
                renderer.selectedRouteId = route.id;
                renderer.updateRouteStyles();
                renderer.onRouteClick?.(route);
            });

        this.redraw();
    }

    updateZoneStyles() {
        if (!this.zoneGroup) return;
        this.zoneGroup.selectAll('path.trade-zone')
            .attr('fill', feature => feature.properties?.color || '#7d8795')
            .attr('fill-opacity', feature => {
                const id = feature.properties?.id;
                return id === this.selectedZoneId ? 0.38 : id === this.hoveredZoneId ? 0.29 : 0.18;
            })
            .attr('stroke', feature => {
                const id = feature.properties?.id;
                return id === this.selectedZoneId ? '#ffc15c' : id === this.hoveredZoneId ? '#fff0c8' : '#d8b56a';
            })
            .attr('stroke-width', feature => {
                const id = feature.properties?.id;
                return id === this.selectedZoneId ? 3.5 : id === this.hoveredZoneId ? 2.6 : 1.4;
            })
            .attr('cursor', 'pointer');
    }

    updateRouteStyles() {
        if (!this.routeGroup) return;
        const maxTurnover = Math.max(...this.routes.map(route => Number(route.turnover) || 0), 1);
        this.routeGroup.selectAll('path.trade-route')
            .attr('stroke', route => route.id === this.selectedRouteId ? '#fff4d5' : route.id === this.hoveredRouteId ? '#ffe6a1' : '#d8b56a')
            .attr('stroke-width', route => {
                const value = Math.max(Number(route.turnover) || 0, 0);
                const ratio = Math.log1p(value) / Math.log1p(maxTurnover);
                const base = 3 + ratio * 8;
                return route.id === this.selectedRouteId ? base + 3 : route.id === this.hoveredRouteId ? base + 2 : base;
            })
            .attr('stroke-linecap', 'round')
            .attr('stroke-linejoin', 'round')
            .attr('opacity', route => route.id === this.selectedRouteId ? 1 : route.id === this.hoveredRouteId ? 0.98 : 0.82)
            .attr('cursor', 'pointer');
    }
}
