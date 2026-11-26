<template>
    <div class="preview-slider" role="region" aria-roledescription="carousel" :aria-label="`${themeName} previews`">
        <div
            class="preview-slider__viewport"
            :style="viewportHeight ? { height: `${viewportHeight}px` } : null"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
        >
            <div class="preview-slider__track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
                <div
                    v-for="(slide, index) in SLIDES"
                    :key="slide.id"
                    :ref="(element) => setSlideRef(element, index)"
                    class="preview-slider__slide"
                    role="group"
                    aria-roledescription="slide"
                    :aria-label="`${index + 1} of ${SLIDES.length}: ${slide.label}`"
                    :aria-hidden="index !== activeIndex"
                    :inert="index !== activeIndex"
                >
                    <component :is="slide.component" :theme="theme" v-bind="slide.props" />
                </div>
            </div>
        </div>

        <button
            type="button"
            class="preview-slider__arrow preview-slider__arrow--prev"
            :aria-label="`Previous preview: ${SLIDES[previousIndex].label}`"
            @click="go(-1)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6l6 6l1.41-1.41L10.83 12z"/></svg>
        </button>
        <button
            type="button"
            class="preview-slider__arrow preview-slider__arrow--next"
            :aria-label="`Next preview: ${SLIDES[nextIndex].label}`"
            @click="go(1)"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 6L8.59 7.41L13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
        </button>

        <div class="preview-slider__tabs" role="group" aria-label="Choose preview">
            <button
                v-for="(slide, index) in SLIDES"
                :key="slide.id"
                type="button"
                class="preview-slider__tab"
                :class="{ 'is-active': index === activeIndex }"
                :aria-pressed="index === activeIndex"
                @click="activeIndex = index"
            >
                {{ slide.label }}
            </button>
        </div>
    </div>
</template>

<script setup>
import { markRaw } from 'vue';
import PreviewTerminal from './PreviewTerminal.vue';
import HomePreviewTerminal from './HomePreviewTerminal.vue';
import CodePreviewTerminal from './CodePreviewTerminal.vue';

// Lightbox carousel: the palette terminal plus "in use" previews of the same
// scheme (a Linux home session and code in two languages). The active slide is a v-model so the page can keep the
// visitor's last choice between lightbox openings.
const SLIDES = [
    { id: 'palette', label: 'Palette', component: markRaw(PreviewTerminal) },
    { id: 'home', label: 'Linux home', component: markRaw(HomePreviewTerminal) },
    { id: 'javascript', label: 'JavaScript', component: markRaw(CodePreviewTerminal), props: { language: 'javascript' } },
    { id: 'python', label: 'Python', component: markRaw(CodePreviewTerminal), props: { language: 'python' } },
];

const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

const activeIndex = defineModel({ type: Number, default: 0 });

const themeName = computed(() => (props.theme?.name || props.theme?.theme || 'Theme').toString());
const previousIndex = computed(() => (activeIndex.value - 1 + SLIDES.length) % SLIDES.length);
const nextIndex = computed(() => (activeIndex.value + 1) % SLIDES.length);

function go(step) {
    activeIndex.value = (activeIndex.value + step + SLIDES.length) % SLIDES.length;
}

// Slides differ in height; size the viewport to the active one so a short
// slide doesn't leave a gap above the install command.
const slideElements = [];
const viewportHeight = ref(0);
let resizeObserver = null;

function setSlideRef(element, index) {
    slideElements[index] = element;
}

function measureActiveSlide() {
    const element = slideElements[activeIndex.value];
    if (element) {
        viewportHeight.value = element.offsetHeight;
    }
}

watch(activeIndex, () => {
    if (activeIndex.value < 0 || activeIndex.value >= SLIDES.length) {
        activeIndex.value = 0;
        return;
    }
    nextTick(measureActiveSlide);
});

let touchStartX = null;

function onTouchStart(event) {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
}

function onTouchEnd(event) {
    if (touchStartX === null) return;
    const deltaX = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) > 50) {
        go(deltaX < 0 ? 1 : -1);
    }
}

function onKeydown(event) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
    }
    if (event.key === 'ArrowLeft') {
        go(-1);
    } else if (event.key === 'ArrowRight') {
        go(1);
    }
}

onMounted(() => {
    if (activeIndex.value < 0 || activeIndex.value >= SLIDES.length) {
        activeIndex.value = 0;
    }
    measureActiveSlide();
    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(measureActiveSlide);
        slideElements.forEach((element) => element && resizeObserver.observe(element));
    }
    window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    window.removeEventListener('keydown', onKeydown);
});
</script>

<style lang="scss" scoped>
.preview-slider {
    position: relative;

    @media (min-width: 768px) {
        padding: 0 60px;
    }
}

.preview-slider__viewport {
    overflow: hidden;
    transition: height 0.3s ease;
}

.preview-slider__track {
    display: flex;
    align-items: flex-start;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}

.preview-slider__slide {
    flex: 0 0 100%;
    min-width: 0;
}

.preview-slider__arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    cursor: pointer;
    transform: translateY(-50%);
    transition: background-color 0.15s ease;

    &:hover,
    &:focus-visible {
        background: rgba(255, 255, 255, 0.28);
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    // On phones the arrows sit over the window edges.
    @media (max-width: 767.98px) {
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.55);
    }
}

.preview-slider__arrow--prev {
    left: 0;

    @media (max-width: 767.98px) {
        left: 4px;
    }
}

.preview-slider__arrow--next {
    right: 0;

    @media (max-width: 767.98px) {
        right: 4px;
    }
}

.preview-slider__tabs {
    // The negative margin tucks the tabs into the terminal's bottom margin,
    // which overlaps the viewport. The track is transformed, so it paints
    // above in-flow siblings: lift the tabs or the track swallows clicks.
    position: relative;
    z-index: 3;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin: -30px 0 32px;
}

.preview-slider__tab {
    // Same language as the page's filter buttons (ButtonFilter): square,
    // uppercase, 1px border, filled when active with an animated colour bar
    // underneath. Inverted for the lightbox's dark backdrop. px: rem is 10px.
    position: relative;
    padding: 10px 20px 9px;
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

    &::after {
        position: absolute;
        right: 0;
        bottom: -8px;
        left: 0;
        width: 0;
        height: 3px;
        margin: 0 auto;
        background-color: #ffffff;
        content: '';
        opacity: 0;
        transition: width 0.3s ease, opacity 0.3s ease;
    }

    &:hover,
    &:focus-visible {
        border-color: #ffffff;
        color: #ffffff;
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    &:hover::after,
    &.is-active::after {
        width: 100%;
        opacity: 1;
    }

    &.is-active {
        border-color: #ffffff;
        background: #ffffff;
        color: #0d1926;

        &::after {
            animation: preview-slider-tab-bar 18s infinite;
        }
    }

    @media (max-width: 575.98px) {
        padding: 8px 12px 7px;
        font-size: 11px;
    }

    @media (prefers-reduced-motion: reduce) {
        &.is-active::after {
            animation: none;
        }
    }
}

// Mirrors ButtonFilter's anim-gogh-bg (scoped keyframes can't be shared).
@keyframes preview-slider-tab-bar {
    25%   { background-color: #FF0883; }
    37.5% { background-color: #FF8308; }
    50%   { background-color: #0883FF; }
    62.5% { background-color: #8308FF; }
    75%   { background-color: #3dba98; }
    87.5% { background-color: #ffffff; }
    100%  { background-color: #47af32; }
}
</style>
