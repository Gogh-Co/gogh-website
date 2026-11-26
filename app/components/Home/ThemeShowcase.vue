<template>
    <section ref="root" class="showcase" :style="themeVars" aria-label="Live theme preview">
        <div ref="pin" class="showcase__pin">
            <div class="showcase__inner">
                <div class="showcase__copy">
                    <p class="section-eyebrow section-eyebrow--themed"><span>02</span> Live preview</p>
                    <h2 class="showcase__title">One terminal.<br><em>Every mood.</em></h2>

                    <ol class="showcase__list">
                        <li v-for="(theme, index) in showcaseThemes" :key="theme.name">
                            <button
                                type="button"
                                class="showcase__item"
                                :class="{ 'is-active': index === activeIndex }"
                                :aria-pressed="index === activeIndex"
                                @click="select(index)"
                            >
                                <span class="showcase__item-index">{{ String(index + 1).padStart(2, '0') }}</span>
                                <span class="showcase__item-name">{{ theme.name }}</span>
                            </button>
                        </li>
                    </ol>

                    <div class="showcase__progress" aria-hidden="true">
                        <span :style="{ transform: `scaleX(${progress})` }"></span>
                    </div>
                </div>

                <div class="showcase__stage">
                    <div class="showcase__window">
                        <div class="showcase__bar">
                            <span class="showcase__dots" aria-hidden="true"><i></i><i></i><i></i></span>
                            <span class="showcase__bar-title">{{ activeTheme.name }} — zsh</span>
                        </div>

                        <div class="showcase__body" aria-hidden="true">
                            <div class="t-line">
                                <span class="c-blue">~/projects/web</span> <span class="c-magenta">main</span>  <span class="c-green">❯</span>&nbsp;<span>gogh</span> <span class="c-yellow">--theme</span> <span class="c-green">"{{ activeTheme.name }}"</span>
                            </div>
                            <div class="t-line t-line--out"><span class="c-green">✓</span> Theme applied to <span class="c-cyan">GNOME Terminal</span></div>

                            <div class="t-line">
                                <span class="c-blue">~/projects/web</span> <span class="c-magenta">main</span>  <span class="c-green">❯</span>&nbsp;<span>ls</span>
                            </div>
                            <div class="t-line t-line--out t-grid">
                                <span class="c-blue t-bold">src/</span>
                                <span class="c-blue t-bold">public/</span>
                                <span class="c-green">build.sh</span>
                                <span>README.md</span>
                                <span class="c-yellow">package.json</span>
                                <span class="c-red">.env</span>
                            </div>

                            <div class="t-line">
                                <span class="c-blue">~/projects/web</span> <span class="c-magenta">main</span>  <span class="c-green">❯</span>&nbsp;<span>cat</span> <span class="c-cyan">src/theme.js</span>
                            </div>
                            <div class="t-code">
                                <div><i>1</i><span class="c-magenta">export const</span> <span class="c-blue">theme</span> <span class="c-cyan">=</span> {</div>
                                <div><i>2</i>&nbsp;&nbsp;name: <span class="c-green">'{{ activeTheme.name }}'</span>,</div>
                                <div><i>3</i>&nbsp;&nbsp;colors: <span class="c-yellow">16</span>, <span class="c-dim">// ANSI palette</span></div>
                                <div><i>4</i>&nbsp;&nbsp;dark: <span class="c-red">{{ activeTheme.category !== 'light' }}</span>,</div>
                                <div><i>5</i>};</div>
                            </div>

                            <div class="t-line">
                                <span class="c-blue">~/projects/web</span> <span class="c-magenta">main</span>  <span class="c-green">❯</span>&nbsp;<span class="t-cursor"></span>
                            </div>
                        </div>

                        <div class="showcase__palette" aria-hidden="true">
                            <i v-for="n in 16" :key="n" :style="{ backgroundColor: `var(--c${n})`, transitionDelay: `${n * 18}ms` }"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
const props = defineProps({
    themes: {
        type: Array,
        default: () => [],
    },
});

const SHOWCASE = ['Dracula', 'Nord', 'Gruvbox Dark', 'Catppuccin Mocha', 'Github Light', 'Rose Pine', 'TokyoNight Storm', 'Kanagawa Wave'];

