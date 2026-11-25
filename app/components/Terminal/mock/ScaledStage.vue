<template>
    <!-- Desktop mockups are laid out at a fixed design size and scaled to
         the available width, so they read like a screenshot on any screen
         instead of reflowing or scrolling sideways. -->
    <div ref="root" class="scaled-stage" :style="{ aspectRatio: `${width} / ${height}` }">
        <div
            class="scaled-stage__inner"
            :style="{ width: `${width}px`, height: `${height}px`, '--stage-scale': scale }"
        >
            <slot />
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    width: {
        type: Number,
        default: 1100,
    },
    height: {
        type: Number,
        default: 620,
    },
});

const root = ref(null);
// Unset until mounted: until then the CSS container-query fallback below
// sizes the mockup, so the server-rendered page is already close to right.
const scale = ref(null);
let observer = null;

function measure() {
    if (root.value?.clientWidth) {
        scale.value = root.value.clientWidth / props.width;
    }
}

onMounted(() => {
    measure();
    if (typeof ResizeObserver !== 'undefined' && root.value) {
        observer = new ResizeObserver(measure);
        observer.observe(root.value);
    }
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style lang="scss" scoped>
@use 'sass:math';

.scaled-stage {
    container-type: inline-size;
    position: relative;
    width: 100%;
    overflow: hidden;
    margin: 0 0 30px;
    border-radius: 10px;
    box-shadow: 2px 4px 20px rgba(27, 27, 27, 0.6);
}

.scaled-stage__inner {
    --fallback-scale: 0.25;
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(var(--stage-scale, var(--fallback-scale)));
    transform-origin: top left;
}

// Pre-hydration fallback in 25px steps, for the 1100px design width both
// desktop mockups use. JS replaces it with the exact ratio on mount.
@for $step from 11 through 48 {
    $stage-width: $step * 25;
    @container (min-width: #{$stage-width}px) {
        .scaled-stage__inner {
            --fallback-scale: #{math.div($stage-width, 1100)};
        }
    }
}
</style>
