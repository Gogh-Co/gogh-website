<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="bright">
            <div class="bright__screen" :style="{ background: THEME.background, color: THEME.foreground }">
                <div v-for="row in rows" :key="row.key" class="bright__row">
                    <span class="bright__label">{{ row.label }}</span>
                    <span class="bright__words">
                        <span
                            v-for="(name, index) in names"
                            :key="name"
                            class="bright__word"
                            :style="{ color: row.colors[index], fontWeight: row.bold ? 700 : 400 }"
                        >{{ name }}</span>
                    </span>
                </div>
            </div>

            <label class="bright__toggle">
                <input v-model="boldIsBright" type="checkbox">
                <span class="bright__switch" aria-hidden="true"></span>
                {{ copy.boldBright }}
            </label>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { HISTORY_THEMES } from '~/utils/historyData';

const props = defineProps({
    copy: { type: Object, required: true },
    names: { type: Array, required: true },
});

const THEME = HISTORY_THEMES[0];
const NORMAL = THEME.colors.slice(0, 8);
const BRIGHT = THEME.colors.slice(8, 16);
// Black on this dark background would vanish: show it as the foreground does.
const VISIBLE_NORMAL = [THEME.colors[8], ...NORMAL.slice(1)];

const boldIsBright = ref(true);

const rows = computed(() => [
    { key: 'normal', label: props.copy.normal, colors: VISIBLE_NORMAL, bold: false },
    { key: 'bright', label: props.copy.bright, colors: BRIGHT, bold: false },
    { key: 'bold', label: props.copy.bold, colors: boldIsBright.value ? BRIGHT : VISIBLE_NORMAL, bold: true },
]);
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.bright {
    display: grid;
    gap: 18px;
}

.bright__screen {
    display: grid;
    gap: 14px;
    padding: 20px;
    font-family: $font_mono;
}

.bright__row {
    display: grid;
    gap: 6px;

    @include m768 {
        grid-template-columns: 130px 1fr;
        align-items: baseline;
    }
}

.bright__label {
    color: rgba(236, 240, 241, 0.5);
    font-size: 1.1rem;
}

.bright__words {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 1.45rem;
}

.bright__word {
    transition: color 0.4s ease;
}

.bright__toggle {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: var(--cream);
    font-size: 1.3rem;
    cursor: pointer;

    input {
        position: absolute;
        opacity: 0;
    }

    input:focus-visible + .bright__switch {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 3px;
    }

    input:checked + .bright__switch {
        background: var(--gogh-green);

        &::after {
            transform: translateX(18px);
        }
    }
}

.bright__switch {
    position: relative;
    width: 40px;
    height: 22px;
    background: var(--ink-3);
    border: 1px solid var(--ink-line);
    transition: background-color 0.3s ease;

    &::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background: var(--cream);
        transition: transform 0.35s $ease_out_expo;
    }
}
</style>
