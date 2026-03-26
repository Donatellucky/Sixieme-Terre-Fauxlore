import { mapObjects } from "../data/objects.js";
import { getIcon } from "./icons.js";

function translateType(typeKey) {
    const types = {
        trade_1: 'Торговый центр (I уровень)',
        trade_2: 'Торговый центр (II уровень)',
        trade_3: 'Торговый центр (III уровень)',
        castle: 'Замок',
        city_no_wall: 'Город без стен',
        city_with_wall: 'Город со стенами',
        capital: 'Столица',
        port: 'Порт'
    };
    return types[typeKey] || typeKey;
}

function showObjectInfo(obj) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="info-panel-header">
            <h3>${obj.name}</h3>
            <button class="close-panel">✖</button>
        </div>
        <div class="info-panel-content">
            <p><strong>Тип:</strong> ${translateType(obj.type)}</p>
            <p>${obj.description}</p>
            <a href="${obj.wikiUrl}" class="wiki-link" target="_blank">Подробнее в вики</a>
        </div>
    `;
    panel.style.display = 'block';

    panel.querySelector('.close-panel').addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

export function addMarkers(map) {
    const markerGroup = L.layerGroup();

    mapObjects.forEach(obj => {
        const icon = getIcon(obj.type);
        if (!icon) {
            console.warn(`Иконка для типа ${obj.type} не найдена`);
            return;
        }

        const marker = L.marker(obj.coords, { icon })
            .on('click', () => showObjectInfo(obj));
        marker.addTo(markerGroup);
    });

    markerGroup.addTo(map);
    return markerGroup;
}

export { showObjectInfo, translateType };