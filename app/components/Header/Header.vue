<template>
    <header
        class="gogh-header"
        :class="{
            'is-scrolled': scrolled || !overlay,
            'is-hidden': hidden && !mobileNavOpen,
            'is-menu-open': mobileNavOpen,
        }"
    >
        <div class="gogh-header__inner">
            <NuxtLink to="/" class="gogh-header__brand" aria-label="Gogh home" @click="onBrandClick">
                <span class="gogh-header__brand-text">Gogh</span>
                <span class="gogh-header__logo-bar" aria-hidden="true">
                    <span
                        v-for="(color, index) in logoBarColors"
                        :key="index"
                        class="gogh-header__logo-swatch"
                        :style="{ backgroundColor: color, '--i': index }"
                    ></span>
                </span>
            </NuxtLink>

            <nav id="gogh-header-nav" class="gogh-header__nav" :class="{ 'is-open': mobileNavOpen }" aria-label="Primary">
                <NuxtLink
                    v-for="(link, index) in NAV_LINKS"
                    :key="link.to"
                    :to="link.to"
                    class="gogh-header__nav-link"
                    :style="{ '--i': index }"
                    @click="mobileNavOpen = false"
                >
                    <span class="gogh-header__nav-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
                    {{ link.label }}
                </NuxtLink>

                <div class="gogh-header__tools">
                    <button
                        type="button"
                        class="gogh-header__theme-toggle gogh-header__random"
                        :class="{ 'is-loading': randomLoading }"
                        aria-label="Open a random theme"
                        title="Random theme"
                        :aria-busy="randomLoading"
                        :disabled="randomLoading"
                        @pointerenter="prefetchThemePaths"
                        @focus="prefetchThemePaths"
                        @click="openRandomTheme"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2.5 3a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M7.5 15a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3"/></svg>
                        <span class="gogh-header__theme-toggle-label">Random theme</span>
                    </button>

                    <button
                        type="button"
                        class="gogh-header__theme-toggle"
                        :aria-label="pageTheme === 'dark' ? 'Switch page to light background' : 'Switch page to dark background'"
                        :aria-pressed="pageTheme === 'dark'"
                        @click="togglePageTheme"
                    >
                        <svg v-if="pageTheme === 'dark'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1M3 11a1 1 0 0 1 0 2H2a1 1 0 1 1 0-2zm19 0a1 1 0 0 1 0 2h-1a1 1 0 1 1 0-2zM4.929 4.929a1 1 0 0 1 1.414 0l.707.707A1 1 0 1 1 5.636 7.05l-.707-.707a1 1 0 0 1 0-1.414m12.02 12.02a1 1 0 0 1 1.415 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414M19.071 4.929a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0M7.05 16.95a1 1 0 0 1 0 1.414l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M9.822 2.238a.75.75 0 0 1 .174.808a7.5 7.5 0 0 0 9.958 9.958a.75.75 0 0 1 .982.982A9.001 9.001 0 0 1 12 21a9 9 0 0 1-2.834-17.539a.75.75 0 0 1 .656.777"/></svg>
                        <span class="gogh-header__theme-toggle-label">{{ pageTheme === 'dark' ? 'Light background' : 'Dark background' }}</span>
                    </button>

                    <AuthControl />
                </div>
            </nav>

            <button
                type="button"
                class="gogh-header__toggle"
                :class="{ 'is-open': mobileNavOpen }"
                :aria-expanded="mobileNavOpen"
                aria-controls="gogh-header-nav"
                :aria-label="mobileNavOpen ? 'Close menu' : 'Open menu'"
                @click="mobileNavOpen = !mobileNavOpen"
            >
                <span></span>
                <span></span>
            </button>
        </div>
    </header>

    <!-- Pages without a full-bleed hero keep their content below the fixed bar. -->
    <div v-if="!overlay" class="gogh-header-spacer" aria-hidden="true"></div>
</template>

<script setup>
import githubButtonsScript from '@/assets/static/buttons.js?raw';
import AuthControl from '@/components/Auth/AuthControl.vue';

