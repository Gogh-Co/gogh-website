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
                <code>{{ command }}</code>
                <button type="button" class="hchip" @click="copyCommand">{{ copied ? ui.copied : ui.copy }}</button>
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
    const text = props.copy.sample.replace(/'/g, "'\\''").replace(/%/g, '%%');
    return `printf '\\e[${params.value.join(';')}m${text}\\e[0m\\n'`;
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
    gap: 16px;
}

.sgr__anatomy {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.sgr__part {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 64px;
    padding: 12px 14px 10px;
    border-top: 3px solid var(--part);
    background: color-mix(in srgb, var(--part) 10%, var(--ink));

    code {
        color: var(--part);
        font-family: $font_mono;
        font-size: 2.6rem;
        font-weight: 700;
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
        font-size: 1.05rem;
        line-height: 1.3;
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
    min-height: 92px;
    padding: 20px 24px;
    font-family: $font_mono;
    font-size: 2.2rem;

    @include m768 {
        font-size: 2.8rem;
    }
}

.sgr__sample {
    padding: 0 4px;
    transition: color 0.3s ease, background-color 0.3s ease;
}

.sgr__command {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--ink-line);
    background: var(--ink);

    code {
        flex: 1;
        overflow-x: auto;
        color: var(--cream);
        font-family: $font_mono;
        font-size: 1.3rem;
        white-space: nowrap;
    }
}

.sgr__controls {
    display: grid;
    gap: 10px;
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
    min-width: 92px;
    color: var(--muted);
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

@keyframes param-in {
    from { transform: translateY(-8px); opacity: 0; }
}
</style>
