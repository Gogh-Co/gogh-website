<template>
    <section ref="root" class="terms">
        <div class="terms__header">
            <p class="section-eyebrow"><span>04</span> {{ t('terminalsStrip.eyebrow') }}</p>
            <h2 class="section-title">{{ t('terminalsStrip.title') }}<br><em>{{ t('terminalsStrip.titleAccent') }}</em></h2>
        </div>

        <div class="terms__viewport">
            <div ref="track" class="terms__track">
                <NuxtLink
                    v-for="terminal in TERMINALS"
                    :key="terminal.name"
                    to="/terminals"
                    class="terms__card"
                >
                    <span class="terms__shot">
                        <img :src="`/terminals/${terminal.image}`" :alt="t('terminalsStrip.screenshotAlt', { name: terminal.name })" loading="lazy" width="640" height="400">
                    </span>
                    <span class="terms__name">{{ terminal.name }}</span>
                </NuxtLink>
            </div>
        </div>

        <div class="terms__footer">
            <NuxtLink to="/terminals" class="terms__all">
                {{ t('terminalsStrip.seeAll') }}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.175 13H4v-2h12.175l-5.6-5.6L12 4l8 8l-8 8l-1.425-1.4z"/></svg>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup>
const { t } = useI18n();

const TERMINALS = [
    { name: 'Ghostty', image: 'ghostty.jpg' },
    { name: 'Alacritty', image: 'alacritty.jpg' },
    { name: 'Kitty', image: 'kitty.jpg' },
    { name: 'WezTerm', image: 'wezterm.jpg' },
    { name: 'iTerm2', image: 'iterm2.jpg' },
    { name: 'GNOME Terminal', image: 'gnome-terminal.jpg' },
    { name: 'Konsole', image: 'konsole.jpg' },
    { name: 'Tilix', image: 'tilix.jpg' },
    { name: 'XFCE4 Terminal', image: 'xfce4-terminal.jpg' },
    { name: 'Terminator', image: 'terminator.jpg' },
    { name: 'Mintty', image: 'mintty.jpg' },
    { name: 'Pantheon', image: 'pantheon.jpg' },
];

const root = ref(null);
const track = ref(null);
let gsapContext = null;

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    // Vertical scroll drives the strip sideways while the section passes.
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.fromTo(track.value, { x: () => window.innerWidth * 0.1 }, {
            x: () => -(track.value.scrollWidth - window.innerWidth * 0.9),
            ease: 'none',
            scrollTrigger: {
                trigger: root.value,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.8,
                invalidateOnRefresh: true,
            },
        });

        gsap.from('.terms__header > *', {
            y: 40,
            opacity: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: root.value, start: 'top 75%' },
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.terms {
    padding: 60px 0 140px;
    overflow: hidden;
    background: var(--ink);
    color: var(--cream);
}

.terms__header,
.terms__footer {
    max-width: 1496px;
    margin: 0 auto;
    padding: 0 20px;

    @include m768 {
        padding: 0 48px;
    }
}

.terms__header {
    margin-bottom: 56px;
}

.terms__viewport {
    // Without JS (or with reduced motion) the strip is a normal swipeable row.
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @media (prefers-reduced-motion: no-preference) {
        overflow: visible;
    }
}

.terms__track {
    display: flex;
    gap: 20px;
    width: max-content;
    padding: 0 20px;
    will-change: transform;
}

.terms__card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 300px;
    color: var(--cream);
    text-decoration: none;

    &:hover {
        color: var(--cream);

        img {
            transform: scale(1.06);
        }

        .terms__name::after {
            transform: scaleX(1);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 4px;
        border-radius: 0;
    }

    @include m768 {
        width: 420px;
    }
}

.terms__shot {
    display: block;
    overflow: hidden;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    aspect-ratio: 16 / 10;
    background: var(--ink-2);

    img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
        transition: transform 1s $ease_out_expo;
    }
}

.terms__name {
    position: relative;
    align-self: flex-start;
    font-family: $font_display;
    font-size: 2.2rem;
    font-weight: 500;
    letter-spacing: -0.01em;

    &::after {
        content: '';
        position: absolute;
        right: 0;
        bottom: -2px;
        left: 0;
        height: 1px;
        background: currentColor;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.6s $ease_out_expo;
    }
}

.terms__footer {
    margin-top: 48px;
}

.terms__all {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: var(--cream);
    font-size: 1.5rem;
    font-weight: 600;
    text-decoration: none;

    svg {
        transition: transform 0.5s $ease_out_expo;
    }

    &:hover {
        color: var(--gogh-yellow);

        svg {
            transform: translateX(5px);
        }
    }
}
</style>
