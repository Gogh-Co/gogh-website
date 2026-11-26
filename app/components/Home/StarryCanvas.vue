<template>
    <canvas ref="canvas" class="starry-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
// A generative "brushstroke" field: short strokes flow along a vector field
// made of swirling vortices plus slow waves, leaving painterly trails, a nod
// to the painter the project is named after. Colors come from the active
// theme's palette, so the canvas repaints itself whenever it changes.
//
// With `scene` on (the hero), a night landscape paints itself in over the
// first seconds, the way his skies do: a crescent moon and stars wrapped in
// concentric halo strokes, rolling hills, a flame-like cypress and a few
// village lights. Touches of code join the paint: glyphs drifting with the
// wind, a line of code orbiting the moon and another written along the hills.

const props = defineProps({
    // With `scene`, expected in the hero's order: red, green, yellow, blue,
    // magenta, cyan, then the six bright variants in the same order.
    palette: {
        type: Array,
        required: true,
    },
    background: {
        type: String,
        default: '#0a0f14',
    },
    // Particle budget bounds (the count scales with the canvas area).
    minParticles: {
        type: Number,
        default: 350,
    },
    maxParticles: {
        type: Number,
        default: 1400,
    },
    // Stops the animation loop while the host is hidden.
    paused: {
        type: Boolean,
        default: false,
    },
    // Paint the night landscape and the code touches (hero only).
    scene: {
        type: Boolean,
        default: false,
    },
});

const CODE_GLYPHS = ['{', '}', ';', '=>', '()', '</>', '0', '1', '#', '$', '*', '&&', '||', '[]', 'fn', '::', '//', '!=', '++', '%', '~', '|>'];
const MOON_TEXT = 'const night = paint({ swirl: true, stars: 11 }); ';
const HILL_TEXT = 'while (night) { sky.swirl(); stars.glow(); } // gogh  ';
const CODE_FONT = '"Roboto Mono", ui-monospace, monospace';

// Frames before the landscape starts, and frames it takes to fully appear.
const SCENE_DELAY = 60;
const SCENE_BUILD = 720;

const canvas = ref(null);

let ctx = null;
let frame = 0;
let running = false;
let width = 0;
let height = 0;
let dpr = 1;
let particles = [];
let vortices = [];
let time = 0;
let progress = 0;
let pointer = { x: -9999, y: -9999, active: false };
let resizeObserver = null;
let visibilityObserver = null;
let reduced = false;
let onScreen = false;
let fadeColor = 'rgba(10, 15, 20, 0.07)';
let geo = null;

