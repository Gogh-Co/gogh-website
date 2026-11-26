<template>
    <div class="share" :class="{ 'share--start': align === 'start' }">
        <div class="share-buttons" role="group" :aria-label="`Share ${themeName || 'Gogh'}`">
            <a
                v-for="network in networks"
                :key="network.id"
                class="share-buttons__btn"
                :style="{ '--brand': network.color, '--brand-ink': network.ink }"
                :href="network.href"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`Share on ${network.label}`"
                :title="labels ? null : network.label"
            >
                <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                    <path v-for="(d, index) in network.paths" :key="index" fill="currentColor" :d="d" />
                </svg>
                <span v-if="labels" class="share-buttons__label" aria-hidden="true">{{ network.label }}</span>
            </a>

            <button
                type="button"
                class="share-buttons__btn share-buttons__btn--copy"
                :class="{ 'is-copied': copied }"
                :style="copied ? null : { '--brand': copyColor.color, '--brand-ink': copyColor.ink }"
                :aria-label="copied ? 'Link copied' : 'Copy link'"
                :title="labels ? null : (copied ? 'Copied' : 'Copy link')"
                @click="copyLink"
            >
                <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
                    <path v-for="(d, index) in (copied ? ICONS.check : ICONS.link)" :key="index" fill="currentColor" :d="d" />
                </svg>
                <span v-if="labels" class="share-buttons__label" aria-hidden="true">{{ copied ? 'Copied' : 'Copy link' }}</span>
            </button>
            <span class="share-buttons__status" role="status" aria-live="polite">{{ copied ? 'Link copied' : '' }}</span>
        </div>

        <nav v-if="previews" class="share-previews" aria-label="Preview the share card">
            <span class="share-previews__label">Preview card</span>
            <template v-for="(tool, index) in previewTools" :key="tool.id">
                <span v-if="index" class="share-previews__sep" aria-hidden="true">·</span>
                <a
                    class="share-previews__link"
                    :href="tool.href"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="tool.title"
                >{{ tool.label }}</a>
            </template>
        </nav>
    </div>
</template>

<script setup>
// Icon-only share links: no marketing copy, just the site
// URL (the theme name rides along as the post text where a network takes
// one). Icons: Bootstrap Icons (MIT), 16x16 viewBox. Colours come from the
// theme being previewed, so the row matches whatever scheme is open.
import chroma from 'chroma-js';

const props = defineProps({
    themeName: {
        type: String,
        default: '',
    },
    theme: {
        type: Object,
        default: null,
    },
    // Page to share; the site root when empty.
    url: {
        type: String,
        default: '',
    },
    // The "Preview card" debugger links under the icons.
    previews: {
        type: Boolean,
        default: true,
    },
    // A visible name per button (styled by the parent) instead of the
    // native title tooltip.
    labels: {
        type: Boolean,
        default: false,
    },
    // 'center' (theme page) or 'start' (footer).
    align: {
        type: String,
        default: 'center',
    },
    // What the buttons sit on; icons are pushed away from it until they
    // reach 3:1 (lighter on dark backdrops, darker on light ones).
    backdrop: {
        type: String,
        default: '#05080c',
    },
});

// Each network takes the ANSI slot closest to its brand colour.
const NETWORK_SLOTS = {
    x: 'foreground',
    facebook: 'color_05',
    linkedin: 'color_13',
    reddit: 'color_02',
    bluesky: 'color_07',
    whatsapp: 'color_03',
    telegram: 'color_15',
    copy: 'color_06',
};

// Any theme colour under 3:1 against the backdrop gets brightened (or
// darkened, on a light backdrop) so every icon stays visible.
const MIN_CONTRAST = 3;
const FALLBACK = '#ffffff';

function swatch(key) {
    const raw = props.theme?.[key];
    if (!raw || !chroma.valid(raw)) {
        return { color: FALLBACK, ink: '#0d1926' };
    }
    let color = chroma(raw);
    const backdrop = chroma.valid(props.backdrop) ? props.backdrop : '#05080c';
    const lightBackdrop = chroma(backdrop).luminance() > 0.4;
    for (let step = 0; step < 8 && chroma.contrast(color, backdrop) < MIN_CONTRAST; step++) {
        color = lightBackdrop ? color.darken(0.5) : color.brighten(0.5);
    }
    // Icon colour on hover (filled button): the theme background when it
    // reads on the fill, else whichever of black/white contrasts more.
    const background = props.theme?.background;
    let ink = chroma.contrast(color, '#000000') >= chroma.contrast(color, '#ffffff') ? '#000000' : '#ffffff';
    if (background && chroma.valid(background) && chroma.contrast(color, background) >= 3) {
        ink = chroma(background).hex();
    }
    return { color: color.hex(), ink };
}

const copyColor = computed(() => swatch(NETWORK_SLOTS.copy));

