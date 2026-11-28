<template>
    <Header overlay />

    <main ref="root" class="history" :class="{ 'is-calm': !effectsEnabled }" :style="{ '--ambient': ambient }">
        <!-- Fixed backdrop: a glow tinted by the chapter in view, plus film grain. -->
        <div class="h-ambient" aria-hidden="true">
            <span class="h-ambient__glow h-ambient__glow--far"></span>
            <span class="h-ambient__glow h-ambient__glow--near"></span>
        </div>

        <aside class="h-motion-control" :aria-label="c.ui.motion.label">
            <button
                type="button"
                class="h-motion-toggle"
                :class="{ 'is-on': calm || systemReduced }"
                :aria-pressed="calm || systemReduced"
                :disabled="systemReduced || !motionReady"
                :title="systemReduced ? c.ui.motion.system : calm ? c.ui.motion.disable : c.ui.motion.enable"
                @click="setCalm(!calm)"
            >
                <span class="h-motion-toggle__indicator" aria-hidden="true"><i></i><i></i><i></i></span>
                {{ c.ui.motion.label }}
                <span class="h-motion-toggle__switch" aria-hidden="true"></span>
            </button>
        </aside>

        <article class="h-article article-content" aria-labelledby="history-title" :lang="localeInfo.htmlLang" :dir="localeInfo.dir">
            <!-- One continuous article: Reader View uses this same visible copy. -->
            <section class="h-hero">
                <div class="h-hero__media" aria-hidden="true">
                    <img
                        class="h-hero__image"
                        src="/history/hero.webp"
                        srcset="/history/hero-960.webp 960w, /history/hero.webp 1672w"
                        sizes="100vw"
                        alt=""
                        fetchpriority="high"
                    >
                </div>

                <div class="h-hero__inner">
                    <header class="h-hero__heading">
                        <div class="h-hero__masthead">
                            <p class="section-eyebrow h-hero__eyebrow"><span>ESC</span> {{ c.hero.eyebrow }}</p>
                            <span class="h-hero__notation" aria-hidden="true">ASCII / ANSI / RGB</span>
                        </div>
                        <h1 id="history-title" class="h-hero__title">
                            <span class="h-mask"><span class="h-hero__line">{{ c.hero.title }}{{ ' ' }}</span></span>
                            <span class="h-mask"><em class="h-hero__line">{{ c.hero.titleAccent }}</em></span>
                        </h1>
                    </header>
                    <div class="h-hero__note">
                        <p class="h-hero__lead">{{ c.hero.lead }}</p>
                        <nav role="navigation" :aria-label="c.ui.nav">
                            <a class="h-hero__cue" href="#paper" @click.prevent="goTo('#paper')">
                                <span class="h-hero__cue-line" aria-hidden="true"></span>
                                <span>{{ c.hero.scroll }}</span>
                            </a>
                        </nav>
                    </div>
                </div>

                <div class="h-hero__spectrum" aria-hidden="true">
                    <i v-for="(color, index) in SPECTRUM" :key="index" :style="{ background: color, '--i': index }"></i>
                </div>
            </section>

            <aside class="h-wrap h-facts">
                <ul class="h-hero__stats">
                    <li v-for="stat in c.hero.stats" :key="stat.value">
                        <b>{{ stat.value }}</b>
                        <span>{{ stat.label }}</span>
                    </li>
                </ul>
            </aside>

            <!-- Chapter index -->
            <nav id="chapters" class="h-index" role="navigation" aria-labelledby="h-index-title">
                <div class="h-wrap">
                    <header class="h-index__header">
                        <p class="section-eyebrow"><span>{{ HISTORY_CHAPTERS.length }}</span> {{ c.index.eyebrow }}</p>
                        <h2 id="h-index-title" class="section-title">{{ c.index.title }} <em>{{ c.index.titleAccent }}</em></h2>
                    </header>

                    <ol class="h-index__grid">
                        <li v-for="(chapter, index) in HISTORY_CHAPTERS" :key="chapter.id" class="h-index__item" :style="{ '--accent': chapter.accent }">
                            <a class="h-card" :href="`#${chapter.id}`" @click.prevent="goTo(`#${chapter.id}`)">
                                <span class="h-card__media">
                                    <img :src="`/history/${chapter.image}-480.webp`" alt="" loading="lazy" width="480" height="270">
                                </span>
                                <span class="h-card__meta">
                                    <span class="h-card__num">{{ pad(index + 1) }}</span>
                                    <span class="h-card__years">{{ c.chapters[chapter.id].years }}</span>
                                </span>
                                <span class="h-card__title">{{ c.chapters[chapter.id].title }} <em>{{ c.chapters[chapter.id].titleAccent }}</em></span>
                                <span class="h-card__kicker">{{ c.chapters[chapter.id].kicker }}</span>
                            </a>
                        </li>
                    </ol>
                </div>
            </nav>

            <!-- Escape-code marquee: decorative, the same sequences the chapters explain. -->
            <div class="h-marquee" aria-hidden="true">
                <div class="h-marquee__track">
                    <span v-for="n in 2" :key="n">
                        <b v-for="code in MARQUEE" :key="code[0]" :style="{ color: code[1] }">{{ code[0] }}</b>
                    </span>
                </div>
            </div>

            <!-- Sticky chapter rail -->
            <nav class="h-rail" role="navigation" :aria-label="c.ui.nav">
                <div class="h-rail__inner">
                    <a
                        v-for="(chapter, index) in HISTORY_CHAPTERS"
                        :key="chapter.id"
                        :ref="(el) => (railLinks[index] = el)"
                        class="h-rail__link"
                        :class="{ 'is-active': activeChapter === index }"
                        :href="`#${chapter.id}`"
                        :style="{ '--accent': chapter.accent }"
                        :aria-current="activeChapter === index ? 'true' : undefined"
                        @click.prevent="goTo(`#${chapter.id}`)"
                    >
                        <span>{{ pad(index + 1) }}</span>
                        {{ c.chapters[chapter.id].title }} {{ c.chapters[chapter.id].titleAccent }}
                    </a>
                </div>
                <span class="h-rail__progress" :style="{ transform: `scaleX(${progress})` }" role="progressbar" :aria-label="c.ui.progress" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100"></span>
            </nav>

            <!-- Chapters -->
            <section
                v-for="(chapter, index) in HISTORY_CHAPTERS"
                :id="chapter.id"
                :key="chapter.id"
                class="h-chapter"
                :class="[`h-chapter--${chapter.id}`, `h-layout--${CHAPTER_LAYOUTS[chapter.id]}`]"
                :style="{ '--accent': chapter.accent }"
                :aria-labelledby="`${chapter.id}-title`"
            >
                <!-- Each era has its own composition, within the same editorial grid. -->
                <div class="h-stage">
                    <div class="h-stage__sticky">
                        <header class="h-wrap h-chapter__header article-heading">
                            <div class="h-chapter__copy">
                                <p class="section-eyebrow h-chapter__eyebrow">
                                    <span>{{ pad(index + 1) }}</span>
                                    {{ c.chapters[chapter.id].kicker }}
                                    <b class="h-chapter__years">{{ c.chapters[chapter.id].years }}</b>
                                </p>
                                <h2 :id="`${chapter.id}-title`" class="section-title h-chapter__title">
                                    <span class="h-mask"><span class="h-rise">{{ c.chapters[chapter.id].title }}{{ ' ' }}</span></span>
                                    <span class="h-mask"><em class="h-rise">{{ c.chapters[chapter.id].titleAccent }}</em></span>
                                </h2>
                                <p class="h-chapter__lead">{{ c.chapters[chapter.id].lead }}</p>
                            </div>
                        </header>
                        <figure class="h-stage__media">
                            <img
                                class="h-chapter__image"
                                :src="`/history/${chapter.image}.webp`"
                                :srcset="`/history/${chapter.image}-960.webp 960w, /history/${chapter.image}.webp 1672w`"
                                :sizes="CHAPTER_LAYOUTS[chapter.id] === 'immersive' || CHAPTER_LAYOUTS[chapter.id] === 'chromatic' ? '100vw' : '(min-width: 1600px) 1120px, (min-width: 992px) 75vw, 100vw'"
                                :alt="c.chapters[chapter.id].title + ' ' + c.chapters[chapter.id].titleAccent"
                                loading="lazy"
                                width="1672"
                                height="941"
                            >
                            <CubeDepth v-if="chapter.id === 'cube'" class="h-chapter__image" source="/history/cube256.webp" :enabled="effectsEnabled" />
                        </figure>
                    </div>
                </div>

                <div class="h-wrap article-content">
                    <div class="h-chapter__body">
                        <div class="h-chapter__text">
                            <RichText v-for="(paragraph, p) in c.chapters[chapter.id].body" :key="p" :text="paragraph" />
                        </div>

                        <div class="h-chapter__figure">
                            <FigAscii v-if="chapter.id === 'paper'" :copy="c.figures.paper" />
                            <FigPhosphor v-else-if="chapter.id === 'glass'" :copy="c.figures.glass" />
                            <FigSgr v-else-if="chapter.id === 'escape'" :copy="c.figures.escape" :ui="c.ui" />
                            <FigAnsiTable v-else-if="chapter.id === 'eight'" :copy="c.figures.eight" />
                            <FigBright v-else-if="chapter.id === 'sixteen'" :copy="c.figures.sixteen" :names="c.figures.eight.names" />
                            <FigCube v-else-if="chapter.id === 'cube'" :copy="c.figures.cube" />
                            <FigTruecolor v-else-if="chapter.id === 'truecolor'" :copy="c.figures.truecolor" />
                            <FigThemes v-else-if="chapter.id === 'themes'" v-model="themeIndex" :copy="c.figures.themes" />
                            <FigContrast v-else-if="chapter.id === 'science'" :copy="c.figures.science" :theme-index="themeIndex" />
                            <FigEtiquette v-else-if="chapter.id === 'etiquette'" :copy="c.figures.etiquette" />
                            <FigToday v-else-if="chapter.id === 'today'" :copy="c.figures.today" />
                        </div>
                    </div>

                    <section class="h-sources article-references" :aria-label="c.ui.sources">
                        <h3 class="h-sources__title">{{ c.ui.sources }}</h3>
                        <ol class="h-sources__list">
                            <li v-for="source in chapter.sources" :key="source.url">
                                <a class="h-source" :href="source.url" target="_blank" rel="noopener noreferrer">
                                    <span class="h-source__kind">{{ c.ui.kinds[source.kind] }}{{ ' ' }}</span>
                                    <span class="h-source__title">{{ source.title }}{{ ' ' }}</span>
                                    <span class="h-source__publisher">{{ source.publisher }}</span>
                                    <svg class="h-source__arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z" /></svg>
                                </a>
                            </li>
                        </ol>
                    </section>
                </div>
            </section>

            <HistoryTimeline :copy="c.timeline" :motion-enabled="effectsEnabled" />
        </article>

        <!-- Outro -->
        <aside class="h-outro">
            <div class="h-outro__swatches" aria-hidden="true">
                <i v-for="(color, index) in outroColors" :key="index" :style="{ background: color, '--i': index }"></i>
            </div>
            <div class="h-wrap h-outro__inner">
                <p class="section-eyebrow"><span>16</span> {{ c.outro.eyebrow }}</p>
                <h2 class="section-title">{{ c.outro.title }} <em>{{ c.outro.titleAccent }}</em></h2>
                <p class="h-outro__lead">{{ c.outro.lead }}</p>
                <div class="h-outro__actions">
                    <NuxtLink to="/#themes" class="h-btn h-btn--primary">{{ c.outro.browse }}</NuxtLink>
                    <NuxtLink to="/generator" class="h-btn">{{ c.outro.generator }}</NuxtLink>
                </div>
            </div>
        </aside>
    </main>
