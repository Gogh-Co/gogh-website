// Bit effects for icon buttons, drawn on a single canvas (client-only).
//
// assembleFromBits: 0/1 bits burst out of a source element and fly along
// curved paths into each target, where they settle into the shape of its
// SVG icon; then the real icon fades in (onDone) and the bits fade out.
//
// scatterToBits: the way out. Each icon turns into bits in place (onStart:
// hide the real icon), they burst apart, and the source pulls them in,
// shrinking and fading as they arrive.
//
// Both return a cancel function that stops the animation, clears the canvas
// and runs whatever callbacks are still pending.

export interface BitsTarget {
    // Element holding the <svg> to draw.
    element: HTMLElement;
    // Bit colour; the element's text colour when left out.
    color?: string;
    // assembleFromBits: its bits have landed (show the real icon).
    onDone?: () => void;
    // scatterToBits: its bits replace the icon (hide the real icon).
    onStart?: () => void;
}

interface BitsOptions {
    // Delay between one target and the next, in ms.
    stagger?: number;
    // Average flight time of a bit, in ms.
    duration?: number;
    // The whole animation ended or was cancelled.
    onComplete?: () => void;
}

type Box = { left: number; top: number; width: number; height: number };

// Cells across the icon; each filled cell becomes one bit.
const GRID = 11;
const RASTER = 44;
const FLIGHT_SIZE = 11;
const FADE_OUT = 260;
const FONT = '"Roboto Mono", ui-monospace, monospace';
const shapes = new Map<string, Array<[number, number]>>();

// Filled cells of an SVG icon, as 0..1 coordinates of its viewBox.
function sampleIcon(svg: SVGSVGElement): Array<[number, number]> {
    const paths = [...svg.querySelectorAll('path')].map((path) => path.getAttribute('d') ?? '');
    const box = svg.viewBox?.baseVal;
    const width = box?.width || 16;
    const height = box?.height || 16;
    const key = `${width}x${height}|${paths.join('|')}`;
    const cached = shapes.get(key);
    if (cached) {
        return cached;
    }

    const points: Array<[number, number]> = [];
    const raster = document.createElement('canvas');
    raster.width = RASTER;
    raster.height = RASTER;
    const ctx = raster.getContext('2d', { willReadFrequently: true });
    if (ctx && typeof Path2D !== 'undefined') {
        ctx.scale(RASTER / width, RASTER / height);
        for (const d of paths) {
            ctx.fill(new Path2D(d));
        }
        const { data } = ctx.getImageData(0, 0, RASTER, RASTER);
        const cell = RASTER / GRID;
        for (let row = 0; row < GRID; row += 1) {
            for (let col = 0; col < GRID; col += 1) {
                const x = Math.floor((col + 0.5) * cell);
                const y = Math.floor((row + 0.5) * cell);
                if (data[(y * RASTER + x) * 4 + 3] > 96) {
                    points.push([(col + 0.5) / GRID, (row + 0.5) / GRID]);
                }
            }
        }
    }

    shapes.set(key, points);
    return points;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInCubic = (t: number) => t ** 3;
const randomBit = () => (Math.random() < 0.5 ? '0' : '1');
const center = (rect: Box, box: Box): [number, number] => [
    rect.left + rect.width / 2 - box.left,
    rect.top + rect.height / 2 - box.top,
];

// Point on a quadratic curve from a to b, bowed sideways by `bend`.
function curve(ax: number, ay: number, bx: number, by: number, bend: number, t: number): [number, number] {
    const cx = (ax + bx) / 2 + bend;
    const cy = (ay + by) / 2;
    const inv = 1 - t;
    return [
        inv * inv * ax + 2 * inv * t * cx + t * t * bx,
        inv * inv * ay + 2 * inv * t * cy + t * t * by,
    ];
}

function drawBit(ctx: CanvasRenderingContext2D, bit: string, x: number, y: number, size: number, color: string, alpha: number) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `700 ${size.toFixed(2)}px ${FONT}`;
    ctx.fillText(bit, x, y);
}

