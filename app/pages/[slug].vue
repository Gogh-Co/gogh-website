<template>
    <!-- Dark themes let the hero run under the transparent bar, like the home
         page; light ones keep the solid bar so its light text stays legible. -->
    <Header :overlay="summary.variant === 'dark'" />

    <main class="theme-page" :style="pageContentStyle">
        <ThemeHero
            :theme="theme"
            :theme-name="themeName"
            :variant="summary.variant"
            :author-name="authorName"
            :author-url="authorUrl"
            :url="pageUrl"
            :previous="previous"
            :next="next"
            :pressed-key="pressedArrow"
        />

        <ThemePalette :theme="theme" :theme-name="themeName" :summary="summary" />

        <ThemeReading :theme="theme" :theme-name="themeName" :sentences="summary.sentences" />

        <ThemeSession :theme="theme" :theme-name="themeName" />

        <ThemePreviews :theme="theme" :theme-name="themeName" />

        <ThemePager
            :theme="theme"
            :theme-name="themeName"
            :url="pageUrl"
            :previous="previous"
            :next="next"
            :total="total"
        />
    </main>

    <ClientOnly>
        <ThemeInstallDock :theme="theme" :theme-name="themeName" />
        <ThemeSwipe :previous="previous" :next="next" />
    </ClientOnly>
</template>

<script setup>
import Header from '@/components/Header/Header.vue';
import ThemeHero from '@/components/Theme/ThemeHero.vue';
import ThemePalette from '@/components/Theme/ThemePalette.vue';
import ThemeReading from '@/components/Theme/ThemeReading.vue';
import ThemeSession from '@/components/Theme/ThemeSession.vue';
import ThemePreviews from '@/components/Theme/ThemePreviews.vue';
import ThemePager from '@/components/Theme/ThemePager.vue';
import ThemeInstallDock from '@/components/Theme/ThemeInstallDock.vue';
import ThemeSwipe from '@/components/Theme/ThemeSwipe.vue';

// The previews section follows the page's light/dark toggle (the gallery's
// paper and ink); the hero and the reading section wear the theme itself.
const PAGE_THEME_LIGHT_STYLE = {
    '--site-background': '#EFEBE3',
    '--site-foreground': '#0d1926',
};

const PAGE_THEME_DARK_STYLE = {
    '--site-background': '#121F2A',
    '--site-foreground': '#e7e7e7',
    '--code-block-background': '#0d1926',
    '--code-block-foreground': '#e7e7e7',
};

// Neighbour cards preview their theme on hover: base colors plus the palette.
const NEIGHBOUR_COLOR_KEYS = Array.from({ length: 16 }, (_, index) => `color_${String(index + 1).padStart(2, '0')}`);

const route = useRoute();
const slug = String(route.params.slug || '').toLowerCase();

// Only this theme and its alphabetical neighbours go into the page payload,
// not the whole ~1,200-theme list.
const { data } = await useAsyncData(`theme-page-${slug}`, async () => {
    const list = await fetchThemeList().catch(() => []);
    const sorted = list
        .filter((theme) => getThemeDisplayName(theme))
        .sort((a, b) => getThemeDisplayName(a).localeCompare(getThemeDisplayName(b)));
    const index = sorted.findIndex((theme) => themeSlug(getThemeDisplayName(theme)) === slug);

    if (index === -1) {
        return null;
    }

    const neighbour = (offset) => {
        const theme = sorted[(index + offset + sorted.length) % sorted.length];
        const name = getThemeDisplayName(theme);
        return {
            name,
            path: themePagePath(name),
            background: safeHex(theme.background),
            foreground: safeHex(theme.foreground),
            colors: NEIGHBOUR_COLOR_KEYS.map((key) => safeHex(theme[key])),
        };
    };

    return {
        theme: sorted[index],
        previous: neighbour(-1),
        next: neighbour(1),
        total: sorted.length,
    };
});

if (!data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Theme not found', fatal: true });
}

