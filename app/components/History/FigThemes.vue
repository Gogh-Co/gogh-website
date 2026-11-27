<template>
    <HistoryFigure :label="copy.label" :caption="copy.caption" flush>
        <div class="tswap" :style="vars">
            <div class="tswap__chips" role="radiogroup" :aria-label="copy.label">
                <button
                    v-for="(theme, index) in HISTORY_THEMES"
                    :key="theme.name"
                    type="button"
                    role="radio"
                    class="tswap__chip"
                    :class="{ 'is-on': index === modelValue }"
                    :aria-checked="index === modelValue"
                    @click="emit('update:modelValue', index)"
                >
                    <span class="tswap__dots" aria-hidden="true">
                        <i v-for="slot in [1, 2, 3, 4, 5, 6]" :key="slot" :style="{ background: theme.colors[slot] }"></i>
                    </span>
                    {{ theme.name }}
                </button>
            </div>

            <div class="tswap__window">
                <div class="tswap__bar" aria-hidden="true"><i></i><i></i><i></i><span>~/projects/gogh</span></div>
                <pre class="tswap__screen"><span class="c4 b">~/projects/gogh</span> <span class="c5">on main</span> <span class="c3">✓</span>
<span class="c2 b">❯</span> git status --short
 <span class="c1">M</span> themes/dracula.yml
<span class="c1">??</span> themes/new-theme.yml
<span class="c2 b">❯</span> ls
<span class="c4 b">installs</span>  <span class="c4 b">themes</span>  <span class="c4 b">tools</span>  README.md  <span class="c2 b">gogh.sh</span>
<span class="c2 b">❯</span> cat hello.py
<span class="c5">def</span> <span class="c4">greet</span>(name):
    <span class="c8"># every color here is one of 16 slots</span>
    <span class="c5">return</span> <span class="c2">f"Hello, </span><span class="c3">{name}</span><span class="c2">"</span>
<span class="c2 b">❯</span> <span class="cursor">█</span></pre>
            </div>

            <div class="tswap__palette" aria-hidden="true">
                <span v-for="(color, index) in theme.colors" :key="index" class="tswap__slot" :style="{ background: color }">
                    <small>{{ String(index + 1).padStart(2, '0') }}</small>
                </span>
            </div>

            <NuxtLink class="tswap__open" :to="themePagePath(theme.name)">
                {{ format(copy.open, { name: theme.name }) }}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z" /></svg>
            </NuxtLink>
        </div>
    </HistoryFigure>
</template>

<script setup>
import HistoryFigure from './HistoryFigure.vue';
import { HISTORY_THEMES } from '~/utils/historyData';
import { themePagePath } from '~/utils/themeSlug';

const props = defineProps({
    copy: { type: Object, required: true },
    modelValue: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue']);
const { format } = useI18n();

const theme = computed(() => HISTORY_THEMES[props.modelValue] ?? HISTORY_THEMES[0]);

// The screen paints with the slots through CSS variables, so a theme change
// is one transition instead of a re-render.
const vars = computed(() => {
    const result = {
        '--t-bg': theme.value.background,
        '--t-fg': theme.value.foreground,
        '--t-cursor': theme.value.cursor,
    };
    theme.value.colors.forEach((color, index) => {
        result[`--t${index}`] = color;
    });
    return result;
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.tswap {
    display: grid;
}

.tswap__chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 14px;
    border-bottom: 1px solid var(--ink-line);
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
}

.tswap__chip {
    display: inline-flex;
    flex: none;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    font-size: 1.2rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:hover {
        color: var(--cream);
        border-color: rgba(255, 255, 255, 0.3);
    }

    &.is-on {
        border-color: var(--cream);
        background: rgba(255, 255, 255, 0.06);
        color: var(--cream);
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 2px;
    }
}

.tswap__dots {
    display: flex;
    gap: 2px;

    i {
        width: 12px;
        height: 6px;
    }
}

.tswap__window {
    margin: 18px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: var(--t-bg);
    box-shadow: 0 40px 80px -40px rgba(0, 0, 0, 0.9);
    transition: background-color 0.6s ease;

    @include m768 {
        margin: 24px;
    }
}

.tswap__bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 12px;
    background: color-mix(in srgb, var(--t-fg) 8%, var(--t-bg));
    transition: background-color 0.6s ease;

    i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--t-fg) 30%, transparent);
    }

    span {
        margin-inline-start: 10px;
        color: color-mix(in srgb, var(--t-fg) 60%, transparent);
        font-family: $font_mono;
        font-size: 1.1rem;
    }
}

.tswap__screen {
    margin: 0;
    padding: 16px 18px 20px;
    overflow-x: auto;
    color: var(--t-fg);
    font-family: $font_mono;
    font-size: 1.3rem;
    line-height: 1.65;
    transition: color 0.6s ease;

    @include m768 {
        font-size: 1.45rem;
    }

    span {
        transition: color 0.6s ease;
    }

    .b { font-weight: 700; }
    .c1 { color: var(--t1); }
    .c2 { color: var(--t2); }
    .c3 { color: var(--t3); }
    .c4 { color: var(--t4); }
    .c5 { color: var(--t5); }
    .c6 { color: var(--t6); }
    .c8 { color: var(--t8); font-style: italic; }

    .cursor {
        color: var(--t-cursor);
        animation: blink 1.1s steps(1) infinite;
    }
}

.tswap__palette {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    margin: 0 18px;

    @include m768 {
        margin: 0 24px;
    }
}

.tswap__slot {
    display: flex;
    align-items: flex-end;
    height: 42px;
    padding: 3px 5px;
    transition: background-color 0.6s ease;

    small {
        color: #fff;
        font-family: $font_mono;
        font-size: 0.95rem;
        mix-blend-mode: difference;
    }
}

.tswap__open {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: 8px;
    margin: 16px 18px 20px;
    color: var(--cream);
    font-size: 1.35rem;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid var(--accent, var(--gogh-yellow));

    @include m768 {
        margin: 18px 24px 24px;
    }

    svg {
        transition: transform 0.4s $ease_out_expo;
    }

    &:hover {
        color: var(--accent, var(--gogh-yellow));

        svg {
            transform: rotate(45deg);
        }
    }
}

@keyframes blink {
    50% { opacity: 0; }
}
</style>
