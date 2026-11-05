import { tradeNodeData } from './trade-nodes-data.js';
import { showTradeNodeInfo } from './trade-node-panel.js';

let tradeNodeLayer = null;

const NODE_TYPES = {
    capital: { symbol: '♛', color: '#d8b56a' },
    city: { symbol: '◆', color: '#c7d2df' },
    port: { symbol: '⚓', color: '#70b7d8' },
    warehouse: { symbol: '▣', color: '#d6a85f' }
};

function isValidNode(node) {
    return Boolean(
        node &&
        typeof node.id === 'string' &&
        typeof node.name === 'string' &&
        node.mapPosition &&
        Number.isFinite(node.mapPosition.x) &&
        Number.isFinite(node.mapPosition.y)
    );
}

function createNodeIcon(type) {
    const config = NODE_TYPES[type] || NODE_TYPES.city;

    return L.divIcon({
        className: 'trade-node-icon-wrapper',
        html: `<span class="trade-node-icon" style="--trade-node-color:${config.color}" aria-hidden="true">${config.symbol}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

export function loadTradeNodes(map) {
    if (tradeNodeLayer) return Promise.resolve(tradeNodeLayer);

    if (!map.getPane('tradeNodesPane')) {
        map.createPane('tradeNodesPane');
        map.getPane('tradeNodesPane').style.zIndex = 625;
    }

    tradeNodeLayer = L.layerGroup();

    tradeNodeData.forEach(node => {
        if (!isValidNode(node)) {
            console.warn('[Trade Nodes] Некорректная запись узла пропущена:', node);
            return;
        }

        const marker = L.marker([node.mapPosition.y, node.mapPosition.x], {
            pane: 'tradeNodesPane',
            icon: createNodeIcon(node.type),
            keyboard: true,
            title: node.name
        });

        marker.bindTooltip(node.name, {
            direction: 'top',
            offset: [0, -12],
            opacity: 0.95,
            className: 'trade-node-tooltip'
        });

        marker.on('click', () => showTradeNodeInfo(node));
        marker.addTo(tradeNodeLayer);
    });

    return Promise.resolve(tradeNodeLayer);
}

export function setTradeNodesVisible(map, visible) {
    if (!tradeNodeLayer) return;
    const isVisible = map.hasLayer(tradeNodeLayer);

    if (visible && !isVisible) tradeNodeLayer.addTo(map);
    if (!visible && isVisible) map.removeLayer(tradeNodeLayer);
}

export function getTradeNodeLayer() {
    return tradeNodeLayer;
}

export function getTradeNodeCount() {
    return tradeNodeData.filter(isValidNode).length;
}
