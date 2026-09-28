// ============================================================
//  КОНФИГИ ПРЕОБРАЗОВАНИЯ КООРДИНАТ
//  Меняются в одном месте — применяются ко всем слоям.
// ============================================================

/**
 * Базовый конфиг. Используется провинциями, реками,
 * климатом и всем, что рисуется поверх fauxmap.png.
 */
export const COORD_CONFIG = {
    swapXY: true,
    invertY: false,
    scaleX: 1,
    scaleY: 1,
    offsetX: 2270,
    offsetY: 0,
    swapReturn: true,
};

/**
 * Конфиг для торговых зон.
 * Отдельный, потому что зоны нарисованы в другой точке
 * начала координат — им нужен сдвиг по Y.
 */
export const COORD_CONFIG_ZONES = {
    swapXY: true,
    invertY: false,
    scaleX: 1,
    scaleY: 1,
    offsetX: 2270,
    offsetY: 0,   // ← подобрать точно визуально
    swapReturn: true,
};

// ============================================================
//  ПРЕОБРАЗОВАНИЕ
// ============================================================

export function convertPoint(x, y, config = COORD_CONFIG) {
    let newX = x;
    let newY = y;

    if (config.swapXY) {
        const tmp = newX;
        newX = newY;
        newY = tmp;
    }

    if (config.invertY) {
        newY = -newY;
    }

    newX = newX * config.scaleX + config.offsetX;
    newY = newY * config.scaleY + config.offsetY;

    if (config.swapReturn) {
        return [newY, newX];
    }
    return [newX, newY];
}

export function recalcGeometry(geom, config = COORD_CONFIG) {
    if (geom.type === 'Polygon') {
        return {
            type: 'Polygon',
            coordinates: geom.coordinates.map(ring =>
                ring.map(coord =>
                    convertPoint(coord[0], coord[1], config)
                )
            ),
        };
    }

    if (geom.type === 'MultiPolygon') {
        return {
            type: 'MultiPolygon',
            coordinates: geom.coordinates.map(poly =>
                poly.map(ring =>
                    ring.map(coord =>
                        convertPoint(coord[0], coord[1], config)
                    )
                )
            ),
        };
    }

    if (geom.type === 'LineString') {
    return {
        type: 'LineString',
        coordinates: geom.coordinates.map(coord =>
            convertPoint(coord[0], coord[1], config)
        ),
    };
}

if (geom.type === 'MultiLineString') {
    return {
        type: 'MultiLineString',
        coordinates: geom.coordinates.map(line =>
            line.map(coord =>
                convertPoint(coord[0], coord[1], config)
            )
        ),
    };
}

    return geom;
}

export function transformFeatureCollection(data, config = COORD_CONFIG) {
    return {
        type: 'FeatureCollection',
        features: data.features.map(feature => ({
            type: 'Feature',
            properties: feature.properties,
            geometry: recalcGeometry(feature.geometry, config),
        })),
    };
}