import {
    transformFeatureCollection,
    COORD_CONFIG_ZONES
} from '../../../data/coords-transform.js';

import {
    tradeRouteData
} from './trade-routes-data.js';

import {
    TradeRouteCanvasRenderer
} from './trade-route-renderer.js';

import {
    openEntityPanel,
    closeEntityPanel
} from '../../../ui/entity-panel.js';


let tradeRouteLayer = null;
let tradeRouteRenderer = null;

let routeObjects = [];


/**
 * Загружает торговые маршруты.
 */
export async function loadTradeRoutes(map) {


const response = await fetch('src/data/trade-routes.geojson');

    if (!response.ok) {
        throw new Error(
            `Не удалось загрузить торговые маршруты: ${response.status}`
        );
    }

    const data =
        await response.json();


    /*
     * Преобразуем координаты
     * в систему Fauxlore.
     */
    const transformedData =
        transformFeatureCollection(
            data,
            COORD_CONFIG_ZONES
        );


    /*
     * Формируем объекты маршрутов.
     */
    routeObjects =
        transformedData.features
            .map(feature => {

                const properties =
    feature.properties || {};

const routeId =
    properties.route_id;

if (!routeId) {
    console.warn(
        'Торговый маршрут без ID пропущен.',
        feature
    );

    return null;
}

const economicData =
    tradeRouteData[routeId] || {};

const paths =
    geometryToPaths(
        feature.geometry
    );

return {
    id: routeId,

    name:
        economicData.name ||
        routeId,

    fromZone:
        properties.from_zone ||
        null,

    toZone:
        properties.to_zone ||
        null,

    routeType:
        properties.route_type ||
        null,

    turnover:
        economicData.turnover ||
        0,

    countries:
        economicData.countries ||
        [],

    geometry:
        feature.geometry,

    paths
};
            })
            .filter(Boolean);


    /*
     * Создаём скрытый интерактивный слой.
     *
     * Он НЕ рисует красивые маршруты.
     * Он нужен только для hover/click.
     */
    tradeRouteLayer =
        L.geoJSON(
            transformedData,
            {
                renderer: L.canvas(),

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


/**
 * Преобразует геометрию в
 * массивы Leaflet LatLng.
 */
function geometryToPaths(
    geometry
) {
    if (
        !geometry ||
        !geometry.coordinates
    ) {
        return [];
    }


    if (
        geometry.type ===
        'LineString'
    ) {
        return [
            geometry.coordinates.map(
                ([lng, lat]) =>
                    L.latLng(lat, lng)
            )
        ];
    }


    if (
        geometry.type ===
        'MultiLineString'
    ) {
        return geometry.coordinates.map(
            line =>
                line.map(
                    ([lng, lat]) => 
                        L.latLng(lat, lng)
                )
        );
    }


    console.warn(
        `Неподдерживаемая геометрия маршрута: ${geometry.type}`
    );

    return [];
}


/**
 * Информация о маршруте.
 */
function showTradeRouteInfo(
    routeId
) {
    const route =
        tradeRouteData[routeId];

    if (!route) {
        console.warn(
            `Нет данных маршрута: ${routeId}`
        );

        return;
    }


    const formatNumber =
        value => {

            if (
                value === null ||
                value === undefined ||
                value === ''
            ) {
                return '—';
            }

            return Number(value)
                .toLocaleString('ru-RU');
        };


    const fromName =
        getZoneName(
            route.fromZone
        );

    const toName =
        getZoneName(
            route.toZone
        );


    const countriesHtml =
        route.countries?.length
            ? route.countries
                .map(
                    country =>
                        `<div class="entity-data-row">
                            <span class="entity-data-label">
                                Государство
                            </span>

                            <span class="entity-data-value">
                                ${country}
                            </span>
                        </div>`
                )
                .join('')
            : `
                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Участники
                    </span>

                    <span class="entity-data-value">
                        —
                    </span>
                </div>
            `;


    const content = `
        <div class="entity-metrics">

            <div class="entity-metric">
                <span class="entity-metric-label">
                    Оборот
                </span>

                <span class="entity-metric-value">
                    ${formatNumber(
                        route.turnover
                    )}
                </span>
            </div>


            <div class="entity-metric">
                <span class="entity-metric-label">
                    Тип
                </span>

                <span class="entity-metric-value">
                    ${route.routeType || '—'}
                </span>
            </div>

        </div>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Направление
            </h4>

            <div class="entity-data-list">

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Откуда
                    </span>

                    <span class="entity-data-value">
                        ${fromName}
                    </span>
                </div>

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Куда
                    </span>

                    <span class="entity-data-value">
                        ${toName}
                    </span>
                </div>

            </div>

        </section>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Участники
            </h4>

            <div class="entity-data-list">
                ${countriesHtml}
            </div>

        </section>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Идентификатор
            </h4>

            <div class="entity-data-row">

                <span class="entity-data-label">
                    ID маршрута
                </span>

                <span class="entity-data-value entity-mono">
                    ${routeId}
                </span>

            </div>

        </section>
    `;


    openEntityPanel({
        type: 'Торговый маршрут',

        title:
            route.name ||
            routeId,

        subtitle:
            `${fromName} → ${toName}`,

        content
    });
}


/**
 * Получает название торговой зоны.
 */
function getZoneName(
    zoneId
) {
    if (!zoneId) {
        return '—';
    }

    /*
     * Импорт не нужен:
     * название маршрута может временно
     * отображаться через ID.
     *
     * Позже подключим полноценный
     * lookup торговых зон.
     */
    return zoneId;
}


export function getTradeRouteLayer() {
    return tradeRouteLayer;
}