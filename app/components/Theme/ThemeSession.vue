<template>
    <section ref="root" class="session" :style="themeVars" aria-labelledby="theme-session-title">
        <div class="session__inner">
            <header class="session__header">
                <p class="section-eyebrow session__eyebrow"><span>03</span> Live session</p>
                <h2 id="theme-session-title" class="section-title session__title">A day in <em>the shell.</em></h2>
                <p class="session__lede">
                    A made-up session that plays in a loop: git, vim, a commit and a push, then ssh into a server,
                    fastfetch and htop. Nothing runs for real, and every character takes its color from {{ themeName }}.
                </p>
            </header>

            <!-- #live-session: the hero's theme name links here, and the page
                 centers the terminal itself rather than the section heading. -->
            <div id="live-session" class="session__stage" data-anchor="center">
                <div class="session__window">
                    <TerminalFrame :theme="theme" :title="state.title">
                        <div class="session__fit">
                            <div class="session__screen" role="img" :aria-label="screenLabel">
                                <div v-for="(row, rowIndex) in rows" :key="rowIndex" class="session__row" aria-hidden="true">
                                    <span
                                        v-for="(part, partIndex) in row"
                                        :key="part.cur ? `cursor-${state.keys}` : partIndex"
                                        :class="segmentClass(part)"
                                    >{{ part.t }}</span>
                                </div>
                            </div>
                        </div>
                    </TerminalFrame>
                </div>

                <div class="session__controls">
                    <button
                        type="button"
                        class="session__toggle"
                        :aria-label="playing ? 'Pause the session' : 'Play the session'"
                        @click="toggle"
                    >
                        <svg v-if="playing" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" /><rect x="9.5" y="3" width="3" height="10" /></svg>
                        <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4L13 8z" /></svg>
                    </button>

                    <ol class="session__chapters">
                        <li
                            v-for="(chapter, index) in session.chapters"
                            :key="chapter.id"
                            class="session__chapter"
                            :style="{ flexGrow: chapter.end - chapter.start }"
                        >
                            <button
                                type="button"
                                class="session__jump"
                                :class="{ 'is-active': index === activeChapter }"
                                :aria-current="index === activeChapter ? 'step' : undefined"
                                :aria-label="`Jump to ${chapter.label}`"
                                @click="jumpTo(chapter)"
                            >
                                <span class="session__track"><span ref="fills" class="session__fill"></span></span>
                                <span class="session__label">{{ chapter.label }}</span>
                            </button>
                        </li>
                    </ol>

                    <span ref="timeEl" class="session__time" aria-hidden="true">{{ formatClock(posterTime) }} / {{ formatClock(session.total) }}</span>

                    <!-- Download the loop as a file; a running export can be cancelled. -->
                    <div class="session__downloads" role="group" aria-label="Download the session">
                        <button
                            v-for="format in downloadFormats"
                            :key="format.id"
                            type="button"
                            class="session__download"
                            :class="{ 'is-busy': exporting === format.id }"
                            :disabled="!!exporting && exporting !== format.id"
                            :title="exporting === format.id ? 'Cancel' : format.title"
                            :aria-label="exporting === format.id ? `Cancel the ${format.label} export` : format.title"
                            @click="download(format.id)"
                        >
                            <span class="session__download-bar" :style="exporting === format.id ? { transform: `scaleX(${exportProgress})` } : null"></span>
                            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7.25 2h1.5v7.19l2.47-2.47 1.06 1.06L8 12.06 3.72 7.78l1.06-1.06 2.47 2.47zM3 13h10v1.5H3z" /></svg>
                            <span>{{ exporting === format.id ? `${Math.round(exportProgress * 100)}%` : format.label }}</span>
                        </button>
                    </div>
                </div>
                <p class="session__status" role="status" aria-live="polite">{{ exportStatus }}</p>
            </div>
        </div>
    </section>
</template>

<script setup>
import TerminalFrame from '@/components/Terminal/TerminalFrame.vue';

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
const fills = ref([]);
const timeEl = ref(null);
let gsapContext = null;

const themeVars = computed(() => themeCssVars(props.theme));
const session = computed(() => buildTerminalSession(props.theme, props.themeName));
const posterTime = computed(() => session.value.times[session.value.posterIndex] ?? 0);

