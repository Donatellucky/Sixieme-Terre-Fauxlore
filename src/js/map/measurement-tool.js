
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

    const layerGroup = L.layerGroup().addTo(map);
    const points = [];

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

    function renderMeasurement() {
        layerGroup.clearLayers();

        points.forEach(point => {
            L.circleMarker(point, {
                radius: 5,
                color: '#f1dcb7',
                weight: 2,
                fillColor: '#c9a45b',
                fillOpacity: 1
            }).addTo(layerGroup);
        });

        if (measurementType === 'area' && points.length >= 3) {
            L.polygon(points, {
                color: '#f1dcb7',
                weight: 2,
                dashArray: '8, 6',
                fillColor: '#c9a45b',
                fillOpacity: 0.2
            }).addTo(layerGroup);
        } else if (points.length >= 2) {
            L.polyline(points, {
                color: '#f1dcb7',
                weight: 3,
                dashArray: '8, 6'
            }).addTo(layerGroup);
        }

        if (measurementType === 'distance') {
            if (points.length < 2) {
                result.textContent = points.length === 1
                    ? 'Поставьте следующую точку.'
                    : 'Нажмите на карту, чтобы поставить первую точку.';
                return;
            }

            const km = calculateDistance();

            result.textContent =
                `Точек: ${points.length} · Расстояние: ` +
                `${km.toFixed(MEASUREMENT_CONFIG.distancePrecision)} км`;
            return;
        }

        if (points.length < 3) {
            result.textContent =
                `Точек: ${points.length} · Для площади нужно минимум 3 точки.`;
            return;
        }

        const area = calculateArea();

        result.textContent =
            `Точек: ${points.length} · Площадь: ` +
            `${area.toFixed(MEASUREMENT_CONFIG.areaPrecision)} км²`;
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
            ? 'Завершить измерение'
            : 'Начать измерение';

        setProvinceInteraction(!active);

        if (active) {
            map.on('click', onMapClick);
            renderMeasurement();
        } else {
            map.off('click', onMapClick);
        }
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