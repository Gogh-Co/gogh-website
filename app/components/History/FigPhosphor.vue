<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="crt-demo">
            <div class="crt" :style="{ '--phosphor': PHOSPHORS[phosphor].color, '--phosphor-dim': PHOSPHORS[phosphor].dim }">
                <div class="crt__bezel">
                    <span>VT100 / 1978</span>
                    <span class="crt__status"><i aria-hidden="true"></i><output aria-live="polite">{{ copy[phosphor] }}</output></span>
                </div>
                <div class="crt__glass">
                    <pre class="crt__text" aria-hidden="true"><span class="dim">VT100 READY</span>
<span>$ ls -l</span>
<span>total 3</span>
<span>-rw-r--r--  1 ken  512 README</span>
<span>drwxr-xr-x  2 ken   64 src</span>
<span>$ </span><span class="sample" :class="attributeClasses">*** DISK FULL ***</span><span class="cursor">█</span></pre>
                </div>
            </div>

            <div class="crt-controls">
                <div class="crt-controls__group" role="radiogroup" :aria-label="copy.phosphor">
                    <span class="crt-controls__label">{{ copy.phosphor }}</span>
                    <button
                        v-for="(item, key) in PHOSPHORS"
                        :key="key"
                        type="button"
                        role="radio"
                        class="hchip"
                        :class="{ 'is-on': phosphor === key }"
                        :aria-checked="phosphor === key"
                        :tabindex="phosphor === key ? 0 : -1"
                        @click="phosphor = key"
                        @keydown="movePhosphor($event, key)"
                    >
                        <i :style="{ background: item.color }"></i>{{ copy[key] }}
                    </button>
                </div>
                <div class="crt-controls__group">
                    <span class="crt-controls__label">{{ copy.attributes }}</span>
                    <button
                        v-for="name in ATTRIBUTES"
                        :key="name"
                        type="button"
                        class="hchip"
                        :class="{ 'is-on': attributes[name] }"
                        :aria-pressed="attributes[name]"
                        @click="attributes[name] = !attributes[name]"
                    >
                        {{ copy[name] }}
                    </button>
                </div>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';

defineProps({ copy: { type: Object, required: true } });

// Approximate emission colors of the classic monochrome phosphors.
const PHOSPHORS = {
    p1: { color: '#33ff66', dim: '#0f5f25' },
    p3: { color: '#ffb000', dim: '#6a4600' },
    p4: { color: '#e8f0ff', dim: '#5a6270' },
};
const ATTRIBUTES = ['bold', 'underline', 'blink', 'reverse'];

const phosphor = ref('p1');
const attributes = reactive({ bold: true, underline: false, blink: false, reverse: true });
const attributeClasses = computed(() => ATTRIBUTES.filter((name) => attributes[name]).map((name) => `is-${name}`));

function movePhosphor(event, key) {
    const keys = Object.keys(PHOSPHORS);
    const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (offset === undefined && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (keys.indexOf(key) + offset + keys.length) % keys.length;
    phosphor.value = keys[index];
    event.currentTarget.parentElement.querySelectorAll('[role="radio"]')[index].focus();
}
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;
@use './chips' as *;

.crt-demo {
    display: grid;
    gap: 28px;
}

.crt {
    padding: 18px;
    border: 1px solid #ffffff16;
    border-radius: 14px;
    background: linear-gradient(145deg, #22292a, #101617);
    box-shadow: inset 0 1px 0 #ffffff0a, 0 32px 64px -40px #000;
}

.crt__bezel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 4px 16px;
    color: var(--muted);
    font: 1.1rem $font_mono;
    letter-spacing: .06em;
}

.crt__status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--phosphor);
    i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
}

.crt__glass {
    position: relative;
    overflow: hidden;
    padding: 22px 24px;
    border-radius: 8px;
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--phosphor) 10%, #050806), #020302 80%);
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.9), inset 0 0 6px color-mix(in srgb, var(--phosphor) 40%, transparent);
    transition: background 0.6s ease;

    // Scanlines and a slow refresh band.
    &::before,
    &::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    &::before {
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
    }

    &::after {
        background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--phosphor) 10%, transparent), transparent);
        height: 30%;
        animation: refresh 5s linear infinite;
    }
}

.crt__text {
    position: relative;
    z-index: 1;
    margin: 0;
    overflow: hidden;
    color: var(--phosphor);
    font-family: $font_mono;
    font-size: 1.3rem;
    line-height: 1.6;
    white-space: pre;
    text-shadow: 0 0 6px var(--phosphor), 0 0 18px color-mix(in srgb, var(--phosphor) 50%, transparent);
    transition: color 0.6s ease, text-shadow 0.6s ease;

    @include m768 {
        font-size: 1.5rem;
    }

    span {
        display: inline;
    }

    .dim {
        color: var(--phosphor-dim);
        text-shadow: none;
    }
}

.sample {
    &.is-bold {
        font-weight: 700;
        filter: brightness(1.35);
    }

    &.is-underline {
        text-decoration: underline;
        text-underline-offset: 4px;
    }

    &.is-blink {
        animation: blink 1s steps(1) infinite;
    }

    &.is-reverse {
        background: var(--phosphor);
        color: #020302;
        text-shadow: none;
        box-shadow: 0 0 14px color-mix(in srgb, var(--phosphor) 60%, transparent);
    }
}

.cursor {
    animation: blink 1.1s steps(1) infinite;
}

.crt-controls {
    display: grid;
    gap: 12px;
}

.crt-controls__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;

    .hchip { font-size: 1.3rem; }
}

.crt-controls__label {
    min-width: 92px;
    color: var(--muted);
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

@keyframes blink {
    50% { opacity: 0; }
}

@keyframes refresh {
    from { transform: translateY(-100%); }
    to { transform: translateY(400%); }
}

@media (prefers-reduced-motion: reduce) {
    .crt__glass::after, .cursor, .sample.is-blink { animation: none; }
    .crt__glass, .crt__text { transition: none; }
}
</style>