// Frame loop on a DPR-sized canvas. `draw` gets the canvas box and the
// elapsed time and returns false once it is finished.
function animate(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    draw: (box: DOMRect, elapsed: number) => boolean,
    onStop: () => void,
): () => void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    let startTime = 0;
    let stopped = false;

    const stop = () => {
        if (stopped) {
            return;
        }
        stopped = true;
        cancelAnimationFrame(frame);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onStop();
    };

    const tick = (now: number) => {
        if (!startTime) {
            startTime = now;
        }
        const box = canvas.getBoundingClientRect();
        const width = Math.round(box.width * dpr);
        const height = Math.round(box.height * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, box.width, box.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const running = draw(box, now - startTime);
        ctx.globalAlpha = 1;
        if (running) {
            frame = requestAnimationFrame(tick);
        } else {
            stop();
        }
    };

    frame = requestAnimationFrame(tick);
    return stop;
}

function prepare(canvas: HTMLCanvasElement | null | undefined, source: HTMLElement | null | undefined) {
    const ctx = canvas?.getContext('2d');
    return canvas && ctx && source && typeof window !== 'undefined' ? ctx : null;
}

export function assembleFromBits(
    canvas: HTMLCanvasElement | null | undefined,
    source: HTMLElement | null | undefined,
    items: BitsTarget[],
    { stagger = 55, duration = 720, onComplete }: BitsOptions = {},
): () => void {
    const ctx = prepare(canvas, source);
    if (!ctx || !canvas || !source) {
        items.forEach((item) => item.onDone?.());
        onComplete?.();
        return () => {};
    }

    const targets: Array<{ svg: SVGSVGElement; color: string; landAt: number; onDone?: () => void; done: boolean }> = [];
    const particles: Array<{ target: number; u: number; v: number; delay: number; duration: number; jitterX: number; jitterY: number; bend: number; bit: string }> = [];

    items.forEach((item, index) => {
        const svg = item.element.querySelector('svg');
        const points = svg ? sampleIcon(svg) : [];
        if (!svg || !points.length) {
            item.onDone?.();
            return;
        }
        const target = targets.length;
        const start = index * stagger;
        let landAt = 0;
        for (const [u, v] of points) {
            const delay = start + Math.random() * 160;
            const flight = duration * (0.7 + Math.random() * 0.6);
            landAt = Math.max(landAt, delay + flight);
            particles.push({
                target,
                u,
                v,
                delay,
                duration: flight,
                jitterX: (Math.random() - 0.5) * 22,
                jitterY: (Math.random() - 0.5) * 10,
                bend: (Math.random() - 0.5) * 70,
                bit: randomBit(),
            });
        }
        targets.push({
            svg,
            color: item.color || getComputedStyle(item.element).color || '#ffffff',
            landAt,
            onDone: item.onDone,
            done: false,
        });
    });

    const settle = (target: (typeof targets)[number]) => {
        if (!target.done) {
            target.done = true;
            target.onDone?.();
        }
    };

    if (!particles.length) {
        onComplete?.();
        return () => {};
    }

    const end = Math.max(...targets.map((target) => target.landAt)) + FADE_OUT;

    return animate(canvas, ctx, (box, elapsed) => {
        // Measured every frame: the buttons are still rising into place
        // and the whole widget can shift up out of the way of banners.
        const [fromX, fromY] = center(source.getBoundingClientRect(), box);
        const rects = targets.map((target) => target.svg.getBoundingClientRect());

        for (const target of targets) {
            if (elapsed >= target.landAt) {
                settle(target);
            }
        }

        for (const particle of particles) {
            const local = elapsed - particle.delay;
            if (local <= 0) {
                continue;
            }
            const target = targets[particle.target];
            const rect = rects[particle.target];
            const toX = rect.left + particle.u * rect.width - box.left;
            const toY = rect.top + particle.v * rect.height - box.top;
            const endSize = Math.max((rect.width / GRID) * 1.45, 2);

            const progress = Math.min(local / particle.duration, 1);
            const eased = easeOutCubic(progress);
            const [x, y] = curve(fromX + particle.jitterX, fromY + particle.jitterY, toX, toY, particle.bend, eased);

            if (progress < 1 && Math.random() < 0.18) {
                particle.bit = particle.bit === '0' ? '1' : '0';
            }

            let alpha = Math.min(progress / 0.15, 1);
            if (target.done) {
                alpha *= Math.max(0, 1 - (elapsed - target.landAt) / FADE_OUT);
            }
            if (alpha > 0) {
                drawBit(ctx, particle.bit, x, y, FLIGHT_SIZE + (endSize - FLIGHT_SIZE) * eased, target.color, alpha);
            }
        }
        return elapsed < end;
    }, () => {
        targets.forEach(settle);
        onComplete?.();
    });
}

// Burst: how far a bit is thrown out of the icon before the pull starts.
const BURST_TIME = 170;
const BURST_SIZE = 8;
const ARRIVE_SIZE = 2;

