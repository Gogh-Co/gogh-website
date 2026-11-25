<template>
    <Header />

    <div class="gogh-content theme-page" :style="pageContentStyle">
        <div class="container">
            <nav class="theme-page__crumbs" aria-label="Breadcrumb">
                <NuxtLink to="/" class="theme-page__crumb-link">All themes</NuxtLink>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{{ themeName }}</span>
            </nav>

            <h1 class="page-title">{{ themeName }}</h1>

            <p class="theme-page__meta">
                <span class="theme-page__badge">{{ summary.variant === 'light' ? 'Light' : 'Dark' }} theme</span>
                <template v-if="authorName">
                    by
                    <a v-if="authorUrl" :href="authorUrl" target="_blank" rel="noopener noreferrer">{{ authorName }}</a>
                    <template v-else>{{ authorName }}</template>
                </template>
            </p>
        </div>

        <!-- Dark band styled like the gallery lightbox: palette, install, share. -->
        <section class="theme-page__stage" aria-label="Palette preview and install">
            <div class="container">
                <PreviewTerminal :theme="theme" />

                <div class="theme-page__install">
                    <div v-for="command in installCommands" :key="command.id" class="code-wrap">
                        <h2 class="theme-page__install-title">{{ command.label }} <span>({{ command.tool }})</span></h2>
                        <div class="code-holder theme-page__code-holder">
                            <pre><code class="language-bash" :id="command.id">{{ command.text }}</code></pre>
                            <button type="button" class="btn-copy" :data-clipboard-target="`#${command.id}`" :aria-label="`Copy ${command.label} install command`">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="48" height="48" aria-hidden="true"> <path d="M27.4,14.7l-6.1-6.1C21,8.2,20.5,8,20,8h-8c-1.1,0-2,0.9-2,2v18c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V16.1C28,15.6,27.8,15.1,27.4,14.7z M20,10l5.9,6H20V10z M12,28V10h6v6c0,1.1,0.9,2,2,2h6l0,10H12z"/> <path d="M6,18H4V4c0-1.1,0.9-2,2-2h14v2H6V18z"/> <rect width="32" height="32" fill="none"/> </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <ThemeShareButtons :theme-name="themeName" :theme="theme" :url="pageUrl" />
            </div>
        </section>

        <div class="container">
            <section class="theme-page__section" aria-labelledby="theme-colors-title">
                <h2 id="theme-colors-title" class="theme-page__heading">Colors</h2>

                <p v-for="(sentence, index) in summary.sentences" :key="index">{{ sentence }}</p>

                <p>
                    The window above is the palette view: the top bar shows the eight normal ANSI colors
                    (black, red, green, yellow, blue, magenta, cyan, white) and the bottom bar their bright
                    variants, over the theme's own background. Contrast ratios below are measured against
                    that background.
                </p>

                <div v-for="group in colorGroups" :key="group.id" class="theme-page__group">
                    <h3 class="theme-page__subheading">{{ group.title }}</h3>
                    <p v-if="group.intro" class="theme-page__group-intro">{{ group.intro }}</p>

                    <ul class="swatch-grid">
                        <li v-for="color in group.colors" :key="color.key" class="swatch">
                            <span class="swatch__chip" :style="{ backgroundColor: color.hex, color: color.ink }">
                                <span class="swatch__hex">{{ color.hex }}</span>
                            </span>
                            <span class="swatch__body">
                                <span class="swatch__name">
                                    {{ color.label }}
                                    <code class="swatch__key">{{ color.key }}</code>
                                </span>
                                <span v-if="color.ratio" class="swatch__contrast" :class="`swatch__contrast--${color.levelClass}`">
                                    {{ color.ratio }} · {{ color.level }}
                                </span>
                                <span class="swatch__role">{{ color.role }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </section>

            <section class="theme-page__section" aria-labelledby="theme-previews-title">
                <h2 id="theme-previews-title" class="theme-page__heading">Previews</h2>
                <p>
                    The same previews as the gallery lightbox, followed by a blog, an Omarchy desktop and a Quickshell
                    desktop, so you can judge {{ themeName }} on everyday output instead of swatches. Each one lists the
                    colors it uses and what they paint.
                </p>

                <article
                    v-for="preview in previews"
                    :key="preview.id"
                    class="preview-row"
                    :class="{ 'preview-row--wide': preview.wide }"
                >
                    <div class="preview-row__terminal">
                        <component :is="preview.component" :theme="theme" v-bind="preview.props" />
                    </div>

                    <div class="preview-row__text">
                        <h3 class="theme-page__subheading">{{ preview.title }}</h3>
                        <p>{{ preview.description }}</p>
                        <p v-if="preview.note" class="preview-row__note">{{ preview.note }}</p>

                        <ul class="legend">
                            <li v-for="item in preview.legend" :key="item.key" class="legend__item">
                                <span class="legend__chip" :style="{ backgroundColor: item.hex }" aria-hidden="true"></span>
                                <span class="legend__text">
                                    <strong>{{ item.label }}</strong>
                                    <span class="legend__hex">{{ item.hex }}<template v-if="item.ratio"> · {{ item.ratio }}</template></span>
                                    <span class="legend__what">{{ item.what }}</span>
                                </span>
                            </li>
                        </ul>
                    </div>
                </article>
            </section>

            <nav class="theme-page__pager" aria-label="More themes">
                <NuxtLink :to="previous.path" class="theme-page__pager-link" rel="prev">
                    <span class="theme-page__pager-label">Previous</span>
                    <span class="theme-page__pager-name">{{ previous.name }}</span>
                </NuxtLink>
                <NuxtLink to="/" class="theme-page__pager-link theme-page__pager-link--all">
                    <span class="theme-page__pager-label">Gallery</span>
                    <span class="theme-page__pager-name">All {{ total }} themes</span>
                </NuxtLink>
                <NuxtLink :to="next.path" class="theme-page__pager-link theme-page__pager-link--next" rel="next">
                    <span class="theme-page__pager-label">Next</span>
                    <span class="theme-page__pager-name">{{ next.name }}</span>
                </NuxtLink>
            </nav>
        </div>
    </div>
</template>

<script setup>
import { markRaw } from 'vue';
import ClipboardJS from 'clipboard';
import Prism from 'prismjs';
import Header from '@/components/Header/Header.vue';
import PreviewTerminal from '@/components/Terminal/PreviewTerminal.vue';
import HomePreviewTerminal from '@/components/Terminal/HomePreviewTerminal.vue';
import CodePreviewTerminal from '@/components/Terminal/CodePreviewTerminal.vue';
import BlogPreview from '@/components/Terminal/BlogPreview.vue';
import OmarchyPreview from '@/components/Terminal/OmarchyPreview.vue';
import QuickshellPreview from '@/components/Terminal/QuickshellPreview.vue';
import ThemeShareButtons from '@/components/Terminal/ThemeShareButtons.vue';

const PAGE_THEME_DARK_STYLE = {
    '--site-background': '#121F2A',
    '--site-foreground': '#e7e7e7',
    '--code-block-background': '#0d1926',
    '--code-block-foreground': '#e7e7e7',
};

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
        const name = getThemeDisplayName(sorted[(index + offset + sorted.length) % sorted.length]);
        return { name, path: themePagePath(name) };
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
const pageContentStyle = computed(() => (pageTheme.value === 'dark' ? PAGE_THEME_DARK_STYLE : undefined));

const installCommands = computed(() => {
    const quoted = themeName.value.replace(/"/g, '\\"');
    return [
        { id: 'code-theme-linux', label: 'Linux', tool: 'wget', text: `bash -c "$(wget -qO- https://gogh.website/gogh)" -- "${quoted}"` },
        { id: 'code-theme-mac', label: 'Mac', tool: 'curl', text: `bash -c "$(curl -fsSL https://gogh.website/gogh)" -- "${quoted}"` },
    ];
});

function describeSlot(slot) {
    const hex = safeHex(theme.value[slot.key]);
    const ratio = slot.key === 'background' ? null : contrastRatio(hex, theme.value.background);
    const level = contrastLevel(ratio);
    return {
        ...slot,
        hex: hex || 'n/a',
        ink: inkFor(hex),
        ratio: ratio === null ? '' : `${ratio.toFixed(1)}:1`,
        level,
        levelClass: level.toLowerCase().replace(/\s+/g, '-'),
    };
}

const colorGroups = computed(() => [
    {
        id: 'base',
        title: 'Base',
        intro: '',
        colors: BASE_COLOR_SLOTS.map(describeSlot),
    },
    {
        id: 'normal',
        title: 'Normal colors',
        intro: 'ANSI colors 0–7: what programs use for regular colored output.',
        colors: NORMAL_COLOR_SLOTS.map(describeSlot),
    },
    {
        id: 'bright',
        title: 'Bright colors',
        intro: 'ANSI colors 8–15: used for bold or emphasised text, and picked directly by many tools.',
        colors: BRIGHT_COLOR_SLOTS.map(describeSlot),
    },
]);

function legendItem(key, what) {
    const hex = safeHex(theme.value[key]) || 'n/a';
    const ratio = contrastRatio(hex, theme.value.background);
    return { key, label: slotLabel(key), hex, ratio: ratio === null ? '' : `${ratio.toFixed(1)}:1`, what };
}

// Legends follow the slot mapping in HomePreviewTerminal and
// CodePreviewTerminal; keep them in sync if those change.
const previews = computed(() => [
    {
        id: 'home',
        title: 'Linux home',
        description: 'A stock Ubuntu bash session in $HOME running ls, ls -la and git status, colored the way dircolors, the default prompt and git do it out of the box.',
        component: markRaw(HomePreviewTerminal),
        props: {},
        legend: [
            legendItem('color_03', 'Bold user@linux in the prompt, the deploy.sh executable and the staged new file in git status.'),
            legendItem('color_05', 'Bold directories (Desktop, Documents, .config...) and the working path in the prompt.'),
            legendItem('color_02', 'The backup.tar.gz archive and the modified and untracked files in git status.'),
            legendItem('color_07', 'The projects symbolic link.'),
            legendItem('foreground', 'Permissions, sizes, dates, plain files like notes.txt and git messages.'),
            legendItem('cursor', 'The blinking cursor after the last prompt.'),
        ],
    },
    {
        id: 'javascript',
        title: 'JavaScript',
        description: 'loadTheme.js as a terminal editor such as vim, nano or micro would paint it with the 16 ANSI colors: each kind of token maps to one palette slot.',
        component: markRaw(CodePreviewTerminal),
        props: { language: 'javascript' },
        legend: codeLegend(),
    },
    {
        id: 'python',
        title: 'Python',
        description: 'load_theme.py with the same token mapping, adding a decorator, type hints and Python built-in types.',
        component: markRaw(CodePreviewTerminal),
        props: { language: 'python' },
        legend: codeLegend(),
    },
    {
        id: 'blog',
        title: 'Blog',
        description: 'A simple blog built only from this scheme, the way terminal-inspired themes for static site generators do it: background and foreground for the page, ANSI colors for links, tags and code.',
        note: 'Cards and the code block use the background with a little of the foreground mixed in.',
        component: markRaw(BlogPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('foreground', 'Body text and post titles.'),
            legendItem('color_05', 'The ~/notes logo, the active menu item, links, "Read more" and the Subscribe button.'),
            legendItem('color_09', 'Dates, reading time, the RSS link, tag counts and the footer.'),
            legendItem('color_03', 'Sidebar headings, the #colors tag and strings in the code block.'),
            legendItem('color_06', 'The #terminal tag and keywords in the code block.'),
            legendItem('color_04', 'The #dotfiles tag, the quote border and numbers in code.'),
            legendItem('color_02', 'Inline code and constants.'),
            legendItem('color_08', 'The pull quote.'),
        ],
    },
    {
        id: 'omarchy',
        title: 'Omarchy desktop',
        description: `An Omarchy desktop: Arch Linux with the Hyprland tiling window manager and Waybar on top, running Neovim with neo-tree, a terminal, btop and Files. An Omarchy theme recolors all of them at once; here they all take their colors from ${themeName.value}.`,
        note: 'A mockup of how the palette would look across the desktop. Gogh itself installs the terminal colors.',
        component: markRaw(OmarchyPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('background', 'Window backgrounds; the wallpaper blends it with blue and magenta.'),
            legendItem('color_05', 'The focused window border, the active workspace, NORMAL mode, commands, directories, dates in ls and the folders in Files.'),
            legendItem('color_06', 'Shell keywords (if, local, case...), the git branch in the prompt and the network graph.'),
            legendItem('color_07', 'Variables like $devices and the prompt directory.'),
            legendItem('color_03', 'Strings, executables and file sizes, the CPU box and low CPU load.'),
            legendItem('color_04', 'Options and numbers, the user and read bits in ls, the memory box and medium load.'),
            legendItem('color_02', 'Write bits in ls, used memory, the process box and high load.'),
            legendItem('color_09', 'Line numbers, comments, tree guides, inactive tabs and workspaces, btop labels.'),
        ],
    },
    {
        id: 'quickshell',
        title: 'Quickshell',
        description: 'A desktop shell built with Quickshell, the QtQuick toolkit behind configs such as Caelestia and end-4\'s dots-hyprland: a floating bar, an app launcher, notifications, a volume OSD and a dashboard with quick toggles, sliders, media and a calendar.',
        note: 'A mockup: Quickshell configs read colors from their own theme files. Gogh itself installs the terminal colors.',
        component: markRaw(QuickshellPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('background', 'The wallpaper base and, with a little foreground mixed in, every panel.'),
            legendItem('color_05', 'The active workspace, launcher button, selected app, active toggles, volume, play button and today\'s date.'),
            legendItem('color_06', 'The playing track in the bar, the avatar and the album art gradient.'),
            legendItem('color_03', 'The battery level, the screenshot notification and media progress.'),
            legendItem('color_04', 'The brightness slider and the updates notification.'),
            legendItem('color_02', 'Power buttons, the browser icon and the album art.'),
            legendItem('color_09', 'Secondary text: window title, descriptions, times and weekdays.'),
            legendItem('foreground', 'Primary text: names, clock and labels.'),
        ],
    },
]);

function codeLegend() {
    return [
        legendItem('color_06', 'Keywords (import, const, async, def, return...), in bold.'),
        legendItem('color_03', 'Strings and template literals.'),
        legendItem('color_04', 'Numbers, types and class names, decorators.'),
        legendItem('color_05', 'Function and method calls.'),
        legendItem('color_07', 'Object properties and keyword arguments.'),
        legendItem('color_02', 'Constants (MAX_RETRIES, true, None...).'),
        legendItem('color_09', 'Comments (in italics) and line numbers.'),
        legendItem('foreground', 'Variables, operators and punctuation.'),
    ];
}

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
});

let clipboard = null;

onMounted(() => {
    clipboard = new ClipboardJS('.theme-page .btn-copy');
    nextTick(() => Prism.highlightAll());
});

onBeforeUnmount(() => {
    clipboard?.destroy();
});
</script>

<style lang="scss" scoped>
@use '@/pages/theme.scss';
</style>
