import { prepareTradeRoutes } from './trade-data-loader.js';

import {
    tradeRouteData
} from './trade-routes-data.js';

import {
    TradeRouteCanvasRenderer
} from './trade-route-renderer.js';

import { closeEntityPanel } from '../../../ui/entity-panel.js';
import { showTradeRouteInfo } from './trade-route-panel.js';


let tradeRouteLayer = null;
let loadingPromise = null;
let tradeRouteRenderer = null;

let routeObjects = [];


/**
 * Загружает торговые маршруты.
 */
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

    const { geojson: transformedData, routes } = await prepareTradeRoutes();
    // Адаптер данных для существующего Leaflet Canvas-рендерера.
    routeObjects = routes.map(route => ({
        id: route.id,
        name: route.name,
        fromZone: route.fromZone,
        toZone: route.toZone,
        routeType: route.routeType,
        turnover: route.turnover,
        countries: route.countries,
        geometry: route.geometry,
        paths: route.coordinatePaths.map(path => path.map(([lng, lat]) => L.latLng(lat, lng)))
    }));

    /*
     * Создаём скрытый интерактивный слой.
     *
     * Он НЕ рисует красивые маршруты.
     * Он нужен только для hover/click.
     */
    // Панель для невидимой геометрии попадания мышью.
    // Располагается выше торговых зон, но работает только в торговом режиме.
    if (!map.getPane('tradeRouteHitPane')) {
        map.createPane('tradeRouteHitPane');
        map.getPane('tradeRouteHitPane').style.zIndex = 420;
    }
    tradeRouteLayer =
        L.geoJSON(
            transformedData,
            {
                pane: 'tradeRouteHitPane',
                renderer: L.canvas({ pane: 'tradeRouteHitPane' }),

                style: {
                    color: '#000000',
                    weight: 48,

                    /*
                     * Практически невидимо.
                     * Геометрия всё равно остаётся
                     * интерактивной.
                     */
                    opacity: 0,

                    fillOpacity: 0
                },

                onEachFeature:
                    (feature, layer) => {

                        const routeId =
                            feature.properties?.route_id;

                        if (
                            !tradeRouteData[routeId]
                        ) {
                            return;
                        }

                        layer.on(
                            'mouseover',
                            () => {

                                tradeRouteRenderer
                                    ?.setHoveredRoute(
                                        routeId
                                    );

                                map.getContainer()
                                    .style.cursor =
                                    'pointer';
                            }
                        );


                        layer.on(
                            'mouseout',
                            () => {

                                if (
                                    tradeRouteRenderer
                                        ?.selectedRouteId !==
                                    routeId
                                ) {
                                    tradeRouteRenderer
                                        ?.setHoveredRoute(
                                            null
                                        );
                                }

                                map.getContainer()
                                    .style.cursor =
                                    '';
                            }
                        );


                        layer.on(
                            'click',
                            () => {

                                tradeRouteRenderer
                                    ?.setSelectedRoute(
                                        routeId
                                    );

                                showTradeRouteInfo(
                                    routeId
                                );
                            }
                        );
                    }
            }
        );


    /*
     * Создаём Canvas renderer.
     */
    tradeRouteRenderer =
        new TradeRouteCanvasRenderer(map);

    tradeRouteRenderer.init();

    tradeRouteRenderer.setRoutes(
        routeObjects
    );

    return tradeRouteLayer;
}


/**
 * Показывает / скрывает маршруты.
 */
export function setTradeRoutesVisible(
    map,
    visible
) {
    if (
        !tradeRouteLayer ||
        !tradeRouteRenderer
    ) {
        return;
    }


    const hitPane = map.getPane('tradeRouteHitPane');
    if (hitPane) hitPane.style.pointerEvents = visible ? 'auto' : 'none';

    if (visible) {

        if (!map.hasLayer(tradeRouteLayer)) {
            tradeRouteLayer.addTo(map);
        }

        tradeRouteRenderer.setVisible(
            true
        );

        return;
    }


    if (map.hasLayer(tradeRouteLayer)) {
        map.removeLayer(
            tradeRouteLayer
        );
    }

    tradeRouteRenderer.clearSelection();

    tradeRouteRenderer.setVisible(
        false
    );

    closeEntityPanel();

    map.getContainer()
        .style.cursor = '';
}


export function getTradeRouteLayer() {
    return tradeRouteLayer;
}