/* ---------------------------------------------------------------- colors */

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
    const value = parseInt(full.slice(0, 6), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgba(hex, alpha) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Linear mix of two hex colors, returned as an rgba() string.
function mix(hexA, hexB, t, alpha = 1) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const c = a.map((value, i) => Math.round(value + (b[i] - value) * t));
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function paletteAt(...indexes) {
    const palette = props.palette;
    return indexes.map((i) => palette[i % palette.length]).filter(Boolean);
}

// Which palette entries each part of the scene paints with.
const roles = computed(() => {
    if (!props.scene) {
        return { sky: props.palette };
    }
    return {
        sky: paletteAt(3, 5, 9, 11, 4, 10, 9, 11, 8),
        light: paletteAt(2, 8, 8),
        hill: paletteAt(3, 1, 5, 9, 4),
        cypress: paletteAt(1, 7, 3),
        code: paletteAt(8, 11, 9, 10, 7),
    };
});

function updateFadeColor() {
    const [r, g, b] = hexToRgb(props.background);
    fadeColor = `rgba(${r}, ${g}, ${b}, 0.075)`;
}

/* -------------------------------------------------------------- geometry */

function placeVortices() {
    const base = height < 160 ? width * 0.35 : Math.min(width, height);
    vortices = props.scene
        ? [
            // The big rolling swirl across the middle of the sky, plus eddies.
            { x: width * 0.42, y: height * 0.3, r: base * 0.2, s: 1 },
            { x: width * 0.58, y: height * 0.26, r: base * 0.17, s: -1 },
            { x: width * 0.26, y: height * 0.22, r: base * 0.13, s: -1 },
            { x: width * 0.72, y: height * 0.45, r: base * 0.12, s: 1 },
            { x: width * 0.16, y: height * 0.5, r: base * 0.1, s: 1 },
        ]
        : [
            { x: width * 0.74, y: height * 0.3, r: base * 0.22, s: 1 },
            { x: width * 0.42, y: height * 0.2, r: base * 0.16, s: -1 },
            { x: width * 0.18, y: height * 0.62, r: base * 0.2, s: 1 },
            { x: width * 0.6, y: height * 0.78, r: base * 0.17, s: -1 },
            { x: width * 0.92, y: height * 0.72, r: base * 0.12, s: 1 },
        ];
}

function horizonFar(x) {
    return height * 0.71 + Math.sin((x / width) * Math.PI * 1.5 + 0.9) * height * 0.04 + Math.sin((x / width) * Math.PI * 5.2) * height * 0.01;
}

function horizonNear(x) {
    return height * 0.81 + Math.sin((x / width) * Math.PI * 1.1 + 2.4) * height * 0.035 + Math.sin((x / width) * Math.PI * 3.6 + 1) * height * 0.012;
}

function placeScene() {
    const unit = Math.min(width, height);
    const narrow = width < 700;
    geo = {
        // Low enough that its code ring clears the header bar.
        moon: { x: width * (narrow ? 0.8 : 0.84), y: height * (narrow ? 0.15 : 0.25), r: unit * (narrow ? 0.06 : 0.05) },
        stars: [
            [0.08, 0.12], [0.2, 0.07], [0.33, 0.15], [0.5, 0.06], [0.64, 0.12],
            [0.7, 0.34], [0.95, 0.38], [0.27, 0.4], [0.9, 0.58], [0.06, 0.32],
        ].map(([x, y], i) => ({ x: width * x, y: height * y, r: unit * (0.012 + (i % 3) * 0.004) })),
        cypress: {
            x: width * (narrow ? 0.12 : 0.1),
            base: height * 1.02,
            top: height * (narrow ? 0.42 : 0.3),
            w: Math.max(26, width * (narrow ? 0.07 : 0.045)),
        },
        lights: Array.from({ length: 9 }, (_, i) => {
            const x = width * (0.52 + i * 0.035 + (i % 2) * 0.01);
            return { x, y: horizonNear(x) - 6 - (i % 3) * 4 };
        }),
    };
}

// A point inside the cypress: t runs base (0) to tip (1), u across (-1..1).
function cypressPoint(t, u) {
    const c = geo.cypress;
    const y = c.base - t * (c.base - c.top);
    const half = c.w * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(t, 1), 0.6)), 0.85) * (1 - t * 0.5);
    const sway = Math.sin(t * 6 + time * 0.02) * c.w * 0.22 * t;
    return [c.x + sway + u * half, y];
}

/* ------------------------------------------------------------- particles */

function pickRole() {
    if (!props.scene || progress <= 0) {
        return 'sky';
    }
    const roll = Math.random();
    const p = progress;
    if (roll < 0.05 * p) return 'code';
    if (roll < 0.17 * p) return 'halo';
    if (roll < 0.27 * p) return 'cypress';
    if (roll < 0.45 * p) return 'hill';
    return 'sky';
}

