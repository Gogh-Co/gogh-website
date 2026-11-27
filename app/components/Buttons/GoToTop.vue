<template>
    <!-- Floating corner pair, shown once the visitor is a screen down: a
         random theme (the header's dice) and back to top. -->
    <div
        ref="dock"
        class="float-dock"
        :class="{ 'is-visible': visible }"
        :style="{ '--go-top-lift': `${lift}px` }"
        :aria-hidden="!visible"
    >
        <button
            type="button"
            class="float-dock__button float-dock__random random-dice-host"
            :class="{ 'is-loading': randomLoading }"
            :tabindex="visible ? 0 : -1"
            :aria-label="t('header.randomAria')"
            :title="t('header.randomTitle')"
            aria-keyshortcuts="r"
            :aria-busy="randomLoading"
            :disabled="randomLoading"
            @pointerenter="prefetchThemePaths"
            @focus="prefetchThemePaths"
            @click="openRandomTheme('float')"
        >
            <RandomDice />
        </button>

        <button
            type="button"
            class="float-dock__button go-top"
            :tabindex="visible ? 0 : -1"
            :aria-label="t('goTop')"
            @click="goTop"
        >
            <!-- The outline fills up as the page scrolls. -->
            <svg class="go-top__progress" viewBox="0 0 52 52" aria-hidden="true">
                <rect x="1" y="1" width="50" height="50" pathLength="100" :style="{ strokeDashoffset: 100 - progress * 100 }" />
            </svg>
            <svg class="go-top__arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 20V7.825l-5.6 5.6L4 12l8-8l8 8l-1.4 1.425l-5.6-5.6V20z"/></svg>
        </button>
    </div>
</template>

<script setup>
import RandomDice from '@/components/Buttons/RandomDice.vue';

// A floating "back to top" button: shows up once the visitor is more than a
// screen down, tracks how far they've scrolled, and glides back up with the
// site's smooth scroll. Next to it, the header's random theme dice.

const { t } = useI18n();
const { randomLoading, prefetchThemePaths, openRandomTheme } = useRandomTheme();
const visible = ref(false);
const progress = ref(0);
const lift = ref(0);
const dock = ref(null);
let ticking = false;

// Bars pinned to the bottom of the screen that the button must not cover.
const BOTTOM_BARS = '.persistence-banner, .favorites-sign-in-banner, .install-dock.is-visible';
const GAP = 12;

// How far to raise the buttons so they clear any bar sharing its corner.
function measureLift() {
    const self = dock.value?.getBoundingClientRect();
    if (!self) return 0;
    // From the layout, not the rect: the rect moves with the lift transition.
    const base = window.innerHeight - (parseFloat(getComputedStyle(dock.value).bottom) || 0);
    let raise = 0;
    for (const bar of document.querySelectorAll(BOTTOM_BARS)) {
        const rect = bar.getBoundingClientRect();
        const overlaps = rect.width > 0 && rect.left < self.right && rect.right > self.left && rect.top < base;
        if (overlaps) {
            raise = Math.max(raise, base - rect.top + GAP);
        }
    }
    return raise;
}

function update() {
    ticking = false;
    const scrollY = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    visible.value = scrollY > window.innerHeight;
    progress.value = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    lift.value = visible.value ? measureLift() : 0;
}

function onScroll() {
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
    }
}

function goTop(event) {
    scrollToTarget(0, 0);
    // Keyboard users continue from the top of the page, not from here.
    if (event.detail === 0) {
        document.querySelector('.gogh-header a')?.focus({ preventScroll: true });
    }
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Banners open and close on clicks; re-check the corner after them.
    window.addEventListener('click', onScroll, { passive: true });
    update();
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('click', onScroll);
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.float-dock {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 890;
    display: flex;
    gap: 8px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(calc(16px - var(--go-top-lift, 0px)));
    transition: opacity 0.4s ease, transform 0.5s $ease_out_expo, visibility 0s linear 0.4s;

    @include m768 {
        right: 28px;
        bottom: 28px;
    }

    &.is-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(calc(-1 * var(--go-top-lift, 0px)));
        transition: opacity 0.4s ease, transform 0.5s $ease_out_expo, visibility 0s;
    }
}

.float-dock__button {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: var(--ink);
    color: var(--cream);
    box-shadow: inset 0 0 0 1px rgba(244, 239, 230, 0.14), 0 10px 30px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background: var(--ink-3);
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 3px;
    }
}

.float-dock__random:disabled {
    cursor: progress;
}

.go-top:hover .go-top__arrow {
    transform: translateY(-3px);
}

.go-top__progress {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    rect {
        fill: none;
        stroke: var(--cream);
        stroke-width: 2;
        stroke-dasharray: 100;
        transition: stroke-dashoffset 0.15s linear;
    }
}

.go-top__arrow {
    position: relative;
    transition: transform 0.5s $ease_out_expo;
}

@media (prefers-reduced-motion: reduce) {
    .float-dock,
    .float-dock.is-visible {
        transform: translateY(calc(-1 * var(--go-top-lift, 0px)));
    }

    .go-top__arrow {
        transform: none;
    }
}
</style>