const FALLBACK = [{
    name: 'Gogh',
    category: 'dark',
    background: '#0D1926', foreground: '#E7E7E7',
    color_01: '#243342', color_02: '#C54133', color_03: '#27AE60', color_04: '#EDB20A', color_05: '#2479D0', color_06: '#7D3EA0', color_07: '#1D8579', color_08: '#C9CCCD',
    color_09: '#34495E', color_10: '#E74C3C', color_11: '#2ECC71', color_12: '#F1C40F', color_13: '#3498DB', color_14: '#9B59B6', color_15: '#2AA198', color_16: '#ECF0F1',
}];

const root = ref(null);
const pin = ref(null);
const activeIndex = ref(0);
const progress = ref(0);
let trigger = null;
let gsapContext = null;

const showcaseThemes = computed(() => {
    const byName = new Map(props.themes.map((theme) => [String(theme.name || ''), theme]));
    const found = SHOWCASE.map((name) => byName.get(name)).filter(Boolean);
    return found.length ? found : FALLBACK;
});

const activeTheme = computed(() => showcaseThemes.value[Math.min(activeIndex.value, showcaseThemes.value.length - 1)]);

const themeVars = computed(() => {
    const theme = activeTheme.value;
    const vars = { '--bg': theme.background, '--fg': theme.foreground };
    for (let n = 1; n <= 16; n += 1) {
        vars[`--c${n}`] = theme[`color_${String(n).padStart(2, '0')}`];
    }
    return vars;
});

function select(index) {
    if (trigger) {
        // Scroll-driven: jump the page to the slice of the pinned range that
        // shows this theme, so scroll position and selection never disagree.
        const count = showcaseThemes.value.length;
        const target = trigger.start + ((index + 0.5) / count) * (trigger.end - trigger.start);
        scrollToTarget(target, 0);
        return;
    }
    activeIndex.value = index;
}

function setupPin() {
    const { gsap, ScrollTrigger } = useGsap();
    gsapContext = gsap.context(() => {
        trigger = ScrollTrigger.create({
            trigger: root.value,
            pin: pin.value,
            start: 'top top',
            end: () => `+=${Math.round(window.innerHeight * 0.7 * Math.max(1, showcaseThemes.value.length - 1))}`,
            invalidateOnRefresh: true,
            onUpdate(self) {
                const count = showcaseThemes.value.length;
                progress.value = self.progress;
                const index = Math.min(count - 1, Math.floor(self.progress * count));
                if (index !== activeIndex.value) {
                    activeIndex.value = index;
                }
            },
        });

        gsap.from('.showcase__window', {
            y: 80,
            rotateX: 14,
            opacity: 0,
            duration: 1.4,
            ease: 'expo.out',
            scrollTrigger: { trigger: root.value, start: 'top 75%' },
        });
    }, root.value);
}

// The theme list can arrive after mount (client fallback fetch): the pinned
// range depends on how many showcase themes exist, so re-measure.
watch(() => showcaseThemes.value.length, () => {
    nextTick(() => trigger?.refresh());
});

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    setupPin();
});

