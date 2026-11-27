<template>
    <Header />

    <div class="gogh-content stats-page">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1 class="page-title">{{ t('stats.title') }}</h1>
                    <p class="stats-intro">{{ t('stats.intro') }}</p>
                </div>
                <div class="col-md-4 stats-page__actions">
                    <Button class="btn" type="button" @click="refreshThemes">
                        {{ t('stats.refresh') }}
                    </Button>
                    <Button class="btn" to="/">
                        {{ t('common.backToThemes') }}
                    </Button>
                </div>
            </div>

            <div v-if="loading" class="stats-loading" role="status" aria-live="polite">
                <div class="gogh-banner-anim" aria-hidden="true">
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--01"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--02"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--03"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--04"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--05"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--06"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--07"></span>
                    <span class="gogh-banner-anim__color gogh-banner-anim__color--08"></span>
                    <span class="gogh-banner-anim__shine"></span>
                </div>
                <p class="stats-loading__text">{{ t('stats.loading') }}</p>
            </div>

            <div v-else-if="errorMessage" class="stats-status stats-status--error" role="alert">
                <p>{{ t(errorMessage) }}</p>
                <Button class="btn" type="button" @click="loadThemes(true)">{{ t('stats.tryAgain') }}</Button>
            </div>

            <template v-else>
                <div class="stats-meta-row">
                    <span v-if="lastUpdatedLabel">{{ t('stats.updated', { date: lastUpdatedLabel }) }}</span>
                    <I18nT keypath="stats.totalThemesInline" tag="span">
                        <template #count><strong>{{ n(totalThemes) }}</strong></template>
                    </I18nT>
                </div>

                <I18nT keypath="stats.duplicates" tag="p" class="stats-duplicates-note">
                    <template #names><strong>{{ n(duplicateNames.length) }}</strong></template>
                    <template #hashes><strong>{{ n(duplicateHashes.length) }}</strong></template>
                    <template #backgrounds><strong>{{ n(duplicateBackgrounds.length) }}</strong></template>
                </I18nT>

                <div class="row stats-summary-row">
                    <div class="col-md-6">
                        <div class="stats-card summary-card h-100">
                            <h3>{{ t('stats.totalThemes') }}</h3>
                            <p class="stats-value">{{ n(totalThemes) }}</p>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="stats-card summary-card h-100">
                            <h3>{{ t('stats.authorCoverage') }}</h3>
                            <ul class="summary-list">
                                <li>
                                    <span>{{ t('stats.withAuthor') }}</span>
                                    <strong class="summary-number">{{ authorCounts.present }}</strong>
                                </li>
                                <li>
                                    <span>{{ t('stats.missingAuthor') }}</span>
                                    <strong class="summary-number">{{ authorCounts.missing }}</strong>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="row stats-secondary-row">
                    <div class="col-md-6">
                        <div class="stats-card h-100">
                            <h3>{{ t('stats.variantCounts') }}</h3>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>{{ t('stats.variant') }}</th>
                                        <th>{{ t('stats.count') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="entry in variantCounts" :key="entry.value">
                                        <td>{{ variantLabel(entry.value) }}</td>
                                        <td>{{ entry.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="stats-card h-100">
                            <h3>{{ t('stats.backgroundClassification') }}</h3>
                            <I18nT keypath="stats.rule" tag="p" class="stats-note">
                                <template #light><strong>{{ t('stats.ruleLight') }}</strong></template>
                                <template #threshold><strong>&gt;= 0.5</strong></template>
                                <template #dark><strong>{{ t('stats.ruleDark') }}</strong></template>
                            </I18nT>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>{{ t('stats.class') }}</th>
                                        <th>{{ t('stats.count') }}</th>
                                        <th>{{ t('stats.percent') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{{ t('stats.lightBackground') }}</td>
                                        <td>{{ backgroundClassCounts.light }}</td>
                                        <td>{{ formatPercent(backgroundClassCounts.light, totalThemes) }}</td>
                                    </tr>
                                    <tr>
                                        <td>{{ t('stats.darkBackground') }}</td>
                                        <td>{{ backgroundClassCounts.dark }}</td>
                                        <td>{{ formatPercent(backgroundClassCounts.dark, totalThemes) }}</td>
                                    </tr>
                                </tbody>
                            </table>

                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-4">
                        <div class="stats-card">
                            <h3>{{ t('stats.topBackgrounds') }}</h3>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>{{ t('stats.color') }}</th>
                                        <th>{{ t('stats.hex') }}</th>
                                        <th>{{ t('stats.count') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="entry in topBackgroundColors" :key="entry.value">
                                        <td><span class="color-swatch" :style="{ backgroundColor: entry.value }"></span></td>
                                        <td>{{ entry.value }}</td>
                                        <td>{{ entry.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="stats-card">
                            <h3>{{ t('stats.topForegrounds') }}</h3>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>{{ t('stats.color') }}</th>
                                        <th>{{ t('stats.hex') }}</th>
                                        <th>{{ t('stats.count') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="entry in topForegroundColors" :key="entry.value">
                                        <td><span class="color-swatch" :style="{ backgroundColor: entry.value }"></span></td>
                                        <td>{{ entry.value }}</td>
                                        <td>{{ entry.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="stats-card">
                            <h3>{{ t('stats.topBySlot') }}</h3>
                            <table class="stats-table">
                                <thead>
                                    <tr>
                                        <th>{{ t('stats.slot') }}</th>
                                        <th>{{ t('stats.color') }}</th>
                                        <th>{{ t('stats.hex') }}</th>
                                        <th>{{ t('stats.count') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="entry in topColorBySlot" :key="entry.key">
                                        <td>{{ t(entry.name) }}</td>
                                        <td><span class="color-swatch" :style="{ backgroundColor: entry.value }"></span></td>
                                        <td>{{ entry.value }}</td>
                                        <td>{{ entry.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <h3>{{ t('stats.themesTable') }}</h3>

                    <div class="table-filters">
                        <div class="table-filter-field table-filter-field--search">
                            <label for="stats-search">{{ t('stats.searchLabel') }}</label>
                            <input
                                id="stats-search"
                                v-model.trim="searchQuery"
                                type="search"
                                :placeholder="t('stats.searchPlaceholder')"
                            >
                        </div>

                        <div class="table-filter-field">
                            <label for="variant-filter">{{ t('stats.variant') }}</label>
                            <select id="variant-filter" v-model="variantFilter">
                                <option value="all">{{ t('common.all') }}</option>
                                <option
                                    v-for="entry in variantCounts"
                                    :key="entry.value"
                                    :value="entry.value"
                                >
                                    {{ variantLabel(entry.value) }}
                                </option>
                            </select>
                        </div>

                        <div class="table-filter-field">
                            <label for="author-filter">{{ t('stats.author') }}</label>
                            <select id="author-filter" v-model="authorFilter">
                                <option value="all">{{ t('common.all') }}</option>
                                <option value="present">{{ t('stats.authorPresent') }}</option>
                                <option value="missing">{{ t('stats.authorMissing') }}</option>
                            </select>
                        </div>

                        <div class="table-filter-field">
                            <label for="bg-filter">{{ t('stats.backgroundClass') }}</label>
                            <select id="bg-filter" v-model="backgroundFilter">
                                <option value="all">{{ t('common.all') }}</option>
                                <option value="light">{{ t('common.light') }}</option>
                                <option value="dark">{{ t('common.dark') }}</option>
                            </select>
                        </div>

                        <div class="table-filter-field">
                            <label for="duplicate-filter">{{ t('stats.duplicatesLabel') }}</label>
                            <select id="duplicate-filter" v-model="duplicatesFilter">
                                <option value="all">{{ t('stats.allThemes') }}</option>
                                <option value="duplicates">{{ t('stats.duplicatesOnly') }}</option>
                            </select>
                        </div>

                        <div class="table-filter-field">
                            <label for="sort-filter">{{ t('stats.sort') }}</label>
                            <select id="sort-filter" v-model="sortBy">
                                <option value="name-asc">{{ t('stats.sortName') }}</option>
                                <option value="author-asc">{{ t('stats.sortAuthor') }}</option>
                                <option value="variant-asc">{{ t('stats.sortVariant') }}</option>
                                <option value="luminance-asc">{{ t('stats.sortLuminanceAsc') }}</option>
                                <option value="luminance-desc">{{ t('stats.sortLuminanceDesc') }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-wrap" role="region" :aria-label="t('stats.tableAria')" tabindex="0">
                        <table class="stats-table stats-table--themes">
                            <thead>
                                <tr>
                                    <th>{{ t('stats.name') }}</th>
                                    <th>{{ t('stats.author') }}</th>
                                    <th>{{ t('stats.variant') }}</th>
                                    <th>{{ t('stats.background') }}</th>
                                    <th>{{ t('stats.foreground') }}</th>
                                    <th>{{ t('stats.palette') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(theme, index) in paginatedThemes"
                                    :key="`${theme.hash || theme.name || 'theme'}-${index}`"
                                    tabindex="0"
                                    class="theme-row"
                                    @click="openDetail(theme)"
                                    @keydown.enter.prevent="openDetail(theme)"
                                    @keydown.space.prevent="openDetail(theme)"
                                >
                                    <td>{{ theme.name || '—' }}</td>
                                    <td>{{ theme.author || '—' }}</td>
                                    <td>{{ variantLabel(theme.variant || 'unspecified') }}</td>
                                    <td>
                                        <span class="inline-color"><span class="color-swatch" :style="{ backgroundColor: theme.background }"></span>{{ theme.background || '—' }}</span>
                                    </td>
                                    <td>
                                        <span class="inline-color"><span class="color-swatch" :style="{ backgroundColor: theme.foreground }"></span>{{ theme.foreground || '—' }}</span>
                                    </td>
                                    <td>
                                        <div class="palette-preview">
                                            <span
                                                v-for="key in COLOR_KEYS"
                                                :key="`${theme.hash || theme.name}-${key}`"
                                                class="palette-preview__swatch"
                                                :style="{ backgroundColor: theme[key] || '#000000' }"
                                            ></span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer">
                        <div class="table-footer__count">
                            {{ t('stats.showing', { shown: paginatedThemes.length, total: filteredThemes.length }) }}
                        </div>

                        <div class="table-footer__controls">
                            <label for="page-size">{{ t('stats.rows') }}</label>
                            <select id="page-size" v-model.number="pageSize">
                                <option :value="10">10</option>
                                <option :value="25">25</option>
                                <option :value="50">50</option>
                                <option :value="-1">{{ t('common.all') }}</option>
                            </select>

                            <Button class="btn" type="button" :disabled="currentPage === 1" @click="currentPage -= 1">
                                {{ t('common.previous') }}
                            </Button>
                            <span>{{ t('stats.page', { page: currentPage, pages: totalPages }) }}</span>
                            <Button class="btn" type="button" :disabled="currentPage >= totalPages" @click="currentPage += 1">
                                {{ t('common.next') }}
                            </Button>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <h3>{{ t('stats.allColors') }}</h3>
                    <p class="stats-note">{{ t('stats.allColorsNote') }}</p>

                    <div class="table-wrap" role="region" :aria-label="t('stats.allColorsAria')" tabindex="0">
                        <table class="stats-table stats-table--all-colors">
                            <thead>
                                <tr>
                                    <th>{{ t('stats.color') }}</th>
                                    <th>{{ t('stats.hex') }}</th>
                                    <th>{{ t('stats.totalUses') }}</th>
                                    <th>{{ t('stats.themesCount') }}</th>
                                    <th>{{ t('stats.themes') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="entry in allColorUsage" :key="entry.value">
                                    <td>
                                        <span class="color-swatch" :style="{ backgroundColor: entry.value }"></span>
                                    </td>
                                    <td>{{ entry.value }}</td>
                                    <td>{{ entry.count }}</td>
                                    <td>{{ entry.themes.length }}</td>
                                    <td class="themes-list-cell">{{ entry.themes.map((name) => name || t('stats.unnamed')).join(', ') }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>
        </div>

        <div
            v-if="selectedTheme"
            class="stats-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stats-detail-title"
            @click.self="closeDetail"
        >
            <div class="stats-lightbox__content" tabindex="-1" ref="detailModalRef">
                <button
                    type="button"
                    class="stats-lightbox__close"
                    :aria-label="t('stats.closeDetails')"
                    @click="closeDetail"
                >
                    ×
                </button>

                <h3 id="stats-detail-title">{{ selectedTheme.name || t('stats.themeDetails') }}</h3>
                <p class="stats-note">{{ t('stats.authorValue', { author: selectedTheme.author || '—' }) }}</p>

                <div class="stats-lightbox__actions">
                    <Button class="btn" type="button" @click="copyThemeName">
                        {{ t('stats.copyName') }}
                    </Button>
                    <Button class="btn" type="button" @click="copyThemeJson">
                        {{ t('stats.copyJson') }}
                    </Button>
                    <span v-if="copyMessage" class="copy-message" role="status" aria-live="polite">{{ t(copyMessage) }}</span>
                </div>

                <table class="stats-table stats-table--detail">
                    <tbody>
                        <tr>
                            <th>{{ t('stats.name') }}</th>
                            <td>{{ selectedTheme.name || '—' }}</td>
                        </tr>
                        <tr>
                            <th>{{ t('stats.author') }}</th>
                            <td>{{ selectedTheme.author || '—' }}</td>
                        </tr>
                        <tr>
                            <th>{{ t('stats.variant') }}</th>
                            <td>{{ variantLabel(selectedTheme.variant || 'unspecified') }}</td>
                        </tr>
                        <tr>
                            <th>{{ t('stats.hash') }}</th>
                            <td>{{ selectedTheme.hash || '—' }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="table-wrap" role="region" :aria-label="t('stats.baseColorsAria')" tabindex="0">
                    <table class="stats-table stats-table--detail-meta-colors">
                        <thead>
                            <tr>
                                <th>background</th>
                                <th>foreground</th>
                                <th>cursor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="inline-color">
                                        <span class="color-swatch" :style="{ backgroundColor: selectedTheme.background || '#000000' }"></span>
                                        {{ selectedTheme.background || '—' }}
                                    </span>
                                </td>
                                <td>
                                    <span class="inline-color">
                                        <span class="color-swatch" :style="{ backgroundColor: selectedTheme.foreground || '#000000' }"></span>
                                        {{ selectedTheme.foreground || '—' }}
                                    </span>
                                </td>
                                <td>
                                    <span class="inline-color">
                                        <span class="color-swatch" :style="{ backgroundColor: selectedTheme.cursor || '#000000' }"></span>
                                        {{ selectedTheme.cursor || '—' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="detail-colors-grid">
                    <table class="stats-table stats-table--detail-colors">
                        <thead>
                            <tr>
                                <th>{{ t('stats.color') }}</th>
                                <th>{{ t('stats.value') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="key in detailPaletteKeysLeft" :key="key">
                                <th>{{ key }}</th>
                                <td>
                                    <span class="inline-color">
                                        <span class="color-swatch" :style="{ backgroundColor: selectedTheme[key] || '#000000' }"></span>
                                        {{ selectedTheme[key] || '—' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="stats-table stats-table--detail-colors">
                        <thead>
                            <tr>
                                <th>{{ t('stats.color') }}</th>
                                <th>{{ t('stats.value') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="key in detailPaletteKeysRight" :key="key">
                                <th>{{ key }}</th>
                                <td>
                                    <span class="inline-color">
                                        <span class="color-swatch" :style="{ backgroundColor: selectedTheme[key] || '#000000' }"></span>
                                        {{ selectedTheme[key] || '—' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import Header from '@/components/Header/Header.vue';
import Button from '@/components/Buttons/Button.vue';
import I18nT from '@/components/I18nT';

const { t, n, localeInfo } = useI18n();

// Variant values come from the theme files ("dark", "light", or missing).
function variantLabel(value) {
    if (value === 'dark' || value === 'light') {
        return t(`common.${value}`).toLocaleLowerCase();
    }
    return value === 'unspecified' ? t('stats.unspecified') : value;
}

const title = () => t('meta.statsTitle');
const description = () => t('meta.statsDescription');

useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl('/stats/'),
    twitterTitle: title,
    twitterDescription: description,
});
useHead({
    link: [{ rel: 'canonical', href: canonicalUrl('/stats/') }],
});

const COLOR_KEYS = Array.from({ length: 16 }, (_, index) => `color_${String(index + 1).padStart(2, '0')}`);
const ALL_COLOR_FIELDS = [...COLOR_KEYS, 'background', 'foreground', 'cursor'];

const cachedThemes = useState('stats-themes-cache', () => null);
const cachedUpdatedAt = useState('stats-themes-cache-updated', () => 0);

const themes = ref([]);
const loading = ref(false);
const errorMessage = ref('');

const searchQuery = ref('');
const variantFilter = ref('all');
const authorFilter = ref('all');
const backgroundFilter = ref('all');
const duplicatesFilter = ref('all');
const sortBy = ref('name-asc');
const pageSize = ref(25);
const currentPage = ref(1);

const selectedTheme = ref(null);
const detailModalRef = ref(null);
const copyMessage = ref('');

const detailPaletteKeysLeft = COLOR_KEYS.slice(0, 8);
const detailPaletteKeysRight = COLOR_KEYS.slice(8);

function normalizeThemes(remoteThemes) {
    if (Array.isArray(remoteThemes)) {
        return remoteThemes;
    }

    if (Array.isArray(remoteThemes?.data)) {
        return remoteThemes.data;
    }

    return [];
}

function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
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

function normalizeTheme(theme) {
    const normalized = {
        ...theme,
        name: normalizeString(theme?.name),
        author: normalizeString(theme?.author),
        variant: normalizeString(theme?.variant) || 'unspecified',
        background: normalizeHexColor(theme?.background),
        foreground: normalizeHexColor(theme?.foreground),
        cursor: normalizeHexColor(theme?.cursor),
        hash: normalizeString(theme?.hash),
    };

    COLOR_KEYS.forEach((key) => {
        normalized[key] = normalizeHexColor(theme?.[key]);
    });

    normalized.backgroundClass = classifyBackground(normalized.background);
    normalized.backgroundLuminance = relativeLuminance(normalized.background);

    return normalized;
}

function channelToLinear(channelValue) {
    const normalized = channelValue / 255;
    if (normalized <= 0.04045) {
        return normalized / 12.92;
    }

    return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
    const normalized = normalizeHexColor(hex);
    if (!normalized) {
        return 0;
    }

    const rgbHex = normalized.slice(1);
    const red = Number.parseInt(rgbHex.slice(0, 2), 16);
    const green = Number.parseInt(rgbHex.slice(2, 4), 16);
    const blue = Number.parseInt(rgbHex.slice(4, 6), 16);

    const linearRed = channelToLinear(red);
    const linearGreen = channelToLinear(green);
    const linearBlue = channelToLinear(blue);

    return (0.2126 * linearRed) + (0.7152 * linearGreen) + (0.0722 * linearBlue);
}

function classifyBackground(backgroundHex) {
    // Deterministic threshold: luminance >= 0.5 => light, otherwise dark.
    return relativeLuminance(backgroundHex) >= 0.5 ? 'light' : 'dark';
}

async function loadThemes(forceRefresh = false) {
    if (!forceRefresh && Array.isArray(cachedThemes.value) && cachedThemes.value.length) {
        themes.value = cachedThemes.value;
        errorMessage.value = '';
        return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
        const remoteThemes = await fetchThemeList();
        const normalized = normalizeThemes(remoteThemes).map((theme) => normalizeTheme(theme));

        themes.value = normalized;
        cachedThemes.value = normalized;
        cachedUpdatedAt.value = Date.now();
    } catch {
        errorMessage.value = 'common.fetchThemesError';

        if (Array.isArray(cachedThemes.value) && cachedThemes.value.length) {
            themes.value = cachedThemes.value;
        }
    } finally {
        loading.value = false;
    }
}

async function refreshThemes() {
    await loadThemes(true);
}

function countBy(items, getValue) {
    const counts = new Map();

    items.forEach((item) => {
        const value = getValue(item);

        if (!value) {
            return;
        }

        counts.set(value, (counts.get(value) || 0) + 1);
    });

    return counts;
}

function topColorsBy(items, keys, limit = 10) {
    const colorMap = new Map();

    items.forEach((item) => {
        keys.forEach((key) => {
            const value = normalizeHexColor(item[key]);
            if (!value) {
                return;
            }

            colorMap.set(value, (colorMap.get(value) || 0) + 1);
        });
    });

    return [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([value, count]) => ({ value, count }));
}

function duplicateEntriesBy(items, getValue) {
    const counts = countBy(items, getValue);

    return [...counts.entries()]
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count }));
}

const totalThemes = computed(() => themes.value.length);

const variantCounts = computed(() => {
    const counts = countBy(themes.value, (theme) => theme.variant || 'unspecified');

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count }));
});

const authorCounts = computed(() => {
    const present = themes.value.filter((theme) => Boolean(theme.author)).length;
    return {
        present,
        missing: themes.value.length - present,
    };
});

const duplicateNames = computed(() => duplicateEntriesBy(themes.value, (theme) => theme.name));
const duplicateHashes = computed(() => duplicateEntriesBy(themes.value, (theme) => theme.hash));
const duplicateBackgrounds = computed(() => duplicateEntriesBy(themes.value, (theme) => theme.background));

const duplicateNameValues = computed(() => new Set(duplicateNames.value.map((entry) => entry.value)));
const duplicateHashValues = computed(() => new Set(duplicateHashes.value.map((entry) => entry.value)));
const duplicateBackgroundValues = computed(() => new Set(duplicateBackgrounds.value.map((entry) => entry.value)));

const topBackgroundColors = computed(() => topColorsBy(themes.value, ['background']));
const topForegroundColors = computed(() => topColorsBy(themes.value, ['foreground']));

const topColorBySlot = computed(() => COLOR_KEYS.map((key) => {
    const top = topColorsBy(themes.value, [key], 1)[0];

    return {
        key,
        // Message key for the slot name.
        name: `colors.${key}`,
        value: top?.value || '',
        count: top?.count || 0,
    };
}));
const allColorUsage = computed(() => {
    const usageMap = new Map();

    themes.value.forEach((theme) => {
        // Empty names show as "(unnamed theme)" in the table.
        const themeName = theme.name || '';

        ALL_COLOR_FIELDS.forEach((key) => {
            const hex = normalizeHexColor(theme[key]);
            if (!hex) {
                return;
            }

            if (!usageMap.has(hex)) {
                usageMap.set(hex, {
                    value: hex,
                    count: 0,
                    themesSet: new Set(),
                });
            }

            const entry = usageMap.get(hex);
            entry.count += 1;
            entry.themesSet.add(themeName);
        });
    });

    return [...usageMap.values()]
        .map((entry) => ({
            value: entry.value,
            count: entry.count,
            themes: [...entry.themesSet].sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
});

const backgroundClassCounts = computed(() => {
    const light = themes.value.filter((theme) => theme.backgroundClass === 'light').length;
    return {
        light,
        dark: themes.value.length - light,
    };
});

const filteredThemes = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return themes.value
        .filter((theme) => {
            if (query) {
                const name = (theme.name || '').toLowerCase();
                const author = (theme.author || '').toLowerCase();

                if (!name.includes(query) && !author.includes(query)) {
                    return false;
                }
            }

            if (variantFilter.value !== 'all' && theme.variant !== variantFilter.value) {
                return false;
            }

            if (authorFilter.value === 'present' && !theme.author) {
                return false;
            }

            if (authorFilter.value === 'missing' && theme.author) {
                return false;
            }

            if (backgroundFilter.value !== 'all' && theme.backgroundClass !== backgroundFilter.value) {
                return false;
            }

            if (duplicatesFilter.value === 'duplicates') {
                const isDuplicateName = duplicateNameValues.value.has(theme.name);
                const isDuplicateHash = duplicateHashValues.value.has(theme.hash);
                const isDuplicateBackground = duplicateBackgroundValues.value.has(theme.background);

                if (!isDuplicateName && !isDuplicateHash && !isDuplicateBackground) {
                    return false;
                }
            }

            return true;
        })
        .sort((left, right) => {
            const nameCompare = (left.name || '').localeCompare(right.name || '');
            const authorCompare = (left.author || '').localeCompare(right.author || '');
            const variantCompare = (left.variant || '').localeCompare(right.variant || '');
            const luminanceCompare = left.backgroundLuminance - right.backgroundLuminance;

            switch (sortBy.value) {
                case 'author-asc':
                    return authorCompare || nameCompare;
                case 'variant-asc':
                    return variantCompare || nameCompare;
                case 'luminance-asc':
                    return luminanceCompare || nameCompare;
                case 'luminance-desc':
                    return (right.backgroundLuminance - left.backgroundLuminance) || nameCompare;
                case 'name-asc':
                default:
                    return nameCompare || authorCompare;
            }
        });
});

const totalPages = computed(() => {
    if (pageSize.value === -1) {
        return 1;
    }

    const pages = Math.ceil(filteredThemes.value.length / pageSize.value);
    return pages > 0 ? pages : 1;
});

const paginatedThemes = computed(() => {
    if (pageSize.value === -1) {
        return filteredThemes.value;
    }

    const page = Math.min(currentPage.value, totalPages.value);
    const start = (page - 1) * pageSize.value;
    return filteredThemes.value.slice(start, start + pageSize.value);
});

const lastUpdatedLabel = computed(() => {
    if (!cachedUpdatedAt.value) {
        return '';
    }

    return new Date(cachedUpdatedAt.value).toLocaleString(localeInfo.value.htmlLang);
});

function formatPercent(count, total) {
    const ratio = total ? count / total : 0;
    return new Intl.NumberFormat(localeInfo.value.htmlLang === 'ar' ? 'ar-u-nu-latn' : localeInfo.value.htmlLang, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(ratio);
}

watch(
    [searchQuery, variantFilter, authorFilter, backgroundFilter, duplicatesFilter, sortBy, pageSize],
    () => {
        currentPage.value = 1;
    },
);

watch(filteredThemes, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
    }
});

function onGlobalKeydown(event) {
    if (event.key === 'Escape' && selectedTheme.value) {
        closeDetail();
    }
}

function openDetail(theme) {
    selectedTheme.value = theme;
    copyMessage.value = '';

    nextTick(() => {
        detailModalRef.value?.focus();
    });
}

function closeDetail() {
    selectedTheme.value = null;
    copyMessage.value = '';
}

async function copyText(text) {
    if (!text) {
        return false;
    }

    try {
        if (globalThis.navigator?.clipboard?.writeText) {
            await globalThis.navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Continue to fallback below.
    }

    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const didCopy = document.execCommand('copy');
        document.body.removeChild(textarea);
        return didCopy;
    } catch {
        return false;
    }
}

async function copyThemeName() {
    const didCopy = await copyText(selectedTheme.value?.name || '');
    copyMessage.value = didCopy ? 'stats.nameCopied' : 'stats.copyFailed';
}

async function copyThemeJson() {
    const didCopy = await copyText(JSON.stringify(selectedTheme.value, null, 2));
    copyMessage.value = didCopy ? 'stats.jsonCopied' : 'stats.copyFailed';
}

onMounted(() => {
    loadThemes();
    window.addEventListener('keydown', onGlobalKeydown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', onGlobalKeydown);
});
</script>

<style lang="scss" scoped>
@use '@/pages/stats.scss';
</style>
