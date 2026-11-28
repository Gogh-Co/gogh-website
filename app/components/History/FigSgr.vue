<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption">
        <div class="sgr">
            <div class="sgr__anatomy" aria-hidden="true">
                <span class="sgr__part sgr__part--esc"><code>ESC</code><small>{{ copy.parts.esc }}</small></span>
                <span class="sgr__part sgr__part--csi"><code>[</code><small>{{ copy.parts.csi }}</small></span>
                <span class="sgr__part sgr__part--params">
                    <code><template v-for="(param, index) in params" :key="index"><b>{{ param }}</b><i v-if="index < params.length - 1">;</i></template></code>
                    <small>{{ copy.parts.params }}</small>
                </span>
                <span class="sgr__part sgr__part--final"><code>m</code><small>{{ copy.parts.final }}</small></span>
            </div>

            <div class="sgr__screen" :style="{ background: THEME.background, color: THEME.foreground }">
                <span class="sgr__sample" :style="sampleStyle">{{ copy.sample }}</span>
            </div>

            <div class="sgr__command">
                <div class="sgr__shells" role="group" aria-label="Shell">
                    <button
                        v-for="item in SHELLS"
                        :key="item"
                        type="button"
                        class="hchip"
                        :class="{ 'is-on': shell === item }"
                        :aria-pressed="shell === item"
                        @click="shell = item"
                    >{{ item }}</button>
                </div>
                <div class="sgr__line">
                    <code>{{ command }}</code>
                    <button type="button" class="hchip" @click="copyCommand">{{ copied ? ui.copied : ui.copy }}</button>
                </div>
            </div>

            <div class="sgr__controls">
                <div class="sgr__group">
                    <span class="sgr__label">{{ copy.style }}</span>
                    <button
                        v-for="item in STYLES"
                        :key="item.code"
                        type="button"
                        class="hchip"
                        :class="{ 'is-on': styles[item.key] }"
                        :aria-pressed="styles[item.key]"
                        @click="styles[item.key] = !styles[item.key]"
                    >
                        {{ copy[item.key] }} <small>{{ item.code }}</small>
                    </button>
                </div>
                <div class="sgr__group">
                    <span class="sgr__label">{{ copy.foreground }}</span>
                    <button type="button" class="hswatch hswatch--none" :class="{ 'is-on': fg === null }" :aria-label="copy.none" :aria-pressed="fg === null" @click="fg = null">∅</button>
                    <button
                        v-for="(color, index) in NORMAL"
                        :key="color"
                        type="button"
                        class="hswatch"
                        :class="{ 'is-on': fg === index }"
                        :style="{ background: color }"
                        :aria-label="`${30 + index}`"
                        :aria-pressed="fg === index"
                        @click="fg = index"
                    ><span>{{ 30 + index }}</span></button>
                </div>
                <div class="sgr__group">
                    <span class="sgr__label">{{ copy.background }}</span>
                    <button type="button" class="hswatch hswatch--none" :class="{ 'is-on': bg === null }" :aria-label="copy.none" :aria-pressed="bg === null" @click="bg = null">∅</button>
                    <button
                        v-for="(color, index) in NORMAL"
                        :key="color"
                        type="button"
                        class="hswatch"
                        :class="{ 'is-on': bg === index }"
                        :style="{ background: color }"
                        :aria-label="`${40 + index}`"
                        :aria-pressed="bg === index"
                        @click="bg = index"
                    ><span>{{ 40 + index }}</span></button>
                </div>
            </div>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { HISTORY_THEMES } from '~/utils/historyData';

const props = defineProps({
    copy: { type: Object, required: true },
    ui: { type: Object, required: true },
});

const THEME = HISTORY_THEMES[0];
const NORMAL = THEME.colors.slice(0, 8);
const BRIGHT = THEME.colors.slice(8, 16);

const STYLES = [
    { key: 'bold', code: 1 },
    { key: 'italic', code: 3 },
    { key: 'underline', code: 4 },
    { key: 'reverse', code: 7 },
];

const styles = reactive({ bold: true, italic: false, underline: false, reverse: false });
const fg = ref(1);
const bg = ref(null);
const copied = ref(false);

// printf is portable; bash's echo needs -e, zsh's echo reads escapes by default.
const SHELLS = ['printf', 'bash', 'zsh'];
const shell = ref('printf');

const params = computed(() => {
    const list = STYLES.filter((item) => styles[item.key]).map((item) => item.code);
    if (fg.value !== null) list.push(30 + fg.value);
    if (bg.value !== null) list.push(40 + bg.value);
    return list.length ? list : [0];
});

const sampleStyle = computed(() => {
    // Bold also brightens, as most terminals still do for the first 8 colors.
    let color = fg.value === null ? THEME.foreground : (styles.bold ? BRIGHT : NORMAL)[fg.value];
    let background = bg.value === null ? 'transparent' : NORMAL[bg.value];
    if (styles.reverse) {
        [color, background] = [background === 'transparent' ? THEME.background : background, color];
    }
    return {
        color,
        background,
        fontWeight: styles.bold ? 700 : 400,
        fontStyle: styles.italic ? 'italic' : 'normal',
        textDecoration: styles.underline ? 'underline' : 'none',
    };
});

// Single quotes in the sample are closed, escaped and reopened for the shell.
const command = computed(() => {
    const text = props.copy.sample.replace(/'/g, "'\\''");
    const seq = params.value.join(';');
    if (shell.value === 'bash') return `echo -e '\\e[${seq}m${text}\\e[0m'`;
    if (shell.value === 'zsh') return `echo '\\e[${seq}m${text}\\e[0m'`;
    return `printf '\\e[${seq}m${text.replace(/%/g, '%%')}\\e[0m\\n'`;
});

async function copyCommand() {
    try {
        await navigator.clipboard.writeText(command.value);
        copied.value = true;
        setTimeout(() => (copied.value = false), 1400);
    } catch {
        // Clipboard blocked: nothing to do, the command is on screen.
    }
}
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;
@use './chips' as *;
@use './swatches' as *;

.sgr {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    gap: 24px;

    > * { min-width: 0; }
}

.sgr__anatomy {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    @include m768 { gap: 12px; }
}

.sgr__part {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 64px;
    padding: 12px 14px 10px;
    border-top: 1px solid color-mix(in srgb, var(--part) 60%, transparent);
    background: color-mix(in srgb, var(--part) 5%, var(--ink));

    @include m768 { padding: 22px 24px 18px; min-width: 120px; }

    code {
        color: var(--part);
        font-family: $font_mono;
        font-size: clamp(2.6rem, 4vw, 4.8rem);
        font-weight: 400;
        line-height: 1;

        i {
            color: var(--muted);
            font-style: normal;
        }

        b {
            display: inline-block;
            animation: param-in 0.5s $ease_out_expo;
        }
    }

    small {
        max-width: 140px;
        color: var(--muted);
        font-size: 1.2rem;
        line-height: 1.5;
        letter-spacing: 0.04em;
    }

    &--esc { --part: #e74c3c; }
    &--csi { --part: #f1c40f; }
    &--params { --part: #2ecc71; flex: 1; }
    &--final { --part: #3498db; }
}

.sgr__screen {
    display: flex;
    align-items: center;
    min-height: 120px;
    padding: 20px 24px;
    font-family: $font_mono;
    font-size: 2.2rem;

    @include m768 {
        min-height: 160px;
        font-size: 3.6rem;
    }
}

.sgr__sample {
    padding: 0 4px;
    transition: color 0.3s ease, background-color 0.3s ease;
}

.sgr__command {
    display: grid;
    gap: 10px;
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--ink-line);
    background: var(--ink);
}

.sgr__shells {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .hchip { font-family: $font_mono; }
}

.sgr__line {
    display: flex;
    align-items: center;
    gap: 10px;

    code {
        flex: 1;
        min-width: 0;
        overflow-x: auto;
        color: var(--cream);
        font-family: $font_mono;
        font-size: 1.4rem;
        white-space: nowrap;
    }
}

.sgr__controls {
    display: grid;
    gap: 24px;

    @include m992 { grid-template-columns: 1fr 1.1fr 1.1fr; }
}

.sgr__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;

    small {
        opacity: 0.6;
        font-family: $font_mono;
    }
}

.sgr__label {
    flex-basis: 100%;
    margin-bottom: 4px;
    color: var(--muted);
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

@include m992 {
    .sgr__group {
        display: grid;
        grid-template-columns: repeat(9, minmax(0, 1fr));
        align-content: start;

        .sgr__label { grid-column: 1 / -1; }
        .hswatch { width: 100%; height: 38px; }

        &:first-child {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            .hchip { justify-content: center; min-height: 38px; padding: 6px 8px; }
        }
    }
}

@keyframes param-in {
    from { transform: translateY(-8px); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .sgr__part code b { animation: none; }
    .sgr__sample { transition: none; }
}
</style>
