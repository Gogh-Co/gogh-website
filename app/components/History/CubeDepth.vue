<template>
    <canvas
        ref="canvas"
        class="cube-depth"
        :class="{ 'is-ready': ready }"
        :data-depth-state="ready ? 'active' : 'static'"
        width="1672"
        height="941"
        aria-hidden="true"
    ></canvas>
</template>

<script setup lang="ts">
import type { CubeDepthRenderer } from '~/utils/cubeDepthRenderer';

const props = withDefaults(defineProps<{ source: string; enabled?: boolean }>(), { enabled: true });
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
let renderer: CubeDepthRenderer | null = null;
let pending: AbortController | null = null;
let media: MediaQueryList | null = null;
let intersection: IntersectionObserver | null = null;
let resize: ResizeObserver | null = null;
let stage: HTMLElement | null = null;
let track: HTMLElement | null = null;
let poster: HTMLImageElement | null = null;
let posterOpacity = '';
let inView = false;
let destroyed = false;
let mouseCapable = false;
let pointerX = 0;
let pointerY = 0;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));
const visible = () => props.enabled && inView && mouseCapable && !document.hidden && !!media?.matches;

function updatePose() {
    if (!renderer || !track || !visible()) return;
    const box = track.getBoundingClientRect();
    const scroll = clamp(((innerHeight * .5 - box.top) / Math.max(box.height, innerHeight) - .5) * 2);
    renderer.setPose(pointerX, pointerY, scroll);
}

function onPointer(event: PointerEvent) {
    if (!props.enabled || !canvas.value || event.pointerType !== 'mouse' || !media?.matches || !inView) return;
    // Hybrid laptops and streamed browser views can report no primary mouse.
    // An actual mouse event is also sufficient evidence of pointer support.
    if (!mouseCapable) { mouseCapable = true; sync(); }
    const box = canvas.value.getBoundingClientRect();
    pointerX = clamp(((event.clientX - box.left) / box.width - .5) * 2);
    pointerY = clamp(((event.clientY - box.top) / box.height - .5) * 2);
    updatePose();
}

function resetPointer() {
    pointerX = pointerY = 0;
    updatePose();
}

function fit() {
    if (!canvas.value || !renderer) return;
    renderer.resize(canvas.value.clientWidth, canvas.value.clientHeight);
    updatePose();
}

function release() {
    pending?.abort();
    pending = null;
    renderer?.dispose();
    renderer = null;
    ready.value = false;
    if (poster) poster.style.opacity = posterOpacity;
    pointerX = pointerY = 0;
}

async function sync() {
    if (destroyed || !props.enabled || !media?.matches) { release(); return; }
    if (renderer) { renderer.setVisible(visible()); updatePose(); return; }
    if (!visible() || pending || !canvas.value) return;
    const request = new AbortController();
    pending = request;
    try {
        const { createCubeDepthRenderer } = await import('~/utils/cubeDepthRenderer');
        if (request.signal.aborted) return;
        const result = await createCubeDepthRenderer(canvas.value, props.source, request.signal);
        if (destroyed || !props.enabled || request.signal.aborted || !media.matches) { result?.dispose(); return; }
        renderer = result;
        if (!renderer) return;
        fit();
        renderer.setVisible(visible());
        ready.value = true;
        // Keep the accessible image in the layout, but avoid compositing its
        // feathered edges twice beneath the identical WebGL texture.
        if (poster) poster.style.opacity = '0';
    } catch {
        release();
    } finally {
        if (pending === request) pending = null;
    }
}

function contextLost(event: Event) {
    event.preventDefault();
    release();
}

watch(() => props.enabled, sync, { flush: 'post' });

onMounted(() => {
    if (!canvas.value) return;
    stage = canvas.value.closest('.h-stage__sticky');
    track = canvas.value.closest('.h-stage');
    const sibling = canvas.value.previousElementSibling;
    if (sibling instanceof HTMLImageElement) {
        poster = sibling;
        posterOpacity = poster.style.opacity;
    }
    // Unknown input capabilities are common in desktop webviews. Only a
    // coarse-only device needs the static version; an attached mouse can opt in.
    mouseCapable = !window.matchMedia('(pointer: coarse)').matches
        || window.matchMedia('(any-pointer: fine)').matches;
    media = window.matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)');
    media.addEventListener('change', sync);
    stage?.addEventListener('pointermove', onPointer, { passive: true });
    stage?.addEventListener('pointerleave', resetPointer);
    window.addEventListener('scroll', updatePose, { passive: true });
    document.addEventListener('visibilitychange', sync);
    canvas.value.addEventListener('webglcontextlost', contextLost);
    canvas.value.addEventListener('webglcontextrestored', sync);
    resize = new ResizeObserver(fit);
    resize.observe(canvas.value);
    intersection = new IntersectionObserver(([entry]) => {
        inView = !!entry?.isIntersecting;
        sync();
    }, { rootMargin: '200px' });
    intersection.observe(canvas.value);
});

onBeforeUnmount(() => {
    destroyed = true;
    release();
    media?.removeEventListener('change', sync);
    stage?.removeEventListener('pointermove', onPointer);
    stage?.removeEventListener('pointerleave', resetPointer);
    window.removeEventListener('scroll', updatePose);
    document.removeEventListener('visibilitychange', sync);
    canvas.value?.removeEventListener('webglcontextlost', contextLost);
    canvas.value?.removeEventListener('webglcontextrestored', sync);
    resize?.disconnect();
    intersection?.disconnect();
});
</script>

<style scoped>
.cube-depth {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: auto;
    aspect-ratio: 1672 / 941;
    transform: translateY(-50%);
    opacity: 0;
    pointer-events: none;
}

.cube-depth.is-ready { opacity: 1; }

@media (max-width: 991.98px), (prefers-reduced-motion: reduce) {
    .cube-depth.cube-depth { display: none; transition: none; }
}
</style>
