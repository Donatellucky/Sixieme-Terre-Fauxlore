let panel = null;
let initialized = false;


/**
 * Инициализирует единую информационную панель.
 *
 * Панель создаётся в HTML один раз,
 * а дальше только меняет своё содержимое.
 */
function initEntityPanel() {
    if (initialized) return;

    panel = document.getElementById('info-panel');

    if (!panel) {
        console.warn(
            'Entity panel: #info-panel не найден.'
        );

        return;
    }

    // Один обработчик на всю панель.
    // Благодаря делегированию он продолжит
    // работать даже после полной перерисовки innerHTML.
    panel.addEventListener('click', event => {
        const closeButton =
            event.target.closest('[data-entity-close]');

        if (!closeButton) return;

        closeEntityPanel();
    });

    initialized = true;
}


/**
 * Открывает панель и заполняет её содержимым.
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {string} [options.content]
 */
export function openEntityPanel({
    type = 'Объект',
    title = 'Без названия',
    subtitle = '',
    content = ''
}) {
    initEntityPanel();

    if (!panel) return;

    panel.innerHTML = `
        <div class="entity-panel-header">

            <div class="entity-panel-heading">

                <span class="entity-panel-type">
                    ${type}
                </span>

                <h3 class="entity-panel-title">
                    ${title}
                </h3>

                ${subtitle
                    ? `
                        <span class="entity-panel-subtitle">
                            ${subtitle}
                        </span>
                    `
                    : ''
                }

            </div>

            <button
                type="button"
                class="entity-panel-close"
                data-entity-close
                title="Закрыть"
                aria-label="Закрыть панель"
            >
                <span class="material-icons">
                    close
                </span>
            </button>

        </div>

        <div class="entity-panel-content">
            ${content}
        </div>
    `;

    panel.style.display = 'block';
}


/**
 * Закрывает панель.
 */
export function closeEntityPanel() {
    if (!panel) {
        panel =
            document.getElementById('info-panel');
    }

    if (!panel) return;

    panel.style.display = 'none';
    panel.innerHTML = '';

    window.dispatchEvent(
        new CustomEvent('entity-panel:closed')
    );
}


/**
 * Проверяет, открыта ли панель.
 */
export function isEntityPanelOpen() {
    if (!panel) {
        panel =
            document.getElementById('info-panel');
    }

    if (!panel) return false;

    return panel.style.display !== 'none';
}