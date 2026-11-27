<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="contrast">
            <div class="contrast__sample" :style="{ background: background, color: text }">
                <span class="contrast__large">Aa · {{ theme.name }}</span>
                <span class="contrast__small">The quick brown fox jumps over the lazy dog.</span>
                <span class="contrast__ratio">{{ ratio.toFixed(2) }}<small>:1</small></span>
            </div>

            <div class="contrast__grades">
                <div v-for="grade in grades" :key="grade.key" class="contrast__grade" :class="{ 'is-pass': grade.pass }">
                    <b>{{ grade.level }}</b>
                    <span>{{ grade.label }} · {{ grade.min }}:1</span>
                    <em>{{ grade.pass ? copy.pass : copy.fail }}</em>
                </div>
            </div>

            <div class="contrast__pickers">
                <div v-for="picker in pickers" :key="picker.key" class="contrast__picker">
                    <span class="contrast__picker-label">{{ picker.label }}</span>
                    <div class="contrast__swatches">
                        <button
                            v-for="option in options"
                            :key="option.key"
                            type="button"
                            class="hswatch"
                            :class="{ 'is-on': picker.model.value === option.key }"
                            :style="{ background: option.color }"
                            :aria-label="`${picker.label}: ${option.key} ${option.color}`"
                            :aria-pressed="picker.model.value === option.key"
                            @click="picker.model.value = option.key"
                        ><span>{{ option.short }}</span></button>
                    </div>
                </div>
            </div>

            <code class="contrast__formula">({{ lighter.toFixed(3) }} + 0.05) / ({{ darker.toFixed(3) }} + 0.05) = {{ ratio.toFixed(2) }}</code>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { HISTORY_THEMES, relativeLuminance, wcagContrast } from '~/utils/historyData';

const props = defineProps({
    copy: { type: Object, required: true },
    themeIndex: { type: Number, default: 0 },
});

const theme = computed(() => HISTORY_THEMES[props.themeIndex] ?? HISTORY_THEMES[0]);

const options = computed(() => [
    { key: 'bg', short: 'bg', color: theme.value.background },
    { key: 'fg', short: 'fg', color: theme.value.foreground },
    ...theme.value.colors.map((color, index) => ({ key: `c${index}`, short: String(index + 1).padStart(2, '0'), color })),
]);

const textKey = ref('c4');
const backgroundKey = ref('bg');

function colorOf(key) {
    return options.value.find((option) => option.key === key)?.color ?? theme.value.foreground;
}

const text = computed(() => colorOf(textKey.value));
const background = computed(() => colorOf(backgroundKey.value));
const ratio = computed(() => wcagContrast(text.value, background.value));
const lighter = computed(() => Math.max(relativeLuminance(text.value), relativeLuminance(background.value)));
const darker = computed(() => Math.min(relativeLuminance(text.value), relativeLuminance(background.value)));

const pickers = computed(() => [
    { key: 'text', label: props.copy.text, model: textKey },
    { key: 'background', label: props.copy.background, model: backgroundKey },
]);

const grades = computed(() => [
    { key: 'aa', level: 'AA', label: props.copy.normalText, min: 4.5, pass: ratio.value >= 4.5 },
    { key: 'aaa', level: 'AAA', label: props.copy.normalText, min: 7, pass: ratio.value >= 7 },
    { key: 'aa-large', level: 'AA', label: props.copy.largeText, min: 3, pass: ratio.value >= 3 },
]);
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;
@use './swatches' as *;

.contrast {
    display: grid;
    gap: 16px;
}

.contrast__sample {
    position: relative;
    display: grid;
    gap: 8px;
    min-height: 150px;
    padding: 22px;
    transition: background-color 0.4s ease, color 0.4s ease;
}

.contrast__large {
    font-size: 3.2rem;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.02em;
}

.contrast__small {
    max-width: 70%;
    font-size: 1.4rem;
}

.contrast__ratio {
    position: absolute;
    right: 18px;
    bottom: 12px;
    font-family: $font_display;
    font-size: 4.8rem;
    font-weight: 100;
    line-height: 1;

    small {
        font-size: 2rem;
    }
}

.contrast__grades {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}

.contrast__grade {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border: 1px solid rgba(231, 76, 60, 0.45);
    color: var(--muted);
    font-size: 1.1rem;

    b {
        color: var(--gogh-red);
        font-size: 1.8rem;
    }

    em {
        color: var(--gogh-red);
        font-style: normal;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    &.is-pass {
        border-color: rgba(46, 204, 113, 0.5);

        b,
        em {
            color: var(--gogh-green);
        }
    }
}

.contrast__pickers {
    display: grid;
    gap: 10px;
}

.contrast__picker-label {
    display: block;
    margin-bottom: 6px;
    color: var(--muted);
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.contrast__swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .hswatch {
        width: 32px;
        height: 32px;
        font-size: 0.85rem;

        @media (pointer: coarse) {
            width: 40px;
            height: 40px;
        }
    }
}

.contrast__formula {
    padding: 10px 12px;
    border: 1px solid var(--ink-line);
    background: var(--ink);
    color: var(--cream);
    font-family: $font_mono;
    font-size: 1.25rem;
    overflow-x: auto;
    white-space: nowrap;
}
</style>
