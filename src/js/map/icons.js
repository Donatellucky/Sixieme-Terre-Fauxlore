export function getIcon(type) {
    const iconMap = {
        trade_1: 'trade_1_icon.png',
        trade_2: 'trade_2_icon.png',
        trade_3: 'trade_3_icon.png',
        castle: 'castle_icon_test.png',
        city_no_wall: 'city_no_wall_icon.png',
        city_with_wall: 'city_with_wall_icon.png',
        trade_1: 'trade_1_icon.png',
        capital: 'capital_icon.png',
        port: 'port_icon.png',
    };

    const filename = iconMap[type];
    if (!filename) return null;

    return L.icon({
        iconUrl: `src/assets/icons/${filename}`,
        iconSize: [32,32], // размер иконки (подгони под свои PNG)
        iconAnchor: [16,32], // точка привязки (нижний центр)
        popurAnchor: [0,-32] // смещение попапа
    })
}