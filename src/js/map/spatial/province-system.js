
import { createProvincePackageLoader } from './province-package-loader.js';
import { createProvinceTileRegistry } from './province-tile-registry.js';
import { createProvinceRenderer } from './province-renderer.js';
import { createProvinceController } from './province-controller.js';

/**
 * Создаёт полноценную систему провинций Fauxlore.
 *
 * Архитектура:
 *
 * ProvinceSystem
 * ├── PackageLoader
 * ├── TileRegistry
 * ├── Renderer
 * └── Controller
 */

export async function createProvinceSystem({
    map,
    baseUrl = './src/data/provinces/geometry/',
    fetchImpl = fetch,

    style,

    onProvinceOpened = null,
    onProvinceClosed = null,
    onTileError = null,

    paneName = 'newProvincePane',
    paneZIndex = 420,
} = {}) {
    if (!map) {
        throw new Error(
            'ProvinceSystem: необходимо передать экземпляр карты.'
        );
    }

    // 1. Загрузчик геометрического пакета.
    const loader = createProvincePackageLoader({
        baseUrl,
        fetchImpl,
    });

    // 2. Метаданные и пространственный реестр.
    const metadata = await loader.loadMetadata();

    const registry = await createProvinceTileRegistry({
        loader,
    });

    // Контроллер создаётся после renderer.
    // Поэтому временно используем переменную.
    let controller = null;

    // 3. Рендерер геометрии.
    const renderer = createProvinceRenderer({
        map,
        loader,
        registry,

        ...(style ? { style } : {}),

        paneName,
        paneZIndex,

        onTileError,
        
        onProvinceClick(event) {
            controller?.handleProvinceClick(event);
        },
    });

    // 4. Контроллер взаимодействия.
    controller = createProvinceController({
        map,
        renderer,
        registry,

        onProvinceOpened,
        onProvinceClosed,
    });

    let destroyed = false;

    return {
        loader,
        registry,
        renderer,
        controller,
        metadata,

        /**
         * Удобный интерфейс системы.
         */
        selectProvince: (...args) =>
            controller.selectProvince(...args),

        clearSelection: (...args) =>
            controller.clearSelection(...args),

        setVisible: (visible) =>
            renderer.setVisible(visible),

        refresh: () =>
            renderer.refreshVisibleTiles(),

        getSelectedProvinceId: () =>
            controller.getSelectedProvinceId(),

        getStats() {
            return {
                loader: loader.getStats(),
                registry: registry.getStats(),
                renderer: renderer.getStats(),
                selectedProvinceId:
                    controller.getSelectedProvinceId(),
            };
        },

        destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;

            controller.destroy();
            renderer.destroy();
        },
    };
}
