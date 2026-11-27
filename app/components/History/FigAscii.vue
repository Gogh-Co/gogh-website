<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="ascii">
            <ol class="ascii__grid" :aria-label="copy.label">
                <li
                    v-for="(name, code) in ASCII_CONTROLS"
                    :key="name"
                    class="ascii__cell"
                    :class="{ 'is-esc': code === 27, 'is-active': code === active }"
                    @pointerenter="active = code"
                    @pointerleave="active = 27"
                >
                    <span class="ascii__code">{{ code }}</span>
                    <span class="ascii__name">{{ name }}</span>
                </li>
            </ol>

            <div class="ascii__detail" aria-live="polite">
                <span class="ascii__big">{{ ASCII_CONTROLS[active] }}</span>
                <dl class="ascii__forms">
                    <div><dt>dec</dt><dd>{{ active }}</dd></div>
                    <div><dt>hex</dt><dd>0x{{ active.toString(16).toUpperCase().padStart(2, '0') }}</dd></div>
                    <div><dt>oct</dt><dd>\{{ active.toString(8).padStart(3, '0') }}</dd></div>
                    <div><dt>ctrl</dt><dd>^{{ String.fromCharCode(64 + active) }}</dd></div>
                    <div v-if="active === 27"><dt>shell</dt><dd>\e</dd></div>
                </dl>
                <span v-if="active === 27" class="ascii__tag">{{ copy.highlight }}</span>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { ASCII_CONTROLS } from '~/utils/historyData';

defineProps({ copy: { type: Object, required: true } });

const active = ref(27);
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.ascii {
    display: grid;
    gap: 20px;

    @include m576 {
        grid-template-columns: 1fr auto;
        align-items: stretch;
    }
}

.ascii__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.ascii__cell {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    min-height: 52px;
    margin: 0;
    padding: 6px;
    border: 1px solid var(--ink-line);
    background: var(--ink);
    font-family: $font_mono;
    cursor: default;
    transition: background-color 0.25s ease, border-color 0.25s ease, transform 0.4s $ease_out_expo;

    &.is-active {
        border-color: rgba(255, 255, 255, 0.4);
        background: var(--ink-3);
        transform: translateY(-2px);
    }

    &.is-esc {
        border-color: var(--gogh-yellow);
        background: color-mix(in srgb, var(--gogh-yellow) 16%, var(--ink));
        color: var(--gogh-yellow);
        animation: esc-pulse 2.4s ease-in-out infinite;
    }
}

.ascii__code {
    color: var(--muted);
    font-size: 0.95rem;

    .is-esc & {
        color: inherit;
    }
}

.ascii__name {
    font-size: 1.15rem;
    font-weight: 500;

    @include m768 {
        font-size: 1.3rem;
    }
}

.ascii__detail {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    min-width: 170px;
    padding: 18px;
    border: 1px solid var(--ink-line);
    background: var(--ink);
}

.ascii__big {
    font-family: $font_mono;
    font-size: 4.4rem;
    font-weight: 700;
    line-height: 1;
    color: var(--cream);
}

.ascii__forms {
    display: grid;
    gap: 6px;
    margin: 0;

    div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
    }

    dt {
        color: var(--muted);
        font-size: 1.1rem;
        font-weight: 400;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    dd {
        margin: 0;
        font-family: $font_mono;
        font-size: 1.35rem;
    }
}

.ascii__tag {
    align-self: flex-start;
    padding: 4px 8px;
    background: var(--gogh-yellow);
    color: var(--ink);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

@keyframes esc-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(241, 196, 15, 0); }
    50% { box-shadow: 0 0 22px 0 rgba(241, 196, 15, 0.35); }
}
</style>
