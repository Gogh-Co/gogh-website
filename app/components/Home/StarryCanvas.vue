<template>
    <canvas ref="canvas" class="starry-canvas" aria-hidden="true"></canvas>
</template>

<script setup>
// A generative "brushstroke" field: short strokes flow along a vector field
// made of a few swirling vortices plus slow waves, leaving painterly trails,
// a nod to the painter the project is named after. Colors come from the
// active theme's palette, so the hero repaints itself whenever it changes.

const props = defineProps({
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
});

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
let pointer = { x: -9999, y: -9999, active: false };
let resizeObserver = null;
let visibilityObserver = null;
let reduced = false;
let onScreen = false;
let fadeColor = 'rgba(10, 15, 20, 0.07)';

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
    const value = parseInt(full.slice(0, 6), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function updateFadeColor() {
    const [r, g, b] = hexToRgb(props.background);
    fadeColor = `rgba(${r}, ${g}, ${b}, 0.075)`;
}

function placeVortices() {
    // Fixed composition (relative to the viewport) so the swirls read as
    // deliberate: one big swirl upper-right ("the moon"), a few smaller ones.
    // Short, wide canvases (the sticky button) use the width instead, so the
    // swirls stay broad sweeps rather than tiny knots.
    const base = height < 160 ? width * 0.35 : Math.min(width, height);
    vortices = [
        { x: width * 0.74, y: height * 0.3, r: base * 0.22, s: 1 },
        { x: width * 0.42, y: height * 0.2, r: base * 0.16, s: -1 },
        { x: width * 0.18, y: height * 0.62, r: base * 0.2, s: 1 },
        { x: width * 0.6, y: height * 0.78, r: base * 0.17, s: -1 },
        { x: width * 0.92, y: height * 0.72, r: base * 0.12, s: 1 },
    ];
}

function spawn(particle = {}) {
    particle.x = Math.random() * width;
    particle.y = Math.random() * height;
    particle.px = particle.x;
    particle.py = particle.y;
    particle.life = 60 + Math.random() * 180;
    particle.age = 0;
    particle.speed = 0.6 + Math.random() * 1.6;
    particle.color = Math.floor(Math.random() * props.palette.length);
    particle.width = 0.8 + Math.random() * 2.2;
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
    let angle = Math.sin(x * 0.0019 + time * 0.0007) * 1.3
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

function step() {
    time += 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fadeColor;
    ctx.fillRect(0, 0, width, height);

    const palette = props.palette;
    const buckets = palette.map(() => []);

    for (const particle of particles) {
        particle.px = particle.x;
        particle.py = particle.y;
        const angle = fieldAngle(particle.x, particle.y);
        particle.x += Math.cos(angle) * particle.speed;
        particle.y += Math.sin(angle) * particle.speed;
        particle.age += 1;

        const outside = particle.x < -10 || particle.x > width + 10 || particle.y < -10 || particle.y > height + 10;
        if (outside || particle.age > particle.life) {
            spawn(particle);
            continue;
        }

        (buckets[particle.color % palette.length] || buckets[0]).push(particle);
    }

    ctx.lineCap = 'round';
    buckets.forEach((bucket, index) => {
        if (!bucket.length) {
            return;
        }
        ctx.strokeStyle = palette[index];
        // Two widths per color keeps the batching cheap but the strokes varied.
        for (const thick of [false, true]) {
            const scale = height < 160 ? 0.6 : 1;
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

// Reduced motion: paint a still image (a few hundred steps at once) instead
// of animating.
function paintStill() {
    paintBackground();
    for (let i = 0; i < 220; i += 1) {
        step();
    }
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

watch(() => props.palette, () => {
    particles.forEach((particle) => {
        particle.color = Math.floor(Math.random() * props.palette.length);
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

    // Only animate while the hero is on screen.
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
