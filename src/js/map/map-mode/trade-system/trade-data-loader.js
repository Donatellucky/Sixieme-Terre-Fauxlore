/**
 * Подготовка торговых GeoJSON без Leaflet, Canvas и DOM.
 * Экономические справочники остаются независимыми от визуализации.
 */
import { transformFeatureCollection, COORD_CONFIG_ZONES } from '../../../data/coords-transform.js';
import { tradeZoneData } from './trade-zones-data.js';
import { tradeRouteData } from './trade-routes-data.js';

async function fetchCollection(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Не удалось загрузить ${url}: ${response.status}`);
    const collection = await response.json();
    if (collection?.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
        throw new Error(`Некорректный FeatureCollection: ${url}`);
    }
    return collection;
}

export async function prepareTradeZones() {
    const collection = await fetchCollection('src/data/trade-zones.geojson');
    const features = collection.features.filter(feature =>
        feature?.geometry?.coordinates && feature.geometry.coordinates.length > 0
    );
    const geojson = transformFeatureCollection({ ...collection, features }, COORD_CONFIG_ZONES);
    return { geojson, zones: geojson.features.map(feature => ({
        id: feature.properties?.id ?? null,
        properties: feature.properties ?? {},
        geometry: feature.geometry,
        economicData: tradeZoneData[feature.properties?.id] ?? null
    })) };
}

/** Paths here are plain GeoJSON [longitude, latitude] coordinate pairs. */
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
            fromZone: properties.from_zone || null,
            toZone: properties.to_zone || null,
            routeType: properties.route_type || null,
            turnover: economicData.turnover || 0,
            countries: economicData.countries || [],
            geometry: feature.geometry,
            coordinatePaths: geometryToCoordinatePaths(feature.geometry)
        };
    }).filter(Boolean);
    return { geojson, routes };
}
