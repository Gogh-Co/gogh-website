<template>
    <footer ref="root" class="gogh-footer">
        <div class="gogh-footer__inner">
            <div class="gogh-footer__top">
                <div class="gogh-footer__intro">
                    <p class="gogh-footer__tagline">Color schemes for your terminal. Free and open source.</p>
                    <a href="https://github.com/Gogh-Co/Gogh" class="gogh-footer__star" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z"/></svg>
                        Star Gogh on GitHub
                    </a>
                </div>

                <nav class="gogh-footer__col" aria-label="Explore">
                    <span class="gogh-footer__col-title">Explore</span>
                    <NuxtLink to="/">Themes</NuxtLink>
                    <NuxtLink to="/generator">Generator</NuxtLink>
                    <NuxtLink to="/wcsg">WCAG data</NuxtLink>
                    <NuxtLink to="/stats">Stats</NuxtLink>
                    <NuxtLink to="/wallpapers">Wallpapers</NuxtLink>
                    <NuxtLink to="/terminals">Terminals</NuxtLink>
                </nav>

                <nav class="gogh-footer__col" aria-label="Project">
                    <span class="gogh-footer__col-title">Project</span>
                    <a href="https://github.com/Gogh-Co/Gogh" target="_blank" rel="noopener">Repository</a>
                    <a href="https://github.com/Gogh-Co/Gogh/issues" target="_blank" rel="noopener">Issues</a>
                    <a href="https://github.com/Gogh-Co/Gogh/tree/master/themes" target="_blank" rel="noopener">Theme files</a>
                </nav>
            </div>

            <div class="gogh-footer__wordmark" aria-hidden="true">
                <span v-for="(letter, index) in 'Gogh'" :key="index" class="gogh-footer__letter" :style="{ '--i': index }">{{ letter }}</span>
            </div>

            <div class="gogh-footer__palette" aria-hidden="true">
                <span v-for="(color, index) in PALETTE" :key="index" :style="{ backgroundColor: color }"></span>
            </div>

            <div class="gogh-footer__bottom">
                <span class="gogh-footer__credit">
                    Made by <a href="https://lanet.co" target="_blank" rel="noopener">Miguel D. Quintero</a>
                </span>

                <div class="gogh-footer__socials">
                    <a
                        href="https://x.com/Mgldvd_tech"
                        target="_blank"
                        rel="noopener"
                        class="gogh-footer__social-link"
                        aria-label="Follow on X"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                    </a>
                    <a
                        href="https://github.com/Mgldvd"
                        target="_blank"
                        rel="noopener"
                        class="gogh-footer__social-link"
                        aria-label="Follow on GitHub"
                    >
                        <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
const PALETTE = [
    '#243342', '#C54133', '#27AE60', '#EDB20A', '#2479D0', '#7D3EA0', '#1D8579', '#C9CCCD',
    '#34495E', '#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#2AA198', '#ECF0F1',
];

const root = ref(null);
let observer = null;

// The wordmark letters rise in once the footer scrolls into view.
onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
        root.value?.classList.add('is-visible');
        return;
    }
    observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            root.value?.classList.add('is-visible');
            observer?.disconnect();
        }
    }, { threshold: 0.15 });
    observer.observe(root.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style lang="scss" scoped>
@use './Footer.scss';
</style>
