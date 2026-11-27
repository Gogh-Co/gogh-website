<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption" flush>
        <div class="ansi-table" role="table" :aria-label="copy.label">
            <div class="ansi-table__row ansi-table__row--head" role="row">
                <span class="ansi-table__system" role="columnheader">{{ copy.system }}</span>
                <span v-for="(name, index) in copy.names" :key="name" class="ansi-table__head" role="columnheader">
                    <b>{{ 30 + index }}</b>
                    <span class="ansi-table__name">{{ name }}</span>
                    <span class="ansi-table__bits" :title="copy.bits">{{ index.toString(2).padStart(3, '0') }}</span>
                </span>
            </div>

            <div
                v-for="(palette, row) in SYSTEM_PALETTES"
                :key="palette.name"
                class="ansi-table__row"
                role="row"
                :style="{ '--row': row }"
            >
                <span class="ansi-table__system" role="rowheader">
                    {{ palette.name }}
                    <small>{{ palette.year }}</small>
                </span>
                <span
                    v-for="column in 8"
                    :key="column"
                    class="ansi-table__cell"
                    role="cell"
                    :title="`${palette.colors[column - 1]} / ${palette.colors[column + 7]}`"
                    :aria-label="`${copy.names[column - 1]}: ${palette.colors[column - 1]}, ${palette.colors[column + 7]}`"
                >
                    <i :style="{ background: palette.colors[column - 1] }"></i>
                    <i :style="{ background: palette.colors[column + 7] }"></i>
                    <code>{{ palette.colors[column - 1] }}</code>
                </span>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { SYSTEM_PALETTES } from '~/utils/historyData';

defineProps({ copy: { type: Object, required: true } });
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.ansi-table {
    display: grid;
    overflow-x: auto;
    padding: 8px;
    scrollbar-width: thin;
}

.ansi-table__row {
    display: grid;
    grid-template-columns: minmax(120px, 1.3fr) repeat(8, minmax(52px, 1fr));
    gap: 4px;
    min-width: 600px;
    padding: 2px 0;

    &--head {
        position: sticky;
        top: 0;
        padding-bottom: 8px;
    }
}

.ansi-table__system {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 0 10px;
    color: var(--cream);
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.2;

    small {
        color: var(--muted);
        font-size: 1.05rem;
        font-weight: 400;
    }

    .ansi-table__row--head & {
        color: var(--muted);
        font-size: 1.05rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }
}

.ansi-table__head {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 4px 2px;
    text-align: center;

    b {
        font-family: $font_mono;
        font-size: 1.4rem;
        color: var(--cream);
    }
}

.ansi-table__name {
    overflow: hidden;
    color: var(--muted);
    font-size: 1.05rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ansi-table__bits {
    color: color-mix(in srgb, var(--cream) 40%, transparent);
    font-family: $font_mono;
    font-size: 1rem;
    letter-spacing: 0.1em;
}

.ansi-table__cell {
    position: relative;
    display: grid;
    grid-template-rows: 2fr 1fr;
    height: 58px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: transform 0.4s $ease_out_expo;

    i {
        display: block;
    }

    code {
        position: absolute;
        inset: auto 0 0;
        padding: 2px 4px;
        background: rgba(0, 0, 0, 0.72);
        color: var(--cream);
        font-family: $font_mono;
        font-size: 0.95rem;
        opacity: 0;
        transform: translateY(100%);
        transition: opacity 0.25s ease, transform 0.35s $ease_out_expo;
    }

    &:hover {
        z-index: 1;
        transform: scale(1.12);

        code {
            opacity: 1;
            transform: none;
        }
    }
}
</style>
