<template>
    <Header overlay />

    <main ref="root" class="history" :style="{ '--ambient': ambient }">
        <!-- Fixed backdrop: a glow tinted by the chapter in view, plus film grain. -->
        <div class="h-ambient" aria-hidden="true">
            <span class="h-ambient__glow h-ambient__glow--far"></span>
            <span class="h-ambient__glow h-ambient__glow--near"></span>
        </div>

        <!-- Hero -->
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
                <p class="section-eyebrow h-hero__eyebrow"><span>ESC</span> {{ c.hero.eyebrow }}</p>
                <h1 class="h-hero__title">
                    <span class="h-mask"><span class="h-hero__line">{{ c.hero.title }}</span></span>
                    <span class="h-mask"><em class="h-hero__line">{{ c.hero.titleAccent }}</em></span>
                </h1>
                <p class="h-hero__lead">{{ c.hero.lead }}</p>

                <ul class="h-hero__stats">
                    <li v-for="stat in c.hero.stats" :key="stat.value">
                        <b>{{ stat.value }}</b>
                        <span>{{ stat.label }}</span>
                    </li>
                </ul>

                <a class="h-hero__cue" href="#chapters" @click.prevent="goTo('#chapters')">
                    <span>{{ c.hero.scroll }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 4h2v12l5.5-5.5l1.42 1.42L12 19.84l-7.92-7.92L5.5 10.5L11 16z" /></svg>
                </a>
            </div>

            <div class="h-hero__spectrum" aria-hidden="true">
                <i v-for="(color, index) in SPECTRUM" :key="index" :style="{ background: color, '--i': index }"></i>
            </div>
        </section>

        <!-- Chapter index -->
        <section id="chapters" class="h-index" aria-labelledby="h-index-title">
            <div class="h-wrap">
                <header class="h-index__header">
                    <p class="section-eyebrow"><span>{{ HISTORY_CHAPTERS.length }}</span> {{ c.index.eyebrow }}</p>
                    <h2 id="h-index-title" class="section-title">{{ c.index.title }}<br><em>{{ c.index.titleAccent }}</em></h2>
                </header>

                <ol class="h-index__grid">
                    <li v-for="(chapter, index) in HISTORY_CHAPTERS" :key="chapter.id" class="h-index__item" :style="{ '--accent': chapter.accent }">
                        <a class="h-card" :href="`#${chapter.id}`" @click.prevent="goTo(`#${chapter.id}`)" @pointermove="tilt" @pointerleave="untilt">
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
        </section>

        <!-- Escape-code marquee: decorative, the same sequences the chapters explain. -->
        <div class="h-marquee" aria-hidden="true">
            <div class="h-marquee__track">
                <span v-for="n in 2" :key="n">
                    <b v-for="code in MARQUEE" :key="code[0]" :style="{ color: code[1] }">{{ code[0] }}</b>
                </span>
            </div>
        </div>

        <!-- Sticky chapter rail -->
        <nav class="h-rail" :aria-label="c.ui.nav">
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
            :class="{ 'h-chapter--alt': index % 2 === 1 }"
            :style="{ '--accent': chapter.accent }"
            :aria-labelledby="`${chapter.id}-title`"
        >
            <!-- Pinned stage: the drawing fills the screen and melts into the page. -->
            <div class="h-stage">
                <div class="h-stage__sticky">
                    <div class="h-stage__media">
                        <img
                            class="h-chapter__image"
                            :src="`/history/${chapter.image}.webp`"
                            :srcset="`/history/${chapter.image}-960.webp 960w, /history/${chapter.image}.webp 1672w`"
                            sizes="100vw"
                            :alt="c.chapters[chapter.id].title + ' ' + c.chapters[chapter.id].titleAccent"
                            loading="lazy"
                            width="1672"
                            height="941"
                        >
                    </div>
                    <span class="h-chapter__bignum" aria-hidden="true">{{ pad(index + 1) }}</span>

                    <header class="h-wrap h-chapter__header">
                        <p class="section-eyebrow h-chapter__eyebrow">
                            <span>{{ pad(index + 1) }}</span>
                            {{ c.chapters[chapter.id].kicker }}
                            <b class="h-chapter__years">{{ c.chapters[chapter.id].years }}</b>
                        </p>
                        <h2 :id="`${chapter.id}-title`" class="section-title h-chapter__title">
                            <span class="h-mask"><span class="h-rise">{{ c.chapters[chapter.id].title }}</span></span>
                            <span class="h-mask"><em class="h-rise">{{ c.chapters[chapter.id].titleAccent }}</em></span>
                        </h2>
                        <p class="h-chapter__lead">{{ c.chapters[chapter.id].lead }}</p>
                    </header>
                </div>
            </div>

            <div class="h-wrap">
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

                <aside class="h-sources" :aria-label="c.ui.sources">
                    <p class="h-sources__title">{{ c.ui.sources }}</p>
                    <ul class="h-sources__list">
                        <li v-for="source in chapter.sources" :key="source.url">
                            <a class="h-source" :href="source.url" target="_blank" rel="noopener noreferrer">
                                <span class="h-source__kind">{{ c.ui.kinds[source.kind] }}</span>
                                <span class="h-source__title">{{ source.title }}</span>
                                <span class="h-source__publisher">{{ source.publisher }}</span>
                                <svg class="h-source__arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z" /></svg>
                            </a>
                        </li>
                    </ul>
                </aside>
            </div>
        </section>

        <HistoryTimeline :copy="c.timeline" />

        <!-- Outro -->
        <section class="h-outro">
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
        </section>
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
import FigTruecolor from '@/components/History/FigTruecolor.vue';
import FigThemes from '@/components/History/FigThemes.vue';
import FigContrast from '@/components/History/FigContrast.vue';
import FigEtiquette from '@/components/History/FigEtiquette.vue';
import FigToday from '@/components/History/FigToday.vue';
import HistoryTimeline from '@/components/History/HistoryTimeline.vue';
import { HISTORY_CHAPTERS, HISTORY_THEMES } from '~/utils/historyData';

const { t } = useI18n();
const c = useHistoryContent();

const title = () => t('meta.historyTitle');
const description = () => t('meta.historyDescription');

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl('/history/'),
    ogImage: `${SITE_URL}/history/hero.webp`,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: `${SITE_URL}/history/hero.webp`,
});
useHead({
    link: [{ rel: 'canonical', href: canonicalUrl('/history/') }],
});

