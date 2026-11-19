
/**
 * Единая система координат нового мира Fauxlore.
 *
 * Исходное изображение:
 * - размер: 10000 × 10000 px;
 * - начало координат: верхний левый угол;
 * - X растёт вправо;
 * - Y растёт вниз.
 *
 * GeoJSON:
 * - [longitude, latitude];
 * - X растёт вправо;
 * - Y растёт вверх.
 *
 * Leaflet CRS.Simple:
 * - [lat, lng];
 * - начало координат находится снизу слева;
 * - Y растёт вверх.
 */

export const WORLD_WIDTH = 10000;
export const WORLD_HEIGHT = 10000;

export const WORLD_BOUNDS = [
    [0, 0],
    [WORLD_HEIGHT, WORLD_WIDTH],
];

/**
 * Координаты пикселя изображения -> GeoJSON.
 *
 * [x, y] -> [x, WORLD_HEIGHT - y]
 */
export function pixelToGeoJSON([x, y]) {
    return [x, WORLD_HEIGHT - y];
}

/**
 * Координаты пикселя изображения -> Leaflet.
 *
 * [x, y] -> [WORLD_HEIGHT - y, x]
 */
export function pixelToLeaflet([x, y]) {
    return [WORLD_HEIGHT - y, x];
}

/**
 * GeoJSON -> координаты пикселя изображения.
 *
 * [longitude, latitude] -> [x, WORLD_HEIGHT - latitude]
 */
export function geoJSONToPixel([longitude, latitude]) {
    return [longitude, WORLD_HEIGHT - latitude];
}

/**
 * Leaflet -> координаты пикселя изображения.
 *
 * [lat, lng] -> [lng, WORLD_HEIGHT - lat]
 */
export function leafletToPixel([lat, lng]) {
    return [lng, WORLD_HEIGHT - lat];
}

/**
 * Проверяет, находится ли точка внутри границ мира.
 *
 * Координаты задаются в пикселях исходного изображения.
 */
export function isInsideWorld([x, y]) {
    return (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        x >= 0 &&
        x <= WORLD_WIDTH &&
        y >= 0 &&
        y <= WORLD_HEIGHT
    );
}
