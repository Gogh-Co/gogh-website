<template>
    <section ref="root" class="bento-section">
        <div class="bento-section__inner">
            <header class="bento-section__header">
                <p class="section-eyebrow"><span>03</span> The toolkit</p>
                <h2 class="section-title">More than a<br><em>color list.</em></h2>
                <p class="bento-section__lead">
                    Build a theme from scratch, check its contrast, explore the numbers behind the collection,
                    or take the palette to your desktop.
                </p>
            </header>

            <div class="bento">
                <NuxtLink
                    v-for="card in CARDS"
                    :key="card.to"
                    :to="card.to"
                    class="bento__card"
                    :class="`bento__card--${card.id}`"
                    @pointermove="onPointerMove"
                >
                    <span class="bento__spot" aria-hidden="true"></span>

                    <span class="bento__visual" aria-hidden="true">
                        <!-- Generator: a palette that keeps re-mixing itself -->
                        <span v-if="card.id === 'generator'" class="viz-generator">
                            <i v-for="n in 8" :key="n" :style="{ '--n': n }"></i>
                        </span>

                        <!-- WCAG: a contrast ratio readout -->
                        <span v-else-if="card.id === 'wcag'" class="viz-wcag">
                            <span class="viz-wcag__sample">Aa</span>
                            <span class="viz-wcag__badges"><b>AA</b><b>AAA</b></span>
                        </span>

                        <!-- Stats: bars growing -->
                        <span v-else-if="card.id === 'stats'" class="viz-stats">
                            <i v-for="n in 9" :key="n" :style="{ '--h': `${STAT_BARS[n - 1]}%`, '--n': n }"></i>
                        </span>

                        <!-- Wallpapers: stacked thumbnails -->
                        <span v-else-if="card.id === 'wallpapers'" class="viz-walls">
                            <img v-for="(src, index) in WALLS" :key="src" :src="src" alt="" loading="lazy" :style="{ '--n': index }">
                        </span>

                        <!-- Terminals: names cycling -->
                        <span v-else-if="card.id === 'terminals'" class="viz-terms">
                            <span v-for="name in TERMINAL_NAMES" :key="name">{{ name }}</span>
                        </span>
                    </span>

                    <span class="bento__text">
                        <span class="bento__kicker">{{ card.kicker }}</span>
                        <span class="bento__title">{{ card.title }}</span>
                        <span class="bento__desc">{{ card.description }}</span>
                    </span>

                    <span class="bento__arrow" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z" /></svg>
                    </span>
                </NuxtLink>
            </div>
        </div>
    </section>
</template>

<script setup>
const CARDS = [
    {
        id: 'generator',
        to: '/generator',
        kicker: 'Generator',
        title: 'Design your own scheme',
        description: 'Pick every color with a live preview, then export a ready-to-use Gogh theme file.',
    },
    {
        id: 'wcag',
        to: '/wcsg',
        kicker: 'WCAG data',
        title: 'Readable by design',
        description: 'Contrast ratios for every theme, filterable by light and dark.',
    },
    {
        id: 'stats',
        to: '/stats',
        kicker: 'Stats',
        title: 'The numbers behind the palette',
        description: 'Authors, duplicates and color usage across the whole collection.',
    },
    {
        id: 'wallpapers',
        to: '/wallpapers',
        kicker: 'Wallpapers',
        title: 'Take it to your desktop',
        description: 'Free wallpapers painted in the Gogh palette.',
    },
    {
        id: 'terminals',
        to: '/terminals',
        kicker: 'Terminals',
        title: 'Works where you work',
        description: 'GNOME Terminal, Konsole, Alacritty, Kitty, WezTerm, iTerm2 and more.',
    },
];

const STAT_BARS = [38, 62, 45, 80, 56, 92, 70, 48, 66];
const WALLS = ['/wallpapers/thumbs/gogh-10.jpg', '/wallpapers/thumbs/gogh-12.jpg', '/wallpapers/thumbs/gogh-14.jpg'];
const TERMINAL_NAMES = ['Alacritty', 'Ghostty', 'Kitty', 'WezTerm', 'iTerm2', 'Konsole', 'Tilix', 'GNOME Terminal', 'Alacritty'];

const root = ref(null);
let gsapContext = null;

