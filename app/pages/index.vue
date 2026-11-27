<template>
    <Header overlay />

    <main class="home">
        <HeroSection :themes="themes" @browse="scrollToGallery" />
        <ThemeMarquee :themes="themes" />
        <ManifestoText />
        <ThemeShowcase :themes="themes" />
        <FeatureBento />
        <TerminalsStrip />
        <InstallSteps />
    </main>

    <div id="themes" class="gogh-content gallery" :style="pageContentStyle">
        <div class="container-fluid">
            <header ref="galleryHeader" class="gallery__header">
                <p class="section-eyebrow gallery__eyebrow"><span>06</span> {{ t('gallery.eyebrow') }}</p>
                <div class="gallery__heading">
                    <!-- Hidden for the 100ms setFilter() blanks the filter, so it never flashes "0". -->
                    <p class="gallery__count" aria-live="polite" :style="{ visibility: filter === '' ? 'hidden' : 'visible' }">
                        <I18nT keypath="gallery.count" tag="" :params="{ count: filteredThemes.length }">
                            <template #count><strong ref="galleryCount">{{ n(filteredThemes.length) }}</strong></template>
                        </I18nT>
                        <span v-if="filteredThemes.length !== themes.length">{{ t('gallery.ofTotal', { total: themes.length }) }}</span>
                    </p>
                </div>
            </header>

            <PersistenceBanner />
        </div>

        <!-- Sticks under the header while the collection scrolls; once stuck
             it condenses into a single scrollable row. -->
        <div ref="galleryToolbar" class="container-fluid gallery__toolbar" :class="{ 'is-stuck': toolbarStuck }">
            <div class="row">
                <div class="col-md-12">
                    <div class="filters">
                        <div class="filters__row filters__row--filters">
                            <div class="filters__group" role="group" :aria-label="t('gallery.filterAria')">
                                <span class="filters__group-label">{{ t('gallery.filterLabel') }}</span>

                                <div class="filters__group-scroll">
                                    <ButtonFilter extra-class="js-btn--filter" :active="filter === 'all' && !colorFilterField"
                                        @click="setFilter('all'); clearColorFilter()">
                                        {{ t('common.all') }}
                                    </ButtonFilter>

                                    <ButtonFilter extra-class="js-btn--filter" :active="filter === 'light' && !colorFilterField"
                                        @click="setFilter('light'); clearColorFilter()">
                                        {{ t('common.lightThemes') }}
                                    </ButtonFilter>

                                    <ButtonFilter extra-class="js-btn--filter" :active="filter === 'dark' && !colorFilterField"
                                        @click="setFilter('dark'); clearColorFilter()">
                                        {{ t('common.darkThemes') }}
                                    </ButtonFilter>

                                    <ButtonFilter extra-class="js-btn--filter" :active="filter === 'popular' && !colorFilterField"
                                        @click="setFilter('popular'); clearColorFilter(); setSortMode('random'); setViewMode('compact')">
                                        {{ t('gallery.popular') }}
                                    </ButtonFilter>

                                    <ButtonFilter extra-class="js-btn--filter" :active="filter === 'favorites' && !colorFilterField"
                                        @click="setFilter('favorites'); clearColorFilter()">
                                        {{ favorites.length ? t('gallery.favoritesCount', { count: favorites.length }) : t('gallery.favorites') }}
                                    </ButtonFilter>

                                    <ButtonFilter
                                        :active="!!colorFilterField"
                                        aria-haspopup="dialog"
                                        :aria-expanded="colorFilterFieldMenuOpen"
                                        @click="openColorFilterFieldMenu"
                                    >
                                        {{ t('gallery.byColor') }}
                                    </ButtonFilter>
                                </div>
                            </div>

                            <div class="filters__group view-toggle" role="group" :aria-label="t('gallery.viewAria')">
                                <span class="filters__group-label">{{ t('gallery.viewLabel') }}</span>

                                <div class="filters__group-scroll">
                                    <ButtonFilter :active="viewMode === 'compact'" @click="pickViewMode('compact')">
                                        {{ t('gallery.compact') }}
                                    </ButtonFilter>

                                    <ButtonFilter :active="viewMode === 'detailed'" @click="pickViewMode('detailed')">
                                        {{ t('gallery.detailed') }}
                                    </ButtonFilter>
                                </div>
                            </div>

                            <div class="filters__group sort-toggle" role="group" :aria-label="t('gallery.sortAria')">
                                <span class="filters__group-label">{{ t('gallery.sortLabel') }}</span>

                                <div class="filters__group-scroll">
                                    <ButtonFilter :active="sortMode === 'alphabetical'" @click="setSortMode('alphabetical')">
                                        {{ sortMode === 'alphabetical' && sortDirection === 'desc' ? 'Z-A' : 'A-Z' }}
                                    </ButtonFilter>

                                    <ButtonFilter :active="sortMode === 'random'" @click="shuffleThemes">
                                        {{ t('gallery.shuffle') }}
                                    </ButtonFilter>
                                </div>
                            </div>

                            <!-- Page background behind the cards (was the header's sun/moon toggle). -->
                            <div class="filters__group background-toggle" role="group" :aria-label="t('gallery.backgroundAria')">
                                <span class="filters__group-label">{{ t('gallery.backgroundLabel') }}</span>

                                <div class="filters__group-scroll">
                                    <ButtonFilter
                                        extra-class="filter-btn--icon"
                                        :active="pageTheme === 'light'"
                                        :aria-pressed="pageTheme === 'light'"
                                        :aria-label="t('header.lightBackground')"
                                        :title="t('header.lightBackground')"
                                        @click="setPageTheme('light')"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m0 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1M3 11a1 1 0 0 1 0 2H2a1 1 0 1 1 0-2zm19 0a1 1 0 0 1 0 2h-1a1 1 0 1 1 0-2zM4.929 4.929a1 1 0 0 1 1.414 0l.707.707A1 1 0 1 1 5.636 7.05l-.707-.707a1 1 0 0 1 0-1.414m12.02 12.02a1 1 0 0 1 1.415 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414M19.071 4.929a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0M7.05 16.95a1 1 0 0 1 0 1.414l-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0"/></svg>
                                    </ButtonFilter>

                                    <ButtonFilter
                                        extra-class="filter-btn--icon"
                                        :active="pageTheme === 'dark'"
                                        :aria-pressed="pageTheme === 'dark'"
                                        :aria-label="t('header.darkBackground')"
                                        :title="t('header.darkBackground')"
                                        @click="setPageTheme('dark')"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.822 2.238a.75.75 0 0 1 .174.808a7.5 7.5 0 0 0 9.958 9.958a.75.75 0 0 1 .982.982A9.001 9.001 0 0 1 12 21a9 9 0 0 1-2.834-17.539a.75.75 0 0 1 .656.777"/></svg>
                                    </ButtonFilter>
                                </div>
                            </div>

                            <div class="theme-search" role="search">
                                <button
                                    v-if="searchQuery"
                                    type="button"
                                    class="theme-search__clear"
                                    :aria-label="t('common.clearSearch')"
                                    @click="clearSearchQuery"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29l-1.41 1.42L10.59 13.4L4.29 19.71L2.88 18.3L9.17 12L2.88 5.71L4.29 4.29l6.3 6.3l6.29-6.3z"/></svg>
                                </button>
                                <span class="theme-search__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"/></svg>
                                </span>
                                <input
                                    v-model.trim="searchQuery"
                                    class="theme-search__input"
                                    type="search"
                                    :placeholder="t('common.searchByName')"
                                    :aria-label="t('common.searchByName')"
                                >
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>


        <br>

        <div v-if="themesError && !themes.length" class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="themes-status themes-status--error" role="alert">
                        <p>{{ t(themesError) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="container-fluid">
            <div ref="galleryGrid" class="row gallery-grid" :class="{ 'is-animated': galleryReveal.enabled.value }">
                <template v-for="theme in visibleThemes" :key="getThemeName(theme) || theme.background + theme.foreground">
                    <div
                        class="gallery-card"
                        :class="viewMode === 'compact' ? 'col-6 col-md-4 col-lg-3 col-xl-2' : 'col-12 col-md-6  col-xl-4'"
                        :style="{ '--card-bg': theme.background, '--card-fg': theme.foreground }"
                    >
                        <div
                            class="terminal-preview"
                            :class="{ 'terminal-preview--detailed': viewMode === 'detailed' }"
                        >
                            <!-- The whole card opens the theme page: a real link
                                 stretched over it, under the favorite and page buttons. -->
                            <NuxtLink
                                class="terminal-preview__link"
                                :to="themePagePath(getThemeName(theme))"
                                :aria-label="t('common.themePage', { name: getThemeName(theme) })"
                            />
                            <FavoriteButton
                                :active="isFavorite(getThemeName(theme))"
                                :theme-name="getThemeName(theme)"
                                @toggle="onToggleFavorite(theme)"
                            />
                            <ThemePageLink :theme-name="getThemeName(theme)" />
                            <CompactThemeCard v-if="viewMode === 'compact'" :theme="theme" />
                            <PreviewTerminal v-else :theme="theme" />
                        </div>
                    </div>
                </template>
            </div>

            <GalleryLoader
                v-if="filteredThemes.length"
                :loaded="visibleThemes.length"
                :total="filteredThemes.length"
                :loading="loadingMore"
            />

            <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true"></div>
        </div>

        <div
            v-if="colorFilterFieldMenuOpen"
            class="color-filter-lightbox"
            data-lenis-prevent
            @click.self="closeColorFilterFieldMenu"
        >
            <button
                type="button"
                class="color-filter-lightbox__close"
                :aria-label="t('gallery.closeColorFilter')"
                @click="closeColorFilterFieldMenu"
            >
                ×
            </button>

            <div class="color-filter-lightbox__content">
                <div class="color-filter-grid" role="group" :aria-label="t('gallery.colorFilterAria')">
                    <button
                        type="button"
                        class="color-filter-cube color-filter-cube--background"
                        :class="{ active: colorFilterField === 'background' }"
                        :style="'background-color:' + BACKGROUND_FILTER_OPTION.previewColor"
                        :aria-pressed="colorFilterField === 'background'"
                        :title="t(BACKGROUND_FILTER_OPTION.label)"
                        :aria-label="t('gallery.filterByOption', { color: t(BACKGROUND_FILTER_OPTION.label) })"
                        @click="selectColorFilterField('background')"
                    ></button>

                    <div class="color-filter-grid__ansi">
                        <div class="color-filter-grid__row">
                            <button
                                v-for="option in NORMAL_COLOR_FILTER_OPTIONS"
                                :key="option.key"
                                type="button"
                                class="color-filter-cube"
                                :class="{ active: colorFilterField === option.key }"
                                :style="'background-color:' + option.previewColor"
                                :aria-pressed="colorFilterField === option.key"
                                :title="t(option.label)"
                                :aria-label="t('gallery.filterByOption', { color: t(option.label) })"
                                @click="selectColorFilterField(option.key)"
                            ></button>
                        </div>

                        <div class="color-filter-grid__row">
                            <button
                                v-for="option in BRIGHT_COLOR_FILTER_OPTIONS"
                                :key="option.key"
                                type="button"
                                class="color-filter-cube"
                                :class="{ active: colorFilterField === option.key }"
                                :style="'background-color:' + option.previewColor"
                                :aria-pressed="colorFilterField === option.key"
                                :title="t(option.label)"
                                :aria-label="t('gallery.filterByOption', { color: t(option.label) })"
                                @click="selectColorFilterField(option.key)"
                            ></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="colorFilterValueMenuOpen"
            class="background-lightbox"
            data-lenis-prevent
            @click.self="closeColorFilterValueMenu"
        >
            <button
                type="button"
                class="background-lightbox__close"
                :aria-label="t('gallery.closeColorFilter')"
                @click="closeColorFilterValueMenu"
            >
                ×
            </button>

            <div class="background-lightbox__content">
                <div class="background-lightbox__header">
                    <h3 class="background-lightbox__title">{{ t('gallery.colorFilterTitle', colorFilterFieldLabel) }}</h3>

                    <div class="background-lightbox__sort" role="group" :aria-label="t('gallery.sortSwatches')">
                        <ButtonFilter :active="colorFilterValueSortMode === 'color'" @click="setColorFilterValueSortMode('color')">
                            {{ t('gallery.sortColor') }}
                        </ButtonFilter>

                        <ButtonFilter :active="colorFilterValueSortMode === 'count'" @click="setColorFilterValueSortMode('count')">
                            {{ colorFilterValueSortMode === 'count' && colorFilterValueSortDirection === 'asc' ? t('gallery.leastFirst') : t('gallery.mostFirst') }}
                        </ButtonFilter>
                    </div>
                </div>

                <div class="background-lightbox__grid">
                    <template v-for="item in colorFilterFieldValues" :key="item.hex">
                        <button
                            type="button"
                            class="background-lightbox__swatch"
                            :class="{ active: colorFilterValue === item.hex.toLowerCase() }"
                            :style="'background-color:' + item.hex"
                            :title="t('common.themesCount', { count: item.count })"
                            @click="selectColorFilterValue(item.hex)"
                        >
                            <span class="background-lightbox__count" :style="{ color: item.textColor, textShadow: item.textShadow }">{{ item.count }}</span>
                            <span class="background-lightbox__hex">{{ item.hex.toLowerCase() }}</span>
                        </button>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <div id=master-dev style="display:none">
        4d 69 67 75 65 6c 20 44 2e 20 51 75 69 6e 74 65 72 6f 20 2d 20 6d 69 67 75 65 6c 64 61 76 69 64 71 40 67 6d 61 69 6c 2e 63 6f 6d
    </div>

    <FavoritesSignInBanner :visible="showFavoritesBanner" @close="dismissFavoritesBanner" />

    <ClientOnly>
        <ShareSite />
    </ClientOnly>
</template>

<script setup>
import chroma from 'chroma-js';

const { t, n } = useI18n();
const title = () => t('meta.homeTitle');
const description = () => t('meta.siteDescription');

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl('/'),
    twitterTitle: title,
    twitterDescription: description,
});
useHead({
    link: [{ rel: 'canonical', href: canonicalUrl('/') }],
});

import PreviewTerminal from '@/components/Terminal/PreviewTerminal.vue';
import CompactThemeCard from '@/components/Terminal/CompactThemeCard.vue';
import FavoriteButton from '@/components/Terminal/FavoriteButton.vue';
import ThemePageLink from '@/components/Terminal/ThemePageLink.vue';
import FavoritesSignInBanner from '@/components/Terminal/FavoritesSignInBanner.vue';
import PersistenceBanner from '@/components/Banner/PersistenceBanner.vue';
import Header from '@/components/Header/Header.vue';
import ButtonFilter from '@/components/Buttons/ButtonFilter.vue';
import ShareSite from '@/components/Buttons/ShareSite.vue';
import HeroSection from '@/components/Home/HeroSection.vue';
import ThemeMarquee from '@/components/Home/ThemeMarquee.vue';
import ManifestoText from '@/components/Home/ManifestoText.vue';
import ThemeShowcase from '@/components/Home/ThemeShowcase.vue';
import FeatureBento from '@/components/Home/FeatureBento.vue';
import TerminalsStrip from '@/components/Home/TerminalsStrip.vue';
import InstallSteps from '@/components/Home/InstallSteps.vue';
import GalleryLoader from '@/components/Home/GalleryLoader.vue';
import I18nT from '@/components/I18nT';

const smoothScroll = useSmoothScroll();
const galleryHeader = ref(null);
const galleryGrid = ref(null);
const galleryCount = ref(null);
const galleryReveal = useGalleryReveal(galleryGrid);
const loadingMore = ref(false);
const galleryToolbar = ref(null);
const toolbarStuck = ref(false);
let toolbarTicking = false;

// The toolbar is "stuck" once its top reaches the sticky offset set in CSS.
function updateToolbarStuck() {
    toolbarTicking = false;
    const element = galleryToolbar.value;
    if (!element) {
        return;
    }
    const stickyTop = parseFloat(getComputedStyle(element).top) || 0;
    const rect = element.getBoundingClientRect();
    const stuck = rect.top <= stickyTop + 1 && window.scrollY > 0;
    if (stuck === toolbarStuck.value) {
        return;
    }
    // Freeze the toolbar's height while stuck: the filters condense to one
    // row, but the page below mustn't jump (or the stuck state would flicker).
    element.style.height = stuck ? `${element.offsetHeight}px` : '';
    toolbarStuck.value = stuck;
}

function onToolbarScroll() {
    if (!toolbarTicking) {
        toolbarTicking = true;
        requestAnimationFrame(updateToolbarStuck);
    }
}
let galleryMotion = null;

function scrollToGallery() {
    scrollToTarget('#themes', 0);
}

const { favorites, isFavorite, toggleFavorite } = useFavorites();
const { user } = useAuth();

// Nudges anonymous visitors, once, toward signing in so favorites persist
// beyond this browser. Dismissing it is remembered in localStorage so it
// never comes back for that visitor, even across sessions.
const FAVORITES_BANNER_DISMISSED_KEY = 'gogh-favorites-banner-dismissed';
const showFavoritesBanner = ref(false);

function isFavoritesBannerDismissed() {
    try {
        return localStorage.getItem(FAVORITES_BANNER_DISMISSED_KEY) === '1';
    } catch {
        return false;
    }
}

function dismissFavoritesBanner() {
    showFavoritesBanner.value = false;
    try {
        localStorage.setItem(FAVORITES_BANNER_DISMISSED_KEY, '1');
    } catch {
        // Ignore storage failures (private browsing, disabled storage, quota, etc.).
    }
}

function onToggleFavorite(theme) {
    const name = getThemeName(theme);
    toggleFavorite(name, user.value?.id ?? null);
    trackEvent('Favorite', { action: isFavorite(name) ? 'add' : 'remove', theme: name, place: 'gallery' });
    if (!user.value && !isFavoritesBannerDismissed()) {
        showFavoritesBanner.value = true;
    }
}

// The banner is only ever relevant while signed out - if a sign-in completes
// elsewhere (e.g. via the header) while it's open, close it too.
watch(user, (value) => {
    if (value) showFavoritesBanner.value = false;
});

const THEMES_PAGE_SIZE = 60;

// The 48 most popular terminal color schemes, used by the "Popular" filter.
// One single research pass (web search, Sept 2026), ranking every candidate
// on the same two signals:
//   1. GitHub stars on the scheme's own origin repo (api.github.com/repos/<owner>/<repo>).
//   2. VS Code Marketplace install counts for the closest matching editor theme.
// ...corroborated with "best terminal/iTerm2/VS Code theme" roundup articles
// and r/unixporn / r/neovim mentions where no repo/install number applied.
// Each entry is matched to its exact Gogh filename (Gogh/themes/<Name>.yml)
// -- re-verify spelling/casing against Gogh/themes/ before reusing this list,
// scheme names there aren't normalized (e.g. "Github Light" vs "GitHub Dark",
// "Papercolor Dark" vs "PaperColor" upstream).
//
// Ranked by evidence found (strongest first):
//   GitHub Dark        - github/github-vscode-theme, 18.8M VS Code installs
//   Dracula            - dracula/dracula-theme, 7.5M installs / 23,577 GH stars
//   One Dark Pro       - Binaryify/OneDark-Pro, 6.7M installs
//   Catppuccin Mocha   - catppuccin/catppuccin, 3.5M installs / 19,729 GH stars
//   Monokai            - "Monokai" VS Code theme, 2.9M installs
//   TokyoNight Storm   - folke/tokyonight.nvim, 2.7M installs / 8,183 GH stars
//   Solarized Dark     - altercation/solarized, 16,013 GH stars
//   Gruvbox Dark       - morhetz/gruvbox, 15,727 GH stars
//   Tomorrow Night     - chriskempson/tomorrow-theme, 13,988 GH stars
//   Material Theme     - equinusocio/material-theme, 11,313 GH stars
//   Nord               - nordtheme/nord (=arcticicestudio/nord), 6,874 GH stars
//   Kanagawa Wave      - rebelot/kanagawa.nvim, 6,370 GH stars
//   Synthwave 84       - robb0wen/synthwave-vscode, 5,290 GH stars
//   Everforest Dark    - sainnhe/everforest, 4,189 GH stars
//   Nightfox           - EdenEast/nightfox.nvim, 4,065 GH stars
//   Aura               - daltonmenezes/aura-theme, 3,818 GH stars
//   Rose Pine          - rose-pine/neovim, 3,085 GH stars
//   Night Owl          - sdras/night-owl-vscode-theme, 2,956 GH stars
//   Papercolor Dark    - NLKNguyen/papercolor-theme, 2,844 GH stars
//   Andromeda          - EliverLara/andromeda, 2,420 GH stars
//   Iceberg Dark       - cocopon/iceberg.vim, 2,380 GH stars
//   Sonokai            - sainnhe/sonokai, 1,954 GH stars
//   Seoul256           - junegunn/seoul256.vim, 1,756 GH stars
//   Snazzy             - sindresorhus/hyper-snazzy, ~1.5k GH stars, widely mirrored
//   Hybrid             - w0ng/vim-hybrid, 1,490 GH stars
//   Doom One / Doom Vibrant - doomemacs/themes, 1,490 stars (Doom Emacs host: 20k+ stars)
//   Zenburn            - jnurmine/Zenburn, 920 GH stars (one of the oldest ported schemes)
//   Ayu Dark           - ayu-theme/ayu-colors, 851 GH stars but very widely ported
//   Cobalt2            - wesbos/cobalt2-vscode, 807 GH stars
//   Vesper             - raunofreiberg/vesper, 778 GH stars, trending 2025-26
//
//   No single hard star/install number found for these, but each recurs
//   across multiple independent "best terminal themes" roundups:
//   Palenight, Horizon, Panda, Oceanic Next, One Half Dark, Spacegray,
//   IR Black (classic TextMate/Sublime scheme, still cited constantly)
//
//   Ubuntu             - default terminal palette, high exposure by
//                        install-base rather than GH stars/roundup mentions
//
//   Light/other-flavor variants of a family already above (independently
//   popular, not redundant with the parent entry):
//   Gruvbox Light, Catppuccin Macchiato, Catppuccin Frappe, TokyoNight Moon,
//   Kanagawa Dragon, Rose Pine Moon, Ayu Mirage, Github Light, Everforest Light
//
// Checked but deliberately left out as redundant or too weak a signal:
//   - Molokai (tomasr/molokai, 3,626 GH stars) -- a Monokai reskin, same
//     family already covered by "Monokai" above; keeping both reads as one
//     entry duplicated under two names in a 48-theme gallery.
//   - Bluloco (https://www.blulocotheme.com/, 227-442 stars across its repos)
//   - Poimandres (https://github.com/topics/poimandres, ~490 stars, Neovim-niche)
//   - "City Lights" (no matching origin repo found under that name)
//
// Sources consulted (re-run similar searches to refresh this list):
//   - https://moltamp.com/blog/best-terminal-color-schemes-2026/
//   - https://terminalcolors.com/
//   - https://www.jit.io/blog/best-vs-code-themes-2023
//   - https://dev.to/dhavalkurkutiya/material-nova-the-best-vs-code-theme-of-2026-50el
//   - https://terminalcandy.com/blog/iterm2-themes-2026/
//   - GitHub REST API, api.github.com/repos/<owner>/<repo>, for GH star counts above
//   - VS Code Marketplace listing pages, for install counts above
const POPULAR_THEME_NAMES = new Set([
    'GitHub Dark',
    'Dracula',
    'One Dark Pro',
    'Catppuccin Mocha',
    'Monokai',
    'TokyoNight Storm',
    'Solarized Dark',
    'Gruvbox Dark',
    'Tomorrow Night',
    'Material Theme',
    'Nord',
    'Kanagawa Wave',
    'Synthwave 84',
    'Everforest Dark',
    'Nightfox',
    'Aura',
    'Rose Pine',
    'Night Owl',
    'Papercolor Dark',
    'Andromeda',
    'Iceberg Dark',
    'Sonokai',
    'Seoul256',
    'Snazzy',
    'Hybrid',
    'Doom One',
    'Doom Vibrant',
    'Zenburn',
    'Ayu Dark',
    'Cobalt2',
    'Vesper',
    'Palenight',
    'Horizon',
    'Panda',
    'Oceanic Next',
    'One Half Dark',
    'Spacegray',
    'IR Black',
    'Ubuntu',
    'Gruvbox Light',
    'Catppuccin Macchiato',
    'Catppuccin Frappe',
    'TokyoNight Moon',
    'Kanagawa Dragon',
    'Rose Pine Moon',
    'Ayu Mirage',
    'Github Light',
    'Everforest Light',
]);

const VIEW_MODE_STORAGE_KEY = 'gogh-gallery-view-mode';
const SORT_MODE_STORAGE_KEY = 'gogh-gallery-sort-mode';
const SORT_DIRECTION_STORAGE_KEY = 'gogh-gallery-sort-direction';

// Labels/preview swatches for the "filter by color" submenu, in theme-template.yml
// order (color_01..color_16: 8 base ANSI colors, then their 8 bright variants).
// Preview colors are lifted verbatim from the "Gogh" theme itself
// (themes/Gogh.yml on master) rather than generic ANSI primaries, so the
// filter cubes read as the project's own palette.
const COLOR_FILTER_SLOT_COLORS = [
    '#243342', '#C54133', '#27AE60', '#EDB20A', '#2479D0', '#7D3EA0', '#1D8579', '#C9CCCD',
    '#34495E', '#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#2AA198', '#ECF0F1',
];

// Labels are message keys (colors.*).
const COLOR_FILTER_OPTIONS = [
    { key: 'background', label: 'colors.background', previewColor: '#0D1926' },
    ...COLOR_FILTER_SLOT_COLORS.map((previewColor, index) => {
        const key = `color_${String(index + 1).padStart(2, '0')}`;
        return { key, label: `colors.${key}`, previewColor };
    }),
];

const COLOR_FILTER_KEYS = new Set(COLOR_FILTER_OPTIONS.map((option) => option.key));

// Split for the field-picker lightbox's layout: a background cube beside a
// 2-row grid of the 16 ANSI colors (normal row on top, bright row below),
// matching the swatch grid on CompactThemeCard.
const BACKGROUND_FILTER_OPTION = COLOR_FILTER_OPTIONS[0];
const NORMAL_COLOR_FILTER_OPTIONS = COLOR_FILTER_OPTIONS.slice(1, 9);
const BRIGHT_COLOR_FILTER_OPTIONS = COLOR_FILTER_OPTIONS.slice(9, 17);

const PAGE_THEME_DARK_STYLE = {
    '--site-background': '#121F2A',
    '--site-foreground': '#e7e7e7',
    '--generator-action-background': '#e7e7e7',
    '--generator-action-foreground': '#0d1926',
    '--code-block-background': '#0d1926',
    '--code-block-foreground': '#e7e7e7',
};

const themes = ref([]);
const themesError = ref('');
const filter = ref('all');
const viewMode = ref('compact');
const sortMode = ref('alphabetical');
const sortDirection = ref('asc');
const shuffleOrder = ref(new Map());
const { pageTheme, setPageTheme } = usePageTheme();
const colorFilterField = ref('');
const colorFilterValue = ref('');
const colorFilterFieldMenuOpen = ref(false);
const colorFilterValueMenuOpen = ref(false);
const colorFilterValueSortMode = ref('color');
const colorFilterValueSortDirection = ref('desc');
const visibleCount = ref(THEMES_PAGE_SIZE);
const loadMoreSentinel = ref(null);
let loadMoreObserver = null;
const searchQuery = ref('');

function lightOrDark(color) {
    // Variables for red, green, blue values
    var r, g, b, hsp;
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        r = color[1];
        g = color[2];
        b = color[3];
    } else {
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));
        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }
    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    // Using the HSP value, determine whether the color is light or dark
    if (hsp > 127.5) {
        return 'light';
    } else {
        return 'dark';
    }
}

