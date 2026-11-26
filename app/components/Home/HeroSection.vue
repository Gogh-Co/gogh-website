<template>
    <section ref="root" class="hero" :class="`is-${reveal}`" :style="heroStyle">
        <ClientOnly>
            <StarryCanvas :palette="palette" :background="activeTheme.background" />
        </ClientOnly>
        <div class="hero__veil" aria-hidden="true"></div>
        <ClientOnly>
            <CodeReveal :theme="activeTheme" :glow-anchor="brand" :glow-colors="GOGH_LOGO_COLORS" />
        </ClientOnly>
        <div class="hero__grain" aria-hidden="true"></div>

        <div ref="content" class="hero__content">
            <h1 ref="title" class="hero__title">
                <span class="hero__line hero__line--brand">
                    <!-- The code layer (CodeReveal) hides the logo's color bar
                         behind this word; the ink uncovers it. -->
                    <span ref="brand" class="hero__brand">
                        <span class="hero__word" style="--i: 0">Gogh</span>
                    </span>
                </span>
                <span class="hero__line hero__line--sub">
                    <em class="hero__word hero__word--accent" style="--i: 1">terminal schemes</em>
                </span>
                <span class="visually-hidden"> Color schemes for GNOME Terminal, Alacritty, Kitty, iTerm2 and more.</span>
            </h1>

            <div class="hero__install">
                <InstallCommand tone="glass" />
            </div>

            <div class="hero__actions">
                <a ref="cta" href="#themes" class="hero__cta" @click.prevent="emit('browse')">
                    Browse the collection
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 4h2v12l5.5-5.5l1.42 1.42L12 19.84l-7.92-7.92L5.5 10.5L11 16z"/></svg>
                </a>
                <a href="https://github.com/Gogh-Co/Gogh" class="hero__ghost" target="_blank" rel="noopener">
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    Star on GitHub
                </a>
            </div>
        </div>

        <div class="hero__footer">
            <button
                type="button"
                class="hero__painting"
                :aria-label="`Painting with ${activeThemeName}. Switch to the next theme`"
                @click="nextTheme(true)"
            >
                <span class="hero__painting-label">Painting with</span>
                <span class="hero__painting-swatches" aria-hidden="true">
                    <span v-for="(color, index) in palette.slice(0, 6)" :key="index" :style="{ backgroundColor: color }"></span>
                </span>
                <span ref="paintingName" class="hero__painting-name">{{ activeThemeName }}</span>
                <svg class="hero__painting-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V4h2v7h-7V9h4.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.925 0 3.475-1.1T17.65 14h2.1q-.7 2.65-2.85 4.325T12 20"/></svg>
            </button>

            <div class="hero__scroll" aria-hidden="true">
                <span>Scroll</span>
                <span class="hero__scroll-line"></span>
            </div>
        </div>
    </section>

    <!-- The same CTA, pinned to the top of the screen from the moment the
         hero's own button scrolls away until the theme gallery comes in.
         It carries a miniature of the hero's brushstroke canvas. -->
    <ClientOnly>
        <Teleport to="body">
            <a
                href="#themes"
                class="hero-sticky-cta"
                :class="{ 'is-visible': stickyVisible }"
                :style="{ ...heroStyle, top: `${stickyTop}px` }"
                :tabindex="stickyVisible ? 0 : -1"
                :aria-hidden="!stickyVisible"
                @click.prevent="emit('browse')"
            >
                <StarryCanvas
                    :palette="palette"
                    :background="activeTheme.background"
                    :min-particles="70"
                    :max-particles="140"
                    :paused="!stickyVisible"
                />
                <span class="hero-sticky-cta__veil" aria-hidden="true"></span>
                <span class="hero-sticky-cta__label">
                    Browse the collection
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 4h2v12l5.5-5.5l1.42 1.42L12 19.84l-7.92-7.92L5.5 10.5L11 16z"/></svg>
                </span>
            </a>
        </Teleport>
    </ClientOnly>
</template>

<script setup>
import StarryCanvas from './StarryCanvas.vue';
import CodeReveal from './CodeReveal.vue';
import InstallCommand from './InstallCommand.vue';

