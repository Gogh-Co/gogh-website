<template>
    <section ref="root" class="install">
        <div class="install__glow" aria-hidden="true"></div>
        <div class="install__inner">
            <p class="section-eyebrow"><span>05</span> Get started</p>
            <h2 class="install__title">
                One line.<br><em>Any theme.</em>
            </h2>

            <div class="install__command">
                <InstallCommand tone="solid" />
            </div>

            <ol class="install__steps">
                <li v-for="(step, index) in STEPS" :key="step.title" class="install__step">
                    <span class="install__step-index">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span class="install__step-title">{{ step.title }}</span>
                    <span class="install__step-text">{{ step.text }}</span>
                </li>
            </ol>
        </div>
    </section>
</template>

<script setup>
import InstallCommand from './InstallCommand.vue';

const STEPS = [
    { title: 'Run the command', text: 'Paste it into the terminal you want to theme. Linux uses wget, macOS uses curl.' },
    { title: 'Pick your themes', text: 'Choose one or several from the numbered list, or open any theme below and copy its own one-liner.' },
    { title: 'Switch any time', text: 'Run it again whenever you want to try another palette. It takes seconds.' },
];

const root = ref(null);
let gsapContext = null;

onMounted(() => {
    if (prefersReducedMotion()) {
        return;
    }
    const { gsap } = useGsap();
    gsapContext = gsap.context(() => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: root.value, start: 'top 70%' } });
        timeline
            .from('.install__inner > .section-eyebrow, .install__title, .install__command', {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.1,
                ease: 'expo.out',
            })
            .from('.install__step', {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.12,
                ease: 'expo.out',
            }, '-=0.8');
    }, root.value);
});

onBeforeUnmount(() => gsapContext?.revert());
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.install {
    position: relative;
    padding: 140px 20px 160px;
    overflow: hidden;
    border-top: 1px solid var(--ink-line);
    background: var(--ink);
    color: var(--cream);
    isolation: isolate;

    @include m768 {
        padding: 180px 48px 200px;
    }
}

.install__glow {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: -1;
    width: min(1100px, 140vw);
    aspect-ratio: 1;
    border-radius: 0;
    background: conic-gradient(from 0deg, #e74c3c, #f1c40f, #2ecc71, #2aa198, #3498db, #9b59b6, #e74c3c);
    filter: blur(140px);
    opacity: 0.18;
    transform: translate(-50%, -30%);
    animation: spin 30s linear infinite;
}

.install__inner {
    max-width: 1100px;
    margin: 0 auto;
    text-align: center;

    .section-eyebrow {
        justify-content: center;
    }
}

.install__title {
    margin: 0 0 48px;
    color: var(--cream);
    font-family: $font_display;
    font-size: clamp(5.2rem, 10vw, 14rem);
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.055em;

    em {
        font-style: normal;
        font-weight: 100;
        letter-spacing: -0.04em;
        background: linear-gradient(100deg, var(--gogh-yellow), var(--gogh-red) 35%, var(--gogh-magenta) 65%, var(--gogh-blue));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }
}

.install__command {
    display: flex;
    justify-content: center;
    margin: 0 0 80px;
    text-align: left;

    :deep(.install-cmd) {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    :deep(.install-cmd__box) {
        width: 100%;
    }
}

.install__steps {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: left;

    @include m768 {
        grid-template-columns: repeat(3, 1fr);
    }
}

.install__step {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 26px;
    border: 1px solid var(--ink-line);
    border-radius: 0;
    background: rgba(17, 26, 34, 0.7);
    backdrop-filter: blur(10px);
}

.install__step-index {
    color: var(--gogh-yellow);
    font-family: $font_default;
    font-size: 1.2rem;
    letter-spacing: 0.1em;
}

.install__step-title {
    font-family: $font_display;
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.install__step-text {
    color: var(--muted);
    font-size: 1.45rem;
    line-height: 1.55;
}

@keyframes spin {
    to {
        transform: translate(-50%, -30%) rotate(360deg);
    }
}
</style>