</template>

<script setup>
import Header from '@/components/Header/Header.vue';
import RichText from '@/components/History/RichText';
import FigAscii from '@/components/History/FigAscii.vue';
import FigPhosphor from '@/components/History/FigPhosphor.vue';
import FigSgr from '@/components/History/FigSgr.vue';
import FigAnsiTable from '@/components/History/FigAnsiTable.vue';
import FigBright from '@/components/History/FigBright.vue';
import FigCube from '@/components/History/FigCube.vue';
import CubeDepth from '@/components/History/CubeDepth.vue';
import FigTruecolor from '@/components/History/FigTruecolor.vue';
import FigThemes from '@/components/History/FigThemes.vue';
import FigContrast from '@/components/History/FigContrast.vue';
import FigEtiquette from '@/components/History/FigEtiquette.vue';
import FigToday from '@/components/History/FigToday.vue';
import HistoryTimeline from '@/components/History/HistoryTimeline.vue';
import { HISTORY_CHAPTERS, HISTORY_THEMES } from '~/utils/historyData';
import { createHistoryHover } from '~/utils/historyHover';
import { createHistoryField } from '~/utils/historyField';

const { t, localeInfo } = useI18n();
const c = useHistoryContent();
const { calm, systemReduced, ready: motionReady, enabled: effectsEnabled, setCalm } = useHistoryMotion();