const ICONS = {
    x: ['M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z'],
    facebook: ['M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951'],
    linkedin: ['M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z'],
    reddit: [
        'M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z',
        'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165',
    ],
    bluesky: ['M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692-.572 2.04-2.653 2.561-4.504 2.246 3.236.551 4.06 2.375 2.281 4.2-3.376 3.464-4.852-.87-5.23-1.98-.07-.204-.103-.3-.103-.218 0-.081-.033.014-.102.218-.379 1.11-1.855 5.444-5.231 1.98-1.778-1.825-.955-3.65 2.28-4.2-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632 0 .186 2.145.955 3.468 1.948'],
    whatsapp: ['M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232'],
    telegram: ['M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09'],
    link: [
        'M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z',
        'M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z',
    ],
    check: ['M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0'],
};

const shareUrl = computed(() => props.url || `${SITE_URL}/`);

// Official card debuggers (they also refresh a network's cached preview)
// plus two multi-network previewers. X and Bluesky have no public tool.
const previewTools = computed(() => {
    const url = encodeURIComponent(shareUrl.value);
    return [
        { id: 'facebook', label: 'Facebook', title: 'Facebook Sharing Debugger (also WhatsApp)', href: `https://developers.facebook.com/tools/debug/?q=${url}` },
        { id: 'linkedin', label: 'LinkedIn', title: 'LinkedIn Post Inspector', href: `https://www.linkedin.com/post-inspector/inspect/${url}` },
        { id: 'opengraph', label: 'OpenGraph.xyz', title: 'Preview on several networks at once', href: `https://www.opengraph.xyz/url/${url}` },
        { id: 'metatags', label: 'Metatags.io', title: 'Preview on several networks at once', href: `https://metatags.io/?url=${url}` },
    ];
});

const networks = computed(() => {
    const url = encodeURIComponent(shareUrl.value);
    const name = props.themeName.trim();
    const text = encodeURIComponent(name ? `${name} · Gogh` : 'Gogh');
    const textWithUrl = encodeURIComponent(`${name ? `${name} · Gogh` : 'Gogh'} ${shareUrl.value}`);

    return [
        { id: 'x', label: 'X', paths: ICONS.x, href: `https://x.com/intent/post?url=${url}&text=${text}` },
        { id: 'facebook', label: 'Facebook', paths: ICONS.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
        { id: 'linkedin', label: 'LinkedIn', paths: ICONS.linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` },
        { id: 'reddit', label: 'Reddit', paths: ICONS.reddit, href: `https://www.reddit.com/submit?url=${url}&title=${text}` },
        { id: 'bluesky', label: 'Bluesky', paths: ICONS.bluesky, href: `https://bsky.app/intent/compose?text=${textWithUrl}` },
        { id: 'whatsapp', label: 'WhatsApp', paths: ICONS.whatsapp, href: `https://wa.me/?text=${textWithUrl}` },
        { id: 'telegram', label: 'Telegram', paths: ICONS.telegram, href: `https://t.me/share/url?url=${url}&text=${text}` },
    ].map((network) => ({ ...network, ...swatch(NETWORK_SLOTS[network.id]) }));
});

const copied = ref(false);
let copiedTimer = null;

async function copyLink() {
    try {
        await navigator.clipboard.writeText(shareUrl.value);
    } catch {
        return;
    }
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
        copied.value = false;
    }, 2000);
}

onBeforeUnmount(() => clearTimeout(copiedTimer));
</script>

<style lang="scss" scoped>
// Square, bordered, icon-only: same language as the preview tabs and the
// page's filter buttons. px: this site's rem is 10px.
.share {
    margin: 0 0 24px;
}

.share--start {
    margin: 0;

    .share-buttons,
    .share-previews {
        justify-content: flex-start;
    }
}

.share-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
}

// Discreet text line under the icons: where to check the share card.
.share-previews {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 6px;
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    letter-spacing: 0.5px;
}

.share-previews__label {
    text-transform: uppercase;
}

.share-previews__link {
    color: rgba(255, 255, 255, 0.78);
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
    transition: color 0.2s ease, border-color 0.2s ease;

    &:hover,
    &:focus-visible {
        color: #ffffff;
        border-bottom-color: #ffffff;
    }

    &:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }
}

.share-buttons__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    // Wireframe kept (1px border, transparent fill); each network takes a
    // colour from the open theme for icon and border, and fills with it on hover.
    border: 1px solid color-mix(in srgb, var(--brand, #ffffff) 55%, transparent);
    border-radius: 0;
    background: color-mix(in srgb, var(--brand, #ffffff) 8%, transparent);
    color: var(--brand, #ffffff);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover,
    &:focus-visible {
        border-color: var(--brand, #ffffff);
        background: var(--brand, #ffffff);
        color: var(--brand-ink, #ffffff);
        transform: translateY(-2px);
    }

    &:focus-visible {
        outline: 2px solid var(--brand, #ffffff);
        outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
        &:hover,
        &:focus-visible {
            transform: none;
        }
    }

    &.is-copied {
        --brand: #47af32;
        border-color: #47af32;
        background: #47af32;
        color: #ffffff;
    }
}

.share-buttons__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}
</style>