async function fetchData() {
    try {
        const remoteThemes = await fetchThemeList();
        themesError.value = '';
        return remoteThemes;
    } catch {
        themesError.value = 'common.fetchThemesError';
        return [];
    }
}

function setFilter(f) {
    trackEvent('Gallery Filter', { filter: f });
    filter.value = '';
    setTimeout(() => {
        filter.value = f;
    }, 100);
}

// The view buttons themselves (setViewMode also runs for the Popular filter).
function pickViewMode(mode) {
    setViewMode(mode);
    trackEvent('Gallery View', { view: mode });
}

function setViewMode(mode) {
    viewMode.value = mode;

    try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }
}

// Light mode on the redesigned home: warm "paper" instead of flat grey.
const PAGE_THEME_LIGHT_STYLE = {
    '--site-background': '#EFEBE3',
    '--site-foreground': '#0d1926',
};

const pageContentStyle = computed(() => (pageTheme.value === 'dark' ? PAGE_THEME_DARK_STYLE : PAGE_THEME_LIGHT_STYLE));

// Overlays pause the smooth scroll so the page doesn't move behind them.
watch(
    () => colorFilterFieldMenuOpen.value || colorFilterValueMenuOpen.value,
    (open) => setPageScrollLocked(open),
);

// Unique, rainbow-ordered values for whichever field the 2-step "by Color"
// filter has picked (an ANSI slot or "background"). Neutrals are grouped
// black-to-white first, then hue-sorted, so a hue like blue always shows as
// one contiguous run instead of being scattered by sort noise -- same
// ordering as the field-picker cubes themselves.
const colorFilterFieldValues = computed(() => {
    if (!colorFilterField.value || !Array.isArray(themes.value) || themes.value.length === 0) {
        return [];
    }

    const counts = new Map();
    themes.value.forEach((theme) => {
        const value = theme[colorFilterField.value];
        if (typeof value !== 'string' || !value) {
            return;
        }

        const hex = chroma(value.toLowerCase()).hex();
        counts.set(hex, (counts.get(hex) || 0) + 1);
    });

    return [...counts.entries()]
        .map(([hex, count]) => {
            // Adaptive contrast (reusing the same light/dark check as the
            // category filter) so the theme count reads on any swatch color,
            // light or dark, without a background box cluttering the grid.
            const isLight = lightOrDark(hex) === 'light';
            return {
                hex,
                count,
                textColor: isLight ? '#0d1926' : '#ffffff',
                textShadow: isLight ? '0 0 3px rgba(255, 255, 255, 0.75)' : '0 0 3px rgba(0, 0, 0, 0.75)',
            };
        })
        .sort((a, b) => {
            if (colorFilterValueSortMode.value === 'count' && a.count !== b.count) {
                const direction = colorFilterValueSortDirection.value === 'asc' ? 1 : -1;
                return direction * (a.count - b.count);
            }

            // Rainbow order: the default sort, and the tie-breaker when
            // sorting by count (so same-count swatches still read as a
            // contiguous run instead of a shuffled pile).
            return compareHexRainbow(a.hex, b.hex);
        });
});

