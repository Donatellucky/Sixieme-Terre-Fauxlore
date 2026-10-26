import { tradeRouteData } from './trade-routes-data.js';
import { openEntityPanel } from '../../../ui/entity-panel.js';
import { formatNumber } from './trade-panel-format.js';

export function showTradeRouteInfo(
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

