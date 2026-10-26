// Единый источник состояния выбранного режима карты.
import { mapModes, DEFAULT_MAP_MODE } from '../data/map-modes.js';

let activeModeId = DEFAULT_MAP_MODE;
const listeners = new Set();

export function getMapModeId() { return activeModeId; }
export function getMapMode() { return mapModes[activeModeId]; }

export function subscribeMapMode(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setMapMode(modeId) {
    const mode = mapModes[modeId];
    if (!mode) return false;
    if (activeModeId === modeId) return true;
    activeModeId = modeId;
    document.body.dataset.mapMode = modeId; // совместимость со старым кодом
    for (const listener of [...listeners]) {
        try { listener(mode); } catch (error) { console.error('[Map mode] listener:', error); }
    }
    window.dispatchEvent(new CustomEvent('map:modechange', { detail: { id: mode.id, mode } }));
    return true;
}

export function syncMapModeToDOM() { document.body.dataset.mapMode = activeModeId; }
