export function getIcon(type) {
    const iconMap = {
        trade_1: 'trade_1_icon.svg',
        trade_2: 'trade_2_icon.svg',
        trade_3: 'trade_3_icon.svg',
        castle: 'castle_icon.svg',
        city_no_wall: 'city_no_wall_icon.png',
        city_with_wall: 'city_with_wall_icon.png',
        capital: 'capital_icon.png',
        port: 'port_icon.png',
    };

    const filename = iconMap[type];
    if (!filename) return null;

    return L.icon({
        iconUrl: `src/assets/icons/${filename}`,
        iconSize: [64, 64],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}