<template>
    <section ref="root" class="manifesto">
        <div class="manifesto__inner">
            <p class="section-eyebrow"><span>01</span> Why color matters</p>
            <p class="manifesto__text">
                <template v-for="(token, index) in tokens" :key="index">
                    <span
                        class="manifesto__word"
                        :class="token.accent ? `manifesto__word--${token.accent}` : ''"
                    >{{ token.text }}</span>{{ ' ' }}
                </template>
            </p>
        </div>
    </section>
</template>

<script setup>
// Words light up one by one as the paragraph scrolls through the viewport.
// Words wrapped in [brackets] get one of the palette accents.
const COPY = 'You read your terminal for hours a day. [Sixteen] [colors] decide how every prompt, log and diff looks. Gogh is a [curated] [library] of palettes, and installing any of them takes [one] [command].';
const ACCENTS = ['yellow', 'blue', 'magenta', 'cyan', 'green', 'red'];

const tokens = (() => {
    let accentIndex = 0;
    let pairOpen = false;
    return COPY.split(' ').map((word) => {
        const match = word.match(/^\[(.+)\](.*)$/);
        if (!match) {
            pairOpen = false;
            return { text: word };
        }
        // Consecutive bracketed words share one accent color.
        if (!pairOpen) {
            accentIndex += 1;
            pairOpen = true;
        }
        return { text: match[1] + match[2], accent: ACCENTS[(accentIndex - 1) % ACCENTS.length] };
    });
})();

const root = ref(null);
let gsapContext = null;

onMounted(() => {
    if (prefersReducedMotion()) {
        root.value?.classList.add('is-static');
        return;
    }
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.fromTo('.manifesto__word', { opacity: 0.14 }, {
            opacity: 1,
            stagger: 0.08,
            ease: 'none',
            scrollTrigger: {
                trigger: '.manifesto__text',
                start: 'top 80%',
                end: 'bottom 45%',
                scrub: 0.6,
            },
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.manifesto {
    padding: 120px 20px 140px;
    background: var(--ink);
    color: var(--cream);

    @include m768 {
        padding: 180px 48px 200px;
    }
}

.manifesto__inner {
    max-width: 1280px;
    margin: 0 auto;
}

.manifesto__text {
    margin: 0;
    color: var(--cream);
    font-family: $font_display;
    font-size: clamp(3.2rem, 5.6vw, 8rem);
    font-weight: 350;
    font-variation-settings: 'opsz' 144, 'SOFT' 60;
    line-height: 1.08;
    letter-spacing: -0.03em;
}

.manifesto__word {
    display: inline;
    transition: color 0.3s ease;

    // Accents: italic plus a palette color; they still fade in with the rest.
    &[class*='--'] {
        font-style: italic;
        font-weight: 300;
    }

    &--yellow { color: var(--gogh-yellow); }
    &--blue { color: var(--gogh-blue); }
    &--magenta { color: #c17be0; }
    &--cyan { color: #3fc7bb; }
    &--green { color: var(--gogh-green); }
    &--red { color: var(--gogh-red); }
}
</style>