const props = defineProps({
    themes: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['browse']);

// Dark themes only: the hero copy is light, so it has to stay readable on
// every background in the rotation.
const ROTATION = ['Gogh', 'Dracula', 'TokyoNight Storm', 'Catppuccin Mocha', 'Gruvbox Dark', 'Nord', 'Rose Pine', 'Synthwave 84', 'Kanagawa Wave'];

// Used until (or if) the theme list loads: the "Gogh" theme itself.
const FALLBACK_THEME = {
    name: 'Gogh',
    background: '#0D1926',
    foreground: '#E7E7E7',
    color_02: '#C54133', color_03: '#27AE60', color_04: '#EDB20A', color_05: '#2479D0', color_06: '#7D3EA0', color_07: '#1D8579',
    color_10: '#E74C3C', color_11: '#2ECC71', color_12: '#F1C40F', color_13: '#3498DB', color_14: '#9B59B6', color_15: '#2AA198',
};

const CHROMATIC_KEYS = ['color_02', 'color_03', 'color_04', 'color_05', 'color_06', 'color_07', 'color_10', 'color_11', 'color_12', 'color_13', 'color_14', 'color_15'];

const root = ref(null);
const content = ref(null);
const activeIndex = ref(0);
let rotateTimer = null;
let userPicked = false;
let gsapContext = null;
const cta = ref(null);
const stickyVisible = ref(false);
const stickyTop = ref(88);
let stickyTicking = false;
let headerObserver = null;

// "Gogh": the code layer paints the logo glow behind it.
const brand = ref(null);

// Visible once the hero button has scrolled up under the header, hidden
// again as soon as the gallery (#themes) starts entering the screen.
function updateSticky() {
    stickyTicking = false;
    const button = cta.value?.getBoundingClientRect();
    const gallery = document.getElementById('themes')?.getBoundingClientRect();
    const pastHero = !!button && button.bottom < 80;
    const reachedGallery = !!gallery && gallery.top < window.innerHeight * 0.85;
    stickyVisible.value = pastHero && !reachedGallery;

    // Just under the header, or at the very top while the header is tucked away.
    const header = document.querySelector('.gogh-header');
    const headerHidden = !header || header.classList.contains('is-hidden');
    stickyTop.value = headerHidden ? 16 : (header.getBoundingClientRect().height || 72) + 16;
}

function onStickyScroll() {
    if (!stickyTicking) {
        stickyTicking = true;
        requestAnimationFrame(updateSticky);
    }
}

const rotation = computed(() => {
    const byName = new Map(props.themes.map((theme) => [String(theme.name || theme.theme || ''), theme]));
    const found = ROTATION.map((name) => byName.get(name)).filter(Boolean);
    return found.length ? found : [FALLBACK_THEME];
});

const activeTheme = computed(() => rotation.value[activeIndex.value % rotation.value.length] || FALLBACK_THEME);
const activeThemeName = computed(() => String(activeTheme.value.name || activeTheme.value.theme || 'Gogh'));
const palette = computed(() => CHROMATIC_KEYS.map((key) => activeTheme.value[key]).filter(Boolean));

const heroStyle = computed(() => ({
    '--hero-bg': activeTheme.value.background,
    '--hero-a': palette.value[2] || '#F1C40F',
    '--hero-b': palette.value[3] || '#3498DB',
    '--hero-c': palette.value[1] || '#E74C3C',
    '--hero-d': palette.value[4] || '#9B59B6',
}));

function nextTheme(fromUser = false) {
    if (fromUser) {
        userPicked = true;
        clearInterval(rotateTimer);
    }
    activeIndex.value = (activeIndex.value + 1) % rotation.value.length;
}

// The theme name in "Painting with" decodes from bits on every change, in
// place (a fade-out/fade-in swap left the pill empty for half a second).
const paintingName = ref(null);
watch(activeThemeName, () => {
    if (!prefersReducedMotion()) {
        nextTick(() => binaryDecode(paintingName.value, { duration: 550 }));
    }
});

// "Gogh" and "terminal schemes" stay hidden until the page is interactive,
// then fade in where they stand already written in bits and resolve into
// text. (Rising the server-rendered words out of a clipping mask showed them
// cut in pieces; now the motion and the binary effect never overlap.)
// If the page takes too long to become interactive, CSS shows the title as
// plain text on its own; then there is no decode, so real text is never
// swapped for bits.
const title = ref(null);
// 'waiting' | 'ready' (fade in + decode) | 'shown' (already visible as text)
const reveal = ref('waiting');
const TITLE_DECODE = { delay: 200, duration: 900 };
let unlockTimer = null;

function revealTitle() {
    if (title.value && parseFloat(getComputedStyle(title.value).opacity) > 0.01) {
        reveal.value = 'shown';
        return;
    }
    if (!prefersReducedMotion()) {
        // Bits are wider than most letters: hold every word at its real
        // width while it decodes so the title never reflows. Each word is
        // decoded on its own (the heading also holds visually hidden text).
        const words = [...(title.value?.querySelectorAll('.hero__word') ?? [])];
        words.forEach((word, index) => {
            word.style.width = `${word.getBoundingClientRect().width}px`;
            binaryDecode(word, { delay: TITLE_DECODE.delay + index * 150, duration: TITLE_DECODE.duration });
        });
        unlockTimer = setTimeout(() => {
            words.forEach((word) => word.style.removeProperty('width'));
        }, TITLE_DECODE.delay + TITLE_DECODE.duration + words.length * 150 + 100);
    }
    reveal.value = 'ready';
}

onMounted(() => {
    revealTitle();

    window.addEventListener('scroll', onStickyScroll, { passive: true });
    window.addEventListener('resize', onStickyScroll, { passive: true });
    // The header hides/shows itself on its own frame; follow it when it does.
    const header = document.querySelector('.gogh-header');
    if (header) {
        headerObserver = new MutationObserver(onStickyScroll);
        headerObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
    }
    updateSticky();

    if (!prefersReducedMotion()) {
        rotateTimer = setInterval(() => {
            if (!userPicked && !document.hidden) {
                nextTheme();
            }
        }, 7000);

        // Scrolling away: the copy drifts up and fades, the canvas stays.
        const { gsap } = useGsap();
        gsapContext = gsap.context(() => {
            gsap.to(content.value, {
                yPercent: -18,
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
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onStickyScroll);
    window.removeEventListener('resize', onStickyScroll);
    headerObserver?.disconnect();
    clearInterval(rotateTimer);
    clearTimeout(unlockTimer);
    gsapContext?.revert();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.hero {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 100svh;
    overflow: hidden;
    padding: 110px 20px 140px;
    background-color: var(--hero-bg, var(--ink));
    color: var(--cream);
    transition: background-color 1.2s ease;
    isolation: isolate;

    @include m768 {
        padding: 104px 48px 104px;
    }
}

// Darkens the centre (where the copy sits) and the bottom so the text always
// reads over the moving strokes, whatever the palette.
.hero__veil {
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
        radial-gradient(60% 65% at 50% 50%, color-mix(in srgb, var(--hero-bg) 90%, transparent) 0%, color-mix(in srgb, var(--hero-bg) 55%, transparent) 50%, transparent 80%),
        linear-gradient(180deg, transparent 60%, var(--hero-bg) 100%);
    pointer-events: none;
    transition: background 1.2s ease;
}

.hero__grain {
    position: absolute;
    inset: -50%;
    z-index: 2;
    opacity: 0.08;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    animation: grain 1.2s steps(6) infinite;
}

.hero__content {
    position: relative;
    z-index: 3;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    text-align: center;
    will-change: transform, opacity;
}



.hero__title {
    position: relative;
    margin: 0 0 40px;
    color: var(--cream);
    font-family: $font_display;
    font-size: clamp(9.6rem, min(24vw, 30vh), 30rem);
    font-weight: 400;
    line-height: 0.84;
    letter-spacing: -0.04em;
    opacity: 0;
    // Safety net: if the page is not interactive by then, show it as text.
    animation: title-show 0.6s ease 1.4s forwards;
}

// Interactive in time (.is-ready): a fade where it stands while the words
// resolve from bits (see revealTitle). No rise.
.is-ready .hero__title {
    animation: title-in 0.8s $ease_out_expo forwards;
}

// The safety net already showed it (.is-shown): keep it, no decode.
.is-shown .hero__title {
    animation: none;
    opacity: 1;
}

// Without JavaScript there is no reveal: show it as it is.
@media (scripting: none) {
    .hero__title {
        animation: none;
        opacity: 1;
    }
}

// "terminal schemes": a thin, colored line under the heavy wordmark.
.hero__line--sub {
    // Clears the descender of the "g" in "Gogh".
    margin-top: 0.3em;
    font-size: 0.4em;
    line-height: 1;

    @media (max-width: 575.98px) {
        font-size: 0.36em;
    }
}

.hero__line {
    display: block;
    padding: 0 0.04em 0.2em;
    margin-bottom: -0.2em;
}

// Centred and unwrapped, so while its width is held (during the decode) the
// bits overflow evenly on both sides instead of pushing the layout.
.hero__word {
    display: inline-flex;
    justify-content: center;
    white-space: nowrap;
}

.hero__brand {
    display: inline-block;

    // A soft shadow keeps the light wordmark clear of the logo glow that the
    // ink uncovers behind it.
    .hero__word {
        text-shadow: 0 0.01em 0.08em rgba(10, 15, 20, 0.45);
    }
}

.hero__word--accent {
    font-style: normal;
    font-weight: 100;
    letter-spacing: -0.04em;
    background: linear-gradient(100deg, var(--hero-a), var(--hero-c) 30%, var(--hero-d) 55%, var(--hero-b) 80%, var(--hero-a));
    background-size: 220% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 9s linear infinite;
    // The gradient only paints inside the box: give it room on both sides so
    // bits wider than the letters (while the width is held) are not cut off.
    padding-inline: 0.5em;
    margin-inline: -0.5em;
}


.hero__install {
    display: flex;
    justify-content: center;
    text-align: left;
    opacity: 0;
    animation: fade-up 1.1s $ease_out_expo 0.9s forwards;

    :deep(.install-cmd) {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    :deep(.install-cmd__box) {
        width: 100%;
    }
}

.hero__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 24px;
    opacity: 0;
    animation: fade-up 1.1s $ease_out_expo 1.05s forwards;
}

.hero__cta,
.hero__ghost {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 50px;
    padding: 0 22px;
    border-radius: 0;
    font-size: 1.5rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.5s $ease_out_expo, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

    &:hover {
        transform: translateY(-2px);
    }

    &:focus-visible {
        outline: 2px solid var(--hero-a);
        outline-offset: 3px;
    }
}

.hero__cta {
    background: var(--hero-a);
    color: var(--ink);

    svg {
        transition: transform 0.5s $ease_out_expo;
    }

    &:hover {
        color: var(--ink);

        svg {
            transform: translateY(3px);
        }
    }
}

.hero__ghost {
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(8px);
    color: var(--cream);

    &:hover {
        border-color: rgba(255, 255, 255, 0.5);
        color: #fff;
    }
}

.hero__footer {
    position: absolute;
    right: 20px;
    bottom: 28px;
    left: 20px;
    z-index: 3;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
    opacity: 0;
    animation: fade-up 1.1s $ease_out_expo 1.3s forwards;

    @include m768 {
        right: 48px;
        left: 48px;
    }
}

.hero__painting {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 14px 6px 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 0;
    background: rgba(10, 15, 20, 0.45);
    backdrop-filter: blur(10px);
    color: var(--cream);
    font-size: 1.3rem;
    cursor: pointer;
    transition: border-color 0.3s ease, background-color 0.3s ease;

    &:hover {
        border-color: rgba(255, 255, 255, 0.4);

        .hero__painting-icon {
            transform: rotate(-200deg);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--hero-a);
        outline-offset: 3px;
    }
}

.hero__painting-label {
    color: var(--muted);
    font-family: $font_default;
    font-size: 1.1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    @media (max-width: 480px) {
        display: none;
    }
}

.hero__painting-swatches {
    display: inline-flex;

    span {
        width: 14px;
        height: 14px;
        margin-left: -4px;
        border: 2px solid rgba(10, 15, 20, 0.8);
        border-radius: 0;
        transition: background-color 0.8s ease;

        &:first-child {
            margin-left: 0;
        }
    }
}

.hero__painting-name {
    display: inline-block;
    font-weight: 600;
}

.hero__painting-icon {
    transition: transform 0.7s $ease_out_expo;
}

.hero__scroll {
    position: absolute;
    bottom: 0;
    left: 50%;
    display: none;
    transform: translateX(-50%);
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-family: $font_default;
    font-size: 1.05rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;

    @media (min-width: 1200px) and (min-height: 760px) {
        display: flex;
    }
}

.hero__scroll-line {
    position: relative;
    width: 1px;
    height: 54px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.15);

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 40%;
        background: var(--cream);
        animation: scroll-line 2s $ease_in_out infinite;
    }
}

.hero-sticky-cta {
    position: fixed;
    left: 50%;
    z-index: 880;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 260px;
    height: 56px;
    padding: 0 28px;
    overflow: hidden;
    isolation: isolate;
    background: var(--hero-bg, var(--ink));
    color: var(--cream);
    text-decoration: none;
    white-space: nowrap;
    box-shadow: 0 20px 50px -18px rgba(0, 0, 0, 0.75);
    // Hidden: collapsed to a sliver in the middle and lifted above the screen.
    opacity: 0;
    pointer-events: none;
    clip-path: inset(0 50% 0 50%);
    transform: translate(-50%, -24px);
    transition:
        clip-path 0.9s $ease_out_expo,
        transform 0.9s $ease_out_expo,
        opacity 0.3s ease,
        top 0.6s $ease_out_expo;

    &.is-visible {
        opacity: 1;
        pointer-events: auto;
        clip-path: inset(0 0 0 0);
        transform: translate(-50%, 0);
    }

    // Palette border: a turning conic gradient behind everything; the canvas
    // and veil sit 1.5px inside it, so only a thin frame of it shows. (No CSS
    // masks: Firefox resolves the -webkit-mask fallback to a solid fill.)
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        background: conic-gradient(from var(--cta-angle), var(--hero-a), var(--hero-c), var(--hero-d), var(--hero-b), var(--hero-a));
        animation: cta-spin 4s linear infinite;
        pointer-events: none;
    }

    .starry-canvas {
        top: 1.5px;
        left: 1.5px;
        z-index: 1;
        width: calc(100% - 3px);
        height: calc(100% - 3px);
    }

    &:hover,
    &:focus-visible {
        color: #fff;

        .hero-sticky-cta__veil {
            opacity: 0.25;
        }

        svg {
            transform: translateY(3px);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 3px;
    }

    @media (max-width: 420px) {
        min-width: 0;
        padding: 0 22px;
    }
}

// Keeps the label readable over the strokes; lifts on hover so the paint shows.
.hero-sticky-cta__veil {
    position: absolute;
    inset: 1.5px;
    z-index: 2;
    background: radial-gradient(80% 120% at 50% 50%, color-mix(in srgb, var(--hero-bg) 80%, transparent), color-mix(in srgb, var(--hero-bg) 35%, transparent));
    opacity: 0.7;
    transition: opacity 0.5s ease;
    pointer-events: none;
}

.hero-sticky-cta__label {
    position: relative;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);

    svg {
        color: var(--hero-a);
        transition: transform 0.5s $ease_out_expo;
    }
}

@property --cta-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
}

@keyframes cta-spin {
    to {
        --cta-angle: 360deg;
    }
}

@keyframes title-show {
    to {
        opacity: 1;
    }
}

@keyframes title-in {
    from {
        opacity: 0;
        transform: scale(0.97);
    }

    to {
        opacity: 1;
        transform: none;
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

@keyframes shimmer {
    to {
        background-position: -220% 0;
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
