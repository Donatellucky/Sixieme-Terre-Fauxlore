import { openEntityPanel } from '../../../ui/entity-panel.js';

const NODE_TYPE_LABELS = {
    capital: 'Столица',
    city: 'Город',
    port: 'Порт',
    warehouse: 'Склад'
};

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function row(label, value) {
    return `<div class="entity-data-row">
        <span class="entity-data-label">${escapeHTML(label)}</span>
        <span class="entity-data-value">${escapeHTML(value || '—')}</span>
    </div>`;
}

export function showTradeNodeInfo(node) {
    const typeLabel = NODE_TYPE_LABELS[node.type] || 'Торговый узел';
    const content = `
        <section class="entity-section">
            <h4 class="entity-section-title">Сведения об узле</h4>
            <div class="entity-data-list">
                ${row('Тип узла', typeLabel)}
                ${row('Государство', node.stateName || node.stateId)}
                ${row('Торговая зона', node.zoneName || node.zoneId)}
                ${row('Состояние', node.status === 'inactive' ? 'Неактивен' : 'Активен')}
            </div>
        </section>
        ${node.description ? `<section class="entity-section">
            <h4 class="entity-section-title">Описание</h4>
            <p>${escapeHTML(node.description)}</p>
        </section>` : ''}
        <section class="entity-section">
            <h4 class="entity-section-title">Идентификатор</h4>
            ${row('ID узла', node.id)}
        </section>
        <p class="trade-node-placeholder">Экономические показатели узла будут подключены на следующих этапах.</p>
    `;

    openEntityPanel({
        type: typeLabel,
        title: escapeHTML(node.name),
        subtitle: `ID: ${escapeHTML(node.id)}`,
        content
    });
}
