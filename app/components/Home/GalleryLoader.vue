<template>
    <div class="gallery-loader" :class="{ 'is-loading': loading, 'is-done': done }" aria-hidden="true">
        <div class="gallery-loader__line">
            <span class="gallery-loader__prompt">❯</span>
            <span class="gallery-loader__cmd">gogh</span>
            <span class="gallery-loader__flag">{{ done ? '--done' : '--load' }}</span>
            <span class="gallery-loader__bits">{{ bits }}</span>
            <span class="gallery-loader__count">
                <b>{{ String(loaded).padStart(String(total).length, '0') }}</b>/{{ total }}
            </span>
        </div>

        <div class="gallery-loader__bar">
            <i
                v-for="(color, index) in PALETTE"
                :key="index"
                :style="{ '--c': color, '--fill': segmentFill(index) }"
            ></i>
        </div>

        <div class="gallery-loader__status">
            {{ done ? `All ${total} themes decoded` : loading ? 'Decoding the next palettes…' : 'Scroll to decode more' }}
        </div>
    </div>
</template>

<script setup>
// The end-of-gallery strip: a fake `gogh --load` command whose binary stream
// flickers while the next batch of themes "decodes", and a 16-segment bar in
// the Gogh palette that fills with the share of the collection on screen.

const props = defineProps({
    loaded: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
    loading: {
        type: Boolean,
        default: false,
    },
});

const PALETTE = [
    '#243342', '#C54133', '#27AE60', '#EDB20A', '#2479D0', '#7D3EA0', '#1D8579', '#C9CCCD',
    '#34495E', '#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#2AA198', '#ECF0F1',
];

const BIT_GROUPS = 4;
// Static on the server (and with reduced motion); flickers on the client.
const bits = ref(Array.from({ length: BIT_GROUPS }, () => '01100111').join(' '));
let timer = null;

const done = computed(() => props.total > 0 && props.loaded >= props.total);
const ratio = computed(() => (props.total ? Math.min(1, props.loaded / props.total) : 0));

function segmentFill(index) {
    const span = 1 / PALETTE.length;
    return Math.max(0, Math.min(1, (ratio.value - index * span) / span));
}

function flicker() {
    bits.value = Array.from({ length: BIT_GROUPS }, () => randomBits(8)).join(' ');
}

// Fast while a batch loads, a slow idle shimmer otherwise, frozen when done.
function schedule() {
    clearInterval(timer);
    timer = null;
    if (done.value || prefersReducedMotion()) {
        return;
    }
    timer = setInterval(flicker, props.loading ? 55 : 420);
}

watch(() => [props.loading, done.value], schedule);

onMounted(schedule);
onBeforeUnmount(() => clearInterval(timer));
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.gallery-loader {
    max-width: 2100px;
    margin: 24px auto 0;
    padding: 28px 0 8px;
    border-top: 1px solid color-mix(in srgb, var(--site-foreground) 14%, transparent);
    color: var(--site-foreground);
}

.gallery-loader__line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 12px;
    font-family: $font_mono;
    font-size: 1.3rem;

    @include m768 {
        font-size: 1.5rem;
    }
}

.gallery-loader__prompt {
    color: #27ae60;
}

.gallery-loader__cmd {
    font-weight: 500;
}

.gallery-loader__flag {
    color: #c54133;
}

.gallery-loader__bits {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    color: color-mix(in srgb, var(--site-foreground) 45%, transparent);
    letter-spacing: 0.08em;
    white-space: nowrap;
    text-overflow: clip;
    transition: color 0.3s ease;

    .is-loading & {
        color: #2479d0;
    }

    .is-done & {
        color: #27ae60;
    }
}

.gallery-loader__count {
    color: color-mix(in srgb, var(--site-foreground) 60%, transparent);
    font-variant-numeric: tabular-nums;

    b {
        color: var(--site-foreground);
        font-weight: 500;
    }
}

.gallery-loader__bar {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 3px;
    height: 8px;
    margin: 16px 0 12px;

    i {
        position: relative;
        overflow: hidden;
        background: color-mix(in srgb, var(--site-foreground) 10%, transparent);

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            background: var(--c);
            transform: scaleX(var(--fill));
            transform-origin: left center;
            transition: transform 0.9s $ease_out_expo;
        }
    }

    // While loading, the next empty segment pulses.
    .is-loading & i::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
        transform: translateX(-100%);
        animation: scan 0.7s linear infinite;
    }
}

.gallery-loader__status {
    margin: 0;
    color: color-mix(in srgb, var(--site-foreground) 55%, transparent);
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

@keyframes scan {
    to {
        transform: translateX(100%);
    }
}
</style>
