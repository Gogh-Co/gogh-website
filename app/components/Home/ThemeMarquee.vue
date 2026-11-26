<template>
    <section ref="root" class="marquee" aria-label="A sample of the theme collection">
        <div class="marquee__mask">
            <div
                v-for="(row, rowIndex) in rows"
                :key="rowIndex"
                class="marquee__row"
                :class="{ 'marquee__row--reverse': rowIndex % 2 === 1 }"
            >
                <div class="marquee__drift" :data-drift="rowIndex % 2 === 1 ? 1 : -1">
                    <div class="marquee__track" :style="{ '--duration': `${70 + rowIndex * 12}s` }">
                        <!-- Rendered twice so the -50% loop is seamless; the copy is hidden from AT. -->
                        <template v-for="copy in 2" :key="copy">
                            <button
                                v-for="theme in row"
                                :key="`${copy}-${theme.name}`"
                                type="button"
                                class="mini-term"
                                :style="{ '--bg': theme.background, '--fg': theme.foreground }"
                                :aria-hidden="copy === 2"
                                :tabindex="copy === 2 ? -1 : 0"
                                :aria-label="`Preview ${theme.name}`"
                                @click="emit('open', theme)"
                            >
                                <span class="mini-term__bar">
                                    <span class="mini-term__dots" aria-hidden="true"><i></i><i></i><i></i></span>
                                    <span class="mini-term__name">{{ theme.name }}</span>
                                </span>
                                <span class="mini-term__code" aria-hidden="true">
                                    <span><b :style="{ color: theme.color_03 }">❯</b> <span :style="{ color: theme.color_05 }">gogh</span> <span :style="{ color: theme.color_04 }">--install</span></span>
                                    <span><span :style="{ color: theme.color_06 }">const</span> palette <span :style="{ color: theme.color_02 }">=</span> <span :style="{ color: theme.color_03 }">'{{ shortName(theme.name) }}'</span>;</span>
                                </span>
                                <span class="mini-term__swatches" aria-hidden="true">
                                    <i v-for="key in SWATCH_KEYS" :key="key" :style="{ backgroundColor: theme[key] }"></i>
                                </span>
                            </button>
                        </template>
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

const emit = defineEmits(['open']);

const SWATCH_KEYS = Array.from({ length: 8 }, (_, index) => `color_${String(index + 1).padStart(2, '0')}`);
const ROW_COUNT = 2;
const PER_ROW = 14;

const root = ref(null);
let gsapContext = null;

function shortName(name) {
    const value = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return value.length > 14 ? `${value.slice(0, 13)}…` : value;
}

// Popular themes first (they're the ones people recognise), then fill with
// a stable slice of the rest so SSR and the client render the same rows.
const rows = computed(() => {
    const valid = props.themes.filter((theme) => theme?.name && theme.background);
    if (!valid.length) {
        return [];
    }
    const popular = valid.filter((theme) => theme.popular);
    const rest = valid.filter((theme) => !theme.popular);
    const stride = Math.max(1, Math.floor(rest.length / (ROW_COUNT * PER_ROW)));
    const pool = [...popular, ...rest.filter((_, index) => index % stride === 0)];

    return Array.from({ length: ROW_COUNT }, (_, rowIndex) => pool.filter((_, index) => index % ROW_COUNT === rowIndex).slice(0, PER_ROW));
});

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    // On top of the endless CSS loop, rows drift a little against each other
    // with the scroll position, so the section feels tied to the page.
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.utils.toArray('.marquee__drift').forEach((element) => {
            const direction = Number(element.dataset.drift) || 1;
            gsap.fromTo(element, { xPercent: -6 * direction }, {
                xPercent: 6 * direction,
                ease: 'none',
                scrollTrigger: {
                    trigger: root.value,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.marquee {
    position: relative;
    overflow: hidden;
    padding: 40px 0 80px;
    background: var(--ink);
}

.marquee__mask {
    display: flex;
    flex-direction: column;
    gap: 18px;
    // Soft fade at both edges.
    mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.marquee__drift {
    will-change: transform;
}

.marquee__track {
    display: flex;
    gap: 18px;
    width: max-content;
    animation: marquee var(--duration, 70s) linear infinite;

    .marquee__row--reverse & {
        animation-direction: reverse;
    }

    .marquee__row:hover & {
        animation-play-state: paused;
    }
}

.mini-term {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 14px;
    width: 280px;
    padding: 0 0 16px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--fg) 14%, transparent);
    border-radius: 0;
    background: var(--bg);
    color: var(--fg);
    text-align: left;
    cursor: pointer;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
    transition: transform 0.6s $ease_out_expo, box-shadow 0.6s $ease_out_expo;

    &:hover,
    &:focus-visible {
        transform: translateY(-8px) rotate(-1deg);
        box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.8), 0 0 0 1px color-mix(in srgb, var(--fg) 30%, transparent);
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 3px;
    }

    @include m768 {
        width: 320px;
    }
}

.mini-term__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid color-mix(in srgb, var(--fg) 10%, transparent);
}

.mini-term__dots {
    display: inline-flex;
    gap: 5px;

    i {
        width: 9px;
        height: 9px;
        border-radius: 0;
        background: color-mix(in srgb, var(--fg) 28%, transparent);
    }
}

.mini-term__name {
    overflow: hidden;
    font-family: $font_default;
    font-size: 1.2rem;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mini-term__code {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 14px;
    font-family: $font_mono;
    font-size: 1.2rem;
    line-height: 1.5;
    white-space: nowrap;

    > span {
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

.mini-term__swatches {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 5px;
    padding: 0 14px;

    i {
        height: 16px;
        border-radius: 0;
    }
}

@keyframes marquee {
    to {
        transform: translateX(calc(-50% - 9px));
    }
}
</style>
