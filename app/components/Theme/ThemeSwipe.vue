<template>
    <!-- Touch only: the neighbour slides in from the edge while the page is
         swiped sideways, and opens once the swipe goes far enough. -->
    <div
        v-if="target"
        class="theme-swipe"
        :class="[`theme-swipe--${direction}`, { 'is-ready': ready, 'is-leaving': leaving }]"
        :style="hintStyle"
        aria-hidden="true"
    >
        <span class="theme-swipe__label">
            <svg v-if="direction === 'prev'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11v2H8l5.5 5.5l-1.42 1.42L4.16 12l7.92-7.92L13.5 5.5L8 11z"/></svg>
            {{ direction === 'prev' ? t('common.previous') : t('common.next') }}
            <svg v-if="direction === 'next'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M4 11v2h12l-5.5 5.5l1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5L16 11z"/></svg>
        </span>
        <span class="theme-swipe__name">{{ target.name }}</span>
        <span class="theme-swipe__strip">
            <i v-for="(color, index) in target.colors.slice(0, 8)" :key="index" :style="{ backgroundColor: color }"></i>
        </span>
    </div>
</template>

<script setup>
// Swipe left for the next theme, right for the previous one (like turning a
// page). Only clearly horizontal swipes count, and never ones that start on
// something that scrolls or drags sideways itself, near the screen edges
// (the browser's own back/forward gestures live there) or behind a dialog.

const props = defineProps({
    previous: {
        type: Object,
        default: null,
    },
    next: {
        type: Object,
        default: null,
    },
});

// Elements that own horizontal touch gestures.
const { t } = useI18n();

const SWIPE_OWNERS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), '
    + '[role="slider"], [role="tablist"], [role="dialog"], [data-swipe-ignore]';
const EDGE = 24;
const LOCK_DISTANCE = 12;

const dx = ref(0);
const active = ref(false);
const leaving = ref(false);
let start = null;
let axis = null;
let width = 1;

const direction = computed(() => (dx.value < 0 ? 'next' : 'prev'));
const target = computed(() => (active.value && dx.value !== 0 ? props[direction.value === 'next' ? 'next' : 'previous'] : null));
const threshold = computed(() => Math.min(140, width * 0.3));
const progress = computed(() => Math.min(1, Math.abs(dx.value) / threshold.value));
const ready = computed(() => progress.value >= 1);

const hintStyle = computed(() => {
    const color = target.value || {};
    // Eased so it follows the finger at first, then resists a little.
    const shift = (1 - progress.value) * 105;
    return {
        '--swipe-bg': color.background || '#0d1926',
        '--swipe-fg': color.foreground || '#e7e7e7',
        '--swipe-accent': color.colors?.[11] || color.foreground || '#f1c40f',
        transform: `translate(${direction.value === 'next' ? shift : -shift}%, -50%)`,
        opacity: Math.min(1, progress.value * 1.6),
    };
});

// Anything between the touch and the page that scrolls sideways on its own.
function scrollsSideways(element) {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
        if (node.scrollWidth > node.clientWidth + 1) {
            const { overflowX } = getComputedStyle(node);
            if (overflowX === 'auto' || overflowX === 'scroll') {
                return true;
            }
        }
    }
    return false;
}

function blocked(event) {
    const element = event.target instanceof Element ? event.target : null;
    return !element
        || !!element.closest(SWIPE_OWNERS)
        || scrollsSideways(element)
        || document.documentElement.classList.contains('gogh-menu-open')
        || !!document.querySelector('[aria-modal="true"]')
        || !!window.getSelection()?.toString();
}

function reset() {
    start = null;
    axis = null;
    active.value = false;
    dx.value = 0;
}

function onTouchStart(event) {
    if (leaving.value || event.touches.length !== 1) {
        reset();
        return;
    }
    const touch = event.touches[0];
    width = window.innerWidth;
    if (touch.clientX < EDGE || touch.clientX > width - EDGE || blocked(event)) {
        reset();
        return;
    }
    start = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    axis = null;
}

function onTouchMove(event) {
    if (!start || event.touches.length !== 1) {
        reset();
        return;
    }
    const touch = event.touches[0];
    const moveX = touch.clientX - start.x;
    const moveY = touch.clientY - start.y;

    // Decide once: a mostly vertical gesture is a scroll, leave it alone.
    if (!axis) {
        if (Math.hypot(moveX, moveY) < LOCK_DISTANCE) return;
        axis = Math.abs(moveX) > Math.abs(moveY) * 1.4 ? 'x' : 'y';
        if (axis === 'y') {
            start = null;
            return;
        }
    }

    const neighbour = moveX < 0 ? props.next : props.previous;
    active.value = !!neighbour;
    dx.value = neighbour ? moveX : 0;
}

function onTouchEnd() {
    if (!start || axis !== 'x' || !active.value) {
        reset();
        return;
    }
    const elapsed = Math.max(1, performance.now() - start.time);
    const distance = Math.abs(dx.value);
    // Far enough, or a quick flick.
    const flick = distance > 50 && distance / elapsed > 0.6;
    const neighbour = dx.value < 0 ? props.next : props.previous;

    if ((ready.value || flick) && neighbour?.path) {
        leaving.value = true;
        dx.value = dx.value < 0 ? -threshold.value : threshold.value;
        start = null;
        navigateTo(neighbour.path);
        return;
    }
    reset();
}

// A new theme page: clear the gesture state.
watch(() => [props.previous?.path, props.next?.path], () => {
    leaving.value = false;
    reset();
});

onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', reset, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', reset);
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.theme-swipe {
    position: fixed;
    top: 50%;
    z-index: 950;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(220px, 62vw);
    padding: 14px 16px;
    border: 1px solid color-mix(in srgb, var(--swipe-fg) 22%, transparent);
    background: var(--swipe-bg);
    color: var(--swipe-fg);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    will-change: transform, opacity;

    &--next {
        right: 12px;
    }

    &--prev {
        left: 12px;
        text-align: right;
        align-items: flex-end;
    }

    // Past the threshold: letting go opens it.
    &.is-ready {
        border-color: var(--swipe-accent);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--swipe-accent);

        .theme-swipe__label svg {
            animation: nudge 0.6s $ease_out_expo infinite alternate;
        }
    }

    // Snaps fully in while the next page loads.
    &.is-leaving {
        transition: transform 0.35s $ease_out_expo, opacity 0.2s ease;
    }
}

.theme-swipe__label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: color-mix(in srgb, var(--swipe-fg) 70%, transparent);
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.theme-swipe__name {
    font-family: $font_display;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
}

.theme-swipe__strip {
    display: flex;
    width: 100%;
    height: 8px;

    i {
        flex: 1;
    }
}

.theme-swipe--prev .theme-swipe__label svg {
    --nudge: -4px;
}

.theme-swipe--next .theme-swipe__label svg {
    --nudge: 4px;
}

@keyframes nudge {
    to {
        transform: translateX(var(--nudge));
    }
}

@media (prefers-reduced-motion: reduce) {
    .theme-swipe.is-ready .theme-swipe__label svg {
        animation: none;
    }
}
</style>
