<template>
    <section ref="root" class="previews" aria-labelledby="theme-previews-title">
        <div class="previews__inner">
            <header class="previews__header">
                <p class="section-eyebrow previews__eyebrow"><span>04</span> In the wild</p>
                <h2 id="theme-previews-title" class="section-title previews__title">See it <em>at work.</em></h2>
                <p class="previews__lede">
                    A palette view, a Linux home and a JavaScript file, then a blog, an Omarchy desktop and a
                    Quickshell desktop, so you can judge {{ themeName }} on everyday output instead of swatches. Each
                    one lists the colors it uses and what they paint.
                </p>
            </header>

            <article
                v-for="(preview, index) in previews"
                :key="preview.id"
                class="preview"
                :class="{ 'preview--wide': preview.wide }"
            >
                <div class="preview__text">
                    <div class="preview__copy">
                        <span class="preview__index" aria-hidden="true">{{ pad(index + 1) }} <i>/ {{ pad(previews.length) }}</i></span>
                        <h3 class="preview__title">{{ preview.title }}</h3>
                        <p class="preview__description">{{ preview.description }}</p>
                        <p v-if="preview.note" class="preview__note">{{ preview.note }}</p>
                    </div>

                    <ul v-if="preview.legend.length" class="legend">
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

                <div class="preview__stage">
                    <div class="preview__window">
                        <component :is="preview.component" :theme="theme" v-bind="preview.props" />
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>

<script setup>
import { markRaw } from 'vue';
import PreviewTerminal from '@/components/Terminal/PreviewTerminal.vue';
import HomePreviewTerminal from '@/components/Terminal/HomePreviewTerminal.vue';
import CodePreviewTerminal from '@/components/Terminal/CodePreviewTerminal.vue';
import BlogPreview from '@/components/Terminal/BlogPreview.vue';
import OmarchyPreview from '@/components/Terminal/OmarchyPreview.vue';
import QuickshellPreview from '@/components/Terminal/QuickshellPreview.vue';

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

const root = ref(null);
let gsapContext = null;

function pad(value) {
    return String(value).padStart(2, '0');
}

function legendItem(key, what) {
    const hex = safeHex(props.theme[key]) || 'n/a';
    const ratio = contrastRatio(hex, props.theme.background);
    return { key, label: slotLabel(key), hex, ratio: ratio === null ? '' : `${ratio.toFixed(1)}:1`, what };
}

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

