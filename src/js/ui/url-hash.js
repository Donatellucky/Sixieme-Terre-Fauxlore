// src/js/ui/url-hash.js
// Модуль управляет адресной строкой: #province=417
// Слушает события от provinces.js и сам обновляет hash.
// Умеет читать hash при загрузке и открывать нужную провинцию.

import { getProvincesList, highlightProvinceById } from '../data/provinces.js';

const PREFIX = 'province=';

// --- Чтение hash ---
// Возвращает строку ID или null.
export function readProvinceIdFromHash() {
    const h = window.location.hash;         // "#province=417"
    if (!h) return null;
    const clean = h.startsWith('#') ? h.slice(1) : h;
    if (!clean.startsWith(PREFIX)) return null;
    const value = clean.slice(PREFIX.length);
    return value || null;
}

// --- Запись hash ---
// history.pushState не перезагружает страницу, но оставляет запись
// в истории → кнопки «назад/вперёд» работают корректно.
export function setProvinceHash(id) {
    if (id == null) return;
    const next = `#${PREFIX}${id}`;
    if (window.location.hash === next) return;
    history.pushState(null, '', next);
}

// --- Очистка hash ---
export function clearProvinceHash() {
    if (!window.location.hash) return;
    history.pushState(null, '', window.location.pathname + window.location.search);
}

// --- Применить hash после загрузки страницы ---
// Вызывается из main.js после await loadProvinces(map).
export function applyProvinceHash(map) {
    const id = readProvinceIdFromHash();
    if (!id) return;

    const provinces = getProvincesList();
    const found = provinces.find(p => {
        const pid = String(p.properties.id ?? p.properties.fid ?? '');
        return pid === String(id);
    });
    if (!found) return;   // такой провинции нет — молча выходим

    highlightProvinceById(id);
    if (window.provinceLayer) {
        window.provinceLayer.eachLayer(layer => {
            const pid = String(layer.feature.properties.id ?? layer.feature.properties.fid ?? '');
            if (pid === String(id)) {
                map.fitBounds(layer.getBounds());
                layer.openPopup();
            }
        });
    }
}

// --- Слушатель кнопок «назад/вперёд» ---
export function initHashListener(map) {
    window.addEventListener('popstate', () => {
        const id = readProvinceIdFromHash();
        if (id) {
            applyProvinceHash(map);
        } else {
            // hash убрали — значит пользователь «вернулся назад», закрываем попап
            const panel = document.getElementById('info-panel');
            if (panel) panel.style.display = 'none';
        }
    });

    // Слушаем события, которые шлёт provinces.js
    window.addEventListener('province:opened', (e) => {
        setProvinceHash(e.detail.id);
    });
    window.addEventListener('province:closed', () => {
        clearProvinceHash();
    });
}