export function scatterToBits(
    canvas: HTMLCanvasElement | null | undefined,
    source: HTMLElement | null | undefined,
    items: BitsTarget[],
    { stagger = 50, duration = 480, onComplete }: BitsOptions = {},
): () => void {
    const ctx = prepare(canvas, source);
    if (!ctx || !canvas || !source) {
        items.forEach((item) => item.onStart?.());
        onComplete?.();
        return () => {};
    }

    // Frozen at the start: the buttons fade out while their bits fly, and
    // the bits must leave from where the icon was.
    const box = canvas.getBoundingClientRect();
    const targets: Array<{ start: number; color: string; onStart?: () => void; started: boolean }> = [];
    const particles: Array<{ target: number; homeX: number; homeY: number; size: number; burstX: number; burstY: number; leave: number; duration: number; bend: number; bit: string }> = [];

    items.forEach((item, index) => {
        const svg = item.element.querySelector('svg');
        const points = svg ? sampleIcon(svg) : [];
        if (!svg || !points.length) {
            item.onStart?.();
            return;
        }
        const rect = svg.getBoundingClientRect();
        const start = index * stagger;
        const size = Math.max((rect.width / GRID) * 1.45, 2);
        for (const [u, v] of points) {
            // Thrown outward from the icon's centre, a little at random.
            const angle = Math.atan2(v - 0.5, u - 0.5) + (Math.random() - 0.5) * 1.2;
            const reach = 6 + Math.random() * 12;
            particles.push({
                target: targets.length,
                homeX: rect.left + u * rect.width - box.left,
                homeY: rect.top + v * rect.height - box.top,
                size,
                burstX: Math.cos(angle) * reach,
                burstY: Math.sin(angle) * reach,
                leave: start + Math.random() * 140,
                duration: duration * (0.75 + Math.random() * 0.5),
                bend: (Math.random() - 0.5) * 60,
                bit: randomBit(),
            });
        }
        targets.push({
            start,
            color: item.color || getComputedStyle(item.element).color || '#ffffff',
            onStart: item.onStart,
            started: false,
        });
    });

    const begin = (target: (typeof targets)[number]) => {
        if (!target.started) {
            target.started = true;
            target.onStart?.();
        }
    };

    if (!particles.length) {
        onComplete?.();
        return () => {};
    }

    const end = Math.max(...particles.map((particle) => particle.leave + BURST_TIME + particle.duration));

    return animate(canvas, ctx, (frameBox, elapsed) => {
        // The toggle can move with the widget; the icons' spots cannot.
        const shiftX = box.left - frameBox.left;
        const shiftY = box.top - frameBox.top;
        const [toX, toY] = center(source.getBoundingClientRect(), frameBox);

        for (const target of targets) {
            if (elapsed >= target.start) {
                begin(target);
            }
        }

        for (const particle of particles) {
            const target = targets[particle.target];
            if (!target.started) {
                continue;
            }
            const homeX = particle.homeX + shiftX;
            const homeY = particle.homeY + shiftY;
            const local = elapsed - particle.leave;

            // Still in place: the icon, redrawn as bits.
            if (local <= 0) {
                drawBit(ctx, particle.bit, homeX, homeY, particle.size, target.color, 1);
                continue;
            }

            if (Math.random() < 0.22) {
                particle.bit = particle.bit === '0' ? '1' : '0';
            }

            // Burst apart and grow readable.
            if (local < BURST_TIME) {
                const eased = easeOutCubic(local / BURST_TIME);
                drawBit(
                    ctx,
                    particle.bit,
                    homeX + particle.burstX * eased,
                    homeY + particle.burstY * eased,
                    particle.size + (BURST_SIZE - particle.size) * eased,
                    target.color,
                    1,
                );
                continue;
            }

            // Pulled into the toggle, faster and smaller as it gets there.
            const progress = (local - BURST_TIME) / particle.duration;
            if (progress >= 1) {
                continue;
            }
            const eased = easeInCubic(progress);
            const [x, y] = curve(homeX + particle.burstX, homeY + particle.burstY, toX, toY, particle.bend, eased);
            const alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
            drawBit(ctx, particle.bit, x, y, BURST_SIZE + (ARRIVE_SIZE - BURST_SIZE) * eased, target.color, alpha);
        }
        return elapsed < end;
    }, () => {
        targets.forEach(begin);
        onComplete?.();
    });
}
