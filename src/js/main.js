import initFauxloreMap from "./map/init.js";
import { initLayerControls } from "./ui/layer-control.js";
import { addMarkers } from "./map/markers.js";
import { initSidebar, updateProvincesList, initFilters } from "./ui/sidebar.js";
import { loadProvinces, getProvincesList } from "./data/provinces.js";
import { loadBaseLayer } from "./map/layers.js";

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sixième Terre запущен');
    const map = initFauxloreMap();
    initLayerControls(map);
    loadBaseLayer(map, 'src/assets/maps/fauxmap.png');
    addMarkers(map);
    initSidebar(map);
    
    // Загружаем провинции
    await loadProvinces(map);
    const provinceFeatures = getProvincesList();
    
    // Обновляем список провинций в НИЖНЕЙ панели
    updateProvincesList(map, 'bottom');
    
    // Инициализируем фильтры
    if (typeof initFilters === 'function') {
        initFilters(provinceFeatures);
    }

// ===== КООРДИНАТЫ (панель + режим) =====
const coordsToggle = document.getElementById('coords-toggle');
const coordsPanel = document.getElementById('coords-panel');
const coordsDisplay = document.getElementById('coords-display');
const coordsModeToggle = document.getElementById('coords-mode-toggle');
const copyCoordsBtn = document.getElementById('copy-coords-btn');
const clearCrosshairBtn = document.getElementById('clear-crosshair-btn');

let coordsMode = false;
let lastCoords = { x: 0, y: 0 };
let clickMarker = null;

console.log('coordsToggle:', coordsToggle);
console.log('coordsPanel:', coordsPanel);
console.log('coordsModeToggle:', coordsModeToggle);

// Открытие/закрытие панели
if (coordsToggle && coordsPanel) {
    coordsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tool-panel').forEach(p => {
            if (p !== coordsPanel) p.classList.remove('open');
        });
        coordsPanel.classList.toggle('open');
    });
}

// Включение/выключение режима координат
if (coordsModeToggle) {
    coordsModeToggle.addEventListener('click', () => {
        coordsMode = !coordsMode;
        coordsModeToggle.textContent = coordsMode ? '🟢 Вкл' : '⚪ Выкл';
        coordsModeToggle.style.borderColor = coordsMode ? '#4caf50' : 'var(--color-gold)';
        console.log('Режим координат:', coordsMode ? 'ВКЛ' : 'ВЫКЛ');
        if (!coordsMode && clickMarker) {
            map.removeLayer(clickMarker);
            clickMarker = null;
        }
    });
} else {
    console.warn('Кнопка coords-mode-toggle не найдена!');
}

// Обработчик клика по карте
if (map) {
    map.on('click', function(e) {
        if (!coordsMode) return;

        const coords = e.latlng;
        lastCoords.x = coords.lng.toFixed(1);
        lastCoords.y = coords.lat.toFixed(1);

        if (coordsDisplay) {
            coordsDisplay.textContent = `X: ${lastCoords.x}, Y: ${lastCoords.y}`;
        }

        if (clickMarker) {
            map.removeLayer(clickMarker);
        }

        clickMarker = L.marker([coords.lat, coords.lng], {
            icon: L.divIcon({
                className: 'click-crosshair',
                html: '✕',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            }),
            zIndexOffset: 1000
        }).addTo(map);

        clickMarker.on('click', function() {
            map.removeLayer(clickMarker);
            clickMarker = null;
        });

        // Сброс крестика и координат
        if (clearCrosshairBtn) {
            clearCrosshairBtn.addEventListener('click', () => {
        if (clickMarker) {
            map.removeLayer(clickMarker);
            clickMarker = null;
        }
        // Обнуляем координаты в панели
        lastCoords.x = 0;
        lastCoords.y = 0;
        if (coordsDisplay) {
            coordsDisplay.textContent = `X: 0, Y: 0`;
        }
    });
}
    });
}

