<template>
    <section ref="root" class="theme-hero" :class="`theme-hero--${variant}`" :style="heroStyle">
        <ClientOnly>
            <StarryCanvas :palette="palette" :background="background" />
        </ClientOnly>
        <div class="theme-hero__veil" aria-hidden="true"></div>
        <div class="theme-hero__grain" aria-hidden="true"></div>

        <div ref="content" class="theme-hero__content">
            <nav class="theme-hero__crumbs" aria-label="Breadcrumb">
                <NuxtLink to="/" class="theme-hero__crumb-link">All themes</NuxtLink>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{{ themeName }}</span>
            </nav>

            <p ref="eyebrow" class="theme-hero__eyebrow">
                <span class="theme-hero__badge">{{ variant === 'light' ? 'Light' : 'Dark' }}</span>
                <span>terminal color scheme</span>
                <template v-if="authorName">
                    <span class="theme-hero__dot" aria-hidden="true">·</span>
                    <span>
                        by
                        <a v-if="authorUrl" :href="authorUrl" target="_blank" rel="noopener noreferrer">{{ authorName }}</a>
                        <template v-else>{{ authorName }}</template>
                    </span>
                </template>
            </p>

            <h1 ref="title" class="theme-hero__title" :style="{ '--title-vw': titleVw }">
                <!-- The space between lines keeps the heading's text "Dracula Lost",
                     not "DraculaLost"; the flex layout doesn't render it. -->
                <template v-for="(word, index) in titleWords" :key="index">
                    {{ index ? ' ' : '' }}<span class="theme-hero__line">
                        <span class="theme-hero__word" :style="{ '--i': index }">{{ word }}</span>
                    </span>
                </template>
            </h1>

            <!-- The 16 colors drop in one by one, normal row over bright row. -->
            <div class="theme-hero__swatches" aria-hidden="true">
                <span
                    v-for="(color, index) in swatches"
                    :key="index"
                    class="theme-hero__swatch"
                    :style="{ backgroundColor: color, '--i': index }"
                ></span>
            </div>

            <div id="theme-install" ref="install" class="theme-hero__install">
                <InstallCommand tone="glass" :theme-name="themeName" />
            </div>
        </div>

        <div class="theme-hero__footer">
            <span class="theme-hero__painting">
                <span class="theme-hero__painting-label">Painted with</span>
                <span class="theme-hero__painting-name">{{ themeName }}</span>
            </span>

            <div class="theme-hero__scroll" aria-hidden="true">
                <span>Scroll</span>
                <span class="theme-hero__scroll-line"></span>
            </div>

            <span class="theme-hero__codes" aria-hidden="true">
                <span>bg {{ background }}</span>
                <span>fg {{ foreground }}</span>
            </span>
        </div>
    </section>
</template>

<script setup>
import StarryCanvas from '@/components/Home/StarryCanvas.vue';
import InstallCommand from '@/components/Home/InstallCommand.vue';

const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
    themeName: {
        type: String,
        required: true,
    },
    variant: {
        type: String,
        default: 'dark',
    },
    authorName: {
        type: String,
        default: '',
    },
    authorUrl: {
        type: String,
        default: '',
    },
});

// The chromatic colors (no blacks or whites), so the strokes read on the
// background: red, green, yellow, blue, magenta, cyan, then the bright ones.
const CHROMATIC_KEYS = ['color_02', 'color_03', 'color_04', 'color_05', 'color_06', 'color_07', 'color_10', 'color_11', 'color_12', 'color_13', 'color_14', 'color_15'];

const root = ref(null);
const content = ref(null);
const eyebrow = ref(null);
const title = ref(null);
const install = ref(null);
let gsapContext = null;