// Until the section scrolls into view (and on the server) the screen shows a
// poster frame: fastfetch's output with the palette swatches.
const state = ref(sessionStateAt(session.value, session.value.posterIndex));
const rows = computed(() => renderTerminalSession(state.value));
const activeChapter = ref(chapterAt(posterTime.value));
const playing = ref(false);

const screenLabel = computed(() => `An animated, made-up terminal session in ${props.themeName}: git status, editing `
    + `${session.value.file} in vim, a commit and a push, ssh into a server, fastfetch and htop.`);

let stepIndex = session.value.posterIndex;
let clock = posterTime.value;
let started = false;
let visible = false;
let frameId = 0;
let lastFrame = 0;
let lastSecond = -1;
let observer = null;

function segmentClass(part) {
    return [
        part.c && `f-${part.c}`,
        part.bg && `b-${part.bg}`,
        part.b && 'is-bold',
        part.i && 'is-italic',
        part.cur && `is-cursor is-cursor--${part.cur}`,
    ];
}

function formatClock(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function chapterAt(time) {
    const { chapters } = session.value;
    const index = chapters.findIndex((chapter) => time >= chapter.start && time < chapter.end);
    return index === -1 ? chapters.length - 1 : index;
}

// Progress bars and the clock change every frame, so they skip Vue and are
// written straight to the DOM.
function paint() {
    session.value.chapters.forEach((chapter, index) => {
        const fill = fills.value[index];
        if (fill) {
            const amount = Math.min(1, Math.max(0, (clock - chapter.start) / (chapter.end - chapter.start)));
            fill.style.transform = `scaleX(${amount})`;
        }
    });
    const second = Math.floor(clock / 1000);
    if (second !== lastSecond && timeEl.value) {
        lastSecond = second;
        timeEl.value.textContent = `${formatClock(clock)} / ${formatClock(session.value.total)}`;
    }
    const chapter = chapterAt(clock);
    if (chapter !== activeChapter.value) {
        activeChapter.value = chapter;
    }
}

function seek(index) {
    started = true;
    stepIndex = index;
    clock = session.value.times[index] ?? 0;
    state.value = sessionStateAt(session.value, index);
    paint();
    loop();
}

function frame(now) {
    frameId = 0;
    if (!playing.value || !visible) {
        return;
    }
    const delta = lastFrame ? Math.min(now - lastFrame, 100) : 0;
    lastFrame = now;
    clock += delta;

    const { steps, times, total } = session.value;
    if (clock >= total) {
        // Back to the top: the last step already left the same screen.
        clock -= total;
        stepIndex = 0;
        state.value = session.value.initial();
    }
    while (stepIndex < steps.length && times[stepIndex] <= clock) {
        steps[stepIndex].run?.(state.value);
        stepIndex++;
    }

    paint();
    frameId = requestAnimationFrame(frame);
}

function loop() {
    if (!frameId && playing.value && visible) {
        lastFrame = 0;
        frameId = requestAnimationFrame(frame);
    }
}

function halt() {
    if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
    }
}

// Downloads: the GIF works everywhere; the video needs WebCodecs, so its
// button appears once the browser says it can encode.
const videoSupported = ref(false);
const exporting = ref('');
const exportProgress = ref(0);
const exportStatus = ref('');
let exportAbort = null;
let statusTimer = 0;

const downloadFormats = computed(() => [
    { id: 'gif', label: 'GIF', title: `Download the session as a GIF in ${props.themeName}` },
    ...(videoSupported.value ? [{ id: 'video', label: 'MP4', title: `Download the session as an MP4 video in ${props.themeName}` }] : []),
]);

function announce(message) {
    exportStatus.value = message;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
        exportStatus.value = '';
    }, 5000);
}