// The Gogh theme's sixteen colors, used for the hero and outro bands.
const SPECTRUM = HISTORY_THEMES[0].colors;
const themeIndex = ref(0);
const outroColors = computed(() => HISTORY_THEMES[themeIndex.value]?.colors ?? SPECTRUM);

// Real SGR sequences, each painted in the color it selects.
const MARQUEE = [
    'ESC[31m', 'ESC[32m', 'ESC[33m', 'ESC[34m', 'ESC[35m', 'ESC[36m', 'ESC[37m',
    'ESC[1;91m', 'ESC[92m', 'ESC[93m', 'ESC[94m', 'ESC[95m', 'ESC[96m',
].map((code, i) => [code, SPECTRUM[i + 1]]).concat([['ESC[38;5;208m', '#ff8700'], ['ESC[38;2;255;121;198m', '#ff79c6']]);

function pad(value) {
    return String(value).padStart(2, '0');
}

function goTo(hash) {
    // Chapters land with their stage filling the screen; the index sits below the rail.
    scrollToTarget(hash, hash === '#chapters' ? -120 : 0);
    history.replaceState(history.state, '', hash);
}

// Index cards lean toward the cursor (mouse only, and not with reduced motion).
function tilt(event) {
    if (event.pointerType !== 'mouse' || prefersReducedMotion()) {
        return;
    }
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((event.clientX - box.left) / box.width).toFixed(3));
    card.style.setProperty('--my', ((event.clientY - box.top) / box.height).toFixed(3));
}

function untilt(event) {
    event.currentTarget.style.removeProperty('--mx');
    event.currentTarget.style.removeProperty('--my');
}

