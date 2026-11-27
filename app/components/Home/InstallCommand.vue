<template>
    <div class="install-cmd" :class="`install-cmd--${tone}`">
        <div class="install-cmd__tabs" role="tablist" :aria-label="t('install.osAria')">
            <button
                v-for="option in OPTIONS"
                :key="option.id"
                type="button"
                role="tab"
                class="install-cmd__tab"
                :class="{ 'is-active': os === option.id }"
                :aria-selected="os === option.id"
                @click="os = option.id"
            >
                {{ option.label }}
            </button>
            <span class="install-cmd__tab-indicator" :style="indicatorStyle" aria-hidden="true"></span>
        </div>

        <div class="install-cmd__box">
            <span class="install-cmd__prompt" aria-hidden="true">$</span>
            <code class="install-cmd__code">
                <Transition name="cmd-swap" mode="out-in">
                    <span :key="os">{{ command }}</span>
                </Transition>
            </code>
            <button
                type="button"
                class="install-cmd__copy"
                :class="{ 'is-copied': copied }"
                :aria-label="copied ? t('common.copied') : t('install.copyAria')"
                @click="copy"
            >
                <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 18q-.825 0-1.412-.587T7 16V4q0-.825.588-1.412T9 2h9q.825 0 1.413.588T20 4v12q0 .825-.587 1.413T18 18zm0-2h9V4H9zm-4 6q-.825 0-1.412-.587T3 20V6h2v14h11v2zm4-6V4z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/></svg>
                <span class="install-cmd__copy-label">{{ copied ? t('common.copied') : t('common.copy') }}</span>
            </button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    // "glass" sits on the animated hero, "solid" on plain dark sections.
    tone: {
        type: String,
        default: 'glass',
    },
    // Installs this theme directly instead of opening the interactive menu.
    themeName: {
        type: String,
        default: '',
    },
    // Where the box sits, for analytics ("home-hero", "theme-hero"...).
    place: {
        type: String,
        default: '',
    },
});

const { t } = useI18n();

const OPTIONS = [
    { id: 'linux', label: 'Linux · wget', command: 'bash -c "$(wget -qO- https://gogh.website/gogh)"' },
    { id: 'mac', label: 'macOS · curl', command: 'bash -c "$(curl -fsSL https://gogh.website/gogh)"' },
];

const os = ref('linux');
const copied = ref(false);
let copiedTimer = null;

const command = computed(() => {
    const base = OPTIONS.find((option) => option.id === os.value)?.command ?? OPTIONS[0].command;
    return props.themeName ? `${base} -- "${props.themeName.replace(/"/g, '\\"')}"` : base;
});
const indicatorStyle = computed(() => {
    const index = OPTIONS.findIndex((option) => option.id === os.value);
    return { transform: `translateX(${index * 100}%)` };
});

async function copy() {
    try {
        await navigator.clipboard.writeText(command.value);
    } catch {
        // Older browsers / insecure contexts: fall back to a hidden textarea.
        const area = document.createElement('textarea');
        area.value = command.value;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try {
            document.execCommand('copy');
        } catch {
            // Nothing else to try.
        }
        area.remove();
    }

    copied.value = true;
    trackEvent('Install Copy', { place: props.place, os: os.value, theme: props.themeName || 'menu' });
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
        copied.value = false;
    }, 1800);
}

onMounted(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
        os.value = 'mac';
    }
});

onBeforeUnmount(() => clearTimeout(copiedTimer));
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.install-cmd {
    width: 100%;
    max-width: 640px;
}

.install-cmd__tabs {
    position: relative;
    display: inline-grid;
    grid-template-columns: 1fr 1fr;
    margin: 0 0 10px;
    padding: 4px;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    background: rgba(255, 255, 255, 0.04);
}

.install-cmd__tab {
    position: relative;
    z-index: 1;
    min-height: 36px;
    padding: 0 16px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    font-family: $font_default;
    font-size: 1.2rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    cursor: pointer;
    transition: color 0.3s ease;

    &.is-active {
        color: var(--ink);
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 2px;
    }
}

.install-cmd__tab-indicator {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc(50% - 4px);
    border-radius: 0;
    background: var(--cream);
    transition: transform 0.5s $ease_out_expo;
}

.install-cmd__box {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 8px 8px 18px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 0;
    background: rgba(10, 15, 20, 0.55);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);

    .install-cmd--solid & {
        background: var(--ink-2);
        backdrop-filter: none;
    }
}

.install-cmd__prompt {
    flex: 0 0 auto;
    color: var(--gogh-green);
    font-family: $font_mono;
    font-size: 1.5rem;
}

.install-cmd__code {
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    padding: 0;
    background: none;
    color: var(--cream);
    font-family: $font_mono;
    font-size: 1.4rem;
    white-space: nowrap;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    span {
        display: inline-block;
    }

    @include m768 {
        font-size: 1.5rem;
    }
}

.install-cmd__copy {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
    height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 0;
    background: var(--cream);
    color: var(--ink);
    font-size: 1.3rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.4s $ease_out_expo, background-color 0.3s ease;

    &:hover {
        transform: translateY(-1px) scale(1.03);
    }

    &:active {
        transform: scale(0.97);
    }

    &.is-copied {
        background: var(--gogh-green);
    }

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 2px;
    }
}

.install-cmd__copy-label {
    @media (max-width: 420px) {
        display: none;
    }
}

.cmd-swap-enter-active,
.cmd-swap-leave-active {
    transition: opacity 0.25s ease, transform 0.35s $ease_out_expo;
}

.cmd-swap-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.cmd-swap-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
