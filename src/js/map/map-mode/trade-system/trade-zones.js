import { transformFeatureCollection, COORD_CONFIG_ZONES } from '/src/js/data/coords-transform.js';
import { tradeZoneData } from './trade-zones-data.js';
import { openEntityPanel, closeEntityPanel } from '../../../ui/entity-panel.js';

let tradeZoneLayer = null;
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


export async function loadTradeZones(map) {
    const response = await fetch('/src/data/trade-zones.geojson');

    if (!response.ok) {
        throw new Error(
            `Не удалось загрузить торговые зоны: ${response.status}`
        );
    }

    const data = await response.json();

    data.features = data.features.filter(feature =>
        feature.geometry &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length > 0
    );

    const transformedData = transformFeatureCollection(
        data,
        COORD_CONFIG_ZONES
    );

    tradeZoneLayer = L.geoJSON(transformedData, {
        renderer: L.canvas(),

        style: feature => {
            const zoneId = feature.properties?.routes.id;
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

        const zoneId = feature.properties?.route_id;
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


function showTradeZoneInfo(zone, zoneId) {
    const formatNumber = value => {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return '—';
        }

        return Number(value).toLocaleString('ru-RU');
    };

    const content = `
        <div class="entity-metrics">

            <div class="entity-metric">
                <span class="entity-metric-label">
                    Участники
                </span>

                <span class="entity-metric-value">
                    ${formatNumber(zone.participants)}
                </span>
            </div>

            <div class="entity-metric">
                <span class="entity-metric-label">
                    Торговое влияние
                </span>

                <span class="entity-metric-value">
                    ${formatNumber(zone.totalTradeInfluence)}
                </span>
            </div>

            <div class="entity-metric">
                <span class="entity-metric-label">
                    Общая ценность
                </span>

                <span class="entity-metric-value">
                    ${formatNumber(zone.totalValue)}
                </span>
            </div>

            <div class="entity-metric">
                <span class="entity-metric-label">
                    Работающие потоки
                </span>

                <span class="entity-metric-value">
                    ${formatNumber(zone.activeFlows)}
                </span>
            </div>

        </div>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Структура рынка
            </h4>

            <div class="entity-data-list">

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Связанные рынки
                    </span>

                    <span class="entity-data-value">
                        ${formatNumber(zone.connectedMarkets)}
                    </span>
                </div>

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Монополист
                    </span>

                    <span class="entity-data-value">
                        ${zone.monopolist || '—'}
                    </span>
                </div>

            </div>

        </section>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Торговый баланс
            </h4>

            <div class="entity-data-list">

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Производство
                    </span>

                    <span class="entity-data-value">
                        ${formatNumber(zone.totalProduction)}
                    </span>
                </div>

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Импорт
                    </span>

                    <span class="entity-data-value">
                        ${formatNumber(zone.totalImport)}
                    </span>
                </div>

                <div class="entity-data-row">
                    <span class="entity-data-label">
                        Экспорт
                    </span>

                    <span class="entity-data-value">
                        ${formatNumber(zone.totalExport)}
                    </span>
                </div>

            </div>

        </section>


        <section class="entity-section">

            <h4 class="entity-section-title">
                Идентификатор
            </h4>

            <div class="entity-data-row">
                <span class="entity-data-label">
                    ID зоны
                </span>

                <span class="entity-data-value entity-mono">
                    ${zoneId}
                </span>
            </div>

        </section>
    `;

    openEntityPanel({
        type: 'Торговая зона',
        title: zone.name || zoneId,
        subtitle: `ID: ${zoneId}`,
        content
    });
}


export function setTradeZonesVisible(map, visible) {
    if (!tradeZoneLayer) return;

    const isVisible = map.hasLayer(tradeZoneLayer);

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