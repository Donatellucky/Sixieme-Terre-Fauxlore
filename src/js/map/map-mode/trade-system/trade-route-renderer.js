export class TradeRouteCanvasRenderer {

    constructor(map) {
        this.map = map;

        this.canvas = null;
        this.ctx = null;

        this.routes = [];

        this.visible = false;

        this.hoveredRouteId = null;
        this.selectedRouteId = null;

        this.redrawRequested = false;

        this.handleMapChange = this.requestRedraw.bind(this);
    }


    /**
     * Создаёт Canvas поверх карты.
     */
    init() {
        if (this.canvas) return;

        this.canvas = document.createElement('canvas');

        this.canvas.className =
            'trade-routes-canvas';

        this.map.getContainer().appendChild(
            this.canvas
        );

        this.ctx =
            this.canvas.getContext('2d');

        this.map.on(
            'move zoom resize',
            this.handleMapChange
        );

        this.resize();
        this.draw();
    }


    /**
     * Уничтожает Canvas.
     */
    destroy() {
        if (!this.canvas) return;

        this.map.off(
            'move zoom resize',
            this.handleMapChange
        );

        this.canvas.remove();

        this.canvas = null;
        this.ctx = null;
    }


    /**
     * Передаёт renderer'у маршруты.
     */
    setRoutes(routes) {
    this.routes = routes || [];

    console.log(
        'RENDERER SET ROUTES:',
        this.routes.length,
        this.routes
    );

    this.requestRedraw();
}


    /**
     * Показывает / скрывает Canvas.
     */
    setVisible(visible) {
        this.visible = visible;

        if (this.canvas) {
            this.canvas.style.display =
                visible ? 'block' : 'none';
        }

        if (visible) {
            this.requestRedraw();
        }
    }


    /**
     * Устанавливает hover.
     */
    setHoveredRoute(routeId) {
        this.hoveredRouteId = routeId;

        this.requestRedraw();
    }


    /**
     * Устанавливает selected.
     */
    setSelectedRoute(routeId) {
        this.selectedRouteId = routeId;

        this.requestRedraw();
    }


    /**
     * Сбрасывает состояние выделения.
     */
    clearSelection() {
        this.hoveredRouteId = null;
        this.selectedRouteId = null;

        this.requestRedraw();
    }


    /**
     * Просит браузер перерисовать Canvas.
     */
    requestRedraw() {
        if (!this.visible) return;

        if (this.redrawRequested) return;

        this.redrawRequested = true;

        requestAnimationFrame(() => {
            this.redrawRequested = false;

            this.resize();
            this.draw();
        });
    }


    /**
     * Подгоняет Canvas под размер карты.
     */
    resize() {
        if (!this.canvas || !this.ctx) return;

        const size = this.map.getSize();

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );

        this.canvas.style.width =
            `${size.x}px`;

        this.canvas.style.height =
            `${size.y}px`;

        this.canvas.width =
            Math.round(size.x * dpr);

        this.canvas.height =
            Math.round(size.y * dpr);

        this.ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );
    }


    /**
     * Основная отрисовка.
     */
    draw() {
    console.log(
        'RENDERER DRAW:',
        'visible =', this.visible,
        'routes =', this.routes.length
    );

    if (
        !this.visible ||
        !this.canvas ||
        !this.ctx
    ) {
        return;
    }

        const size = this.map.getSize();

        this.ctx.clearRect(
            0,
            0,
            size.x,
            size.y
        );

        if (!this.routes.length) {
            return;
        }

        const maxTurnover =
            Math.max(
                ...this.routes.map(route =>
                    Number(route.turnover) || 0
                ),
                1
            );

        for (const route of this.routes) {
            const paths =
                route.paths || [];

            for (const path of paths) {
                if (path.length < 2) {
                    continue;
                }

                const points =
                    path.map(latLng =>
                        this.map.latLngToContainerPoint(
                            latLng
                        )
                    );

                const width =
                    this.getRouteWidth(
                        route.turnover,
                        maxTurnover
                    );

                const isHovered =
                    route.id ===
                    this.hoveredRouteId;

                const isSelected =
                    route.id ===
                    this.selectedRouteId;

                this.drawRoute(
                    points,
                    width,
                    isHovered,
                    isSelected
                );
            }
        }
    }


    /**
     * Рассчитывает визуальную толщину маршрута.
     */
    getRouteWidth(turnover, maxTurnover) {
        const value =
            Math.max(
                Number(turnover) || 0,
                0
            );

        const max =
            Math.max(
                Number(maxTurnover) || 1,
                1
            );

        const ratio =
            Math.log1p(value) /
            Math.log1p(max);

        return 5 + ratio * 15;
    }


    /**
     * Рисует один маршрут.
     */
    drawRoute(
        points,
        width,
        isHovered,
        isSelected
    ) {
        const ctx = this.ctx;

        if (!ctx) return;

        /*
         * Внешняя часть "трубы".
         */
        ctx.beginPath();

        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(
                    point.x,
                    point.y
                );
            } else {
                ctx.lineTo(
                    point.x,
                    point.y
                );
            }
        });

        ctx.strokeStyle =
            isSelected
                ? '#f1dcb7'
                : '#10151f';

        ctx.lineWidth =
            width +
            (isHovered || isSelected
                ? 7
                : 5);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.stroke();


        /*
         * Внутренний поток.
         */
        ctx.beginPath();

        points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(
                    point.x,
                    point.y
                );
            } else {
                ctx.lineTo(
                    point.x,
                    point.y
                );
            }
        });

        ctx.strokeStyle =
            isSelected
                ? '#ffffff'
                : '#d8b56a';

        ctx.lineWidth =
            width;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.stroke();


        /*
         * Стрелка на конце маршрута.
         */
        this.drawArrow(
            points,
            width,
            isHovered,
            isSelected
        );
    }


    /**
     * Рисует стрелку направления.
     */
    drawArrow(
        points,
        width,
        isHovered,
        isSelected
    ) {
        if (points.length < 2) {
            return;
        }

        const end =
            points[points.length - 1];

        const beforeEnd =
            points[points.length - 2];

        const dx =
            end.x - beforeEnd.x;

        const dy =
            end.y - beforeEnd.y;

        const angle =
            Math.atan2(dy, dx);

        const size =
            Math.max(
                10,
                width * 2
            );

        const spread =
            Math.PI / 6;

        const ctx = this.ctx;

        ctx.beginPath();

        ctx.moveTo(
            end.x,
            end.y
        );

        ctx.lineTo(
            end.x -
                Math.cos(angle - spread) *
                size,

            end.y -
                Math.sin(angle - spread) *
                size
        );

        ctx.lineTo(
            end.x -
                Math.cos(angle + spread) *
                size,

            end.y -
                Math.sin(angle + spread) *
                size
        );

        ctx.closePath();

        ctx.fillStyle =
            isSelected
                ? '#ffffff'
                : isHovered
                    ? '#f1dcb7'
                    : '#d8b56a';

        ctx.fill();
    }
}