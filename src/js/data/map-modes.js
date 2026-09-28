export const mapModes = {
    political: {
        id: 'political',
        title: 'Политическая карта',
        icon: 'account_balance',
        imagePath: 'src/assets/maps/fauxmap.png',
        description: 'Государства, провинции и политический контроль.',

        features: {
            provinces: true,
            chronology: true,
            provinceTools: true,
            tradeZones: false,
            tradeRoutes: false,
            legend: true
        }
    },

    geographic: {
        id: 'geographic',
        title: 'Географическая карта',
        icon: 'terrain',
        imagePath: 'src/assets/maps/newfaux.png',
        description: 'Рельеф, высоты и водные территории.',

        features: {
            provinces: false,
            chronology: false,
            provinceTools: false,
            tradeZones: false,
            tradeRoutes: false,
            legend: true
        }
    },

    trade: {
        id: 'trade',
        title: 'Торговая карта',
        icon: 'sync_alt',
        imagePath: 'src/assets/maps/newfauxtrade.png',
        description: 'Торговые зоны, маршруты, оборот и влияние.',

        features: {
            provinces: false,
            chronology: false,
            provinceTools: false,
            tradeZones: true,
            tradeRoutes: true,
            legend: true
        }
    }
};

export const DEFAULT_MAP_MODE = 'political';