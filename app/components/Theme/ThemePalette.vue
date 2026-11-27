<template>
    <section ref="root" class="palette" aria-labelledby="theme-palette-title" :style="themeVars">
        <div class="palette__inner">
            <header class="palette__header">
                <p class="section-eyebrow palette__eyebrow"><span>01</span> {{ t('palette.eyebrow') }}</p>
                <h2 id="theme-palette-title" class="section-title palette__title">
                    {{ t('palette.title') }}<br><em>{{ t('palette.titleAccent') }}</em>
                </h2>
                <p class="palette__lede">{{ t('palette.lede', { name: themeName }) }}</p>
            </header>

            <!-- Type specimen: foreground over background, with the real cursor. -->
            <div class="specimen">
                <div class="specimen__canvas">
                    <span class="specimen__glyphs" aria-hidden="true">Aa<span class="specimen__cursor"></span></span>
                    <span class="specimen__sample" aria-hidden="true">
                        <span style="color: var(--c03)">user@linux</span>:<span style="color: var(--c05)">~/gogh</span>$ ls
                    </span>
                </div>

                <dl class="specimen__stats">
                    <div class="specimen__stat">
                        <dt>{{ t('palette.textContrast') }}</dt>
                        <dd>
                            <span class="specimen__number" :data-count="summary.foregroundContrast ?? 0" data-decimals="1">{{ formatRatio(summary.foregroundContrast) }}</span><span class="specimen__unit">:1</span>
                            <span v-if="summary.foregroundLevel" class="level" :class="`level--${levelClass(summary.foregroundLevel)}`">{{ t(contrastLevelKey(summary.foregroundLevel)) }}</span>
                        </dd>
                    </div>
                    <div class="specimen__stat">
                        <dt>{{ t('palette.readableAccents') }}</dt>
                        <dd>
                            <span class="specimen__number" :data-count="summary.readableAccents">{{ summary.readableAccents }}</span><span class="specimen__unit">/{{ summary.totalAccents }}</span>
                        </dd>
                    </div>
                    <div v-if="summary.strongest" class="specimen__stat">
                        <dt>{{ t('palette.loudest') }}</dt>
                        <dd class="specimen__pick">
                            <i :style="{ backgroundColor: hexOf(summary.strongest.key) }"></i>
                            {{ summary.strongest.label }} <small>{{ summary.strongest.ratio.toFixed(1) }}:1</small>
                        </dd>
                    </div>
                    <div v-if="summary.weakest && summary.weakest.key !== summary.strongest?.key" class="specimen__stat">
                        <dt>{{ t('palette.subtlest') }}</dt>
                        <dd class="specimen__pick">
                            <i :style="{ backgroundColor: hexOf(summary.weakest.key) }"></i>
                            {{ summary.weakest.label }} <small>{{ summary.weakest.ratio.toFixed(1) }}:1</small>
                        </dd>
                    </div>
                </dl>
            </div>

            <div v-for="group in groups" :key="group.id" class="palette__group">
                <div class="palette__group-head">
                    <h3 class="palette__group-title">{{ group.title }}</h3>
                    <p v-if="group.intro" class="palette__group-intro">{{ group.intro }}</p>
                </div>

                <ul class="chips" :class="`chips--${group.id}`">
                    <li v-for="color in group.colors" :key="color.key" class="chips__item">
                        <button
                            type="button"
                            class="chip"
                            :class="{ 'is-copied': copiedKey === color.key }"
                            :style="{ '--chip': color.hex, '--chip-ink': color.ink }"
                            :aria-label="t('palette.copyHexAria', { label: color.label, hex: color.hex })"
                            @click="copy(color)"
                        >
                            <span class="chip__swatch">
                                <span class="chip__hex">{{ color.hex }}</span>
                                <span class="chip__copied" aria-hidden="true">{{ t('common.copied') }}</span>
                            </span>
                            <span class="chip__meta">
                                <span class="chip__name">
                                    {{ color.label }}
                                    <code class="chip__key">{{ color.key }}</code>
                                </span>
                                <span v-if="color.ratio" class="level" :class="`level--${color.levelClass}`">{{ color.ratio }} · {{ t(contrastLevelKey(color.level)) }}</span>
                                <span class="chip__role">{{ color.role }}</span>
                            </span>
                        </button>
                    </li>
                </ul>
            </div>

            <span class="visually-hidden" role="status" aria-live="polite">{{ copiedKey ? t('palette.hexCopied') : '' }}</span>
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
    summary: {
        type: Object,
        required: true,
    },
});

const { t } = useI18n();
const root = ref(null);
const copiedKey = ref('');
let copiedTimer = null;
let gsapContext = null;

const themeVars = computed(() => themeCssVars(props.theme));

function hexOf(key) {
    return safeHex(props.theme[key]) || 'transparent';
}

