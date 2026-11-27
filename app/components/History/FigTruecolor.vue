<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="depth">
            <div class="depth__bars">
                <div v-for="(label, index) in copy.depths" :key="label" class="depth__bar">
                    <span class="depth__label">{{ label }}</span>
                    <canvas :ref="(el) => (canvases[index] = el)" class="depth__canvas" width="480" height="1" aria-hidden="true"></canvas>
                </div>
            </div>

            <div class="depth__mixer">
                <div class="depth__swatch" :style="{ background: hex }">
                    <span class="depth__near" :style="{ background: nearest256.hex }">
                        <small>256 → {{ nearest256.index }}</small>
                    </span>
                </div>
                <div class="depth__sliders">
                    <label v-for="channel in CHANNELS" :key="channel.key" class="depth__slider" :style="{ '--track': channel.track }">
                        <span>{{ copy[channel.key] }}</span>
                        <input v-model.number="rgb[channel.key]" type="range" min="0" max="255">
                        <b>{{ rgb[channel.key] }}</b>
                    </label>
                    <code class="depth__code">ESC[38;2;{{ rgb.red }};{{ rgb.green }};{{ rgb.blue }}m</code>
                </div>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { XTERM_16, hexToRgb, nearestColor, rgbHex, xterm256 } from '~/utils/historyData';

defineProps({ copy: { type: Object, required: true } });

const CHANNELS = [
    { key: 'red', track: '#e74c3c' },
    { key: 'green', track: '#2ecc71' },
    { key: 'blue', track: '#3498db' },
];

const ALL_256 = xterm256();
const PALETTES = [
    XTERM_16.slice(0, 8).map(hexToRgb),
    XTERM_16.map(hexToRgb),
    ALL_256.map((entry) => hexToRgb(entry.hex)),
    null,
];

// The gradient every bar draws: a hue loop through the Gogh colors, darker
// at both ends so the lower depths have to band.
const STOPS = ['#1a0f2e', '#9b59b6', '#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#2aa198', '#3498db', '#0d1926'].map(hexToRgb);

function gradientAt(t) {
    const position = t * (STOPS.length - 1);
    const index = Math.min(Math.floor(position), STOPS.length - 2);
    const local = position - index;
    const a = STOPS[index];
    const b = STOPS[index + 1];
    return [0, 1, 2].map((channel) => Math.round(a[channel] + (b[channel] - a[channel]) * local));
}

const canvases = [];
const rgb = reactive({ red: 255, green: 121, blue: 198 });
const hex = computed(() => rgbHex(rgb.red, rgb.green, rgb.blue));

const nearest256 = computed(() => {
    const target = [rgb.red, rgb.green, rgb.blue];
    // Only the fixed part (cube and grays): entries 0-15 depend on the theme.
    const candidates = ALL_256.slice(16);
    const best = nearestColor(target, candidates.map((entry) => hexToRgb(entry.hex)));
    const match = candidates.find((entry) => entry.hex === rgbHex(...best));
    return match ?? candidates[0];
});

function draw() {
    canvases.forEach((canvas, index) => {
        const context = canvas?.getContext('2d');
        if (!context) {
            return;
        }
        const image = context.createImageData(canvas.width, 1);
        for (let x = 0; x < canvas.width; x += 1) {
            let color = gradientAt(x / (canvas.width - 1));
            if (PALETTES[index]) {
                color = nearestColor(color, PALETTES[index]);
            }
            image.data.set([color[0], color[1], color[2], 255], x * 4);
        }
        context.putImageData(image, 0, 0);
    });
}

onMounted(draw);
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.depth {
    display: grid;
    gap: 24px;
}

.depth__bars {
    display: grid;
    gap: 10px;
}

.depth__bar {
    display: grid;
    grid-template-columns: 96px 1fr;
    align-items: center;
    gap: 12px;
}

.depth__label {
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.1rem;
}

.depth__canvas {
    display: block;
    width: 100%;
    height: 34px;
    image-rendering: pixelated;
}

.depth__mixer {
    display: grid;
    gap: 18px;

    @include m576 {
        grid-template-columns: 150px 1fr;
    }
}

.depth__swatch {
    position: relative;
    min-height: 120px;
    border: 1px solid var(--ink-line);
}

.depth__near {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-end;
    width: 50%;
    height: 40%;
    padding: 4px 6px;
    border-top: 1px solid rgba(0, 0, 0, 0.3);
    border-left: 1px solid rgba(0, 0, 0, 0.3);

    small {
        color: #fff;
        font-family: $font_mono;
        font-size: 0.95rem;
        mix-blend-mode: difference;
    }
}

.depth__sliders {
    display: grid;
    gap: 10px;
}

.depth__slider {
    display: grid;
    grid-template-columns: 64px 1fr 3ch;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 1.15rem;

    input {
        accent-color: var(--track);
    }

    b {
        color: var(--cream);
        font-family: $font_mono;
        font-size: 1.3rem;
        text-align: end;
    }
}

.depth__code {
    padding: 10px 12px;
    background: var(--ink);
    border: 1px solid var(--ink-line);
    color: var(--cream);
    font-family: $font_mono;
    font-size: 1.35rem;
    overflow-x: auto;
    white-space: nowrap;
}
</style>