// Params for the lightbox title: the label as listed and in lower case.
const colorFilterFieldLabel = computed(() => {
    const option = COLOR_FILTER_OPTIONS.find((opt) => opt.key === colorFilterField.value);
    const color = option ? t(option.label) : t('gallery.sortColor');
    return { color, colorLower: color.toLocaleLowerCase() };
});

function isValidColorFilterKey(key) {
    return COLOR_FILTER_KEYS.has(key);
}

function clearColorFilter() {
    colorFilterField.value = '';
    colorFilterValue.value = '';
    colorFilterFieldMenuOpen.value = false;
    colorFilterValueMenuOpen.value = false;
}

function openColorFilterFieldMenu() {
    colorFilterFieldMenuOpen.value = true;
}

function closeColorFilterFieldMenu() {
    colorFilterFieldMenuOpen.value = false;
}

function selectColorFilterField(fieldKey) {
    if (!isValidColorFilterKey(fieldKey)) {
        return;
    }

    colorFilterField.value = fieldKey;
    colorFilterValue.value = '';
    colorFilterValueSortMode.value = 'color';
    colorFilterFieldMenuOpen.value = false;
    colorFilterValueMenuOpen.value = true;
}

function closeColorFilterValueMenu() {
    colorFilterValueMenuOpen.value = false;
}

