import { getMapMode, subscribeMapMode } from '../../../data/map-mode-state.js';
import { loadTradeZones, setTradeZonesVisible, getTradeZoneLayer } from './trade-zones.js';
import { loadTradeRoutes, setTradeRoutesVisible, getTradeRouteLayer } from './trade-routes.js';

let initializedMap = null;
let initializationPromise = null;

/** Initializes trade subsystems once for one map instance. */
export function initTradeSystem(map) {
    if (initializedMap === map && initializationPromise) return initializationPromise;
    if (initializedMap && initializedMap !== map) {
        throw new Error('Торговая система уже привязана к другой карте.');
    }
    initializedMap = map;

    const ready = { zones: false, routes: false };
    const sync = () => {
        const features = getMapMode()?.features || {};
        if (ready.zones) setTradeZonesVisible(map, Boolean(features.tradeZones));
        if (ready.routes) setTradeRoutesVisible(map, Boolean(features.tradeRoutes));
    };

    subscribeMapMode(sync);

    async function initializePart(name, load, isReady) {
        try {
            await load(map);
            ready[name] = isReady();
            if (!ready[name]) throw new Error(`Слой ${name} не был создан`);
            console.info(`[Trade] ${name}: готов`);
        } catch (error) {
            ready[name] = false;
            console.error(`[Trade] ${name}: ошибка инициализации`, error);
        } finally {
            sync();
        }
    }

    initializationPromise = Promise.all([
        initializePart('zones', loadTradeZones, () => Boolean(getTradeZoneLayer())),
        initializePart('routes', loadTradeRoutes, () => Boolean(getTradeRouteLayer()))
    ]).then(() => {
        console.info('[Trade] Состояние слоёв:', {
            mode: getMapMode()?.id,
            zonesReady: ready.zones,
            routesReady: ready.routes,
            zonesVisible: Boolean(getTradeZoneLayer()?.visible),
            routesVisible: Boolean(getTradeRouteLayer()?.visible)
        });
    });

    return initializationPromise;
}
