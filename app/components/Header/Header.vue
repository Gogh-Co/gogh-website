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
            <NuxtLink to="/" class="gogh-header__brand" :aria-label="t('header.home')" @click="onBrandClick">
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

            <nav id="gogh-header-nav" class="gogh-header__nav" :class="{ 'is-open': mobileNavOpen }" :aria-label="t('header.primaryNav')">
                <NuxtLink
                    v-for="(link, index) in NAV_LINKS"
                    :key="link.to"
                    :to="link.to"
                    class="gogh-header__nav-link"
                    :style="{ '--i': index }"
                    @click="onNavClick($event, link)"
                >
                    <span class="gogh-header__nav-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
                    {{ t(link.label) }}
                </NuxtLink>

                <div class="gogh-header__tools">
                    <button
                        type="button"
                        class="gogh-header__theme-toggle gogh-header__random random-dice-host"
                        :class="{ 'is-loading': randomLoading, 'is-pressed': randomKeyPressed }"
                        :aria-label="t('header.randomAria')"
                        aria-keyshortcuts="r"
                        :aria-busy="randomLoading"
                        :disabled="randomLoading"
                        @pointerenter="prefetchThemePaths"
                        @focus="prefetchThemePaths"
                        @click="openRandomTheme('button', closeMobileNav)"
                    >
                        <RandomDice />
                        <span class="gogh-header__theme-toggle-label">{{ t('header.random') }}</span>

                        <!-- Keyboard hint hanging under the button, like the
                             hero's scroll cue: a long hairline arrow from the
                             R keycap up to the die, with a light running up
                             it. The keycap presses in with R. -->
                        <span class="gogh-header__random-hint" aria-hidden="true">
                            <span class="gogh-header__random-arrow">
                                <svg class="gogh-header__random-arrowhead" xmlns="http://www.w3.org/2000/svg" width="9" height="5" viewBox="0 0 9 5"><path fill="none" stroke="currentColor" stroke-width="1" d="M.5 4.5l4-4l4 4"/></svg>
                                <span class="gogh-header__random-line"></span>
                            </span>
                            <kbd class="gogh-header__random-key">R</kbd>
                        </span>
                    </button>

                    <LanguageSwitcher />

                    <AuthControl />
                </div>
            </nav>

            <button
                type="button"
                class="gogh-header__toggle"
                :class="{ 'is-open': mobileNavOpen }"
                :aria-expanded="mobileNavOpen"
                aria-controls="gogh-header-nav"
                :aria-label="mobileNavOpen ? t('header.closeMenu') : t('header.openMenu')"
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
import LanguageSwitcher from '@/components/I18n/LanguageSwitcher.vue';
import RandomDice from '@/components/Buttons/RandomDice.vue';

defineProps({
    // The home page lets its hero run under a transparent bar; everywhere
    // else the bar is solid from the start and reserves its own height.
    overlay: {
        type: Boolean,
        default: false,
    },
});

// Labels are message keys.
const NAV_LINKS = [
    // The collection section on the home page.
    { to: '/#themes', label: 'header.nav.themes' },
    { to: '/generator', label: 'header.nav.generator' },
    { to: '/wcsg', label: 'header.nav.wcag' },
    { to: '/stats', label: 'header.nav.stats' },
    { to: '/wallpapers', label: 'header.nav.wallpapers' },
    { to: '/terminals', label: 'header.nav.terminals' },
];

const { t } = useI18n();
const mobileNavOpen = ref(false);
const scrolled = ref(false);
const hidden = ref(false);
// The light/dark toggle lives in the gallery's filters now; the header still
// applies the saved choice on every page.
const { initPageTheme } = usePageTheme();
const { user, checkAuth } = useAuth();
const { initFavorites, mergeAfterLogin, mergedThisSession } = useFavorites();

const logoBarColors = GOGH_LOGO_COLORS;

const route = useRoute();
const { randomLoading, prefetchThemePaths, openRandomTheme } = useRandomTheme();
const randomKeyPressed = ref(false);
let randomKeyTimer = 0;

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

// A link to a section of the page already open (Themes on the home page)
// glides there like the hero's "Browse the collection" instead of jumping,
// and puts the anchor in the address bar. Other links navigate as usual.
async function onNavClick(event, link) {
    mobileNavOpen.value = false;
    const [path, hash] = link.to.split('#');
    if (!hash || route.path !== (path || '/')) {
        return;
    }
    event.preventDefault();
    await nextTick();
    history.replaceState(history.state, '', `#${hash}`);
    scrollToTarget(`#${hash}`, 0);
}

// The R key does what the dice button does, unless the key belongs to
// something else: a text field, an open dialog or filter, or a shortcut with
// modifiers (Ctrl+R / Cmd+R still reload the page).
const RANDOM_KEY_OWNERS = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="listbox"]';

function onRandomKeydown(event) {
    if (event.key !== 'r' && event.key !== 'R') {
        return;
    }
    if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
    }
    if (event.target instanceof Element && event.target.closest(RANDOM_KEY_OWNERS)) {
        return;
    }
    if (document.querySelector('[aria-modal="true"], .color-filter-lightbox')) {
        return;
    }
    event.preventDefault();
    // Press the R keycap in the hint for a beat.
    randomKeyPressed.value = true;
    clearTimeout(randomKeyTimer);
    randomKeyTimer = setTimeout(() => {
        randomKeyPressed.value = false;
    }, 220);
    openRandomTheme('key', closeMobileNav);
}

function closeMobileNav() {
    mobileNavOpen.value = false;
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
    window.addEventListener('keydown', onRandomKeydown);

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
    window.removeEventListener('keydown', onRandomKeydown);
    clearTimeout(randomKeyTimer);
    document.documentElement.classList.remove('gogh-menu-open');
});
</script>

<style lang="scss" scoped>
@use './Header.scss';
</style>
