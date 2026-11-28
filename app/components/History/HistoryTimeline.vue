<template>
    <section ref="root" class="tl" aria-labelledby="timeline-title">
        <div class="tl__pin">
            <header class="tl__header article-heading">
                <p class="section-eyebrow"><span>—</span> {{ copy.eyebrow }}</p>
                <h2 id="timeline-title" class="section-title">{{ copy.title }} <em>{{ copy.titleAccent }}</em></h2>
            </header>

            <div ref="viewport" class="tl__viewport">
                <ol ref="track" class="tl__track">
                    <li v-for="(event, index) in copy.events" :key="event.year + index" class="tl__event" :style="{ '--c': COLORS[index % COLORS.length] }">
                        <span class="tl__year">{{ event.year }}{{ ' ' }}</span>
                        <span class="tl__line" aria-hidden="true"></span>
                        <span class="tl__text">{{ event.text }}</span>
                    </li>
                </ol>
            </div>
        </div>
    </section>
</template>

<script setup>
const props = defineProps({
    copy: { type: Object, required: true },
    motionEnabled: { type: Boolean, default: true },
});

const COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#2aa198', '#3498db', '#9b59b6'];

const root = ref(null);
const viewport = ref(null);
const track = ref(null);
let media = null;

// On wide screens the section pins and the years scroll sideways with the
// page; elsewhere (and with reduced motion) the track scrolls natively.
function syncMotion() {
    media?.revert(); media = null;
    if (!props.motionEnabled || prefersReducedMotion() || !root.value) return;
    const { gsap } = useGsap();
    media = gsap.matchMedia();
    media.add('(min-width: 992px)', () => {
        const distance = () => Math.max(0, track.value.scrollWidth - viewport.value.clientWidth);
        gsap.to(track.value, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
                trigger: root.value,
                start: 'top top',
                end: () => `+=${distance()}`,
                pin: true,
                scrub: 0.6,
                invalidateOnRefresh: true,
            },
        });
    });
}

onMounted(syncMotion);
watch(() => props.motionEnabled, syncMotion, { flush: 'post' });

onBeforeUnmount(() => media?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.tl {
    overflow: hidden;
    background: var(--ink);
    color: var(--cream);
}

.tl__pin {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 56px;
    padding: 120px 0;

    @include m992 {
        min-height: 100vh;
        padding: 96px 0;
    }
}

.tl__header {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;

    @include m768 {
        padding: 0 48px;
    }
}

.tl__viewport {
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    @include m992 {
        overflow: visible;
    }
}

.tl__track {
    display: flex;
    width: max-content;
    margin: 0;
    padding: 0 20px;
    list-style: none;

    @include m768 {
        padding: 0 48px;
    }

    @include m1400 {
        padding-inline-start: calc((100vw - 1400px) / 2 + 48px);
    }
}

.tl__event {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 240px;
    margin: 0;
    padding-inline-end: 28px;

    @include m992 {
        width: 300px;
    }
}

.tl__year {
    color: var(--c);
    font-family: $font_display;
    font-size: 5.6rem;
    font-weight: 100;
    line-height: 1;
    letter-spacing: -0.04em;

    @include m992 {
        font-size: 7.2rem;
    }
}

.tl__line {
    position: relative;
    height: 1px;
    background: var(--ink-line);

    &::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 0;
        width: 9px;
        height: 9px;
        background: var(--c);
        box-shadow: 0 0 16px var(--c);
    }
}

.tl__text {
    max-width: 240px;
    color: var(--muted);
    font-size: 1.5rem;
    line-height: 1.5;
}
</style>
