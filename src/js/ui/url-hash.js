
const PREFIX = 'province=';

function getProvinceSystem() {
    const system = window.provinceSystem;

    if (!system?.registry || !system?.controller) {
        console.warn('[URL Hash] Новая система провинций ещё не готова.');
        return null;
    }

    return system;
}

// ===== ЧТЕНИЕ HASH =====

export function readProvinceIdFromHash() {
    const hash = window.location.hash;

    if (!hash) return null;

    const clean = hash.startsWith('#')
        ? hash.slice(1)
        : hash;

    if (!clean.startsWith(PREFIX)) return null;

    const value = clean.slice(PREFIX.length);

    if (!value) return null;

    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

// ===== ЗАПИСЬ HASH =====

export function setProvinceHash(id) {
    if (id == null) return;

    const next = `#${PREFIX}${encodeURIComponent(id)}`;

    if (window.location.hash === next) return;

    window.history.pushState(null, '', next);
}

// ===== ОЧИСТКА HASH =====

export function clearProvinceHash() {
    if (!window.location.hash) return;

    window.history.pushState(
        null,
        '',
        window.location.pathname + window.location.search
    );
}

// ===== ПРИМЕНЕНИЕ HASH =====

export async function applyProvinceHash() {
    const system = getProvinceSystem();

    if (!system) return;

    const id = readProvinceIdFromHash();

    // В URL нет выбранной провинции.
    if (!id) {
        system.controller.clearSelection({
            source: 'url-hash'
        });

        return;
    }

    // Проверяем наличие провинции в новой системе.
    const province = system.registry.getProvince(id);

    if (!province) {
        console.warn(`[URL Hash] Провинция ${id} не найдена.`);

        system.controller.clearSelection({
            source: 'url-hash'
        });

        // Удаляем некорректный hash без создания новой записи истории.
        window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
        );

        return;
    }

    try {
        // Выделяем провинцию и перемещаем к ней карту.
        await system.controller.selectProvince(id, {
            focus: true,
            source: 'url-hash'
        });
    } catch (error) {
        console.error(
            `[URL Hash] Не удалось выбрать провинцию ${id}:`,
            error
        );
    }
}

// ===== СИНХРОНИЗАЦИЯ С ИСТОРИЕЙ =====

export function initHashListener() {
    // Браузер вернулся к предыдущему или следующему URL.
    window.addEventListener('popstate', () => {
        applyProvinceHash();
    });

    // Пользователь выбрал провинцию.
    window.addEventListener('province:opened', event => {
        // Не создаём новую запись истории при восстановлении из URL.
        if (event.detail?.source === 'url-hash') return;

        const id = event.detail?.provinceId ?? event.detail?.id;

        if (id != null) {
            setProvinceHash(id);
        }
    });

    // Пользователь снял выбор.
    window.addEventListener('province:closed', event => {
        // Восстановление состояния из URL не должно менять историю.
        if (event.detail?.source === 'url-hash') return;

        clearProvinceHash();
    });
}
