/** Форматирование числовых показателей для торговых панелей. */
export function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '—';
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('ru-RU') : '—';
}
