<template>
    <section id="theme-more" ref="root" class="pager" aria-labelledby="theme-pager-title">
        <div class="pager__inner">
            <p class="section-eyebrow pager__eyebrow"><span>04</span> Keep exploring</p>
            <h2 id="theme-pager-title" class="visually-hidden">More themes</h2>

            <nav class="pager__nav" aria-label="More themes">
                <NuxtLink
                    v-for="link in links"
                    :key="link.rel"
                    :to="link.path"
                    class="pager__link"
                    :class="`pager__link--${link.rel}`"
                    :rel="link.rel"
                    :style="link.style"
                >
                    <span class="pager__label">
                        <svg v-if="link.rel === 'prev'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 11v2H8l5.5 5.5l-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5L8 11z"/></svg>
                        {{ link.label }}
                        <svg v-if="link.rel === 'next'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 11v2h12l-5.5 5.5l1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5L16 11z"/></svg>
                    </span>
                    <span class="pager__name">{{ link.name }}</span>
                    <!-- Its palette: slivers that rise into bars on hover. -->
                    <span class="pager__strip" aria-hidden="true">
                        <i v-for="(color, index) in link.colors" :key="index" :style="{ backgroundColor: color, '--i': index }"></i>
                    </span>
                </NuxtLink>
            </nav>

            <div class="pager__foot">
                <NuxtLink to="/" class="pager__all">
                    <span>All {{ total.toLocaleString('en-US') }} themes</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 11v2h12l-5.5 5.5l1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5L16 11z"/></svg>
                </NuxtLink>

                <div class="pager__share">
                    <span class="pager__share-title">Share {{ themeName }}</span>
                    <ThemeShareButtons :theme-name="themeName" :theme="theme" :url="url" />
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import ThemeShareButtons from '@/components/Terminal/ThemeShareButtons.vue';

const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
    themeName: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    previous: {
        type: Object,
        required: true,
    },
    next: {
        type: Object,
        required: true,
    },
    total: {
        type: Number,
        default: 0,
    },
});

const root = ref(null);
let gsapContext = null;

function linkFor(neighbour, rel, label) {
    const colors = (neighbour.colors || []).filter(Boolean);
    return {
        rel,
        label,
        name: neighbour.name,
        path: neighbour.path,
        colors,
        style: {
            '--n-bg': neighbour.background || '#18232d',
            '--n-fg': neighbour.foreground || '#f4efe6',
        },
    };
}

const links = computed(() => [
    linkFor(props.previous, 'prev', 'Previous'),
    linkFor(props.next, 'next', 'Next'),
]);

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.from('.pager__link', {
            y: 70,
            opacity: 0,
            duration: 1.3,
            stagger: 0.12,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '.pager__nav',
                start: 'top 85%',
                onEnter: () => {
                    binaryDecode(root.value?.querySelector('.pager__eyebrow'), { delay: 100, duration: 700 });
                    root.value?.querySelectorAll('.pager__name').forEach((name, index) => {
                        binaryDecode(name, { delay: 250 + index * 150, duration: 800 });
                    });
                },
            },
        });
        gsap.from('.pager__foot > *', {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.pager__foot', start: 'top 92%' },
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.pager {
    padding: 110px 20px 120px;
    background: var(--ink);
    color: var(--cream);

    @include m768 {
        padding: 150px 48px 150px;
    }
}

.pager__inner {
    max-width: 1400px;
    margin: 0 auto;
}

.pager__nav {
    display: grid;
    gap: 14px;

    @include m768 {
        grid-template-columns: 1fr 1fr;
    }
}

.pager__link {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 40px;
    min-height: 260px;
    --strip: 64px;
    padding: 28px 30px calc(var(--strip) + 26px);
    overflow: hidden;
    isolation: isolate;
    border: 1px solid var(--ink-line);
    background: var(--ink-2);
    color: var(--cream);
    text-decoration: none;
    transition: background-color 0.7s $ease_out_expo, color 0.5s ease, border-color 0.5s ease;

    @include m992 {
        --strip: 92px;
        min-height: 360px;
        padding: 36px 40px calc(var(--strip) + 30px);
    }

    // Hover previews the neighbour: its background and foreground take over.
    &:hover,
    &:focus-visible {
        border-color: transparent;
        background: var(--n-bg);
        color: var(--n-fg);

        .pager__strip i {
            transform: scaleY(1);
        }

        .pager__label svg {
            transform: translateX(var(--nudge));
        }
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 3px;
    }
}

.pager__link--prev {
    --nudge: -6px;
}

.pager__link--next {
    --nudge: 6px;
    align-items: flex-end;
    text-align: right;
}

.pager__label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 1.2rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    opacity: 0.72;

    svg {
        transition: transform 0.6s $ease_out_expo;
    }
}

.pager__name {
    position: relative;
    z-index: 1;
    font-size: clamp(3.6rem, 5.4vw, 8rem);
    font-weight: 300;
    line-height: 0.95;
    letter-spacing: -0.045em;
    overflow-wrap: anywhere;
}

.pager__strip {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 0;
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    height: var(--strip);
    pointer-events: none;

    // At rest each bar is a sliver; on hover they rise one after another.
    i {
        display: block;
        transform-origin: bottom;
        transform: scaleY(0.08);
        transition: transform 0.9s $ease_out_expo;
        transition-delay: calc(var(--i) * 22ms);
    }
}

.pager__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 40px;
    margin-top: 56px;
}

.pager__all {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 0 0 8px;
    border-bottom: 1px solid var(--ink-line);
    color: var(--cream);
    font-size: clamp(2.2rem, 2.6vw, 3.2rem);
    font-weight: 300;
    letter-spacing: -0.02em;
    text-decoration: none;
    transition: border-color 0.4s ease, color 0.3s ease;

    svg {
        transition: transform 0.6s $ease_out_expo;
    }

    &:hover,
    &:focus-visible {
        border-color: var(--gogh-yellow);
        color: #fff;

        svg {
            transform: translateX(8px);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 4px;
    }
}

.pager__share {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;

    @include m768 {
        align-items: flex-end;
    }

    :deep(.share) {
        margin: 0;
    }

    :deep(.share-buttons),
    :deep(.share-previews) {
        justify-content: flex-start;

        @include m768 {
            justify-content: flex-end;
        }
    }
}

.pager__share-title {
    color: var(--muted);
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}
</style>
