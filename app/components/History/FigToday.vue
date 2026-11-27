<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption" flush>
        <ol class="seqs">
            <li v-for="(item, index) in SEQUENCES" :key="item.code" class="seqs__item">
                <code class="seqs__code">{{ item.code }}</code>
                <span class="seqs__preview" :class="item.className" :style="item.style">{{ item.sample }}</span>
                <span class="seqs__text">{{ copy.items[index] }}</span>
            </li>
        </ol>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';

defineProps({ copy: { type: Object, required: true } });

// In the order the vocabulary grew. Samples stay in English, like terminal output.
const SEQUENCES = [
    { code: 'ESC[7m', sample: ' READY ', className: 'is-reverse' },
    { code: 'ESC[31m', sample: 'error', style: { color: '#cd0000' } },
    { code: 'ESC[91m', sample: 'error', style: { color: '#ff5555' } },
    { code: 'ESC[38;5;208m', sample: 'warning', style: { color: '#ff8700' } },
    { code: 'ESC[38;2;255;121;198m', sample: 'pink', style: { color: '#ff79c6' } },
    { code: 'ESC[4:3m', sample: 'teh', className: 'is-curly' },
    { code: 'ESC[4;58;2;46;204;113m', sample: 'linked', className: 'is-colored-underline' },
    { code: 'ESC]11;?ESC\\', sample: 'rgb:0d0d/1919/2626', className: 'is-reply' },
];
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.seqs {
    margin: 0;
    padding: 0;
    list-style: none;
}

.seqs__item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 6px 16px;
    align-items: center;
    margin: 0;
    padding: 14px 20px;
    border-bottom: 1px solid var(--ink-line);
    transition: background-color 0.3s ease;

    &:last-child {
        border-bottom: 0;
    }

    &:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    @include m768 {
        grid-template-columns: minmax(200px, 1fr) 160px 1.2fr;
    }
}

.seqs__code {
    color: var(--cream);
    font-family: $font_mono;
    font-size: 1.3rem;
    overflow-x: auto;
    white-space: nowrap;
}

.seqs__preview {
    justify-self: start;
    color: #ecf0f1;
    font-family: $font_mono;
    font-size: 1.4rem;

    &.is-reverse {
        background: #ecf0f1;
        color: #0d1926;
    }

    &.is-curly {
        text-decoration: underline wavy #e74c3c;
        text-underline-offset: 4px;
    }

    &.is-colored-underline {
        text-decoration: underline 2px #2ecc71;
        text-underline-offset: 4px;
    }

    &.is-reply {
        color: var(--muted);
        font-size: 1.1rem;
    }
}

.seqs__text {
    grid-column: 1 / -1;
    color: var(--muted);
    font-size: 1.3rem;

    @include m768 {
        grid-column: auto;
    }
}
</style>