// Spotlight that follows the cursor across each card.
function onPointerMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    const { gsap, ScrollTrigger } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.from('.bento-section__header > *', {
            y: 40,
            opacity: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.bento-section__header', start: 'top 80%' },
        });

        gsap.set('.bento__card', { y: 70, opacity: 0, scale: 0.97 });
        ScrollTrigger.batch('.bento__card', {
            start: 'top 88%',
            once: true,
            onEnter: (cards) => gsap.to(cards, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 1.3,
                stagger: 0.1,
                ease: 'expo.out',
                clearProps: 'transform',
            }),
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.bento-section {
    padding: 120px 20px;
    background: var(--ink);
    color: var(--cream);

    @include m768 {
        padding: 160px 48px;
    }
}

.bento-section__inner {
    max-width: 1400px;
    margin: 0 auto;
}

.bento-section__header {
    display: grid;
    gap: 20px;
    margin: 0 0 56px;

    @include m992 {
        grid-template-columns: 1fr 1fr;
        align-items: end;

        .section-eyebrow {
            grid-column: 1 / -1;
        }
    }
}

.bento-section__lead {
    max-width: 480px;
    margin: 0;
    color: var(--muted);
    font-size: 1.7rem;
    line-height: 1.55;

    @include m992 {
        justify-self: end;
    }
}

.bento {
    display: grid;
    gap: 16px;

    @include m768 {
        grid-template-columns: repeat(2, 1fr);
    }

    @include m1200 {
        grid-template-columns: repeat(6, 1fr);
        grid-auto-rows: 300px;
    }
}

.bento__card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 24px;
    min-height: 340px;
    padding: 28px;
    overflow: hidden;
    border: 1px solid var(--ink-line);
    border-radius: 24px;
    background: var(--ink-2);
    color: var(--cream);
    text-decoration: none;
    isolation: isolate;
    transition: border-color 0.4s ease, transform 0.7s $ease_out_expo;

    &:hover {
        border-color: rgba(255, 255, 255, 0.24);
        color: var(--cream);
        transform: translateY(-4px);

        .bento__spot {
            opacity: 1;
        }

        .bento__arrow {
            transform: rotate(45deg);
            background: var(--cream);
            color: var(--ink);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 3px;
    }

    @include m1200 {
        &--generator { grid-column: span 4; grid-row: span 2; }
        &--wcag { grid-column: span 2; }
        &--stats { grid-column: span 2; }
        &--wallpapers { grid-column: span 3; }
        &--terminals { grid-column: span 3; }
    }

    @media (min-width: 768px) and (max-width: 1199.98px) {
        &--generator { grid-column: span 2; min-height: 420px; }
    }
}

.bento__spot {
    position: absolute;
    inset: 0;
    z-index: -1;
    opacity: 0;
    background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(241, 196, 15, 0.12), transparent 60%);
    transition: opacity 0.4s ease;
}

.bento__visual {
    position: absolute;
    inset: 0;
    z-index: -1;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 28px;
    pointer-events: none;
}

.bento__text {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 520px;
}

.bento__kicker {
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.1rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.bento__title {
    font-family: $font_display;
    font-size: 2.8rem;
    font-weight: 400;
    font-variation-settings: 'opsz' 72;
    line-height: 1.05;
    letter-spacing: -0.02em;

    .bento__card--generator & {
        @include m768 {
            font-size: 4.4rem;
        }
    }
}

.bento__desc {
    color: var(--muted);
    font-size: 1.45rem;
    line-height: 1.5;
}

.bento__arrow {
    position: absolute;
    top: 22px;
    right: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--ink-line);
    border-radius: 50%;
    color: var(--cream);
    transition: transform 0.6s $ease_out_expo, background-color 0.3s ease, color 0.3s ease;
}

/* ---------- Visuals ---------- */

.viz-generator {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 680px;
    margin-top: 56px;

    i {
        aspect-ratio: 1 / 2.2;
        border-radius: 14px;
        animation: remix 9s ease-in-out infinite;
        animation-delay: calc(var(--n) * -0.9s);

        &:nth-child(even) {
            transform: translateY(28px);
        }
    }
}

.viz-wcag {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
}

.viz-wcag__sample {
    font-family: $font_display;
    font-size: 7.2rem;
    font-style: italic;
    font-weight: 300;
    line-height: 1;
    background: linear-gradient(90deg, var(--gogh-yellow), var(--gogh-green));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.viz-wcag__badges {
    display: flex;
    gap: 6px;

    b {
        padding: 6px 10px;
        border: 1px solid rgba(46, 204, 113, 0.5);
        border-radius: 999px;
        color: var(--gogh-green);
        font-family: $font_mono;
        font-size: 1.1rem;
        font-weight: 500;
    }
}

.viz-stats {
    display: flex;
    align-items: flex-end;
    gap: 7px;
    width: 100%;
    height: 96px;
    margin-top: 10px;

    i {
        flex: 1;
        height: var(--h);
        border-radius: 6px 6px 2px 2px;
        background: linear-gradient(180deg, var(--gogh-blue), color-mix(in srgb, var(--gogh-blue) 20%, transparent));
        transform-origin: bottom;
        animation: bar 3.6s $ease_in_out infinite alternate;
        animation-delay: calc(var(--n) * 0.12s);
    }
}

.viz-walls {
    position: relative;
    width: 100%;
    height: 130px;

    img {
        position: absolute;
        top: 0;
        left: calc(var(--n) * 70px);
        width: 46%;
        max-width: 240px;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border: 1px solid var(--ink-line);
        border-radius: 12px;
        box-shadow: 0 20px 40px -16px rgba(0, 0, 0, 0.8);
        transform: rotate(calc((var(--n) - 1) * -5deg));
        transition: transform 0.8s $ease_out_expo;
    }

    .bento__card:hover & img {
        transform: rotate(calc((var(--n) - 1) * -9deg)) translateY(-8px) translateX(calc(var(--n) * 14px));
    }
}

.viz-terms {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    height: 120px;
    overflow: hidden;
    mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);

    span {
        flex: 0 0 40px;
        color: rgba(244, 239, 230, 0.35);
        font-family: $font_mono;
        font-size: 2rem;
        line-height: 40px;
        animation: terms 16s steps(8) infinite;
    }
}

@keyframes remix {
    0%, 100% { background-color: #e74c3c; }
    14% { background-color: #f1c40f; }
    28% { background-color: #2ecc71; }
    42% { background-color: #2aa198; }
    56% { background-color: #3498db; }
    70% { background-color: #9b59b6; }
    84% { background-color: #fd971f; }
}

@keyframes bar {
    from { transform: scaleY(0.35); }
    to { transform: scaleY(1); }
}

@keyframes terms {
    to { transform: translateY(-320px); }
}
</style>