function randomOf(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function spawn(particle = {}) {
    const role = pickRole();
    particle.role = role;
    particle.age = 0;
    particle.life = 60 + Math.random() * 180;
    particle.speed = 0.6 + Math.random() * 1.6;
    particle.width = 0.8 + Math.random() * 2.2;

    if (role === 'sky') {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
        // Once the hills exist, keep the sky strokes above them.
        if (props.scene && progress > 0.2) {
            particle.y = Math.random() * horizonFar(particle.x);
        }
        particle.color = randomOf(roles.value.sky);
    } else if (role === 'hill') {
        particle.x = Math.random() * width;
        const top = horizonFar(particle.x);
        particle.y = top + Math.random() * (height - top);
        particle.speed = 0.4 + Math.random() * 0.9;
        particle.color = randomOf(roles.value.hill);
    } else if (role === 'cypress') {
        particle.t = Math.random() * 0.9;
        particle.u = Math.random() * 2 - 1;
        particle.speed = 0.5 + Math.random() * 1.1;
        particle.life = 80 + Math.random() * 120;
        [particle.x, particle.y] = cypressPoint(particle.t, particle.u);
        particle.color = randomOf(roles.value.cypress);
    } else if (role === 'halo') {
        const useMoon = Math.random() < 0.4;
        const body = useMoon ? geo.moon : randomOf(geo.stars);
        const ring = Math.floor(Math.random() * (useMoon ? 5 : 3));
        particle.cx = body.x;
        particle.cy = body.y;
        particle.radius = body.r * (1.5 + ring * (useMoon ? 0.55 : 0.75)) + Math.random() * 2;
        particle.angle = Math.random() * Math.PI * 2;
        particle.dir = useMoon || Math.random() < 0.6 ? 1 : -1;
        particle.speed = 0.5 + Math.random() * 1.2;
        particle.x = particle.cx + Math.cos(particle.angle) * particle.radius;
        particle.y = particle.cy + Math.sin(particle.angle) * particle.radius;
        particle.color = Math.random() < 0.8 ? randomOf(roles.value.light) : randomOf(roles.value.sky);
    } else {
        // code
        particle.x = Math.random() * width;
        particle.y = Math.random() * horizonFar(particle.x) * 0.95;
        particle.speed = 0.35 + Math.random() * 0.6;
        particle.life = 90 + Math.random() * 140;
        particle.glyph = randomOf(CODE_GLYPHS);
        particle.size = 10 + Math.floor(Math.random() * 6);
        particle.color = randomOf(roles.value.code);
    }

    particle.px = particle.x;
    particle.py = particle.y;
    return particle;
}

function createParticles() {
    const area = width * height;
    const count = Math.round(Math.min(props.maxParticles, Math.max(props.minParticles, area / 1100)));
    particles = Array.from({ length: count }, () => spawn());
    // Stagger ages so the field doesn't all respawn on the same frame.
    particles.forEach((particle) => {
        particle.age = Math.random() * particle.life;
    });
}

function fieldAngle(x, y) {
    const angle = Math.sin(x * 0.0019 + time * 0.0007) * 1.3
        + Math.cos(y * 0.0024 - time * 0.0005) * 1.1
        + Math.sin((x + y) * 0.0011 + time * 0.0003) * 0.8;

    // Blend toward each vortex's tangent, weighted by proximity.
    let vx = Math.cos(angle);
    let vy = Math.sin(angle);
    for (const vortex of vortices) {
        const dx = x - vortex.x;
        const dy = y - vortex.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const influence = Math.exp(-distance / vortex.r);
        if (influence < 0.02) {
            continue;
        }
        const tangent = Math.atan2(dy, dx) + (Math.PI / 2) * vortex.s + 0.18 * vortex.s;
        vx += Math.cos(tangent) * influence * 3;
        vy += Math.sin(tangent) * influence * 3;
    }

    // The pointer stirs the paint: a soft, local swirl around the cursor.
    if (pointer.active) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const influence = Math.exp(-distance / 140);
        if (influence > 0.02) {
            const tangent = Math.atan2(dy, dx) + Math.PI / 2;
            vx += Math.cos(tangent) * influence * 4;
            vy += Math.sin(tangent) * influence * 4;
        }
    }

    return Math.atan2(vy, vx);
}

// Hill strokes follow the ridge they sit on, with a gentle wave.
function hillAngle(x, y) {
    const mid = (horizonFar(x) + height) / 2;
    const curve = y < mid ? horizonFar : horizonNear;
    const slope = (curve(x + 4) - curve(x - 4)) / 8;
    return Math.atan(slope) + Math.sin(x * 0.012 + time * 0.01) * 0.2;
}

function move(particle) {
    particle.px = particle.x;
    particle.py = particle.y;
    particle.age += 1;

    if (particle.role === 'halo') {
        particle.angle += (particle.dir * particle.speed) / particle.radius;
        particle.x = particle.cx + Math.cos(particle.angle) * particle.radius;
        particle.y = particle.cy + Math.sin(particle.angle) * particle.radius;
        return particle.age <= particle.life;
    }

    if (particle.role === 'cypress') {
        particle.t += particle.speed / Math.max(1, geo.cypress.base - geo.cypress.top);
        particle.u = Math.max(-1, Math.min(1, particle.u + Math.sin(time * 0.05 + particle.t * 12) * 0.03));
        [particle.x, particle.y] = cypressPoint(particle.t, particle.u);
        return particle.t < 1 && particle.age <= particle.life;
    }

    const angle = particle.role === 'hill' ? hillAngle(particle.x, particle.y) : fieldAngle(particle.x, particle.y);
    particle.x += Math.cos(angle) * particle.speed;
    particle.y += Math.sin(angle) * particle.speed;
    particle.angleNow = angle;

    const outside = particle.x < -10 || particle.x > width + 10 || particle.y < -10 || particle.y > height + 10;
    return !outside && particle.age <= particle.life;
}

/* ------------------------------------------------------------- painting */