const theme = computed(() => data.value.theme);
const previous = computed(() => data.value.previous);
const next = computed(() => data.value.next);
const total = computed(() => data.value.total);
const themeName = computed(() => getThemeDisplayName(theme.value));
const authorName = computed(() => (theme.value.author_name || theme.value.author || '').toString().trim());
const authorUrl = computed(() => {
    const url = (theme.value.author_url || '').toString();
    return /^https?:\/\//.test(url) ? url : '';
});
const pagePath = themePagePath(getThemeDisplayName(data.value.theme));
const pageUrl = canonicalUrl(pagePath);

const summary = computed(() => summarizeThemeColors(theme.value));

const { pageTheme } = usePageTheme();
const pageContentStyle = computed(() => (pageTheme.value === 'dark' ? PAGE_THEME_DARK_STYLE : PAGE_THEME_LIGHT_STYLE));

const title = `${themeName.value} - Terminal Color Scheme | Gogh`;
const description = `${themeName.value} is a ${summary.value.variant} terminal color scheme`
    + `${authorName.value ? ` by ${authorName.value}` : ''}: palette, contrast and live previews. `
    + 'One command installs it on GNOME Terminal, Konsole, Alacritty, Kitty, Ghostty, WezTerm, iTerm2 and more.';

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: pageUrl,
    twitterTitle: title,
    twitterDescription: description,
});
useHead({
    link: [{ rel: 'canonical', href: pageUrl }],
    // Mobile browser chrome takes the theme's own background.
    meta: [{ name: 'theme-color', content: safeHex(theme.value.background) || '#121f2a', key: 'theme-color' }],
});

const smoothScroll = useSmoothScroll();

function refreshTriggers() {
    const { ScrollTrigger } = useGsap();
    ScrollTrigger.refresh();
}

// A shared link such as /dracula/#live-session: the router jumps to the
// anchor before fonts, the hero and the scroll triggers settle the layout, so
// it lands off. Glide back to it, and check again once the glide ends in case
// the page moved meanwhile (a few tries at most). Any scroll or tap from the
// visitor wins and stops the corrections.
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
let hashSettleTimer = 0;

function stopHashSettle() {
    window.clearTimeout(hashSettleTimer);
    hashSettleTimer = 0;
    USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stopHashSettle));
}

function settleHashScroll(tries = 3) {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target || tries <= 0) {
        stopHashSettle();
        return;
    }
    if (tries === 3) {
        USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stopHashSettle, { passive: true }));
    }
    const offset = anchorOffset(target);
    if (Math.abs(target.getBoundingClientRect().top + offset) > 2) {
        scrollToTarget(target, offset);
    }
    hashSettleTimer = window.setTimeout(() => settleHashScroll(tries - 1), 1600);
}

// Left/right arrows step to the previous/next theme, unless the key belongs
// to something else: a text field, a widget that uses arrows itself, an open
// dialog or the mobile menu, or a shortcut with modifiers.
const ARROW_KEY_OWNERS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), '
    + '[role="slider"], [role="tab"], [role="tablist"], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"], [role="radiogroup"]';

const pressedArrow = ref('');

function onArrowKeydown(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
    }
    if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
    }
    if (event.target instanceof Element && event.target.closest(ARROW_KEY_OWNERS)) {
        return;
    }
    if (document.documentElement.classList.contains('gogh-menu-open') || document.querySelector('[aria-modal="true"]')) {
        return;
    }

    const target = event.key === 'ArrowLeft' ? previous.value : next.value;
    if (target?.path) {
        event.preventDefault();
        // The hero's keycap for this key presses in while the page changes.
        pressedArrow.value = event.key;
        navigateTo(target.path);
    }
}

onMounted(() => {
    window.addEventListener('keydown', onArrowKeydown);
    smoothScroll.start();
    // Fonts and the preview mockups change section heights after first layout.
    document.fonts?.ready.then(() => {
        refreshTriggers();
        settleHashScroll();
    });
    window.addEventListener('load', refreshTriggers, { once: true });
});

onUnmounted(() => {
    window.removeEventListener('keydown', onArrowKeydown);
    window.removeEventListener('load', refreshTriggers);
    stopHashSettle();
    smoothScroll.stop();
});
</script>

<style lang="scss" scoped>
@use '@/pages/theme.scss';
</style>
