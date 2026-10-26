
export function initCoordinatesControl(map) {
    const coordsToggle = document.getElementById('coords-toggle');
    const coordsPanel = document.getElementById('coords-panel');
    const coordsDisplay = document.getElementById('coords-display');
    const coordsModeToggle = document.getElementById('coords-mode-toggle');
    const copyCoordsBtn = document.getElementById('copy-coords-btn');
    const clearCrosshairBtn = document.getElementById('clear-crosshair-btn');

    let coordsMode = false;
    let lastCoords = { x: 0, y: 0 };
    let clickMarker = null;

    // Открытие и закрытие панели координат
    if (coordsToggle && coordsPanel) {
        coordsToggle.addEventListener('click', (e) => {
            e.stopPropagation();

            document.querySelectorAll('.tool-panel').forEach(panel => {
                if (panel !== coordsPanel) {
                    panel.classList.remove('open');
                }
            });

            coordsPanel.classList.toggle('open');
        });
    }

    // Удаление крестика с карты
    function removeCrosshair() {
        if (clickMarker) {
            map.removeLayer(clickMarker);
            clickMarker = null;
        }
    }

    // Включение и выключение режима координат
    if (coordsModeToggle) {
        coordsModeToggle.addEventListener('click', () => {
            coordsMode = !coordsMode;

            coordsModeToggle.textContent = coordsMode
                ? '🟢 Вкл'
                : '⚪ Выкл';

            coordsModeToggle.style.borderColor = coordsMode
                ? '#4caf50'
                : 'var(--color-gold)';

            if (!coordsMode) {
                removeCrosshair();
            }
        });
    } else {
        console.warn('Кнопка coords-mode-toggle не найдена!');
    }

    // Получение координат по клику на карте
    map.on('click', (e) => {
        if (!coordsMode) return;

        const coords = e.latlng;

        lastCoords.x = coords.lng.toFixed(1);
        lastCoords.y = coords.lat.toFixed(1);

        if (coordsDisplay) {
            coordsDisplay.textContent =
                `X: ${lastCoords.x}, Y: ${lastCoords.y}`;
        }

        removeCrosshair();

        clickMarker = L.marker(
            [coords.lat, coords.lng],
            {
                icon: L.divIcon({
                    className: 'click-crosshair',
                    html: '✕',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }),
                zIndexOffset: 1000
            }
        ).addTo(map);

        clickMarker.on('click', () => {
            removeCrosshair();
        });
    });

    // Копирование координат
    if (copyCoordsBtn) {
        copyCoordsBtn.addEventListener('click', () => {
            const text =
                `X: ${lastCoords.x}, Y: ${lastCoords.y}`;

            navigator.clipboard.writeText(text)
                .then(() => {
                    copyCoordsBtn.textContent = 'Скопировано!';

                    setTimeout(() => {
                        copyCoordsBtn.textContent = 'Копировать';
                    }, 2000);
                })
                .catch(() => {
                    alert('Не удалось скопировать координаты');
                });
        });
    }

    // Сброс крестика и координат
    if (clearCrosshairBtn) {
        clearCrosshairBtn.addEventListener('click', () => {
            removeCrosshair();

            lastCoords.x = 0;
            lastCoords.y = 0;

            if (coordsDisplay) {
                coordsDisplay.textContent = 'X: 0, Y: 0';
            }
        });
    }
}