function fillCircle(x, y, r, style) {
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

// Soft masses under the strokes. They're redrawn faintly every frame, so with
// the trail fade they build up slowly: the landscape "develops" like a print.
function paintUnderlayer() {
    const p = progress;
    const light = roles.value.light[0] || '#f1c40f';
    const bg = props.background;
    const { moon } = geo;

    // Moon: glow, disk, and a background-colored bite for the crescent.
    const glow = ctx.createRadialGradient(moon.x, moon.y, moon.r * 0.5, moon.x, moon.y, moon.r * 4.5);
    glow.addColorStop(0, rgba(light, 0.05 * p));
    glow.addColorStop(1, rgba(light, 0));
    fillCircle(moon.x, moon.y, moon.r * 4.5, glow);
    fillCircle(moon.x, moon.y, moon.r, rgba(light, 0.12 * p));
    fillCircle(moon.x - moon.r * 0.45, moon.y - moon.r * 0.22, moon.r * 0.86, rgba(bg, 0.12 * p));

    // Stars: glow plus a bright core.
    for (const star of geo.stars) {
        const g = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3.2);
        g.addColorStop(0, rgba(light, 0.07 * p));
        g.addColorStop(1, rgba(light, 0));
        fillCircle(star.x, star.y, star.r * 3.2, g);
        fillCircle(star.x, star.y, star.r * 0.55, rgba('#fff7d6', 0.16 * p));
    }

    // Hills: two ridges, the far one lighter.
    const hillBase = roles.value.hill[0] || '#2479d0';
    for (const [curve, tint, alpha] of [[horizonFar, 0.24, 0.045], [horizonNear, 0.08, 0.075]]) {
        ctx.fillStyle = mix(bg, hillBase, tint, alpha * p);
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width + 12; x += 12) {
            ctx.lineTo(x, curve(x));
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
    }

    // Village windows along the near ridge.
    ctx.fillStyle = rgba(light, 0.2 * p);
    for (const lamp of geo.lights) {
        ctx.fillRect(lamp.x, lamp.y, 3, 2);
    }

    // Cypress silhouette, darker than the night behind it.
    ctx.fillStyle = mix(bg, '#000000', 0.55, 0.08 * p);
    ctx.beginPath();
    const steps = 28;
    for (let i = 0; i <= steps; i += 1) {
        const [x, y] = cypressPoint(i / steps, -1);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i -= 1) {
        const [x, y] = cypressPoint(i / steps, 1);
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

// A line of code orbiting the moon, one character at a time.
function paintMoonCode() {
    const { moon } = geo;
    const radius = moon.r * 3.1;
    const size = Math.max(10, Math.round(moon.r * 0.32));
    const step = (size * 0.62) / radius;
    const count = Math.floor((Math.PI * 2) / step);
    const spin = time * 0.0025;
    ctx.font = `${size}px ${CODE_FONT}`;
    ctx.fillStyle = rgba(roles.value.light[1] || '#f1c40f', 0.32 * progress);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < count; i += 1) {
        const char = MOON_TEXT[i % MOON_TEXT.length];
        if (char === ' ') continue;
        const angle = spin + i * step;
        ctx.save();
        ctx.translate(moon.x + Math.cos(angle) * radius, moon.y + Math.sin(angle) * radius);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
}

// Code written along the far ridge, drifting slowly left.
function paintHillCode() {
    const size = width < 700 ? 10 : 12;
    const spacing = size * 0.62;
    const drift = (time * 0.25) % (HILL_TEXT.length * spacing);
    ctx.font = `${size}px ${CODE_FONT}`;
    ctx.fillStyle = rgba(roles.value.code[1] || '#2aa198', 0.22 * progress);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (let i = 0, x = -drift; x < width + spacing; i += 1, x += spacing) {
        const char = HILL_TEXT[i % HILL_TEXT.length];
        if (char === ' ' || x < -spacing) continue;
        const y = horizonFar(x) - 5;
        const slope = (horizonFar(x + 3) - horizonFar(x - 3)) / 6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.atan(slope));
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
}

function paintGlyphs(glyphs) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const glyph of glyphs) {
        // Fade in and out over the glyph's life.
        const lifeT = glyph.age / glyph.life;
        const alpha = Math.sin(Math.PI * Math.min(1, lifeT)) * 0.75 * progress;
        if (alpha < 0.02) continue;
        ctx.font = `${glyph.size}px ${CODE_FONT}`;
        ctx.fillStyle = rgba(glyph.color, alpha);
        ctx.save();
        ctx.translate(glyph.x, glyph.y);
        ctx.rotate(glyph.angleNow || 0);
        ctx.fillText(glyph.glyph, 0, 0);
        ctx.restore();
    }
}

