import {
    loadTradeZones,
    setTradeZonesVisible
} from './trade-zones.js';

import {
    loadTradeRoutes,
    setTradeRoutesVisible
} from './trade-routes.js';


export async function initTradeSystem(map) {

    /*
     * Торговые зоны — базовый слой.
     */
    try {
        await loadTradeZones(map);

        console.log(
            'Trade system: зоны загружены.'
        );
    } catch (error) {
        console.error(
            'Ошибка загрузки торговых зон:',
            error
        );
    }


    /*
     * Маршруты — дополнительный слой.
     *
     * Если маршруты сломались,
     * зоны всё равно должны работать.
     */
    try {
        await loadTradeRoutes(map);

        console.log(
            'Trade system: маршруты загружены.'
        );
    } catch (error) {
        console.error(
            'Ошибка загрузки торговых маршрутов:',
            error
        );
    }


    /*
     * Проверяем текущий режим.
     */
    const currentMode =
        document.body.dataset.mapMode;


    const isTrade =
        currentMode === 'trade';


    setTradeZonesVisible(
        map,
        isTrade
    );

    setTradeRoutesVisible(
        map,
        isTrade
    );


    /*
     * Реагируем на переключение режима.
     */
    window.addEventListener(
        'map:modechange',
        event => {

            const modeId =
                event.detail?.id;


            const tradeActive =
                modeId === 'trade';


            setTradeZonesVisible(
                map,
                tradeActive
            );

            setTradeRoutesVisible(
                map,
                tradeActive
            );
        }
    );
}