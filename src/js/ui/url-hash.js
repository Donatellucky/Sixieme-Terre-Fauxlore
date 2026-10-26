
import {
    getProvincesList,
    highlightProvinceById,
    clearProvinceSelection
} from '../data/provinces.js';

const PREFIX = 'province=';

// ===== ЧТЕНИЕ HASH =====

export function readProvinceIdFromHash() {
    const hash = window.location.hash;

    if (!hash) return null;

    const clean = hash.startsWith('#')
        ? hash.slice(1)
        : hash;

    if (!clean.startsWith(PREFIX)) return null;

    const value = clean.slice(PREFIX.length);

    return value || null;
}

// ===== ЗАПИСЬ HASH =====

export function setProvinceHash(id) {
    if (id == null) return;

    const next = `#${PREFIX}${id}`;

    if (window.location.hash === next) return;

    history.pushState(null, '', next);
}

// ===== ОЧИСТКА HASH =====

export function clearProvinceHash() {
    if (!window.location.hash) return;

    history.pushState(
        null,
        '',
        window.location.pathname + window.location.search
    );
}

// ===== ПРИМЕНЕНИЕ HASH =====

export function applyProvinceHash(map) {
    const id = readProvinceIdFromHash();

    if (!id) {
        clearProvinceSelection({ emitEvent: false });
        return;
    }

    const provinces = getProvincesList();

    const found = provinces.find(province => {
        const properties = province.properties || {};
        const provinceId = properties.id ?? properties.fid;

        return String(provinceId) === String(id);
    });

    if (!found) {
        clearProvinceSelection({ emitEvent: false });
        return;
    }

    // Не отправляем событие province:opened,
    // иначе навигация может создавать новые записи истории.
    const selected = highlightProvinceById(id, {
        emitEvent: false
    });

    if (!selected) return;

    // Наводим карту на выбранную провинцию.
    if (window.provinceLayer) {
        window.provinceLayer.eachLayer(layer => {
            const properties = layer.feature?.properties || {};
            const layerId = properties.id ?? properties.fid;

            if (String(layerId) === String(id)) {
                map.fitBounds(layer.getBounds());
            }
        });
    }
}

// ===== СИНХРОНИЗАЦИЯ С ИСТОРИЕЙ =====

export function initHashListener(map) {
    window.addEventListener('popstate', () => {
        applyProvinceHash(map);
    });

    // Пользователь выбрал провинцию.
    window.addEventListener('province:opened', event => {
        setProvinceHash(event.detail.id);
    });

    // Пользователь закрыл провинцию.
    window.addEventListener('province:closed', () => {
        clearProvinceHash();
    });
}
