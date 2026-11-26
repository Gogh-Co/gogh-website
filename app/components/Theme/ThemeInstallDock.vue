<template>
    <!-- Follows the reader once the hero's install box scrolls away and steps
         aside when the pager comes in. One click copies the install command
         for this theme. A miniature of the hero canvas paints behind it. -->
    <Teleport to="body">
        <div
            class="install-dock"
            :class="{ 'is-visible': visible, 'is-copied': copied }"
            :style="dockStyle"
            :aria-hidden="!visible"
        >
            <StarryCanvas
                :palette="palette"
                :background="background"
                :min-particles="70"
                :max-particles="140"
                :paused="!visible"
            />
            <span class="install-dock__veil" aria-hidden="true"></span>

            <button
                type="button"
                class="install-dock__button"
                :tabindex="visible ? 0 : -1"
                :aria-label="copied ? 'Install command copied' : `Copy the command that installs ${themeName}`"
                @click="copy"
            >
                <span class="install-dock__prompt" aria-hidden="true">$</span>
                <span class="install-dock__label">
                    <Transition name="dock-swap" mode="out-in">
                        <span v-if="copied" key="done">Copied. Paste it in your terminal</span>
                        <span v-else key="idle">Install <strong>{{ themeName }}</strong></span>
                    </Transition>
                </span>
                <span class="install-dock__icon" aria-hidden="true">
                    <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/></svg>
                </span>
            </button>
        </div>
    </Teleport>
</template>

<script setup>
import StarryCanvas from '@/components/Home/StarryCanvas.vue';

const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
    themeName: {
        type: String,
        required: true,
    },
});

const CHROMATIC_KEYS = ['color_02', 'color_03', 'color_04', 'color_05', 'color_06', 'color_07', 'color_10', 'color_11', 'color_12', 'color_13', 'color_14', 'color_15'];

const visible = ref(false);
const copied = ref(false);
let copiedTimer = null;
let ticking = false;

const background = computed(() => safeHex(props.theme.background) || '#0a0f14');
const palette = computed(() => CHROMATIC_KEYS.map((key) => safeHex(props.theme[key])).filter(Boolean));

const dockStyle = computed(() => ({
    '--dock-bg': background.value,
    '--dock-fg': safeHex(props.theme.foreground) || '#f4efe6',
    '--dock-a': palette.value[2] || '#F1C40F',
    '--dock-b': palette.value[3] || '#3498DB',
    '--dock-c': palette.value[1] || '#E74C3C',
    '--dock-d': palette.value[4] || '#9B59B6',
}));

function command() {
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    const base = isMac
        ? 'bash -c "$(curl -fsSL https://gogh.website/gogh)"'
        : 'bash -c "$(wget -qO- https://gogh.website/gogh)"';
    return `${base} -- "${props.themeName.replace(/"/g, '\\"')}"`;
}

async function copy() {
    try {
        await navigator.clipboard.writeText(command());
    } catch {
        // Insecure context or no permission: nothing else to try here, the
        // full command is in the hero.
        scrollToTarget('#theme-install', -160);
        return;
    }
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
        copied.value = false;
    }, 2200);
}

function update() {
    ticking = false;
    const install = document.getElementById('theme-install')?.getBoundingClientRect();
    const more = document.getElementById('theme-more')?.getBoundingClientRect();
    const pastInstall = !!install && install.bottom < 0;
    const reachedEnd = !!more && more.top < window.innerHeight * 0.9;
    visible.value = pastInstall && !reachedEnd;
}

function onScroll() {
    if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
    }
}

onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    clearTimeout(copiedTimer);
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.install-dock {
    position: fixed;
    bottom: 22px;
    left: 50%;
    z-index: 880;
    height: 58px;
    max-width: calc(100vw - 32px);
    overflow: hidden;
    isolation: isolate;
    background: var(--dock-bg);
    box-shadow: 0 24px 60px -18px rgba(0, 0, 0, 0.7);
    // Hidden: collapsed to a sliver and dropped below the screen edge.
    opacity: 0;
    pointer-events: none;
    clip-path: inset(0 50% 0 50%);
    transform: translate(-50%, 28px);
    transition:
        clip-path 0.9s $ease_out_expo,
        transform 0.9s $ease_out_expo,
        opacity 0.3s ease;

    &.is-visible {
        opacity: 1;
        pointer-events: auto;
        clip-path: inset(0 0 0 0);
        transform: translate(-50%, 0);
    }

    // Palette border: a turning conic gradient 1.5px around the canvas.
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        background: conic-gradient(from var(--dock-angle), var(--dock-a), var(--dock-c), var(--dock-d), var(--dock-b), var(--dock-a));
        animation: dock-spin 4s linear infinite;
        pointer-events: none;
    }

    .starry-canvas {
        top: 1.5px;
        left: 1.5px;
        z-index: 1;
        width: calc(100% - 3px);
        height: calc(100% - 3px);
    }
}

.install-dock__veil {
    position: absolute;
    inset: 1.5px;
    z-index: 2;
    background: radial-gradient(80% 120% at 50% 50%, color-mix(in srgb, var(--dock-bg) 82%, transparent), color-mix(in srgb, var(--dock-bg) 40%, transparent));
    opacity: 0.78;
    transition: opacity 0.5s ease;
    pointer-events: none;
}

.install-dock__button {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: 14px;
    height: 100%;
    min-width: 280px;
    max-width: 100%;
    padding: 0 10px 0 22px;
    border: 0;
    background: transparent;
    color: var(--dock-fg);
    font-size: 1.5rem;
    white-space: nowrap;
    cursor: pointer;

    &:hover .install-dock__icon {
        transform: scale(1.06);
    }

    &:focus-visible {
        outline: 2px solid var(--dock-fg);
        outline-offset: -5px;
    }

    @media (max-width: 420px) {
        min-width: 0;
    }
}

.install-dock:hover .install-dock__veil {
    opacity: 0.4;
}

.install-dock__prompt {
    color: var(--dock-a);
    font-family: $font_mono;
}

.install-dock__label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;

    strong {
        font-weight: 700;
    }

    > span {
        display: inline-block;
    }
}

.install-dock__icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--dock-fg);
    color: var(--dock-bg);
    transition: transform 0.5s $ease_out_expo, background-color 0.3s ease;

    .is-copied & {
        background: var(--dock-a);
    }
}

.dock-swap-enter-active,
.dock-swap-leave-active {
    transition: opacity 0.25s ease, transform 0.4s $ease_out_expo;
}

.dock-swap-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.dock-swap-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@property --dock-angle {
    syntax: '<angle>';
    inherits: false;
    initial-value: 0deg;
}

@keyframes dock-spin {
    to {
        --dock-angle: 360deg;
    }
}
</style>
