
export function initFullscreenControl() {
    const fullscreenBtn = document.getElementById('fullscreen-btn');

    if (!fullscreenBtn) return;

    fullscreenBtn.addEventListener('click', () => {
        const mapContainer = document.getElementById('map');

        if (!mapContainer) return;

        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().catch(err => {
                console.warn('Ошибка fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });
}
