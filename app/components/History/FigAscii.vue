<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="ascii">
            <ol class="ascii__grid" :aria-label="copy.label" @pointerleave="hover = null">
                <li
                    v-for="(name, code) in ASCII_CONTROLS"
                    :key="name"
                >
                    <button
                        type="button"
                        class="ascii__cell"
                        :class="{ 'is-esc': code === 27, 'is-active': code === active }"
                        :aria-label="`${name} · ${code}`"
                        :aria-pressed="selected === code"
                        @pointerenter="hover = code"
                        @focus="selected = code"
                        @click="selected = code"
                    >
                        <span class="ascii__code">{{ code }}</span>
                        <span class="ascii__name">{{ name }}</span>
                    </button>
                </li>
            </ol>

            <div class="ascii__detail" aria-live="polite">
                <span class="ascii__big">{{ ASCII_CONTROLS[active] }}</span>
                <dl class="ascii__forms">
                    <div><dt>dec</dt><dd>{{ active }}</dd></div>
                    <div><dt>hex</dt><dd>0x{{ active.toString(16).toUpperCase().padStart(2, '0') }}</dd></div>
                    <div><dt>oct</dt><dd>\{{ active.toString(8).padStart(3, '0') }}</dd></div>
                    <div><dt>ctrl</dt><dd>^{{ String.fromCharCode(64 + active) }}</dd></div>
                    <!-- rows stay mounted so the panel never changes size on hover -->
                    <div><dt>shell</dt><dd>{{ active === 27 ? '\\e' : '—' }}</dd></div>
                </dl>
                <span class="ascii__tag" :class="{ 'is-hidden': active !== 27 }">{{ copy.highlight }}</span>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { ASCII_CONTROLS } from '~/utils/historyData';

defineProps({ copy: { type: Object, required: true } });

const selected = ref(27);
const hover = ref(null);
const active = computed(() => hover.value ?? selected.value);
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.ascii {
    display: grid;
    gap: 20px;

    @include m576 {
        grid-template-columns: minmax(0, 1fr) 190px;
        align-items: stretch;
    }
}

.ascii__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;

    li { min-width: 0; margin: 0; }

    @include m576 { grid-template-columns: repeat(8, minmax(0, 1fr)); }
}

.ascii__cell {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    height: 100%;
    min-height: 52px;
    margin: 0;
    padding: 6px;
    border: 1px solid var(--ink-line);
    background: var(--ink);
    font-family: $font_mono;
    color: var(--cream);
    text-align: start;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;

    &.is-esc { color: var(--gogh-yellow); }

    &.is-active {
        border-color: var(--cream);
        background: var(--ink-3);
    }

    &.is-esc.is-active {
        border-color: var(--gogh-yellow);
        background: var(--gogh-yellow);
        color: var(--ink);
    }

    &:focus-visible { outline: 2px solid var(--gogh-yellow); outline-offset: 2px; }
}

.ascii__code {
    color: var(--muted);
    font-size: 0.95rem;

    .is-esc & { color: inherit; opacity: 0.7; }
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

    &.is-hidden { visibility: hidden; }
}

@media (prefers-reduced-motion: reduce) {
    .ascii__cell { transition: none; }
}
</style>
