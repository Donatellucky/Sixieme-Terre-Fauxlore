import { TradeSvgRenderer } from './trade-svg-renderer.js';

let instance = null;

export function getTradeSvgRenderer(map) {
    if (!instance) {
        instance = new TradeSvgRenderer(map);
        instance.init();
        window.tradeSvgRenderer = instance;
    } else if (instance.map !== map) {
        throw new Error('D3 торговый рендерер уже привязан к другой карте.');
    }
    return instance;
}
