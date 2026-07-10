// src/js/map/markerFactory.js
import { markerConfig } from '../data/markertypes.js';

export function createMarker(type) {
    const cfg = markerConfig[type];
    if (!cfg) {
        console.warn(`Маркер типа "${type}" не найден`);
        return L.divIcon({ html: '📍', iconSize: [24, 24] });
    }

    const levelHtml = cfg.level ? 
        `<text x="18" y="38" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="serif">${cfg.level}</text>` : '';

    const svg = `
        <svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 1 C8 1 2 9 2 18 C2 28 18 41 18 41 C18 41 34 28 34 18 C34 9 28 1 18 1Z" 
                  fill="${cfg.color}" stroke="#0a0f1a" stroke-width="1.5"/>
            <circle cx="18" cy="17" r="12" fill="${cfg.bgColor}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
            <foreignObject x="8" y="6" width="20" height="20">
                <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
                    <i class="${cfg.icon}" style="font-size:22px; color:#ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.6);"></i>
                </div>
            </foreignObject>
            ${levelHtml}
        </svg>
    `;

    return L.divIcon({
        html: svg,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
        className: `fauxlore-marker marker-${type}`
    });
}