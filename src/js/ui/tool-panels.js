
import { openProvincePanel } from '../map/panel.js';

export function initToolPanels() {
    // ===== БОКОВАЯ ПАНЕЛЬ =====

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');

    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    function toggleSidebar() {
        if (!sidebar) return;

        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            sidebar.classList.add('open');
        }
    }

    if (sidebar && sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    if (sidebar && sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    // ===== ПАНЕЛИ ИНСТРУМЕНТОВ =====

    const panels = [
        {
            button: document.getElementById('map-modes-toggle'),
            panel: document.getElementById('map-modes-panel')
        },
        {
            button: document.getElementById('markers-toggle'),
            panel: document.getElementById('markers-panel')
        },
        {
            button: document.getElementById('filters-toggle'),
            panel: document.getElementById('filters-panel')
        },
        {
            button: document.getElementById('search-toggle'),
            panel: document.getElementById('search-panel')
        }
    ];

    function closeToolPanels(except = null) {
        panels.forEach(({ panel }) => {
            if (panel && panel !== except) {
                panel.classList.remove('open');
            }
        });
    }

    function toggleToolPanel(panel) {
        if (!panel) return;

        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
        } else {
            closeToolPanels(panel);
            panel.classList.add('open');
        }
    }

    // Обработчики кнопок инструментов
    panels.forEach(({ button, panel }) => {
        if (!button || !panel) return;

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleToolPanel(panel);
        });
    });

    // Закрытие панелей при клике вне них
    document.addEventListener('click', (e) => {
        const isInsidePanel = panels.some(({ panel }) => {
            return panel && panel.contains(e.target);
        });

        const isOnButton = panels.some(({ button }) => {
            return button && button.contains(e.target);
        });

        if (!isInsidePanel && !isOnButton) {
            closeToolPanels();
        }
    });

    // ===== СПИСОК ПРОВИНЦИЙ =====

    const openProvincePanelBtn =
        document.getElementById('open-province-panel');

    if (openProvincePanelBtn) {
        openProvincePanelBtn.addEventListener(
            'click',
            openProvincePanel
        );
    }
}