function formatRatio(ratio) {
    return typeof ratio === 'number' ? ratio.toFixed(1) : t('common.notAvailable');
}

function levelClass(level) {
    return String(level || '').toLowerCase().replace(/\s+/g, '-');
}

function describeSlot(slot) {
    const hex = safeHex(props.theme[slot.key]);
    const ratio = slot.key === 'background' ? null : contrastRatio(hex, props.theme.background);
    const level = contrastLevel(ratio);
    return {
        ...slot,
        hex: hex || t('common.notAvailable'),
        ink: inkFor(hex),
        ratio: ratio === null ? '' : `${ratio.toFixed(1)}:1`,
        level,
        levelClass: levelClass(level),
    };
}

const groups = computed(() => [
    {
        id: 'base',
        title: t('palette.baseTitle'),
        intro: t('palette.baseIntro'),
        colors: baseColorSlots(t).map(describeSlot),
    },
    {
        id: 'normal',
        title: t('palette.normalTitle'),
        intro: t('palette.normalIntro'),
        colors: normalColorSlots(t).map(describeSlot),
    },
    {
        id: 'bright',
        title: t('palette.brightTitle'),
        intro: t('palette.brightIntro'),
        colors: brightColorSlots(t).map(describeSlot),
    },
]);

async function copy(color) {
    if (!safeHex(color.hex)) {
        return;
    }
    try {
        await navigator.clipboard.writeText(color.hex);
    } catch {
        // No clipboard access (insecure context): the hex is on screen anyway.
    }
    copiedKey.value = color.key;
    trackEvent('Color Copy', { slot: color.key });
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
        copiedKey.value = '';
    }, 1400);
}

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }

    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.from('.palette__header > *', {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '.palette__header',
                start: 'top 80%',
                onEnter: () => binaryDecode(root.value?.querySelector('.palette__eyebrow'), { delay: 120, duration: 700 }),
            },
        });

        // Specimen: the panel wipes open, then the numbers count up.
        gsap.from('.specimen__canvas', {
            clipPath: 'inset(0 100% 0 0)',
            duration: 1.4,
            ease: 'expo.inOut',
            scrollTrigger: { trigger: '.specimen', start: 'top 80%' },
        });
        gsap.from('.specimen__stat', {
            y: 30,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            delay: 0.4,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.specimen', start: 'top 80%' },
        });
        root.value.querySelectorAll('.specimen__number[data-count]').forEach((element) => {
            const target = Number(element.dataset.count) || 0;
            const decimals = Number(element.dataset.decimals) || 0;
            const counter = { value: 0 };
            gsap.to(counter, {
                value: target,
                duration: 1.6,
                delay: 0.5,
                ease: 'expo.out',
                scrollTrigger: { trigger: '.specimen', start: 'top 80%' },
                onUpdate: () => {
                    element.textContent = counter.value.toFixed(decimals);
                },
            });
        });

        // Each row of chips rises out of a mask; hex codes decode as they land.
        root.value.querySelectorAll('.chips').forEach((list) => {
            const swatches = list.querySelectorAll('.chip__swatch');
            const metas = list.querySelectorAll('.chip__meta');
            gsap.from(swatches, {
                clipPath: 'inset(100% 0 0 0)',
                duration: 1.1,
                stagger: 0.06,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: list,
                    start: 'top 85%',
                    onEnter: () => {
                        list.querySelectorAll('.chip__hex').forEach((hex, index) => {
                            binaryDecode(hex, { delay: 150 + index * 60, duration: 600 });
                        });
                    },
                },
            });
            gsap.from(metas, {
                y: 24,
                opacity: 0,
                duration: 1,
                stagger: 0.06,
                delay: 0.2,
                ease: 'expo.out',
                scrollTrigger: { trigger: list, start: 'top 85%' },
            });
        });
    }, root.value);
});