function step() {
    time += 1;
    progress = props.scene ? Math.max(0, Math.min(1, (time - SCENE_DELAY) / SCENE_BUILD)) : 0;
    // Ease the build-up so it starts gently and settles softly.
    progress = progress * progress * (3 - 2 * progress);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = fadeColor;
    ctx.fillRect(0, 0, width, height);

    if (props.scene && progress > 0) {
        paintUnderlayer();
    }

    const buckets = new Map();
    const glyphs = [];

    for (const particle of particles) {
        if (!move(particle)) {
            spawn(particle);
            continue;
        }
        if (particle.role === 'code') {
            glyphs.push(particle);
            continue;
        }
        let bucket = buckets.get(particle.color);
        if (!bucket) {
            bucket = [];
            buckets.set(particle.color, bucket);
        }
        bucket.push(particle);
    }

    const scale = height < 160 ? 0.6 : 1;
    ctx.lineCap = 'round';
    buckets.forEach((bucket, color) => {
        ctx.strokeStyle = color;
        // Two widths per color keeps the batching cheap but the strokes varied.
        for (const thick of [false, true]) {
            ctx.lineWidth = (thick ? 2.4 : 1.1) * scale;
            ctx.globalAlpha = thick ? 0.55 : 0.85;
            ctx.beginPath();
            for (const particle of bucket) {
                if ((particle.width > 1.9) !== thick) {
                    continue;
                }
                ctx.moveTo(particle.px, particle.py);
                ctx.lineTo(particle.x, particle.y);
            }
            ctx.stroke();
        }
    });
    ctx.globalAlpha = 1;

    if (props.scene && progress > 0) {
        paintGlyphs(glyphs);
        // The orbiting/ridge text only needs every other frame.
        if (time % 2 === 0) {
            paintMoonCode();
            paintHillCode();
        }
    }
}

function loop() {
    if (!running) {
        return;
    }
    step();
    frame = requestAnimationFrame(loop);
}

function play() {
    if (running || reduced || !ctx || props.paused) {
        return;
    }
    running = true;
    frame = requestAnimationFrame(loop);
}

function pause() {
    running = false;
    cancelAnimationFrame(frame);
}

function paintBackground() {
    ctx.globalAlpha = 1;
    ctx.fillStyle = props.background;
    ctx.fillRect(0, 0, width, height);
}

// Reduced motion: paint a still image (the finished scene) instead of
// animating.
function paintStill() {
    paintBackground();
    const startTime = time;
    time = SCENE_DELAY + SCENE_BUILD;
    progress = props.scene ? 1 : 0;
    createParticles();
    for (let i = 0; i < 320; i += 1) {
        step();
    }
    time = Math.max(time, startTime);
}

function resize() {
    const element = canvas.value;
    if (!element) {
        return;
    }
    const rect = element.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    element.width = Math.round(width * dpr);
    element.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    placeVortices();
    placeScene();
    createParticles();
    paintBackground();
    if (reduced) {
        paintStill();
    }
}

function onPointerMove(event) {
    const rect = canvas.value.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
}

function onPointerLeave() {
    pointer.active = false;
}

function onVisibilityChange() {
    if (document.hidden) {
        pause();
    } else if (onScreen) {
        play();
    }
}

watch(() => props.paused, (paused) => {
    if (paused) {
        pause();
    } else if (onScreen && !document.hidden) {
        play();
    }
});

// New palette: every stroke takes a color from its part of the scene again.
watch(() => props.palette, () => {
    particles.forEach((particle) => {
        const list = roles.value[particle.role] || roles.value.sky;
        particle.color = particle.role === 'halo' ? randomOf(roles.value.light) : randomOf(list);
    });
    if (reduced && ctx) {
        paintStill();
    }
});

watch(() => props.background, () => {
    updateFadeColor();
    if (reduced && ctx) {
        paintStill();
    }
});

onMounted(() => {
    ctx = canvas.value.getContext('2d');
    reduced = prefersReducedMotion();
    updateFadeColor();
    resize();

    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas.value);

    // Only animate while the canvas is on screen.
    visibilityObserver = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) {
            play();
        } else {
            pause();
        }
    });
    visibilityObserver.observe(canvas.value);

    const host = canvas.value.parentElement;
    host?.addEventListener('pointermove', onPointerMove, { passive: true });
    host?.addEventListener('pointerleave', onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
    pause();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    const host = canvas.value?.parentElement;
    host?.removeEventListener('pointermove', onPointerMove);
    host?.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style lang="scss" scoped>
.starry-canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
}
</style>