function selectColorFilterValue(hex) {
    colorFilterValue.value = hex.toLowerCase();
    trackEvent('Gallery Filter', { filter: 'color', field: colorFilterField.value });
    colorFilterValueMenuOpen.value = false;
}

function setColorFilterValueSortMode(mode) {
    if (mode === 'count' && colorFilterValueSortMode.value === 'count') {
        colorFilterValueSortDirection.value = colorFilterValueSortDirection.value === 'desc' ? 'asc' : 'desc';
    } else if (mode === 'count') {
        colorFilterValueSortDirection.value = 'desc';
    }

    colorFilterValueSortMode.value = mode;
}

function onWindowKeydown(event) {
    if (event.key !== 'Escape') {
        return;
    }

    if (colorFilterValueMenuOpen.value) {
        closeColorFilterValueMenu();
    } else if (colorFilterFieldMenuOpen.value) {
        closeColorFilterFieldMenu();
    }
}

function getThemeName(theme) {
    return (theme?.name || theme?.theme || '').toString();
}

function clearSearchQuery() {
    searchQuery.value = '';
}

function normalizeHexColor(value) {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;

    if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
        const [r, g, b] = withHash.slice(1);
        return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }

    if (/^#[0-9a-fA-F]{6}$/.test(withHash)) {
        return withHash.toUpperCase();
    }

    return '';
}