const title = () => t('meta.historyTitle');
const description = () => t('meta.historyDescription');

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl('/history/'),
    ogImage: `${SITE_URL}/history/hero.webp`,
    ogType: 'article',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: `${SITE_URL}/history/hero.webp`,
});
useHead({
    link: [{ rel: 'canonical', href: canonicalUrl('/history/') }],
});
useHead(() => ({
    script: [{
        key: 'history-article',
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${c.value.hero.title} ${c.value.hero.titleAccent}`,
            description: c.value.hero.lead,
            inLanguage: localeInfo.value.htmlLang,
            url: canonicalUrl('/history/'),
            image: `${SITE_URL}/history/hero.webp`,
        }),
    }],
}));

// The Gogh theme's sixteen colors, used for the hero and outro bands.
const SPECTRUM = HISTORY_THEMES[0].colors;
const themeIndex = ref(0);
const outroColors = computed(() => HISTORY_THEMES[themeIndex.value]?.colors ?? SPECTRUM);

// Real SGR sequences, each painted in the color it selects.
const MARQUEE = [
    'ESC[31m', 'ESC[32m', 'ESC[33m', 'ESC[34m', 'ESC[35m', 'ESC[36m', 'ESC[37m',
    'ESC[1;91m', 'ESC[92m', 'ESC[93m', 'ESC[94m', 'ESC[95m', 'ESC[96m',
].map((code, i) => [code, SPECTRUM[i + 1]]).concat([['ESC[38;5;208m', '#ff8700'], ['ESC[38;2;255;121;198m', '#ff79c6']]);

const CHAPTER_LAYOUTS = {
    paper: 'spread', glass: 'split-left', escape: 'studio', eight: 'panorama',
    sixteen: 'split-right', cube: 'object', truecolor: 'chromatic', themes: 'split-left',
    science: 'split-right', etiquette: 'quiet', today: 'immersive',
};
const PINNED_LAYOUTS = new Set(['spread', 'object', 'immersive']);

function pad(value) {
    return String(value).padStart(2, '0');
}

function goTo(hash) {
    // Chapters land with their stage filling the screen; the index sits below the rail.
    if (effectsEnabled.value) scrollToTarget(hash, hash === '#chapters' ? -120 : 0);
    else {
        const target = document.querySelector(hash);
        if (target) window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + (hash === '#chapters' ? -120 : 0), behavior: 'instant' });
    }
    history.replaceState(history.state, '', hash);
}

/* ---------- Scroll state: active chapter + reading progress ---------- */
const root = ref(null);
const railLinks = [];
const activeChapter = ref(-1);
const progress = ref(0);
const smoothScroll = useSmoothScroll();
const ambient = computed(() => HISTORY_CHAPTERS[activeChapter.value]?.accent ?? '#2aa198');
let media = null;
let disposeHover = null;
let disposeField = null;
let ownsSmoothScroll = false;
let motionFrame = 0;
let motionInitialized = false;
let readingAnchor = null;
let frame = 0;

function updateScrollState() {
    frame = 0;
    const sections = HISTORY_CHAPTERS.map((chapter) => document.getElementById(chapter.id));
    const probe = window.innerHeight * 0.35;
    let active = -1;
    sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= probe) {
            active = index;
        }
    });
    if (active !== activeChapter.value) {
        activeChapter.value = active;
        // Keep the current chapter centered in the rail on narrow screens.
        // Scrolls only the rail: scrollIntoView would also move the page.
        const link = railLinks[active];
        const rail = link?.parentElement;
        if (link && rail && rail.scrollWidth > rail.clientWidth) {
            rail.scrollTo({ left: link.offsetLeft - (rail.clientWidth - link.offsetWidth) / 2, behavior: effectsEnabled.value ? 'smooth' : 'auto' });
        }
    }

    const first = sections[0];
    const last = sections[sections.length - 1];
    if (first && last) {
        const start = first.offsetTop - probe;
        const end = last.offsetTop + last.offsetHeight - window.innerHeight;
        progress.value = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(1, end - start)));
    }
}

function onScroll() {
    if (!frame) {
        frame = requestAnimationFrame(updateScrollState);
    }
}

function stopEffects() {
    disposeHover?.(); disposeHover = null;
    disposeField?.(); disposeField = null;
    media?.revert(); media = null;
    if (ownsSmoothScroll) { smoothScroll.stop(); ownsSmoothScroll = false; }
}

function startEffects() {
    disposeHover = createHistoryHover(root.value);
    disposeField = createHistoryField(root.value);
    smoothScroll.start(); ownsSmoothScroll = true;
    const { gsap, ScrollTrigger } = useGsap();
    media = gsap.matchMedia(root.value);
    media.add({ wide: '(min-width: 768px)', desktop: '(min-width: 992px)', motion: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
        if (!conditions.motion) return;
        const { wide, desktop } = conditions;
        const blurIn = { opacity: 0, y: 24 };

        // The existing chapter color moves behind the artwork, across the whole
        // reading journey. It never crosses over text or interactive figures.
        gsap.fromTo('.h-ambient__glow--far', { xPercent: -8, yPercent: -10 }, {
            xPercent: 8, yPercent: 12, ease: 'none',
            scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom bottom', scrub: 1.2 },
        });
        gsap.fromTo('.h-ambient__glow--near', { xPercent: 10, yPercent: 12 }, {
            xPercent: -10, yPercent: -8, ease: 'none',
            scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom bottom', scrub: 1.6 },
        });

        /* Hero: the drawing comes into focus, the title rises out of masks. */
        gsap.fromTo('.h-hero__image', { scale: 1.06, opacity: 0, filter: 'blur(12px)' }, {
            scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.8, ease: 'expo.out',
        });
        gsap.from('.h-hero__line', { yPercent: 115, duration: 1.6, stagger: 0.12, ease: 'expo.out', delay: 0.2 });
        gsap.from('.h-hero__masthead, .h-hero__lead, .h-hero__cue', {
            ...blurIn, duration: 1.4, stagger: 0.07, ease: 'expo.out', delay: 0.45,
        });
        // Scrolling away: the copy lifts and fades, the image sinks.
        gsap.to('.h-hero__inner', {
            yPercent: -18, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.h-hero__media', {
            yPercent: 12, ease: 'none',
            scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.from('.h-hero__stats li', {
            ...blurIn, duration: 1, stagger: 0.1, ease: 'expo.out',
            scrollTrigger: { trigger: '.h-facts', start: 'top 90%' },
        });
        gsap.fromTo('.h-marquee__track', { xPercent: 0 }, {
            xPercent: -10, ease: 'none',
            scrollTrigger: { trigger: '.h-marquee', start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        });

        /* Keep the index on the same plane as the site's other cards. */
        gsap.set('.h-index__item', { opacity: 0, y: 36 });
        ScrollTrigger.batch('.h-index__item', {
            start: 'top 95%',
            once: true,
            onEnter: (items) => gsap.to(items, {
                opacity: 1, y: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', clearProps: 'transform',
            }),
        });

        gsap.utils.toArray('.h-chapter').forEach((section) => {
            const stage = section.querySelector('.h-stage');
            const frame = section.querySelector('.h-stage__media');
            const image = section.querySelector('.h-chapter__image');
            const header = section.querySelector('.h-chapter__header');
            const body = section.querySelector('.h-chapter__body');
            const layout = CHAPTER_LAYOUTS[section.id];
            const pinned = desktop && PINNED_LAYOUTS.has(layout);
            const direction = ['spread', 'split-right'].includes(layout) ? -1 : 1;

            // The illustration is the moving layer; its soft mask stays in place.
            // The cube's WebGL relief owns its projection; keep its poster and
            // canvas aligned rather than applying another image transform.
            if (section.id !== 'cube') {
                gsap.fromTo(image, {
                    scale: section.id === 'paper' ? 1.02 : 1.08,
                    xPercent: wide ? -2 * direction : 0, yPercent: -3,
                }, {
                    scale: section.id === 'paper' ? 1.06 : 1.02,
                    xPercent: wide ? 2 * direction : 0, yPercent: 3,
                    ease: 'none',
                    scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
                });
            }

            // Title lines rise out of their masks once the stage is mostly in.
            gsap.timeline({
                scrollTrigger: { trigger: stage, start: pinned ? 'top 25%' : 'top 70%', toggleActions: 'play none none reverse' },
            })
                .from(header.querySelector('.h-chapter__eyebrow'), { ...blurIn, duration: 1, ease: 'expo.out' })
                .from(header.querySelectorAll('.h-rise'), { yPercent: 115, duration: 1.4, stagger: 0.1, ease: 'expo.out' }, '<0.1')
                .from(header.querySelector('.h-chapter__lead'), { ...blurIn, duration: 1.2, ease: 'expo.out' }, '<0.3');

            // Leaving the pin: the scene dims and the copy drifts up as the reading starts.
            if (pinned) {
                gsap.to(header.querySelector('.h-chapter__copy'), {
                    y: -48, opacity: 0, ease: 'none',
                    scrollTrigger: { trigger: stage, start: 'bottom 95%', end: 'bottom 62%', scrub: true },
                });
                gsap.to(frame, {
                    opacity: 0.35, ease: 'none',
                    scrollTrigger: { trigger: stage, start: 'bottom 100%', end: 'bottom 30%', scrub: true },
                });
            }

            gsap.from(body.querySelectorAll('.h-chapter__text p'), {
                ...blurIn, duration: 1.2, stagger: 0.08, ease: 'expo.out',
                scrollTrigger: { trigger: body, start: 'top 85%' },
            });
            // The figure settles into the reading grid without rotating its UI.
            gsap.fromTo(body.querySelector('.h-chapter__figure'), {
                opacity: 0, y: 56,
            }, {
                opacity: 1, y: 0, ease: 'power2.out',
                scrollTrigger: { trigger: body, start: 'top 100%', end: 'top 45%', scrub: 0.8 },
            });
            gsap.from(section.querySelectorAll('.h-source'), {
                opacity: 0, y: 24,
                duration: 0.9, stagger: 0.06, ease: 'expo.out',
                scrollTrigger: { trigger: section.querySelector('.h-sources'), start: 'top 90%' },
            });
        });

        gsap.from('.h-outro__swatches i', {
            scaleY: 0, transformOrigin: 'bottom', duration: 1.4, stagger: 0.04, ease: 'expo.out',
            scrollTrigger: { trigger: '.h-outro', start: 'top 70%' },
        });
        gsap.from('.h-outro__inner > *', {
            ...blurIn, duration: 1.3, stagger: 0.08, ease: 'expo.out',
            scrollTrigger: { trigger: '.h-outro', start: 'top 65%' },
        });

    });
}

// Keep the paragraph in view when removing the taller, pinned scenes.
watch(effectsEnabled, () => {
    if (!motionInitialized || !root.value) return;
    const candidates = [...root.value.querySelectorAll('.h-chapter__text p, .h-chapter__copy, .h-hero__inner, .h-index__header')]
        .map(element => ({ element, top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom }))
        .filter(item => item.bottom > 120 && item.top < innerHeight - 80)
        .sort((a, b) => Math.abs(a.top - 130) - Math.abs(b.top - 130));
    readingAnchor = candidates[0] ?? null;
}, { flush: 'pre' });

watch(effectsEnabled, (enabled) => {
    stopEffects();
    if (enabled) startEffects();
    motionInitialized = true;
    cancelAnimationFrame(motionFrame);
    motionFrame = requestAnimationFrame(() => {
        motionFrame = 0;
        if (readingAnchor?.element.isConnected) {
            const delta = readingAnchor.element.getBoundingClientRect().top - readingAnchor.top;
            if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
        }
        readingAnchor = null;
        useGsap().ScrollTrigger.refresh();
        updateScrollState();
    });
}, { flush: 'post' });

onMounted(() => {
    if (!effectsEnabled.value) motionInitialized = true;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollState();
});

onBeforeUnmount(() => {
    stopEffects();
    cancelAnimationFrame(motionFrame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(frame);
});
</script>

<style lang="scss" scoped>
@use '@/pages/history.scss';
</style>
