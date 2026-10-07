
import { MEASUREMENT_CONFIG } from './measurement-config.js';

export function initMeasurementTool(map) {
    const toggle = document.getElementById('measurement-toggle');
    const panel = document.getElementById('measurement-panel');
    const typeButton = document.getElementById('measurement-type-btn');
    const modeButton = document.getElementById('measurement-mode-btn');
    const undoButton = document.getElementById('measurement-undo-btn');
    const resetButton = document.getElementById('measurement-reset-btn');
    const result = document.getElementById('measurement-result');

    if (!toggle || !panel || !typeButton || !modeButton ||
        !undoButton || !resetButton || !result) {
        console.warn('Не найдены элементы измерителя Fauxlore.');
        return;
    }

    const geometryLayerGroup = L.layerGroup().addTo(map);
    const pointLayerGroup = L.layerGroup().addTo(map);
    const points = [];
    const pointMarkers = [];

    let active = false;
    let measurementType = 'distance';

    function setProvinceInteraction(enabled) {
        const provinceLayer = window.provinceLayer;
        if (!provinceLayer) return;

        provinceLayer.eachLayer(layer => {
            if (enabled) {
                if (layer._measurementWasInteractive !== undefined) {
                    layer.options.interactive =
                        layer._measurementWasInteractive;
                    delete layer._measurementWasInteractive;
                }
            } else if (layer._measurementWasInteractive === undefined) {
                layer._measurementWasInteractive =
                    layer.options.interactive !== false;
                layer.options.interactive = false;
            }
        });
    }

    function calculateDistance() {
        let distance = 0;

        for (let i = 1; i < points.length; i++) {
            const dx = points[i].lng - points[i - 1].lng;
            const dy = points[i].lat - points[i - 1].lat;

            distance += Math.hypot(dx, dy);
        }

        return distance * MEASUREMENT_CONFIG.kmPerUnit;
    }

    function calculateSegments() {
    const segments = [];

    for (let i = 1; i < points.length; i++) {
        const dx = points[i].lng - points[i - 1].lng;
        const dy = points[i].lat - points[i - 1].lat;

        const distance =
            Math.hypot(dx, dy) * MEASUREMENT_CONFIG.kmPerUnit;

        segments.push(distance);
    }

    return segments;
}

    function calculateArea() {
        let area = 0;

        for (let i = 0; i < points.length; i++) {
            const next = (i + 1) % points.length;

            area +=
                points[i].lng * points[next].lat -
                points[next].lng * points[i].lat;
        }

        const mapArea = Math.abs(area) / 2;
        return mapArea * MEASUREMENT_CONFIG.kmPerUnit ** 2;
    }

    function calculatePerimeter() {
    if (points.length < 3) return 0;

    let perimeter = 0;

    for (let i = 0; i < points.length; i++) {
        const next = (i + 1) % points.length;

        const dx = points[next].lng - points[i].lng;
        const dy = points[next].lat - points[i].lat;

        perimeter += Math.hypot(dx, dy);
    }

    return perimeter * MEASUREMENT_CONFIG.kmPerUnit;
}

    function createPointMarker(index) {
        const marker = L.marker(points[index], {
            draggable: active,
            zIndexOffset: 1000,
            icon: L.divIcon({
                className: 'measurement-point-wrapper',
                html: '<div class="measurement-point"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(pointLayerGroup);

        marker.on('drag', event => {
            points[index] = event.target.getLatLng();

            renderGeometry();
            renderResult();
        });

        return marker;
    }

    function syncPointMarkers() {
        while (pointMarkers.length > points.length) {
            const marker = pointMarkers.pop();

            pointLayerGroup.removeLayer(marker);
        }

        while (pointMarkers.length < points.length) {
            const index = pointMarkers.length;
            const marker = createPointMarker(index);

            pointMarkers.push(marker);
        }

        pointMarkers.forEach((marker, index) => {
            marker.setLatLng(points[index]);

            if (active) {
                marker.dragging.enable();
            } else {
                marker.dragging.disable();
            }
        });
    }

    function renderGeometry() {
        geometryLayerGroup.clearLayers();

        if (measurementType === 'area' && points.length >= 3) {
            L.polygon(points, {
                color: '#f1dcb7',
                weight: 2,
                dashArray: '8, 6',
                fillColor: '#c9a45b',
                fillOpacity: 0.2
            }).addTo(geometryLayerGroup);
        } else if (points.length >= 2) {
            L.polyline(points, {
                color: '#f1dcb7',
                weight: 3,
                dashArray: '8, 6'
            }).addTo(geometryLayerGroup);
        }
    }

    function renderResult() {
        if (measurementType === 'distance') {
            if (points.length < 2) {
                result.textContent = points.length === 1
                    ? 'Точек: 1\n\nДобавьте ещё одну точку.'
                    : 'Нажмите на карту, чтобы поставить первую точку.';
                return;
            }

            const segments = calculateSegments();
            const totalDistance = calculateDistance();

            const segmentText = segments
                .map((distance, index) =>
                    `${String.fromCharCode(65 + index)} → ` +
                    `${String.fromCharCode(66 + index)}: ` +
                    `${distance.toFixed(
                        MEASUREMENT_CONFIG.distancePrecision
                    )} км`
                )
                .join('\n');

            result.textContent =
                `Точек: ${points.length}\n\n` +
                `${segmentText}\n\n` +
                `Общее расстояние: ` +
                `${totalDistance.toFixed(
                    MEASUREMENT_CONFIG.distancePrecision
                )} км`;
            return;
        }

        if (points.length < 3) {
            result.textContent =
                `Точек: ${points.length}\n\n` +
                `Для площади нужно минимум 3 точки.`;
            return;
        }

        const area = calculateArea();
        const perimeter = calculatePerimeter();

        result.textContent =
            `Точек: ${points.length}\n\n` +
            `Площадь: ` +
            `${area.toFixed(MEASUREMENT_CONFIG.areaPrecision)} км²\n` +
            `Периметр: ` +
            `${perimeter.toFixed(
                MEASUREMENT_CONFIG.distancePrecision
            )} км`;
    }

    function renderMeasurement() {
        syncPointMarkers();
        renderGeometry();
        renderResult();
    }

    function onMapClick(event) {
    if (!active) return;

    points.push(L.latLng(
        event.latlng.lat,
        event.latlng.lng
    ));

    renderMeasurement();
}

function setActive(value) {
    active = value;

    toggle.classList.toggle('active-coords', active);

    modeButton.textContent = active
    ? 'Редактирование: ВКЛ'
    : 'Редактирование: ВЫКЛ';

    setProvinceInteraction(!active);

    if (active) {
        map.on('click', onMapClick);
    } else {
        map.off('click', onMapClick);
    }

    renderMeasurement();
}

toggle.addEventListener('click', event => {
    event.stopPropagation();
    panel.classList.toggle('open');
});

typeButton.addEventListener('click', () => {
    measurementType =
        measurementType === 'distance' ? 'area' : 'distance';

    typeButton.textContent = measurementType === 'distance'
        ? 'Режим: расстояние'
        : 'Режим: площадь';

    renderMeasurement();
});

modeButton.addEventListener('click', () => {
    setActive(!active);
});

undoButton.addEventListener('click', () => {
    points.pop();
    renderMeasurement();
});

resetButton.addEventListener('click', () => {
    points.length = 0;
    renderMeasurement();
});

renderMeasurement();
}