import type { Ref } from 'vue';

// Reveals gallery cards as they scroll into view: each batch of cards that
// enters together is staggered in reading order (a wave), the card fades in
// where it stands, then its swatches flip from bits to colors and its name
// decodes from binary (only once the card is in place, so they never mix).
//
// Cards are `.gallery-card` elements inside `grid`. The hidden starting state
// only applies while the grid has `.is-animated`, which is added on mount,
// so server-rendered HTML (and reduced-motion visitors) always see the cards.

const STAGGER_MS = 38;
const MAX_STAGGER_STEPS = 22;
// Matches the longest CSS transition in the reveal (see index.scss).
const SETTLE_MS = 2000;
const NAME_SELECTOR = '.compact-card__name, .bar__title';

export function useGalleryReveal(grid: Ref<HTMLElement | null>) {
    const enabled = ref(false);
    let observer: IntersectionObserver | null = null;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    function later(fn: () => void, ms: number) {
        const timer = setTimeout(() => {
            timers.delete(timer);
            fn();
        }, ms);
        timers.add(timer);
    }

    function reveal(card: HTMLElement, delay: number) {
        card.style.setProperty('--reveal-delay', `${delay}ms`);
        card.classList.add('is-revealed');
        binaryDecode(card.querySelector(NAME_SELECTOR), { delay: delay + 360, duration: 600 });
        // Detailed view: the color lines and the command decode as they type in.
        binaryDecode(card.querySelector('.body__txt'), { delay: delay + 420, duration: 900 });
        binaryDecode(card.querySelector('.cmd'), { delay: delay + 1000, duration: 500 });
        later(() => {
            // Done: drop the delay so hover effects work normally.
            card.classList.add('is-settled');
            card.style.removeProperty('--reveal-delay');
        }, delay + SETTLE_MS);
    }

    function onIntersect(entries: IntersectionObserverEntry[]) {
        const entering = entries
            .filter((entry) => entry.isIntersecting)
            .map((entry) => entry.target as HTMLElement)
            .filter((card) => !card.classList.contains('is-revealed'));

        // Reading order: row by row, left to right.
        entering.sort((a, b) => {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left;
        });

        entering.forEach((card, index) => {
            observer?.unobserve(card);
            reveal(card, Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS);
        });
    }

    // Picks up cards rendered since the last call (infinite scroll batches).
    function observeNew() {
        if (!enabled.value || !observer || !grid.value) {
            return;
        }
        grid.value.querySelectorAll<HTMLElement>('.gallery-card:not([data-reveal-watch])').forEach((card) => {
            card.dataset.revealWatch = '1';
            observer?.observe(card);
        });
    }

    // Plays the wave again for every card (after a filter/sort/view change).
    function replay() {
        if (!enabled.value || !observer || !grid.value) {
            return;
        }
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
        grid.value.querySelectorAll<HTMLElement>('.gallery-card').forEach((card) => {
            card.classList.remove('is-revealed', 'is-settled');
            card.style.removeProperty('--reveal-delay');
            card.dataset.revealWatch = '1';
            observer?.unobserve(card);
            observer?.observe(card);
        });
    }

    onMounted(() => {
        if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
            return;
        }
        enabled.value = true;
        observer = new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -6% 0px' });
        nextTick(observeNew);
    });

    onBeforeUnmount(() => {
        observer?.disconnect();
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
    });

    return { enabled, observeNew, replay };
}