// Legends follow the slot mapping in HomePreviewTerminal and
// CodePreviewTerminal; keep them in sync if those change.
const previews = computed(() => [
    {
        id: 'palette',
        title: 'Palette view',
        description: 'The gallery card: the top bar shows the eight normal ANSI colors (black, red, green, yellow, blue, magenta, cyan, white) and the bottom bar their bright variants, over the theme\'s own background, followed by every color as text.',
        component: markRaw(PreviewTerminal),
        props: {},
        legend: [],
    },
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
        description: `An Omarchy desktop: Arch Linux with the Hyprland tiling window manager and Waybar on top, running Neovim with neo-tree, a terminal, btop and Files. An Omarchy theme recolors all of them at once; here they all take their colors from ${props.themeName}.`,
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

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }

    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.from('.previews__header > *', {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '.previews__header',
                start: 'top 80%',
                onEnter: () => binaryDecode(root.value?.querySelector('.previews__eyebrow'), { delay: 120, duration: 700 }),
            },
        });

        root.value.querySelectorAll('.preview').forEach((article) => {
            // The window tips up out of the page, like the home showcase.
            gsap.from(article.querySelector('.preview__window'), {
                y: 90,
                rotateX: 16,
                scale: 0.94,
                opacity: 0,
                transformPerspective: 1400,
                transformOrigin: '50% 100%',
                duration: 1.5,
                ease: 'expo.out',
                scrollTrigger: { trigger: article, start: 'top 78%' },
            });

            gsap.from(article.querySelectorAll('.preview__copy > *, .legend__item'), {
                y: 24,
                opacity: 0,
                duration: 1,
                stagger: 0.05,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: article,
                    start: 'top 78%',
                    onEnter: () => {
                        binaryDecode(article.querySelector('.preview__index'), { delay: 100, duration: 500 });
                        article.querySelectorAll('.legend__hex').forEach((hex, index) => {
                            binaryDecode(hex, { delay: 250 + index * 50, duration: 500 });
                        });
                    },
                },
            });
        });
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.previews {
    --line: color-mix(in srgb, var(--site-foreground) 16%, transparent);
    --soft: color-mix(in srgb, var(--site-foreground) 66%, transparent);
    padding: 110px 20px 60px;
    background: var(--site-background, #efebe3);
    color: var(--site-foreground, #0d1926);
    transition: background-color 0.18s ease, color 0.18s ease;

    @include m768 {
        padding: 160px 48px 80px;
    }
}

.previews__inner {
    max-width: 1400px;
    margin: 0 auto;
}

.previews__header {
    display: grid;
    gap: 0 60px;
    margin: 0 0 40px;

    @include m992 {
        grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
        align-items: end;

        .previews__eyebrow {
            grid-column: 1 / -1;
        }
    }
}

.previews__eyebrow.section-eyebrow {
    color: var(--soft);
}

.previews__title.section-title {
    color: var(--site-foreground);

    em {
        color: inherit;
    }
}

.previews__lede {
    max-width: 560px;
    margin: 28px 0 0;
    color: var(--soft);
    font-size: 1.6rem;
    line-height: 1.55;
}

.preview {
    display: grid;
    gap: 30px 56px;
    padding: 70px 0;
    border-top: 1px solid var(--line);

    @include m992 {
        grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
        align-items: start;
    }
}

// Window first on narrow screens: it is what the text describes.
.preview__stage {
    order: -1;
    min-width: 0;
    perspective: 1400px;

    @include m992 {
        order: 0;
    }
}

.preview__window {
    min-width: 0;
    overflow-x: auto;
    filter: drop-shadow(0 40px 50px rgba(5, 10, 15, 0.28));

    :deep(.terminal-frame) {
        margin-bottom: 0;
    }
}

// The text column rides along while a tall window scrolls past.
.preview__text {
    @include m992 {
        position: sticky;
        top: 110px;
    }
}

// Blog and desktop mockups need the full width: text and legend go above.
.preview--wide {
    @include m992 {
        grid-template-columns: minmax(0, 1fr);
    }

    .preview__stage {
        order: 0;
    }

    .preview__text {
        position: static;
        display: grid;
        gap: 0 56px;
        align-items: start;

        @include m992 {
            grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);

            .legend {
                margin-top: 0;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }
    }
}

.preview__index {
    display: block;
    margin: 0 0 16px;
    font-family: $font_mono;
    font-size: 1.3rem;
    letter-spacing: 0.08em;

    i {
        color: var(--soft);
        font-style: normal;
    }
}

.preview__title {
    margin: 0 0 16px;
    font-size: clamp(3rem, 3.4vw, 4.4rem);
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.035em;
}

.preview__description {
    margin: 0 0 14px;
    font-size: 1.5rem;
    line-height: 1.6;
}

.preview__note {
    margin: 0 0 14px;
    color: var(--soft);
    font-size: 1.3rem;
    line-height: 1.55;
}

.legend {
    display: grid;
    gap: 14px 28px;
    margin: 26px 0 0;
    padding: 0;
    list-style: none;
}

.legend__item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin: 0;
}

.legend__chip {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    margin-top: 2px;
    box-shadow: 0 0 0 1px var(--line);
}

.legend__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 1.35rem;
    line-height: 1.45;

    strong {
        font-weight: 600;
    }
}

.legend__hex {
    color: var(--soft);
    font-family: $font_mono;
    font-size: 1.15rem;
}

.legend__what {
    color: var(--soft);
}
</style>
