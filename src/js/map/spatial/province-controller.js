
/**
 * Контроллер взаимодействия с провинциями Fauxlore.
 *
 * Отвечает за:
 * - выбор провинции;
 * - снятие выделения;
 * - фокусировку карты;
 * - передачу событий другим модулям сайта.
 *
 * Не отвечает за:
 * - загрузку GeoJSON;
 * - геометрию и координатные преобразования;
 * - хранение игровых данных;
 * - оформление полигонов.
 */

export function createProvinceController({
    map,
    renderer,
    registry,
    onProvinceOpened = null,
    onProvinceClosed = null,
} = {}) {
    if (!map || typeof map.fitBounds !== 'function') {
        throw new Error(
            'ProvinceController: необходим экземпляр карты.'
        );
    }

    if (!renderer || typeof renderer.highlightProvince !== 'function') {
        throw new Error(
            'ProvinceController: необходим ProvinceRenderer.'
        );
    }

    if (!registry || typeof registry.getProvince !== 'function') {
        throw new Error(
            'ProvinceController: необходим ProvinceTileRegistry.'
        );
    }

    let selectedProvinceId = null;
    let selectedFeature = null;
    let destroyed = false;

    /**
     * Отправляет событие в общую систему сайта.
     */
    function dispatchEvent(eventName, detail) {
        window.dispatchEvent(
            new CustomEvent(eventName, { detail })
        );
    }

    /**
     * Выбирает провинцию по постоянному ID.
     */
    async function selectProvince(
        provinceId,
        {
            feature = null,
            focus = false,
            source = 'api',
        } = {}
    ) {
        if (destroyed || !provinceId) {
            return false;
        }

        const province = registry.getProvince(provinceId);

        if (!province) {
            return false;
        }

        const highlighted = await renderer.highlightProvince(
            provinceId
        );

        if (!highlighted || destroyed) {
            return false;
        }

        selectedProvinceId = provinceId;
        selectedFeature = feature;

        if (focus) {
            renderer.focusProvince(provinceId);
        }

        const detail = {
            provinceId,
            province,
            feature,
            source,
        };

        dispatchEvent('province:opened', detail);

        if (typeof onProvinceOpened === 'function') {
            onProvinceOpened(detail);
        }

        return true;
    }

    /**
     * Снимает выделение с текущей провинции.
     */
    function clearSelection({
        source = 'api',
    } = {}) {
        if (destroyed || !selectedProvinceId) {
            return false;
        }

        const previousProvinceId = selectedProvinceId;
        const previousFeature = selectedFeature;

        renderer.clearHighlight();

        selectedProvinceId = null;
        selectedFeature = null;

        const detail = {
            provinceId: previousProvinceId,
            feature: previousFeature,
            source,
        };

        dispatchEvent('province:closed', detail);

        if (typeof onProvinceClosed === 'function') {
            onProvinceClosed(detail);
        }

        return true;
    }

    /**
     * Выбор провинции по клику на полигон.
     */
    function handleProvinceClick({
        provinceId,
        feature,
    }) {
        selectProvince(provinceId, {
            feature,
            source: 'map',
        });
    }

    function getSelectedProvinceId() {
        return selectedProvinceId;
    }

    function getSelectedFeature() {
        return selectedFeature;
    }

    function destroy() {
        if (destroyed) {
            return;
        }

        clearSelection({ source: 'destroy' });
        destroyed = true;
    }

    return {
        selectProvince,
        clearSelection,
        handleProvinceClick,

        getSelectedProvinceId,
        getSelectedFeature,

        destroy,
    };
}
