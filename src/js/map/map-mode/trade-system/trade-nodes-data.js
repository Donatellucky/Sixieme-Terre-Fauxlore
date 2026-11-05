/**
 * Координаты задаются в системе карты CRS.Simple.
 * mapPosition.x — горизонталь, mapPosition.y — вертикаль.
 * Leaflet CRS.Simple получает точку как [y, x].
 *
 * Не добавляйте сюда демонстрационные координаты из objects.js:
 * часть существующих маркеров является тестовой.
 */
export const tradeNodeData = [
    {
    id: 'node_capital_x',
    name: 'Название столицы',
    type: 'capital',
    stateId: 'state_x',
    zoneId: 'zone_1',
    mapPosition: { x: 1200, y: 800 },
    status: 'active',
    description: ''
}
];