const background = computed(() => safeHex(props.theme.background) || '#0a0f14');
const foreground = computed(() => safeHex(props.theme.foreground) || '#f4efe6');
const palette = computed(() => {
    const colors = CHROMATIC_KEYS.map((key) => safeHex(props.theme[key])).filter(Boolean);
    return colors.length ? colors : ['#e74c3c', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6', '#2aa198'];
});
const swatches = computed(() => Array.from({ length: 16 }, (_, index) => {
    const slot = String(index + 1).padStart(2, '0');
    return safeHex(props.theme[`color_${slot}`]) || 'transparent';
}));

// Long names wrap onto a line per word; the size shrinks with the longest
// word so it never overflows the viewport.
const titleWords = computed(() => props.themeName.split(/\s+/).filter(Boolean));
const titleVw = computed(() => {
    const longest = Math.max(4, ...titleWords.value.map((word) => word.length));
    return `${Math.min(22, 128 / longest).toFixed(2)}vw`;
});

const heroStyle = computed(() => ({
    '--hero-bg': background.value,
    '--hero-fg': foreground.value,
    '--hero-a': palette.value[2] || '#F1C40F',
    '--hero-b': palette.value[3] || '#3498DB',
    '--hero-c': palette.value[1] || '#E74C3C',
    '--hero-d': palette.value[4] || '#9B59B6',
    '--hero-cursor': safeHex(props.theme.cursor) || foreground.value,
}));

onMounted(() => {
    // The name and the meta line arrive as bits and resolve into text.
    binaryDecode(title.value, { delay: 380, duration: 900 });
    binaryDecode(eyebrow.value, { delay: 220, duration: 700 });

    if (prefersReducedMotion()) {
        return;
    }

    // Scrolling away: the copy drifts up and fades, the canvas stays.
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.to(content.value, {
            yPercent: -16,
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: root.value,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.theme-hero {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100svh;
    overflow: hidden;
    padding: 120px 20px 150px;
    background-color: var(--hero-bg);
    color: var(--hero-fg);
    isolation: isolate;

    @include m768 {
        padding: 120px 48px 130px;
    }
}

// Light themes get the solid header bar above them, not an overlay.
.theme-hero--light {
    min-height: calc(100svh - 72px);
    padding-top: 64px;
}

.theme-hero__veil {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
        radial-gradient(52% 50% at 50% 50%, color-mix(in srgb, var(--hero-bg) 84%, transparent) 0%, color-mix(in srgb, var(--hero-bg) 50%, transparent) 55%, transparent 88%),
        linear-gradient(180deg, transparent 90%, var(--hero-bg) 100%);
    pointer-events: none;
}

.theme-hero__grain {
    position: absolute;
    inset: -50%;
    z-index: 2;
    opacity: 0.07;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    animation: grain 1.2s steps(6) infinite;
}

.theme-hero__content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;
    will-change: transform, opacity;
}

.theme-hero__crumbs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin: 0 0 18px;
    color: color-mix(in srgb, var(--hero-fg) 62%, transparent);
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0;
    animation: fade-up 1s $ease_out_expo 0.1s forwards;
}

.theme-hero__crumb-link {
    color: inherit;
    text-decoration: none;
    border-bottom: 1px solid color-mix(in srgb, var(--hero-fg) 30%, transparent);
    transition: color 0.3s ease, border-color 0.3s ease;

    &:hover,
    &:focus-visible {
        color: var(--hero-fg);
        border-bottom-color: currentColor;
    }
}

.theme-hero__eyebrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 0 0 18px;
    color: color-mix(in srgb, var(--hero-fg) 78%, transparent);
    font-size: 1.4rem;
    letter-spacing: 0.02em;
    opacity: 0;
    animation: fade-up 1s $ease_out_expo 0.2s forwards;

    a {
        color: var(--hero-fg);
        text-decoration: none;
        border-bottom: 1px solid var(--hero-a);
        transition: color 0.3s ease;

        &:hover,
        &:focus-visible {
            color: var(--hero-a);
        }
    }
}

.theme-hero__badge {
    padding: 3px 9px 2px;
    border: 1px solid currentColor;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.theme-hero__dot {
    opacity: 0.5;
}

.theme-hero__title {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 0.22em;
    margin: 0 0 34px;
    color: var(--hero-fg);
    font-family: $font_display;
    font-size: clamp(5.2rem, min(var(--title-vw), 26vh), 24rem);
    font-weight: 400;
    line-height: 0.88;
    letter-spacing: -0.045em;
    overflow-wrap: anywhere;
}

.theme-hero__line {
    display: block;
    overflow: hidden;
    padding: 0 0.04em 0.18em;
    margin-bottom: -0.18em;
}

.theme-hero__word {
    display: inline-block;
    transform: translateY(110%) rotate(4deg);
    transform-origin: center bottom;
    animation: word-rise 1.3s $ease_out_expo forwards;
    animation-delay: calc(0.25s + var(--i) * 0.1s);
}

.theme-hero__swatches {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 3px;
    width: min(420px, 86vw);
    margin: 0 0 36px;
    box-shadow: 0 30px 60px -30px color-mix(in srgb, var(--hero-a) 70%, transparent);
}

.theme-hero__swatch {
    display: block;
    height: 22px;
    /* A hairline keeps near-background colors visible. */
    outline: 1px solid color-mix(in srgb, var(--hero-fg) 14%, transparent);
    outline-offset: -1px;
    transform-origin: bottom;
    animation: swatch-in 0.9s $ease_out_expo backwards;
    animation-delay: calc(0.7s + var(--i) * 40ms);

    &:nth-child(n + 9) {
        height: 12px;
        transform-origin: top;
    }
}

.theme-hero__install {
    display: flex;
    justify-content: center;
    width: 100%;
    text-align: left;
    opacity: 0;
    animation: fade-up 1.1s $ease_out_expo 1.1s forwards;

    :deep(.install-cmd) {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 760px;
    }

    :deep(.install-cmd__box) {
        width: 100%;
    }

    // Tabs sit straight on the canvas: tint them with the theme so they read
    // on light backgrounds too.
    :deep(.install-cmd__tabs) {
        border-color: color-mix(in srgb, var(--hero-fg) 22%, transparent);
        background: color-mix(in srgb, var(--hero-bg) 55%, transparent);
        backdrop-filter: blur(10px);
    }

    :deep(.install-cmd__tab) {
        color: color-mix(in srgb, var(--hero-fg) 72%, transparent);

        &.is-active {
            color: var(--hero-bg);
        }
    }

    :deep(.install-cmd__tab-indicator) {
        background: var(--hero-fg);
    }

    :deep(.install-cmd__prompt) {
        color: var(--hero-a);
    }
}

.theme-hero__footer {
    position: absolute;
    right: 20px;
    bottom: 26px;
    left: 20px;
    z-index: 3;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
    color: color-mix(in srgb, var(--hero-fg) 70%, transparent);
    font-size: 1.15rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0;
    animation: fade-up 1.1s $ease_out_expo 1.4s forwards;

    @include m768 {
        right: 48px;
        left: 48px;
    }
}

.theme-hero__painting {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
}

.theme-hero__painting-label {
    font-size: 1rem;
    letter-spacing: 0.2em;
}

.theme-hero__painting-name {
    color: var(--hero-fg);
    font-weight: 600;
    letter-spacing: 0.04em;
}

.theme-hero__codes {
    display: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-family: $font_mono;
    text-transform: lowercase;
    letter-spacing: 0.04em;

    @include m576 {
        display: inline-flex;
    }
}

.theme-hero__scroll {
    position: absolute;
    bottom: 0;
    left: 50%;
    display: none;
    transform: translateX(-50%);
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 1.05rem;
    letter-spacing: 0.2em;

    @media (min-width: 1200px) and (min-height: 760px) {
        display: flex;
    }
}

.theme-hero__scroll-line {
    position: relative;
    width: 1px;
    height: 54px;
    overflow: hidden;
    background: color-mix(in srgb, var(--hero-fg) 18%, transparent);

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 40%;
        background: var(--hero-fg);
        animation: scroll-line 2s $ease_in_out infinite;
    }
}

@keyframes word-rise {
    to {
        transform: translateY(0) rotate(0);
    }
}

@keyframes swatch-in {
    from {
        opacity: 0;
        transform: scaleY(0);
    }

    to {
        opacity: 1;
        transform: scaleY(1);
    }
}

@keyframes fade-up {
    from {
        opacity: 0;
        transform: translateY(18px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes scroll-line {
    0% {
        transform: translateY(-100%);
    }

    100% {
        transform: translateY(250%);
    }
}

@keyframes grain {
    0% { transform: translate(0, 0); }
    20% { transform: translate(-5%, 3%); }
    40% { transform: translate(4%, -4%); }
    60% { transform: translate(-3%, 5%); }
    80% { transform: translate(5%, 2%); }
    100% { transform: translate(0, 0); }
}
</style>
