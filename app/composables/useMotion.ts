import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Shared motion setup for the redesigned pages: GSAP + ScrollTrigger for
// scroll-driven animation, Lenis for inertial smooth scrolling. Everything
// here is client-only; on the server the helpers are inert.

let pluginsRegistered = false;
let lenis: Lenis | null = null;
let lenisUsers = 0;
let tickerCallback: ((time: number) => void) | null = null;

function ensurePlugins() {
    if (import.meta.client && !pluginsRegistered) {
        gsap.registerPlugin(ScrollTrigger);
        pluginsRegistered = true;
    }
}

export function prefersReducedMotion(): boolean {
    return import.meta.client
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useGsap() {
    ensurePlugins();
    return { gsap, ScrollTrigger };
}

// Starts Lenis for the calling page (ref-counted, so overlapping page
// transitions don't tear it down early) and drives it from GSAP's ticker so
// ScrollTrigger and the smooth scroll stay in lockstep. Skipped entirely for
// visitors who ask for reduced motion.
export function useSmoothScroll() {
    ensurePlugins();

    function start() {
        if (!import.meta.client || prefersReducedMotion()) {
            return;
        }

        lenisUsers += 1;
        if (lenis) {
            return;
        }

        lenis = new Lenis({
            duration: 1.15,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            anchors: { offset: -72 },
            // Overlays (lightboxes, menus) scroll natively.
            prevent: (node: HTMLElement) => !!node.closest?.('[data-lenis-prevent]'),
        });

        lenis.on('scroll', ScrollTrigger.update);
        tickerCallback = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tickerCallback);
        gsap.ticker.lagSmoothing(0);
    }

    function stop() {
        if (!import.meta.client) {
            return;
        }

        lenisUsers = Math.max(0, lenisUsers - 1);
        if (lenisUsers > 0 || !lenis) {
            return;
        }

        if (tickerCallback) {
            gsap.ticker.remove(tickerCallback);
            tickerCallback = null;
        }
        lenis.destroy();
        lenis = null;
    }

    return { start, stop };
}

export function getLenis(): Lenis | null {
    return lenis;
}

// Scroll offset for an anchor target. Elements marked data-anchor="center"
// (the theme page's live terminal) sit in the middle of the viewport, never
// under the fixed header; anything else lines up with the top.
export function anchorOffset(element: Element, headerSpace = 88): number {
    if (!import.meta.client || (element as HTMLElement).dataset?.anchor !== 'center') {
        return 0;
    }
    const free = window.innerHeight - element.getBoundingClientRect().height;
    return -Math.max(headerSpace, free / 2);
}

// Smoothly scrolls to a target (element, selector or pixel offset), using
// Lenis when it's running and the native API otherwise.
export function scrollToTarget(target: string | HTMLElement | number, offset = -72) {
    if (!import.meta.client) {
        return;
    }

    // Resolve to an absolute offset from the real scroll position. Lenis would
    // measure an element against its own cached position, which is stale when
    // the page just got shorter (e.g. Shuffle trims the gallery back to its
    // first batch and the browser clamps the scroll), and land short.
    let top: number;
    if (typeof target === 'number') {
        top = target + offset;
    } else {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) {
            return;
        }
        top = element.getBoundingClientRect().top + window.scrollY + offset;
    }

    if (lenis) {
        // Start the animation from where the page really is.
        lenis.reset();
        lenis.scrollTo(top, { duration: 1.4 });
        return;
    }

    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

// Pauses the page's smooth scroll while an overlay is open (so the wheel
// doesn't move the page behind it) and resumes it afterwards.
export function setPageScrollLocked(locked: boolean) {
    if (!lenis) {
        return;
    }
    if (locked) {
        lenis.stop();
    } else {
        lenis.start();
    }
}
