export function loadBaseLayer(map, imagePath) {
    console.log('🖼️ Загружаем слой:', imagePath);
    const bounds = window.mapBounds;
    const imageLayer = L.imageOverlay(imagePath, bounds);
    imageLayer.addTo(map);
    return imageLayer;
}

export function switchLayer(map, newImagePath, currentLayer) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    return loadBaseLayer(map, newImagePath);
}