/* ---------- Scroll state: active chapter + reading progress ---------- */
const root = ref(null);
const railLinks = [];
const activeChapter = ref(-1);
const progress = ref(0);
const smoothScroll = useSmoothScroll();
const ambient = computed(() => HISTORY_CHAPTERS[activeChapter.value]?.accent ?? '#2aa198');
let media = null;
let onPointer = null;
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
            rail.scrollTo({ left: link.offsetLeft - (rail.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' });
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

onMounted(() => {
    smoothScroll.start();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateScrollState();

    const { gsap, ScrollTrigger } = useGsap();
    media = gsap.matchMedia(root.value);
    media.add({ wide: '(min-width: 768px)', motion: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
        if (!conditions.motion) return;
        const { wide } = conditions;
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
        gsap.fromTo('.h-hero__image', { scale: 1.3, opacity: 0, filter: 'blur(24px)' }, {
            scale: 1.08, opacity: 1, filter: 'blur(0px)', duration: 2.6, ease: 'expo.out',
        });
        gsap.from('.h-hero__line', { yPercent: 115, duration: 1.6, stagger: 0.12, ease: 'expo.out', delay: 0.2 });
        gsap.from('.h-hero__eyebrow, .h-hero__lead, .h-hero__stats li, .h-hero__cue', {
            ...blurIn, duration: 1.4, stagger: 0.07, ease: 'expo.out', delay: 0.45,
        });
        // Scrolling away: the copy lifts and fades, the image sinks.
        gsap.to('.h-hero__inner', {
            yPercent: -18, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to('.h-hero__media', {
            yPercent: 22, scale: 1.08, ease: 'none',
            scrollTrigger: { trigger: '.h-hero', start: 'top top', end: 'bottom top', scrub: true },
        });
        if (wide) {
            const moveX = gsap.quickTo('.h-hero__image', 'x', { duration: 1.4, ease: 'power3.out' });
            const moveY = gsap.quickTo('.h-hero__image', 'y', { duration: 1.4, ease: 'power3.out' });
            onPointer = (event) => {
                moveX((event.clientX / window.innerWidth - 0.5) * -36);
                moveY((event.clientY / window.innerHeight - 0.5) * -24);
            };
            window.addEventListener('pointermove', onPointer, { passive: true });
        }

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
            const direction = section.classList.contains('h-chapter--alt') ? -1 : 1;

            // The illustration is the moving layer; its soft mask stays in place.
            gsap.fromTo(image, {
                scale: 1.16, xPercent: wide ? -3 * direction : 0, yPercent: -4,
            }, {
                scale: 1.08, xPercent: wide ? 3 * direction : 0, yPercent: 4,
                ease: 'none',
                scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
            });
            gsap.fromTo(section.querySelector('.h-chapter__bignum'), { yPercent: 18 }, {
                yPercent: -18, ease: 'none',
                scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true },
            });

            // Title lines rise out of their masks once the stage is mostly in.
            gsap.timeline({
                scrollTrigger: { trigger: stage, start: wide ? 'top 25%' : 'top 70%', toggleActions: 'play none none reverse' },
            })
                .from(header.querySelector('.h-chapter__eyebrow'), { ...blurIn, duration: 1, ease: 'expo.out' })
                .from(header.querySelectorAll('.h-rise'), { yPercent: 115, duration: 1.4, stagger: 0.1, ease: 'expo.out' }, '<0.1')
                .from(header.querySelector('.h-chapter__lead'), { ...blurIn, duration: 1.2, ease: 'expo.out' }, '<0.3');

            // Leaving the pin: the scene dims and the copy drifts up as the reading starts.
            if (wide) {
                gsap.to(header, {
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

        return () => {
            if (onPointer) {
                window.removeEventListener('pointermove', onPointer);
                onPointer = null;
            }
        };
    });
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    cancelAnimationFrame(frame);
    media?.revert();
    smoothScroll.stop();
});
</script>

<style lang="scss" scoped>
@use '@/pages/history.scss';
</style>
