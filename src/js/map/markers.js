import { mapObjects } from "../data/objects";
import { getIcon } from "./icons";

// Функция, которая будет вызвана при клике на маркер
function showObjectInfo(obj) {
    const panel = document.getElementById('Info-panel');
    if (!panel) return;
}
  // Панель данных объекта
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

    panel.querySelector('.close-panel').addEventListener('click',() => {
        panel.style.display = 'none';
    });

function translateType(type) {
    const type = {
        trade_center_1: 'Торговый центр (I уровень)',
        trade_center_2: 'Торговый центр (II уровень)',
        trade_center_3: 'Торговый центр (III уровень)',
        castle: 'Замок',
        city_no_wall: 'Город без стен',
        city_with_wall: 'Город со стенами',
        capital: 'Столица',
        port: 'Порт'
    };
    return types[type] || type;
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
    })

    markerGroup,addTo(map);
    return markerGroup;
}