function themeHasExactHexColor(theme, searchHex) {
    if (!theme || !searchHex) {
        return false;
    }

    return Object.values(theme).some((value) => normalizeHexColor(value) === searchHex);
}

function matchesThemeSearch(theme) {
    const rawSearch = searchQuery.value.trim();
    const normalizedSearch = rawSearch.toLowerCase();

    if (!normalizedSearch) {
        return true;
    }

    const normalizedHexSearch = normalizeHexColor(rawSearch);

    if (normalizedHexSearch) {
        return themeHasExactHexColor(theme, normalizedHexSearch);
    }

    return getThemeName(theme).toLowerCase().includes(normalizedSearch);
}

function themeMatchesFilter(theme) {
    if (colorFilterField.value && colorFilterValue.value) {
        const themeValue = (theme[colorFilterField.value] || '').toLowerCase();
        return themeValue === colorFilterValue.value && matchesThemeSearch(theme);
    }

    if (filter.value === 'favorites') {
        return isFavorite(getThemeName(theme)) && matchesThemeSearch(theme);
    }

    return (filter.value === theme.category || filter.value === 'all' || (filter.value === 'popular' && theme.popular)) && matchesThemeSearch(theme);
}

function themeSortKey(theme) {
    return getThemeName(theme) || `${theme.background}-${theme.foreground}`;
}

