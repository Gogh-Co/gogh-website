<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <ol class="flow">
            <li v-for="(step, index) in copy.steps" :key="index" class="flow__step" :style="{ '--c': STEP_COLORS[index] }">
                <span class="flow__num">{{ index + 1 }}</span>
                <div class="flow__body">
                    <p class="flow__text">{{ step }}</p>
                    <code class="flow__code">{{ CODES[index] }}</code>
                </div>
            </li>
            <li class="flow__step flow__step--result">
                <span class="flow__num">✓</span>
                <div class="flow__body">
                    <p class="flow__text">{{ copy.result }}</p>
                    <code class="flow__code"><span class="r">ESC[31m</span>error<span class="z">ESC[0m</span>: <span class="y">ESC[33m</span>disk almost full<span class="z">ESC[0m</span></code>
                </div>
            </li>
        </ol>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';

defineProps({ copy: { type: Object, required: true } });

const CODES = [
    '[ -t 1 ]',
    '[ -z "${NO_COLOR-}" ]',
    'tput colors        # 8, 16, 256…',
    '[ "$COLORTERM" = truecolor ] || [ "$COLORTERM" = 24bit ]',
];
const STEP_COLORS = ['#3498db', '#e74c3c', '#f1c40f', '#9b59b6'];
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.flow {
    position: relative;
    display: grid;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;

    // The thread joining the steps.
    &::before {
        content: '';
        position: absolute;
        top: 18px;
        bottom: 18px;
        left: 17px;
        width: 1px;
        background: linear-gradient(180deg, #3498db, #e74c3c, #f1c40f, #9b59b6, #2ecc71);
        opacity: 0.6;
    }
}

.flow__step {
    position: relative;
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 14px;
    margin: 0;

    &--result {
        --c: #2ecc71;
    }
}

.flow__num {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--c);
    background: var(--ink-2);
    color: var(--c);
    font-family: $font_mono;
    font-size: 1.4rem;
    font-weight: 700;
}

.flow__body {
    display: grid;
    min-width: 0;
    gap: 8px;
    padding-top: 6px;
}

.flow__text.flow__text {
    margin: 0;
    color: var(--cream);
    font-size: 1.45rem;
    line-height: 1.4;
}

.flow__code {
    padding: 8px 10px;
    border-inline-start: 2px solid var(--c);
    background: var(--ink);
    color: var(--cream);
    font-family: $font_mono;
    font-size: 1.25rem;
    overflow-x: auto;
    white-space: nowrap;

    .r { color: #e74c3c; }
    .y { color: #f1c40f; }
    .z { color: var(--muted); }
}
</style>
