<template>
    <section ref="root" class="previews" aria-labelledby="theme-previews-title">
        <div class="previews__inner">
            <header class="previews__header">
                <p class="section-eyebrow previews__eyebrow"><span>04</span> {{ t('previews.eyebrow') }}</p>
                <h2 id="theme-previews-title" class="section-title previews__title">{{ t('previews.title') }} <em>{{ t('previews.titleAccent') }}</em></h2>
                <p class="previews__lede">{{ t('previews.lede', { name: themeName }) }}</p>
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

const { t } = useI18n();
const root = ref(null);
let gsapContext = null;

function pad(value) {
    return String(value).padStart(2, '0');
}

// `what` is a message key under previews.*.
function legendItem(key, what) {
    const hex = safeHex(props.theme[key]) || t('common.notAvailable');
    const ratio = contrastRatio(hex, props.theme.background);
    return { key, label: slotLabel(key, t), hex, ratio: ratio === null ? '' : `${ratio.toFixed(1)}:1`, what: t(`previews.${what}`) };
}

function codeLegend() {
    return [
        legendItem('color_06', 'code.keywords'),
        legendItem('color_03', 'code.strings'),
        legendItem('color_04', 'code.numbers'),
        legendItem('color_05', 'code.functions'),
        legendItem('color_07', 'code.properties'),
        legendItem('color_02', 'code.constants'),
        legendItem('color_09', 'code.comments'),
        legendItem('foreground', 'code.variables'),
    ];
}

// Legends follow the slot mapping in HomePreviewTerminal and
// CodePreviewTerminal; keep them in sync if those change.
const previews = computed(() => [
    {
        id: 'palette',
        title: t('previews.palette.title'),
        description: t('previews.palette.description'),
        component: markRaw(PreviewTerminal),
        props: {},
        legend: [],
    },
    {
        id: 'home',
        title: t('previews.home.title'),
        description: t('previews.home.description'),
        component: markRaw(HomePreviewTerminal),
        props: {},
        legend: [
            legendItem('color_03', 'home.green'),
            legendItem('color_05', 'home.blue'),
            legendItem('color_02', 'home.red'),
            legendItem('color_07', 'home.cyan'),
            legendItem('foreground', 'home.foreground'),
            legendItem('cursor', 'home.cursor'),
        ],
    },
    {
        id: 'javascript',
        title: t('previews.javascript.title'),
        description: t('previews.javascript.description'),
        component: markRaw(CodePreviewTerminal),
        props: { language: 'javascript' },
        legend: codeLegend(),
    },
    {
        id: 'python',
        title: t('previews.python.title'),
        description: t('previews.python.description'),
        component: markRaw(CodePreviewTerminal),
        props: { language: 'python' },
        legend: codeLegend(),
    },
    {
        id: 'blog',
        title: t('previews.blog.title'),
        description: t('previews.blog.description'),
        note: t('previews.blog.note'),
        component: markRaw(BlogPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('foreground', 'blog.foreground'),
            legendItem('color_05', 'blog.blue'),
            legendItem('color_09', 'blog.brightBlack'),
            legendItem('color_03', 'blog.green'),
            legendItem('color_06', 'blog.magenta'),
            legendItem('color_04', 'blog.yellow'),
            legendItem('color_02', 'blog.red'),
            legendItem('color_08', 'blog.white'),
        ],
    },
    {
        id: 'omarchy',
        title: t('previews.omarchy.title'),
        description: t('previews.omarchy.description', { name: props.themeName }),
        note: t('previews.omarchy.note'),
        component: markRaw(OmarchyPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('background', 'omarchy.background'),
            legendItem('color_05', 'omarchy.blue'),
            legendItem('color_06', 'omarchy.magenta'),
            legendItem('color_07', 'omarchy.cyan'),
            legendItem('color_03', 'omarchy.green'),
            legendItem('color_04', 'omarchy.yellow'),
            legendItem('color_02', 'omarchy.red'),
            legendItem('color_09', 'omarchy.brightBlack'),
        ],
    },
    {
        id: 'quickshell',
        title: t('previews.quickshell.title'),
        description: t('previews.quickshell.description'),
        note: t('previews.quickshell.note'),
        component: markRaw(QuickshellPreview),
        props: {},
        wide: true,
        legend: [
            legendItem('background', 'quickshell.background'),
            legendItem('color_05', 'quickshell.blue'),
            legendItem('color_06', 'quickshell.magenta'),
            legendItem('color_03', 'quickshell.green'),
            legendItem('color_04', 'quickshell.yellow'),
            legendItem('color_02', 'quickshell.red'),
            legendItem('color_09', 'quickshell.brightBlack'),
            legendItem('foreground', 'quickshell.foreground'),
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