// Cached per hex value (many themes/slots share the exact same hex), so sorting
// by color doesn't re-run chroma's LCH conversion on every pairwise comparison.
const colorSortTupleCache = new Map();

// Below this LCH chroma, a color's hue is just noise -- HSL saturation was
// tried first, but it blows up near the lightness extremes (an off-white like
// #FDF0ED reads as 80% "saturated" in HSL despite being barely tinted), which
// scattered near-white colors across the whole hue spectrum instead of
// grouping them. LCH chroma measures actual colorfulness without that
// distortion, so it stays low for true near-black/near-white colors regardless
// of how light or dark they are. Those go in their own achromatic bucket (-2,
// sorted black-to-white by lightness) ahead of the true hue-sorted rainbow.
const ACHROMATIC_CHROMA_THRESHOLD = 15;

function getColorSortTuple(hex) {
    if (typeof hex !== 'string' || !hex) {
        return [-2, 0, 0];
    }

    const cacheKey = hex.toLowerCase();
    const cached = colorSortTupleCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    let tuple;
    try {
        const [l, c, h] = chroma(hex).lch();
        const hue = Number.isNaN(h) ? null : h;
        const isAchromatic = hue === null || c < ACHROMATIC_CHROMA_THRESHOLD;
        // Within a hue, sort light-to-dark (a shade gradient) before chroma.
        tuple = isAchromatic ? [-2, l, c] : [hue, l, c];
    } catch {
        tuple = [-2, 0, 0];
    }

    colorSortTupleCache.set(cacheKey, tuple);
    return tuple;
}

