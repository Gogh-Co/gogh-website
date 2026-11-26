<template>
    <div ref="root" class="share-site" :class="{ 'is-open': open }" :style="{ '--share-lift': `${lift}px` }">
        <div id="share-site-panel" class="share-site__panel" :inert="!open || undefined">
            <ThemeShareButtons :url="SITE_SHARE_URL" :theme="GOGH_SHARE_THEME" :previews="false" />
        </div>

        <button
            type="button"
            class="share-site__toggle"
            :aria-expanded="open"
            aria-controls="share-site-panel"
            :aria-label="open ? 'Close share options' : 'Share gogh.website'"
            :title="open ? 'Close' : 'Share gogh.website'"
            @click="open = !open"
        >
            <svg v-if="!open" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 22q-1.25 0-2.125-.875T14 19q0-.15.075-.7L7.05 14.2q-.4.375-.925.588T5 15q-1.25 0-2.125-.875T2 12t.875-2.125T5 9q.6 0 1.125.213t.925.587l7.025-4.1q-.05-.175-.062-.337T14 5q0-1.25.875-2.125T17 2t2.125.875T20 5t-.875 2.125T17 8q-.6 0-1.125-.213T14.95 7.2l-7.025 4.1q.05.175.063.338T8 12t-.012.363t-.063.337l7.025 4.1q.4-.375.925-.587T17 16q1.25 0 2.125.875T20 19t-.875 2.125T17 22"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg>
        </button>
    </div>
</template>

<script setup>
// A small floating button in the bottom-left corner of the home page: it
// unfolds the share buttons for gogh.website itself (not the current theme).
import ThemeShareButtons from '@/components/Terminal/ThemeShareButtons.vue';

const SITE_SHARE_URL = `${SITE_URL}/`;

const root = ref(null);
const open = ref(false);
const lift = ref(0);

// Bars pinned to the bottom of the screen that the button must not cover
// (same list as the back-to-top button).
const BOTTOM_BARS = '.persistence-banner, .favorites-sign-in-banner, .install-dock.is-visible';
const GAP = 12;

function measureLift() {
    const self = root.value?.getBoundingClientRect();
    if (!self) {
        return 0;
    }
    const base = window.innerHeight - (parseFloat(getComputedStyle(root.value).bottom) || 0);
    let raise = 0;
    for (const bar of document.querySelectorAll(BOTTOM_BARS)) {
        const rect = bar.getBoundingClientRect();
        if (rect.width > 0 && rect.left < self.right && rect.right > self.left && rect.top < base) {
            raise = Math.max(raise, base - rect.top + GAP);
        }
    }
    return raise;
}

let ticking = false;
function updateLift() {
    if (ticking) {
        return;
    }
    ticking = true;
    requestAnimationFrame(() => {
        ticking = false;
        lift.value = measureLift();
    });
}

// Closes on Escape (focus back on the toggle) and on any click outside.
function onKeydown(event) {
    if (event.key === 'Escape' && open.value) {
        open.value = false;
        root.value?.querySelector('.share-site__toggle')?.focus();
    }
}

function onDocumentClick(event) {
    updateLift();
    if (open.value && root.value && !root.value.contains(event.target)) {
        open.value = false;
    }
}

onMounted(() => {
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onDocumentClick);
    window.addEventListener('scroll', updateLift, { passive: true });
    window.addEventListener('resize', updateLift, { passive: true });
    updateLift();
});

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onDocumentClick);
    window.removeEventListener('scroll', updateLift);
    window.removeEventListener('resize', updateLift);
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.share-site {
    position: fixed;
    left: 16px;
    bottom: 16px;
    z-index: 890;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transform: translateY(calc(-1 * var(--share-lift, 0px)));
    transition: transform 0.5s $ease_out_expo;

    @include m768 {
        left: 28px;
        bottom: 28px;
    }
}

// Same square, ink and hairline as the back-to-top button in the other corner.
.share-site__toggle {
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

    svg {
        transition: transform 0.5s $ease_out_expo;
    }

    &:hover {
        background: var(--ink-3);

        svg {
            transform: scale(1.1);
        }
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 3px;
    }
}

.is-open .share-site__toggle svg {
    transform: rotate(90deg);
}

// The network buttons stack upward from the toggle and rise in one by one.
.share-site__panel {
    padding: 6px;
    background: rgba(10, 15, 20, 0.82);
    backdrop-filter: blur(14px);
    box-shadow: inset 0 0 0 1px rgba(244, 239, 230, 0.1), 0 16px 40px rgba(0, 0, 0, 0.35);
    opacity: 0;
    visibility: hidden;
    transform: translateY(12px);
    transform-origin: bottom center;
    transition: opacity 0.3s ease, transform 0.5s $ease_out_expo, visibility 0s linear 0.3s;

    :deep(.share) {
        margin: 0;
    }

    :deep(.share-buttons) {
        flex-direction: column;
        flex-wrap: nowrap;
        gap: 6px;
    }

    :deep(.share-buttons__btn) {
        opacity: 0;
        transform: translateY(10px);
        transition:
            opacity 0.3s ease,
            transform 0.5s $ease_out_expo,
            background-color 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
    }

    @for $i from 1 through 8 {
        :deep(.share-buttons__btn:nth-child(#{$i})) {
            transition-delay: #{(8 - $i) * 30}ms, #{(8 - $i) * 30}ms, 0s, 0s, 0s;
        }
    }
}

.is-open .share-site__panel {
    opacity: 1;
    visibility: visible;
    transform: none;
    transition: opacity 0.3s ease, transform 0.5s $ease_out_expo, visibility 0s;

    :deep(.share-buttons__btn) {
        opacity: 1;
        transform: none;

        &:hover,
        &:focus-visible {
            transform: translateX(2px);
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .share-site__panel,
    .share-site__panel :deep(.share-buttons__btn) {
        transform: none;
    }
}
</style>