onBeforeUnmount(() => {
    clearTimeout(copiedTimer);
    gsapContext?.revert();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.palette {
    padding: 110px 20px 120px;
    background: var(--ink);
    color: var(--cream);

    @include m768 {
        padding: 160px 48px 160px;
    }
}

.palette__inner {
    max-width: 1400px;
    margin: 0 auto;
}

.palette__header {
    display: grid;
    gap: 0 60px;
    margin: 0 0 64px;

    @include m992 {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        align-items: end;

        .palette__eyebrow {
            grid-column: 1 / -1;
        }
    }
}

.palette__lede {
    max-width: 480px;
    margin: 28px 0 0;
    color: var(--muted);
    font-size: 1.6rem;
    line-height: 1.55;
}

/* ---------------------------------------------------------- specimen */

.specimen {
    display: grid;
    margin: 0 0 90px;
    border: 1px solid var(--ink-line);

    @include m992 {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    }
}

.specimen__canvas {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 300px;
    padding: 28px 32px;
    overflow: hidden;
    background: var(--bg);
    color: var(--fg);

    @include m768 {
        min-height: 380px;
    }
}

.specimen__glyphs {
    display: inline-flex;
    align-items: flex-end;
    font-family: $font_display;
    font-size: clamp(12rem, 18vw, 24rem);
    font-weight: 300;
    line-height: 0.85;
    letter-spacing: -0.06em;
}

.specimen__cursor {
    display: inline-block;
    width: 0.38em;
    height: 0.72em;
    margin: 0 0 0.04em 0.08em;
    background: var(--cursor);
    animation: blink 1.1s steps(1) infinite;
}

.specimen__sample {
    font-family: $font_mono;
    font-size: 1.5rem;
}

.specimen__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 0;
    background: var(--ink-2);
}

.specimen__stat {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
    min-height: 150px;
    padding: 22px 24px;
    border-top: 1px solid var(--ink-line);
    border-left: 1px solid var(--ink-line);

    &:nth-child(-n + 2) {
        @include m992 {
            border-top: 0;
        }
    }

    dt {
        color: var(--muted);
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    dd {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 2px 10px;
        margin: 0;
    }
}

.specimen__number {
    font-size: clamp(4.4rem, 5vw, 6.4rem);
    font-weight: 200;
    line-height: 1;
    letter-spacing: -0.04em;
    font-variant-numeric: tabular-nums;
}

.specimen__unit {
    margin-left: -8px;
    color: var(--muted);
    font-size: 2.4rem;
    font-weight: 200;
}

.specimen__pick {
    font-size: 1.9rem;
    font-weight: 600;

    i {
        width: 18px;
        height: 18px;
        align-self: center;
        outline: 1px solid var(--ink-line);
    }

    small {
        color: var(--muted);
        font-size: 1.3rem;
        font-weight: 400;
    }
}

/* ------------------------------------------------------------- chips */

.palette__group {
    margin: 0 0 70px;

    &:last-of-type {
        margin-bottom: 0;
    }
}

.palette__group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 24px;
    margin: 0 0 22px;
    padding: 0 0 14px;
    border-bottom: 1px solid var(--ink-line);
}

.palette__group-title {
    margin: 0;
    color: var(--cream);
    font-size: 2.6rem;
    font-weight: 300;
    letter-spacing: -0.02em;
}

.palette__group-intro {
    margin: 0;
    color: var(--muted);
    font-size: 1.4rem;
}

.chips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px 14px;
    margin: 0;
    padding: 0;
    list-style: none;

    @include m768 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @include m1200 {
        grid-template-columns: repeat(8, minmax(0, 1fr));
    }
}

.chips--base {
    @include m768 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .chip__swatch {
        height: 140px;
    }
}

.chips__item {
    margin: 0;
    min-width: 0;
}

.chip {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: start;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 4px;
    }

    &:hover .chip__swatch,
    &:focus-visible .chip__swatch {
        transform: translateY(-8px);
        box-shadow: 0 34px 60px -26px var(--chip), 0 0 0 1px rgba(255, 255, 255, 0.16);
    }

    &:hover .chip__hex {
        letter-spacing: 0.12em;
    }

    &.is-copied {
        .chip__hex {
            opacity: 0;
            transform: translateY(-10px);
        }

        .chip__copied {
            opacity: 1;
            transform: translateY(0);
        }
    }
}

.chip__swatch {
    position: relative;
    display: flex;
    align-items: flex-end;
    height: 170px;
    padding: 12px 14px;
    background: var(--chip);
    color: var(--chip-ink);
    // Keeps near-black chips visible against the ink section.
    box-shadow: 0 0 0 1px var(--ink-line);
    transition: transform 0.6s $ease_out_expo, box-shadow 0.6s $ease_out_expo;
}

.chip__hex,
.chip__copied {
    font-family: $font_mono;
    font-size: 1.35rem;
    letter-spacing: 0.04em;
    text-transform: lowercase;
    transition: opacity 0.3s ease, transform 0.5s $ease_out_expo, letter-spacing 0.6s $ease_out_expo;
}

.chip__copied {
    position: absolute;
    left: 14px;
    bottom: 12px;
    font-family: $font_default;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0;
    transform: translateY(10px);
}

.chip__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
    padding: 14px 2px 0;
    font-size: 1.3rem;
    line-height: 1.45;
}

.chip__name {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
    color: var(--cream);
    font-size: 1.5rem;
    font-weight: 600;
}

.chip__key {
    padding: 0;
    background: none;
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.1rem;
    font-weight: 400;
}

.chip__role {
    color: var(--muted);
}

.level {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px 1px;
    border: 1px solid currentColor;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    white-space: nowrap;
}

.level--aaa,
.level--aa {
    color: #5fd38d;
}

.level--aa-large {
    color: #f1c40f;
}

.level--low {
    color: #ff7a6b;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}
</style>