function compareHexRainbow(hexA, hexB) {
    const tupleA = getColorSortTuple(hexA);
    const tupleB = getColorSortTuple(hexB);

    for (let i = 0; i < tupleA.length; i++) {
        if (tupleA[i] !== tupleB[i]) {
            return tupleA[i] - tupleB[i];
        }
    }

    return 0;
}

function generateShuffleOrder() {
    const map = new Map();
    themes.value.forEach((theme) => {
        map.set(themeSortKey(theme), Math.random());
    });
    shuffleOrder.value = map;
}

function setSortMode(mode) {
    if (mode === 'alphabetical' && sortMode.value === 'alphabetical') {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else if (mode === 'alphabetical') {
        sortDirection.value = 'asc';
    }

    sortMode.value = mode;
    visibleCount.value = THEMES_PAGE_SIZE;

    if (mode === 'random') {
        generateShuffleOrder();
    }

    try {
        localStorage.setItem(SORT_MODE_STORAGE_KEY, mode);
        localStorage.setItem(SORT_DIRECTION_STORAGE_KEY, sortDirection.value);
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }
}

// A new shuffle starts the list over, so from the stuck toolbar (scrolled
// down into the cards) go back up to the top of the gallery to see it.
function shuffleThemes() {
    const wasStuck = toolbarStuck.value;
    setSortMode('random');

    if (wasStuck) {
        nextTick(scrollToGallery);
    }
}

const filteredThemes = computed(() => {
    const matched = themes.value.filter(themeMatchesFilter);

    if (sortMode.value === 'random') {
        return [...matched].sort((a, b) => {
            const keyA = shuffleOrder.value.get(themeSortKey(a)) ?? 0;
            const keyB = shuffleOrder.value.get(themeSortKey(b)) ?? 0;
            return keyA - keyB;
        });
    }

    const direction = sortDirection.value === 'desc' ? -1 : 1;
    return [...matched].sort((a, b) => direction * getThemeName(a).localeCompare(getThemeName(b)));
});
const visibleThemes = computed(() => filteredThemes.value.slice(0, visibleCount.value));

// Infinite scroll. With animations on, each batch "decodes" for a beat (the
// loader's bit stream races) before the cards arrive and wave in.
const LOAD_DECODE_MS = 450;
let sentinelInView = false;
let loadMoreTimer = null;

function loadMore() {
    if (loadingMore.value || visibleCount.value >= filteredThemes.value.length) {
        return;
    }
    const grow = () => {
        visibleCount.value = Math.min(visibleCount.value + THEMES_PAGE_SIZE, filteredThemes.value.length);
        loadingMore.value = false;
        // Tall screens: keep loading while the end of the list is still visible.
        nextTick(() => {
            if (sentinelInView) {
                loadMore();
            }
        });
    };
    if (!galleryReveal.enabled.value) {
        grow();
        return;
    }
    loadingMore.value = true;
    loadMoreTimer = setTimeout(grow, LOAD_DECODE_MS);
}

// New cards (another batch, or a different filter's results) join the reveal.
watch(visibleThemes, () => nextTick(galleryReveal.observeNew));

// A different filter, sort or view replays the whole wave.
watch([filter, colorFilterValue, sortMode, sortDirection, viewMode, shuffleOrder], () => {
    nextTick(galleryReveal.replay);
});

// The theme count decodes from binary whenever the result set changes.
watch(() => filteredThemes.value.length, () => {
    nextTick(() => binaryDecode(galleryCount.value, { duration: 520 }));
});

watch([filter, searchQuery, colorFilterValue], () => {
    visibleCount.value = THEMES_PAGE_SIZE;
});

// One "Search" event once the visitor stops typing, not one per keystroke.
// "results: 0" is the interesting part: themes people expect and don't find.
const SEARCH_TRACK_DELAY_MS = 2000;
let searchTrackTimer = null;
let lastTrackedSearch = '';

watch(searchQuery, (value) => {
    clearTimeout(searchTrackTimer);
    const query = String(value || '').trim().toLowerCase().slice(0, 60);
    if (query.length < 2) {
        return;
    }
    searchTrackTimer = setTimeout(() => {
        if (query === lastTrackedSearch) {
            return;
        }
        lastTrackedSearch = query;
        const count = filteredThemes.value.length;
        trackEvent('Search', { query, results: count === 0 ? '0' : count <= 5 ? '1-5' : '6+' });
    }, SEARCH_TRACK_DELAY_MS);
});

const { data: themesData } = await useAsyncData('themes', () => fetchData(), {
    default: () => [],
});

const rawThemes = normalizeThemes(themesData.value);

themes.value = rawThemes.map((theme) => ({
    ...theme,
    category: lightOrDark(theme.background),
    popular: POPULAR_THEME_NAMES.has(getThemeName(theme)),
}));

onMounted(() => {
    smoothScroll.start();

    const { gsap, ScrollTrigger } = useGsap();
    // Fonts and lazy images change section heights after first layout.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

    // Opening /#themes directly (a shared link): the browser jumps to the
    // anchor before the animated sections above reach their final height, so
    // go there again once the page has loaded and ScrollTrigger refreshed.
    if (useRoute().hash === '#themes' && document.readyState !== 'complete') {
        window.addEventListener('load', () => {
            requestAnimationFrame(() => scrollToTarget('#themes', 0));
        }, { once: true });
    }

    if (!prefersReducedMotion() && galleryHeader.value) {
        galleryMotion = gsap.context(() => {
            gsap.from('.gallery__header > *, .gallery__heading > *', {
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.08,
                ease: 'expo.out',
                scrollTrigger: {
                    trigger: galleryHeader.value,
                    start: 'top 85%',
                    // The label and the count decode from binary as they arrive.
                    onEnter: () => {
                        binaryDecode(galleryHeader.value?.querySelector('.gallery__eyebrow'), { delay: 150, duration: 700 });
                        binaryDecode(galleryCount.value, { delay: 300, duration: 800 });
                    },
                },
            });
        }, galleryHeader.value);
    }

    try {
        const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        if (savedViewMode === 'compact' || savedViewMode === 'detailed') {
            viewMode.value = savedViewMode;
        }
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }

    try {
        const savedSortMode = localStorage.getItem(SORT_MODE_STORAGE_KEY);
        if (savedSortMode === 'alphabetical' || savedSortMode === 'random') {
            sortMode.value = savedSortMode;
        }

        const savedSortDirection = localStorage.getItem(SORT_DIRECTION_STORAGE_KEY);
        if (savedSortDirection === 'asc' || savedSortDirection === 'desc') {
            sortDirection.value = savedSortDirection;
        }
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }

    if (sortMode.value === 'random' && themes.value.length) {
        generateShuffleOrder();
    }

    if (!themes.value.length) {
        fetchData().then((clientThemes) => {
            themes.value = clientThemes.map((theme) => ({
                ...theme,
                category: lightOrDark(theme.background),
                popular: POPULAR_THEME_NAMES.has(getThemeName(theme)),
            }));

            if (sortMode.value === 'random') {
                generateShuffleOrder();
            }
        });
    }

    window.addEventListener('keydown', onWindowKeydown);
    window.addEventListener('scroll', onToolbarScroll, { passive: true });
    updateToolbarStuck();

    if (loadMoreSentinel.value && typeof IntersectionObserver !== 'undefined') {
        loadMoreObserver = new IntersectionObserver((entries) => {
            sentinelInView = entries.some((entry) => entry.isIntersecting);
            if (sentinelInView) {
                loadMore();
            }
        }, { rootMargin: '0px 0px 120px 0px' });
        loadMoreObserver.observe(loadMoreSentinel.value);
    }
});

onUnmounted(() => {
    clearTimeout(loadMoreTimer);
    clearTimeout(searchTrackTimer);
    galleryMotion?.revert();
    setPageScrollLocked(false);
    smoothScroll.stop();
    window.removeEventListener('keydown', onWindowKeydown);
    window.removeEventListener('scroll', onToolbarScroll);
    loadMoreObserver?.disconnect();
});
</script>



<style lang="scss" scoped>
@use '@/pages/index.scss';
</style>