async function download(format) {
    if (exporting.value) {
        if (exporting.value === format) exportAbort?.abort();
        return;
    }
    exporting.value = format;
    exportProgress.value = 0;
    exportAbort = new AbortController();
    announce(`Rendering the ${format === 'gif' ? 'GIF' : 'video'}…`);
    trackEvent('Session', { action: 'export-start', format: formatName(format) });
    try {
        const exporter = format === 'gif' ? exportSessionGif : exportSessionVideo;
        const result = await exporter(props.theme, props.themeName, {
            signal: exportAbort.signal,
            onProgress: (fraction) => {
                exportProgress.value = fraction;
            },
        });
        saveBlob(result);
        trackEvent('Download', { kind: format === 'gif' ? 'session-gif' : 'session-mp4', theme: props.themeName });
        announce(`Saved ${result.filename} (${(result.blob.size / 1048576).toFixed(1)} MB).`);
    } catch (error) {
        announce(error?.name === 'AbortError' ? 'Export cancelled.' : 'This browser could not create the file.');
        trackEvent('Session', { action: error?.name === 'AbortError' ? 'export-cancel' : 'export-error', format: formatName(format) });
        if (error?.name !== 'AbortError') console.error(error);
    } finally {
        exporting.value = '';
        exportAbort = null;
    }
}

function formatName(format) {
    return format === 'gif' ? 'gif' : 'mp4';
}

// Only the visitor's own clicks are tracked: seek() also runs on its own
// when the loop restarts.
function jumpTo(chapter) {
    seek(chapter.stepIndex);
    trackEvent('Session', { action: 'chapter', chapter: chapter.label });
}

function toggle() {
    playing.value = !playing.value;
    trackEvent('Session', { action: playing.value ? 'play' : 'pause' });
    if (playing.value) {
        if (!started) {
            seek(0);
        }
        loop();
    } else {
        halt();
    }
}

watch(session, () => {
    halt();
    started = false;
    stepIndex = session.value.posterIndex;
    clock = posterTime.value;
    state.value = sessionStateAt(session.value, stepIndex);
    lastSecond = -1;
    paint();
    if (playing.value && visible) {
        seek(0);
    }
});

onMounted(() => {
    // Moving content that lasts this long needs a way to stop it: the toggle.
    // Visitors who ask for less motion get the poster and can press play.
    playing.value = !prefersReducedMotion();
    videoSupported.value = canExportSessionVideo();
    paint();

    observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) {
            halt();
            return;
        }
        if (playing.value && !started) {
            seek(0);
        }
        loop();
    }, { threshold: 0.2 });
    observer.observe(root.value.querySelector('.session__window'));

    if (prefersReducedMotion()) {
        return;
    }
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        gsap.from('.session__header > *', {
            y: 50,
            opacity: 0,
            duration: 1.2,
            stagger: 0.08,
            ease: 'expo.out',
            scrollTrigger: {
                trigger: '.session__header',
                start: 'top 80%',
                onEnter: () => binaryDecode(root.value?.querySelector('.session__eyebrow'), { delay: 120, duration: 700 }),
            },
        });
        gsap.from('.session__window', {
            y: 90,
            rotateX: 14,
            scale: 0.95,
            opacity: 0,
            transformPerspective: 1400,
            transformOrigin: '50% 100%',
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: { trigger: '.session__stage', start: 'top 80%' },
        });
    }, root.value);
});

