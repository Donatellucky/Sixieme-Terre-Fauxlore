// src/js/data/markerTypes.js
export const markerConfig = {

    // 1. Город со стенами → крепость-город
    walled_city: {
        icon: 'fa-solid fa-city',           // или 'fa-regular fa-building'
        color: '#8B7D3C',                    // тёмное золото
        bgColor: 'rgba(139, 125, 60, 0.3)',
    },

    // 2. Торговые центры (уровни по цвету + римская цифра)
    trade_1: {
        icon: 'fa-solid fa-coins',
        color: '#f4d03f',                    // золотой (1 ур.)
        bgColor: 'rgba(244, 208, 63, 0.3)',
        level: 'I'
    },
    trade_2: {
        icon: 'fa-solid fa-coins',
        color: '#5dade2',                    // синий (2 ур.)
        bgColor: 'rgba(93, 173, 226, 0.3)',
        level: 'II'
    },
    trade_3: {
        icon: 'fa-solid fa-coins',
        color: '#a569bd',                    // фиолетовый (3 ур.)
        bgColor: 'rgba(165, 105, 189, 0.3)',
        level: 'III'
    },

    // 3. Крепости (5 уровней — от светлого к тёмному металлу)
    fortress_1: {
        icon: 'fa-solid fa-shield-halved',
        color: '#b0b0b0',                    // светлый металл
        bgColor: 'rgba(176, 176, 176, 0.3)',
        level: 'I'
    },
    fortress_2: {
        icon: 'fa-solid fa-shield-halved',
        color: '#8a8a8a',                    // серый
        bgColor: 'rgba(138, 138, 138, 0.3)',
        level: 'II'
    },
    fortress_3: {
        icon: 'fa-solid fa-shield-halved',
        color: '#6b6b6b',                    // тёмно-серый
        bgColor: 'rgba(107, 107, 107, 0.3)',
        level: 'III'
    },
    fortress_4: {
        icon: 'fa-solid fa-shield-halved',
        color: '#4a4a4a',                    // почти чёрный
        bgColor: 'rgba(74, 74, 74, 0.3)',
        level: 'IV'
    },
    fortress_5: {
        icon: 'fa-solid fa-shield-halved',
        color: '#2c2c2c',                    // чёрный металл
        bgColor: 'rgba(44, 44, 44, 0.3)',
        level: 'V'
    },

    // 4. Город без стен
    town: {
        icon: 'fa-solid fa-house',
        color: '#b87333',                    // медный
        bgColor: 'rgba(184, 115, 51, 0.3)',
    },

    // 5. Точки интереса (чудеса, достопримечательности)
    interest: {
        icon: 'fa-regular fa-star',
        color: '#e9c46a',                    // жёлтый
        bgColor: 'rgba(233, 196, 106, 0.3)',
    },

    // 6. Аномалии (магия)
    anomaly: {
        icon: 'fa-solid fa-wand-magic-sparkles',
        color: '#bb8fce',                    // фиолетовый
        bgColor: 'rgba(187, 143, 206, 0.3)',
    },

    // 7. Восстания
    rebellion: {
        icon: 'fa-solid fa-fire',
        color: '#e63946',                    // красный
        bgColor: 'rgba(230, 57, 70, 0.3)',
    },

    // 8. Ивенты (кубик)
    event: {
        icon: 'fa-solid fa-dice-d6',
        color: '#f39c12',                    // оранжевый
        bgColor: 'rgba(243, 156, 18, 0.3)',
    },

    // Базовые (для обратной совместимости)
    capital: {
        icon: 'fa-solid fa-crown',
        color: '#c9a45b',
        bgColor: 'rgba(201, 164, 91, 0.3)',
    },
    castle: {
        icon: 'fa-solid fa-castle',
        color: '#a8b5c0',
        bgColor: 'rgba(168, 181, 192, 0.3)',
    },
    port: {
        icon: 'fa-solid fa-anchor',
        color: '#4a6fa5',
        bgColor: 'rgba(74, 111, 165, 0.3)',
    },
};