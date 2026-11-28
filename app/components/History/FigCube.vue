<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="cube">
            <div class="cube__palette" @pointerleave="hover = null">
                <p class="cube__block-title">0–15 · {{ copy.system }}</p>
                <div class="cube__system">
                    <span
                        v-for="entry in system"
                        :key="entry.index"
                        class="cube__cell"
                        :class="{ 'is-active': entry.index === current.index }"
                        :style="{ background: entry.hex }"
                        @pointerenter="hover = entry.index"
                        @click="selected = entry.index"
                    ></span>
                </div>

                <p class="cube__block-title">16–231 · {{ copy.cube }}</p>
                <div class="cube__slabs">
                    <div v-for="r in 6" :key="r" class="cube__slab">
                        <span
                            v-for="entry in slab(r - 1)"
                            :key="entry.index"
                            class="cube__cell"
                            :class="{ 'is-active': entry.index === current.index }"
                            :style="{ background: entry.hex }"
                            @pointerenter="hover = entry.index"
                            @click="selected = entry.index"
                        ></span>
                    </div>
                </div>

                <p class="cube__block-title">232–255 · {{ copy.gray }}</p>
                <div class="cube__gray">
                    <span
                        v-for="entry in gray"
                        :key="entry.index"
                        class="cube__cell"
                        :class="{ 'is-active': entry.index === current.index }"
                        :style="{ background: entry.hex }"
                        @pointerenter="hover = entry.index"
                        @click="selected = entry.index"
                    ></span>
                </div>
            </div>

            <div class="cube__detail" aria-live="polite">
                <span class="cube__swatch" :style="{ background: current.hex }"></span>
                <label class="cube__index">
                    <span>{{ copy.index }}</span>
                    <input v-model.number="selected" type="range" min="0" max="255" :aria-label="copy.index" @input="hover = null">
                    <b>{{ current.index }}</b>
                </label>
                <dl class="cube__facts">
                    <div><dt>hex</dt><dd>{{ current.hex }}</dd></div>
                    <div><dt>rgb</dt><dd>{{ rgb }}</dd></div>
                    <div><dt>{{ copy.formula }}</dt><dd class="cube__formula">{{ formula }}</dd></div>
                    <div><dt>SGR</dt><dd>ESC[38;5;{{ current.index }}m</dd></div>
                </dl>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { CUBE_LEVELS, hexToRgb, xterm256 } from '~/utils/historyData';

const props = defineProps({ copy: { type: Object, required: true } });

const ENTRIES = xterm256();
const system = ENTRIES.slice(0, 16);
const gray = ENTRIES.slice(232);

// One 6×6 slab per red level: rows are green, columns blue.
function slab(r) {
    return ENTRIES.slice(16 + 36 * r, 16 + 36 * (r + 1));
}

const selected = ref(208);
const hover = ref(null);
const current = computed(() => ENTRIES[hover.value ?? selected.value] ?? ENTRIES[0]);
const rgb = computed(() => hexToRgb(current.value.hex).join(', '));

const formula = computed(() => {
    const entry = current.value;
    if (entry.block === 'cube') {
        return `16 + 36×${entry.r} + 6×${entry.g} + ${entry.b}\n→ (${CUBE_LEVELS[entry.r]}, ${CUBE_LEVELS[entry.g]}, ${CUBE_LEVELS[entry.b]})`;
    }
    if (entry.block === 'gray') {
        return `8 + 10×${entry.step} = ${8 + 10 * entry.step}`;
    }
    return props.copy.system;
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.cube {
    display: grid;
    gap: 22px;

    @include m992 {
        grid-template-columns: 1fr 230px;
    }
}

.cube__block-title.cube__block-title {
    margin: 0 0 6px;
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.05rem;
    letter-spacing: 0.06em;

    &:not(:first-child) {
        margin-top: 14px;
    }
}

.cube__system {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 2px;
}

.cube__slabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;

    @include m576 {
        grid-template-columns: repeat(6, 1fr);
        gap: 6px;
    }
}

.cube__slab {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 2px;
}

.cube__gray {
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    gap: 2px;
}

.cube__cell {
    aspect-ratio: 1;
    cursor: crosshair;
    transition: transform 0.3s $ease_out_expo, box-shadow 0.2s ease;

    &.is-active {
        position: relative;
        z-index: 1;
        box-shadow: 0 0 0 2px var(--ink-2), 0 0 0 3px var(--cream);
        transform: scale(1.35);
    }
}

.cube__detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.cube__swatch {
    height: 110px;
    border: 1px solid var(--ink-line);
    transition: background-color 0.2s ease;

    @include m992 {
        height: 140px;
    }
}

.cube__index {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    input {
        accent-color: var(--accent, var(--gogh-blue));
    }

    b {
        min-width: 3ch;
        color: var(--cream);
        font-family: $font_mono;
        font-size: 1.8rem;
        text-align: end;
    }
}

.cube__facts {
    display: grid;
    gap: 8px;
    margin: 0;

    dt {
        color: var(--muted);
        font-size: 1rem;
        font-weight: 400;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }

    dd {
        margin: 0;
        color: var(--cream);
        font-family: $font_mono;
        font-size: 1.3rem;
        word-break: break-word;
    }
}

// Always two lines tall, so hovering between blocks never changes the figure's height.
.cube__formula {
    min-height: 3em;
    line-height: 1.5;
    white-space: pre-line;
}
</style>