defineProps({
    // The home page lets its hero run under a transparent bar; everywhere
    // else the bar is solid from the start and reserves its own height.
    overlay: {
        type: Boolean,
        default: false,
    },
});

const NAV_LINKS = [
    { to: '/', label: 'Themes' },
    { to: '/generator', label: 'Generator' },
    { to: '/wcsg', label: 'WCAG' },
    { to: '/stats', label: 'Stats' },
    { to: '/wallpapers', label: 'Wallpapers' },
    { to: '/terminals', label: 'Terminals' },
];

const mobileNavOpen = ref(false);
const scrolled = ref(false);
const hidden = ref(false);
const { pageTheme, togglePageTheme, initPageTheme } = usePageTheme();
const { user, checkAuth } = useAuth();
const { initFavorites, mergeAfterLogin, mergedThisSession } = useFavorites();

const logoBarColors = GOGH_LOGO_COLORS;

const route = useRoute();
const randomLoading = ref(false);

// Already on the home page the link would be a no-op, so it scrolls back to
// the top instead (after the mobile menu has released the page scroll).
async function onBrandClick(event) {
    mobileNavOpen.value = false;
    if (route.path !== '/') {
        return;
    }
    event.preventDefault();
    await nextTick();
    scrollToTarget(0, 0);
}

// Warm the theme list on hover/focus so the click itself feels instant.
function prefetchThemePaths() {
    loadThemePagePaths().catch(() => {});
}

async function openRandomTheme() {
    if (randomLoading.value) {
        return;
    }
    randomLoading.value = true;
    try {
        const path = await pickRandomThemePagePath(route.path);
        if (path) {
            mobileNavOpen.value = false;
            await navigateTo(path);
        }
    } catch {
        // Theme list unavailable (offline / API rate limit): stay put.
    } finally {
        randomLoading.value = false;
    }
}

let lastScrollY = 0;
let ticking = false;

// Glass background once the page moves; hides while scrolling down and comes
// back as soon as the visitor scrolls up (or reaches the top).
function onScroll() {
    if (ticking) {
        return;
    }
    ticking = true;
    requestAnimationFrame(() => {
        const y = window.scrollY;
        scrolled.value = y > 24;
        if (y < 160) {
            hidden.value = false;
        } else if (Math.abs(y - lastScrollY) > 6) {
            hidden.value = y > lastScrollY;
        }
        lastScrollY = y;
        ticking = false;
    });
}

// The full-screen mobile menu shouldn't let the page scroll behind it.
watch(mobileNavOpen, (open) => {
    if (typeof document === 'undefined') {
        return;
    }
    document.documentElement.classList.toggle('gogh-menu-open', open);
    setPageScrollLocked(open);
});

function mountGithubButtons() {
    if (typeof document === 'undefined') {
        return;
    }

    // The buttons.js library only scans the DOM for `.github-button`
    // anchors once, when its script executes. Header re-mounts on every
    // client-side navigation (it lives in each page, not app.vue) and
    // pages render their own `.github-button` anchors, so the old script
    // must be removed and re-injected each time to force a re-scan —
    // otherwise those anchors are left untransformed.
    const scriptId = 'github-buttons-inline';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
        existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.text = githubButtonsScript;
    document.body.appendChild(script);
}

onMounted(async () => {
    mountGithubButtons();
    initPageTheme();
    initFavorites();

    lastScrollY = window.scrollY;
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    await checkAuth();

    // Covers sessions that never went through AuthControl's own
    // login()-then-mergeAfterLogin() call: the popup-blocked fallback is a
    // full top-level redirect (see useAuth.ts's login()), which reloads the
    // page and lands here already authenticated, as does simply reloading
    // an existing session. Runs once per session (see mergedThisSession).
    if (user.value && !mergedThisSession.value) {
        mergeAfterLogin(user.value.id);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll);
    document.documentElement.classList.remove('gogh-menu-open');
});
</script>

<style lang="scss" scoped>
@use './Header.scss';
</style>