// Копирование координат
if (copyCoordsBtn) {
    copyCoordsBtn.addEventListener('click', () => {
        const text = `X: ${lastCoords.x}, Y: ${lastCoords.y}`;
        navigator.clipboard.writeText(text).then(() => {
            copyCoordsBtn.textContent = 'Скопировано!';
            setTimeout(() => {
                copyCoordsBtn.textContent = 'Копировать';
            }, 2000);
        }).catch(() => {
            alert('Не удалось скопировать координаты');
        });
    });
}

// Сброс крестика
if (clearCrosshairBtn) {
    clearCrosshairBtn.addEventListener('click', () => {
        if (clickMarker) {
            map.removeLayer(clickMarker);
            clickMarker = null;
        }
    });
}

// ===== УПРАВЛЕНИЕ ПАНЕЛЯМИ =====
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const bottomPanel = document.querySelector('.bottom-panel');
const bottomToggle = document.getElementById('bottom-toggle');

function closeAllPanels() {
    if (sidebar) sidebar.classList.remove('open');
    if (bottomPanel) bottomPanel.classList.remove('open');
}

function openOnlyThisPanel(panelToOpen) {
    closeAllPanels();
    if (panelToOpen) panelToOpen.classList.add('open');
}

function toggleThisPanel(panel) {
    if (panel.classList.contains('open')) {
        closeAllPanels();
    } else {
        openOnlyThisPanel(panel);
    }
}

if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleThisPanel(sidebar));
}
if (sidebarClose && sidebar) {
    sidebarClose.addEventListener('click', () => closeAllPanels());
}
if (bottomToggle && bottomPanel) {
    bottomToggle.addEventListener('click', () => toggleThisPanel(bottomPanel));
}
});

// Полноэкранный режим
const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        const mapContainer = document.getElementById('map');
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen().catch(err => {
                console.warn('Ошибка fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });
}

// ===== ЛЕВАЯ ПАНЕЛЬ ИНСТРУМЕНТОВ: ОТКРЫТИЕ ПАНЕЛЕЙ =====
const layersToggle = document.getElementById('layers-toggle');
const markersToggle = document.getElementById('markers-toggle');
const filtersToggle = document.getElementById('filters-toggle');
const searchToggle = document.getElementById('search-toggle');

const layersPanel = document.getElementById('layers-panel');
const markersPanel = document.getElementById('markers-panel');
const filtersPanel = document.getElementById('filters-panel');
const searchPanel = document.getElementById('search-panel');

// Закрыть все панели (кроме той, которую открываем)
function closeAllToolPanels(except) {
    const panels = [layersPanel, markersPanel, filtersPanel, searchPanel];
    panels.forEach(panel => {
        if (panel && panel !== except) {
            panel.classList.remove('open');
        }
    });
}

// Функция для переключения панели
function toggleToolPanel(panel, toggleBtn) {
    if (!panel) return;
    // Если панель уже открыта — закрываем
    if (panel.classList.contains('open')) {
        panel.classList.remove('open');
        return;
    }
    // Иначе — закрываем все и открываем нужную
    closeAllToolPanels(panel);
    panel.classList.add('open');
}

// Вешаем обработчики на кнопки
if (layersToggle && layersPanel) {
    layersToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // чтобы не закрылось при клике на кнопку
        toggleToolPanel(layersPanel, layersToggle);
    });
}
if (markersToggle && markersPanel) {
    markersToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleToolPanel(markersPanel, markersToggle);
    });
}
if (filtersToggle && filtersPanel) {
    filtersToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleToolPanel(filtersPanel, filtersToggle);
    });
}
if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleToolPanel(searchPanel, searchToggle);
    });
}

// Закрывать панели при клике вне их
document.addEventListener('click', function(e) {
    const toolPanels = [layersPanel, markersPanel, filtersPanel, searchPanel];
    const toolButtons = [layersToggle, markersToggle, filtersToggle, searchToggle];
    
    // Проверяем, был ли клик внутри какой-либо панели или на кнопке
    const isInsidePanel = toolPanels.some(panel => panel && panel.contains(e.target));
    const isOnButton = toolButtons.some(btn => btn && btn.contains(e.target));
    
    if (!isInsidePanel && !isOnButton) {
        toolPanels.forEach(panel => {
            if (panel) panel.classList.remove('open');
        });
    }
});