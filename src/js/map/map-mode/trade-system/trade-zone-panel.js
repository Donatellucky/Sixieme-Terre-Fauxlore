import { openEntityPanel } from '../../../ui/entity-panel.js';
import { formatNumber } from './trade-panel-format.js';

export function showTradeZoneInfo(zone, zoneId) {
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

