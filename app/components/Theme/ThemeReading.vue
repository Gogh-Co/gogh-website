<template>
    <section ref="root" class="reading" :style="themeVars" aria-labelledby="theme-reading-title">
        <div class="reading__inner">
            <p class="section-eyebrow section-eyebrow--themed reading__eyebrow"><span>02</span> {{ t('reading.eyebrow') }}</p>
            <h2 id="theme-reading-title" class="visually-hidden">{{ t('reading.heading', { name: themeName }) }}</h2>

            <!-- The summary lights up word by word as it scrolls through.
                 Color names, hex codes and ratios take the color they talk about. -->
            <p class="reading__text">
                <template v-for="(word, index) in words" :key="index">
                    <span
                        class="reading__word"
                        :class="{ 'reading__word--accent': word.swatch || word.strong }"
                        :style="word.color ? { color: word.color } : null"
                    ><i v-if="word.swatch" class="reading__swatch" :style="{ backgroundColor: word.swatch }" aria-hidden="true"></i>{{ word.text }}</span>{{ word.space ? ' ' : '' }}
                </template>
            </p>

            <p class="reading__note">{{ t('reading.note') }}</p>
        </div>
    </section>
</template>

<script setup>
const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
    themeName: {
        type: String,
        required: true,
    },
    sentences: {
        type: Array,
        default: () => [],
    },
});

const { t, locale, localeInfo } = useI18n();
const root = ref(null);
let gsapContext = null;
let wordsContext = null;

const themeVars = computed(() => ({
    '--bg': safeHex(props.theme.background) || '#0a0f14',
    '--fg': safeHex(props.theme.foreground) || '#f4efe6',
}));

// Color names in the summary ("Bright Yellow", "Red"...) mapped to their hex.
const colorByLabel = computed(() => {
    const map = new Map();
    for (const slot of [...normalColorSlots(t), ...brightColorSlots(t)]) {
        const hex = safeHex(props.theme[slot.key]);
        if (hex) {
            map.set(slot.label, hex);
        }
    }
    return map;
});

const words = computed(() => {
    const labels = [...colorByLabel.value.keys()].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(#[0-9a-fA-F]{6}\\b|\\d+(?:\\.\\d+)?:1|\\b(?:${labels.map((label) => label.replace(/\s+/g, '\\s+')).join('|')})\\b)`, 'g');
    const out = [];
    // Whether the source had a space after each word, so "(#282a36)." keeps
    // its parentheses tight around the highlighted hex.
    const push = (word) => out.push({ space: false, ...word });

    for (const sentence of props.sentences) {
        for (const part of String(sentence).split(pattern)) {
            if (!part) {
                continue;
            }
            const previous = out[out.length - 1];
            if (previous && /^\s/.test(part)) {
                previous.space = true;
            }

            let color = null;
            let strong = false;
            if (/^#[0-9a-fA-F]{6}$/.test(part)) {
                color = part;
            } else if (/:1$/.test(part)) {
                strong = true;
            } else if (colorByLabel.value.has(part.replace(/\s+/g, ' '))) {
                color = colorByLabel.value.get(part.replace(/\s+/g, ' '));
            }

            if (color || strong) {
                // A matched token stays one unit, so "Bright Yellow" lights up together.
                // Colors too close to the background (the background itself,
                // a black on a dark theme) keep the foreground and show a swatch.
                const readable = color && (contrastRatio(color, props.theme.background) ?? 0) >= 1.8;
                push({ text: part, color: readable ? color : null, swatch: color, strong });
                continue;
            }

            const pieces = part.split(/\s+/);
            pieces.forEach((text, index) => {
                if (text) {
                    push({ text, space: index < pieces.length - 1 });
                }
            });
        }
        // Sentences are separate strings: a space between them (none in
        // scripts that don't use spaces).
        if (out.length && localeInfo.value.spaced) {
            out[out.length - 1].space = true;
        }
    }

    return out;
});

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    setupWords();
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        // The eyebrow decodes from binary the first time the section comes in.
        gsap.from('.reading__eyebrow', {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: root.value,
                start: 'top 80%',
                onEnter: () => binaryDecode(root.value?.querySelector('.reading__eyebrow'), { delay: 100, duration: 700 }),
            },
        });
    }, root.value);
});

function setupWords() {
    wordsContext?.revert();
    const { gsap } = useGsap();
    wordsContext = gsap.context(() => {
        gsap.fromTo('.reading__word', { opacity: 0.14 }, {
            opacity: 1,
            stagger: 0.05,
            ease: 'none',
            scrollTrigger: {
                trigger: '.reading__text',
                start: 'top 80%',
                end: 'bottom 50%',
                scrub: 0.6,
            },
        });
    }, root.value);
}

// The summary is rewritten in another language: light up the new words.
watch(locale, () => {
    if (wordsContext) {
        nextTick(setupWords);
    }
});

onBeforeUnmount(() => {
    wordsContext?.revert();
    gsapContext?.revert();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.reading {
    padding: 120px 20px 130px;
    background: var(--bg);
    color: var(--fg);

    @include m768 {
        padding: 180px 48px 190px;
    }
}

.reading__inner {
    max-width: 1280px;
    margin: 0 auto;
}

.reading__text {
    margin: 0;
    color: var(--fg);
    font-family: $font_display;
    font-size: clamp(2.8rem, 4.4vw, 6.4rem);
    font-weight: 300;
    line-height: 1.12;
    letter-spacing: -0.03em;
}

.reading__word {
    display: inline;
}

.reading__word--accent {
    font-weight: 800;
}

.reading__swatch {
    display: inline-block;
    width: 0.62em;
    height: 0.62em;
    margin: 0 0.14em 0.04em 0.04em;
    vertical-align: baseline;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--fg) 45%, transparent);
}

.reading__note {
    max-width: 620px;
    margin: 56px 0 0;
    color: color-mix(in srgb, var(--fg) 62%, transparent);
    font-size: 1.4rem;
    line-height: 1.6;
}
</style>
