import { transformFeatureCollection, COORD_CONFIG_ZONES } from '../../../data/coords-transform.js';
import { tradeZoneData } from './trade-zones-data.js';
import { tradeRouteData } from './trade-routes-data.js';

async function fetchCollection(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Не удалось загрузить ${url}: ${response.status} ${response.statusText}`);
    const collection = await response.json();
    if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
        throw new Error(`Некорректный FeatureCollection: ${url}`);
    }
    return collection;
}

function validZoneFeature(feature) {
    const geometry = feature?.geometry;
    const validType = geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon';
    const validCoordinates = Array.isArray(geometry?.coordinates) && geometry.coordinates.length > 0;
    if (!validType || !validCoordinates) {
        console.warn('[Trade Zones] Пропущена некорректная геометрия:', {
            id: feature?.properties?.id, type: geometry?.type
        });
        return false;
    }
    return true;
}

export async function prepareTradeZones() {
    const collection = await fetchCollection('src/data/trade-zones.geojson');
    const features = collection.features.filter(validZoneFeature);
    const geojson = transformFeatureCollection({ ...collection, features }, COORD_CONFIG_ZONES);
    const zones = geojson.features.map(feature => ({
        id: feature.properties?.id ?? null,
        properties: feature.properties ?? {},
        geometry: feature.geometry,
        economicData: tradeZoneData[feature.properties?.id] ?? null
    }));
    for (const zone of zones) {
        if (!zone.geometry?.coordinates?.length) {
            throw new Error(`[Trade Zones] Пустая геометрия после преобразования: ${zone.id}`);
        }
    }
    return { geojson, zones };
}

function geometryToCoordinatePaths(geometry) {
    if (!geometry?.coordinates) return [];
    if (geometry.type === 'LineString') return [geometry.coordinates];
    if (geometry.type === 'MultiLineString') return geometry.coordinates;
    console.warn(`Неподдерживаемая геометрия маршрута: ${geometry.type}`);
    return [];
}

export async function prepareTradeRoutes() {
    const collection = await fetchCollection('src/data/trade-routes.geojson');
    const geojson = transformFeatureCollection(collection, COORD_CONFIG_ZONES);
    const routes = geojson.features.map(feature => {
        const properties = feature.properties ?? {};
        const routeId = properties.route_id;
        if (!routeId) {
            console.warn('Торговый маршрут без ID пропущен.', feature);
            return null;
        }
        const economicData = tradeRouteData[routeId] ?? {};
        return {
            id: routeId,
            name: economicData.name || routeId,
            fromZone: properties.from_zone || economicData.fromZone || null,
            toZone: properties.to_zone || economicData.toZone || null,
            routeType: properties.route_type || economicData.routeType || null,
            turnover: economicData.turnover || 0,
            countries: economicData.countries || [],
            geometry: feature.geometry,
            coordinatePaths: geometryToCoordinatePaths(feature.geometry)
        };
    }).filter(Boolean);
    return { geojson, routes };
}