onBeforeUnmount(() => {
    exportAbort?.abort();
    window.clearTimeout(statusTimer);
    halt();
    observer?.disconnect();
    gsapContext?.revert();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

$slots: '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16';

.session {
    padding: 110px 20px 120px;
    background: var(--ink);
    color: var(--cream);

    @include m768 {
        padding: 160px 48px 170px;
    }
}

.session__inner {
    max-width: 1400px;
    margin: 0 auto;
}

.session__header {
    display: grid;
    gap: 0 60px;
    margin: 0 0 70px;

    @include m992 {
        grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
        align-items: end;

        .session__eyebrow {
            grid-column: 1 / -1;
        }
    }
}

.session__lede {
    max-width: 560px;
    margin: 28px 0 0;
    color: var(--muted);
    font-size: 1.6rem;
    line-height: 1.55;
}

// Wide enough for the 88-column grid at its largest font size, no wider.
.session__stage {
    max-width: 920px;
    margin: 0 auto;
    perspective: 1400px;
}

.session__window {
    filter: drop-shadow(0 40px 60px rgba(0, 0, 0, 0.45));

    :deep(.terminal-frame) {
        margin: 0;
    }

    :deep(.terminal-frame__body) {
        overflow: hidden;
    }
}

// The screen is a fixed 88 x 24 grid; its font scales with the window so the
// grid always fits, like a terminal that keeps its size in columns.
.session__fit {
    container-type: inline-size;
}

.session__screen {
    width: 88ch;
    height: #{24 * 1.5}em;
    margin: 0 auto;
    overflow: hidden;
    font-family: $font_mono;
    font-size: clamp(5.5px, calc(100cqw / 53.6), 16px);
    line-height: 1.5;
    font-variant-ligatures: none;
}

.session__row {
    height: 1.5em;
    overflow: hidden;
    white-space: pre;

    span {
        display: inline-block;
        height: 100%;
        vertical-align: top;
    }
}

@each $slot in $slots {
    .f-#{$slot} {
        color: var(--c#{$slot});
    }

    .b-#{$slot} {
        background: var(--c#{$slot});
    }
}

.f-fg {
    color: var(--fg);
}

.f-bg {
    color: var(--bg);
}

.b-cursor {
    background: var(--cursor);
}

.is-bold {
    font-weight: 700;
}

.is-italic {
    font-style: italic;
}

// Solid for half a second after each keystroke (the span is re-keyed), then blinks.
.is-cursor {
    animation: 1.06s step-end 0.53s infinite;
}

.is-cursor--block {
    animation-name: session-blink-block;
}

.is-cursor--bar {
    box-shadow: inset 0.14em 0 0 var(--cursor);
    animation-name: session-blink-bar;
}

@keyframes session-blink-block {
    50% {
        background: transparent;
        color: var(--fg);
    }
}

@keyframes session-blink-bar {
    50% {
        box-shadow: none;
    }
}

// Controls: play/pause, one segment per chapter (as wide as it lasts) and the clock.
.session__controls {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    margin: 26px 0 0;
}

.session__toggle {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-top: -6px;
    padding: 0;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    background: transparent;
    color: var(--cream);
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease;

    svg {
        width: 14px;
        height: 14px;
        fill: currentColor;
    }

    &:hover {
        border-color: color-mix(in srgb, var(--cream) 45%, transparent);
        background: color-mix(in srgb, var(--cream) 6%, transparent);
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 2px;
    }
}

.session__chapters {
    display: flex;
    flex: 1 1 auto;
    gap: 6px;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

.session__chapter {
    flex-basis: 0;
    min-width: 0;
    margin: 0;
}

.session__jump {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    padding: 0 0 4px;
    border: 0;
    background: none;
    color: var(--muted);
    text-align: left;
    cursor: pointer;

    &:hover,
    &.is-active {
        color: var(--cream);
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 4px;
    }
}

.session__track {
    position: relative;
    display: block;
    width: 100%;
    height: 2px;
    overflow: hidden;
    background: var(--ink-line);
}

.session__fill {
    position: absolute;
    inset: 0;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: 0 50%;
}

.session__label {
    overflow: hidden;
    font-family: $font_mono;
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
    text-overflow: ellipsis;

    // The short chapters only fit their label on wide screens.
    @media (max-width: 767px) {
        display: none;
    }
}

.session__time {
    flex: 0 0 auto;
    margin-top: -3px;
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.15rem;
    font-variant-numeric: tabular-nums;

    @media (max-width: 479px) {
        display: none;
    }
}

.session__downloads {
    display: flex;
    flex: 0 0 auto;
    gap: 6px;
    margin-top: -9px;
}

// Small outlined buttons; while rendering, a fill grows behind the percentage.
.session__download {
    position: relative;
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-width: 66px;
    height: 30px;
    padding: 0 10px;
    overflow: hidden;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    background: transparent;
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.1rem;
    letter-spacing: 0.06em;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;

    svg {
        position: relative;
        width: 12px;
        height: 12px;
        fill: currentColor;
    }

    span:not(.session__download-bar) {
        position: relative;
    }

    &:hover:not(:disabled),
    &.is-busy {
        border-color: color-mix(in srgb, var(--cream) 45%, transparent);
        color: var(--cream);
    }

    &:disabled {
        opacity: 0.35;
        cursor: default;
    }

    &:focus-visible {
        outline: 2px solid var(--cream);
        outline-offset: 2px;
    }
}

.session__download-bar {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--cream) 14%, transparent);
    transform: scaleX(0);
    transform-origin: 0 50%;
    transition: transform 0.2s linear;
}

.session__status {
    min-height: 1.6em;
    margin: 14px 0 0;
    color: var(--muted);
    font-family: $font_mono;
    font-size: 1.1rem;
    text-align: right;
}
</style>