onBeforeUnmount(() => {
    gsapContext?.revert();
    trigger = null;
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.showcase {
    position: relative;
    background-color: var(--bg);
    color: var(--fg);
    transition: background-color 0.8s ease, color 0.8s ease;
}

.showcase__pin {
    display: flex;
    align-items: center;
    min-height: 100svh;
    padding: 96px 20px 48px;

    @include m768 {
        padding: 96px 48px 48px;
    }
}

.showcase__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;

    @include m992 {
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
        gap: 64px;
        align-items: center;
    }
}

.showcase__title {
    margin: 0 0 32px;
    color: var(--fg);
    font-family: $font_display;
    font-size: clamp(4rem, 6vw, 8.4rem);
    font-weight: 900;
    line-height: 0.95;
    letter-spacing: -0.05em;
    transition: color 0.8s ease;

    em {
        font-style: normal;
        font-weight: 100;
        color: var(--c13, var(--fg));
        transition: color 0.8s ease;
    }
}

.showcase__list {
    display: flex;
    gap: 6px;
    margin: 0 0 24px;
    padding: 0;
    overflow-x: auto;
    list-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    li {
        flex: 0 0 auto;
        margin: 0;
    }

    @include m992 {
        flex-direction: column;
        gap: 2px;
        overflow: visible;
    }
}

.showcase__item {
    display: inline-flex;
    align-items: baseline;
    gap: 12px;
    padding: 6px 12px;
    border: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
    border-radius: 0;
    background: transparent;
    color: var(--fg);
    opacity: 0.45;
    font-size: 1.4rem;
    white-space: nowrap;
    cursor: pointer;
    transition: opacity 0.4s ease, transform 0.6s $ease_out_expo, color 0.8s ease, border-color 0.4s ease;

    &:hover {
        opacity: 0.8;
    }

    &.is-active {
        opacity: 1;
        border-color: var(--fg);
    }

    &:focus-visible {
        outline: 2px solid var(--c12, currentColor);
        outline-offset: 2px;
    }

    @include m992 {
        padding: 4px 0;
        border: 0;
        border-radius: 0;
        font-family: $font_display;
        font-size: 3.2rem;
        font-weight: 200;
        letter-spacing: -0.02em;

        &.is-active {
            font-weight: 700;
            transform: translateX(14px);
        }
    }
}

.showcase__item-index {
    font-family: $font_default;
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    opacity: 0.7;
}

.showcase__progress {
    display: none;
    width: 100%;
    max-width: 320px;
    height: 2px;
    overflow: hidden;
    background: color-mix(in srgb, var(--fg) 18%, transparent);

    span {
        display: block;
        height: 100%;
        background: var(--fg);
        transform-origin: left center;
    }

    @include m992 {
        display: block;
    }
}

.showcase__stage {
    perspective: 1400px;
}

.showcase__window {
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--fg) 16%, transparent);
    border-radius: 0;
    background: color-mix(in srgb, var(--bg) 88%, var(--fg));
    box-shadow: 0 50px 120px -40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.08);
    transition: background-color 0.8s ease, border-color 0.8s ease;
    transform-origin: center top;
}

.showcase__bar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
}

.showcase__dots {
    position: absolute;
    left: 16px;
    display: inline-flex;
    gap: 7px;

    i {
        width: 11px;
        height: 11px;
        border-radius: 0;
        background: var(--c2);
        transition: background-color 0.8s ease;

        &:nth-child(2) { background: var(--c4); }
        &:nth-child(3) { background: var(--c3); }
    }
}

.showcase__bar-title {
    font-family: $font_default;
    font-size: 1.2rem;
    opacity: 0.7;
}

.showcase__body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
    padding: 20px 18px 8px;
    background: var(--bg);
    font-family: $font_mono;
    font-size: 1.2rem;
    line-height: 1.6;
    transition: background-color 0.8s ease;

    span,
    i,
    div {
        transition: color 0.8s ease;
    }

    @include m768 {
        padding: 26px 28px 10px;
        font-size: 1.45rem;
    }
}

.t-line {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.t-line--out {
    padding-left: 14px;
    opacity: 0.9;
}

.t-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 22px;
    white-space: normal;
}

.t-code {
    margin: 2px 0 6px;
    padding: 10px 0;
    border-left: 2px solid color-mix(in srgb, var(--fg) 14%, transparent);

    div {
        white-space: pre;
    }

    i {
        display: inline-block;
        width: 34px;
        padding-right: 12px;
        color: var(--c9);
        font-style: normal;
        text-align: right;
        opacity: 0.8;
    }
}

.t-bold { font-weight: 700; }
.c-red { color: var(--c2); }
.c-green { color: var(--c3); }
.c-yellow { color: var(--c4); }
.c-blue { color: var(--c5); }
.c-magenta { color: var(--c6); }
.c-cyan { color: var(--c7); }
.c-dim { color: var(--c9); }

.t-cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.15em;
    vertical-align: text-bottom;
    background: var(--fg);
    animation: blink 1.1s steps(1) infinite;
}

.showcase__palette {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    padding: 16px 18px 20px;
    background: var(--bg);
    transition: background-color 0.8s ease;

    i {
        height: 22px;
        border-radius: 0;
        transition: background-color 0.7s ease;

        @include m768 {
            height: 30px;
        }
    }

    @include m768 {
        padding: 18px 28px 26px;
    }
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}
</style>
