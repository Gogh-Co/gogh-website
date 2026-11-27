<template>
    <!-- A button that opens a list of languages, each with its flag. Keyboard:
         Enter/Space/arrows open it, arrows/Home/End move, Enter/Space pick,
         Escape or Tab close. -->
    <div
        ref="root"
        class="language-switcher"
        :class="[`language-switcher--${variant}`, { 'is-open': open }]"
        @keydown="onKeydown"
        @focusout="onFocusOut"
    >
        <button
            ref="toggle"
            type="button"
            class="language-switcher__face"
            aria-haspopup="listbox"
            :aria-expanded="open"
            :aria-controls="listId"
            :aria-label="`${t('language.label')}: ${localeInfo.name}`"
            :title="t('language.choose')"
            @click="open ? close() : show()"
        >
            <img class="language-switcher__flag" :src="FLAGS[locale]" alt="" width="20" height="15">
            <span class="language-switcher__code" aria-hidden="true">{{ locale.toUpperCase() }}</span>
            <span class="language-switcher__name" aria-hidden="true">{{ localeInfo.name }}</span>
            <svg class="language-switcher__caret" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/></svg>
        </button>

        <ul
            v-show="open"
            :id="listId"
            ref="list"
            class="language-switcher__list"
            role="listbox"
            :aria-label="t('language.label')"
            :aria-activedescendant="`${listId}-${locales[activeIndex]?.code}`"
            tabindex="-1"
            data-lenis-prevent
        >
            <li
                v-for="(option, index) in locales"
                :id="`${listId}-${option.code}`"
                :key="option.code"
                class="language-switcher__option"
                :class="{ 'is-active': index === activeIndex, 'is-selected': option.code === locale }"
                role="option"
                :aria-selected="option.code === locale"
                :lang="option.htmlLang"
                @click="pick(option.code)"
                @pointermove="activeIndex = index"
            >
                <img class="language-switcher__flag" :src="FLAGS[option.code]" alt="" width="20" height="15" loading="lazy">
                <span class="language-switcher__option-name">{{ option.name }}</span>
                <svg v-if="option.code === locale" class="language-switcher__check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4z"/></svg>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { LOCALE_QUERY } from '~/i18n/config';
// Flags by language (flag-icons, MIT). Spain uses the plain civil flag:
// the coat of arms makes flag-icons' file 80 KB for a 20px icon.
import flagUs from 'flag-icons/flags/4x3/us.svg?url';
import flagCn from 'flag-icons/flags/4x3/cn.svg?url';
import flagSa from 'flag-icons/flags/4x3/sa.svg?url';
import flagBr from 'flag-icons/flags/4x3/br.svg?url';
import flagId from 'flag-icons/flags/4x3/id.svg?url';
import flagFr from 'flag-icons/flags/4x3/fr.svg?url';
import flagJp from 'flag-icons/flags/4x3/jp.svg?url';
import flagRu from 'flag-icons/flags/4x3/ru.svg?url';
import flagDe from 'flag-icons/flags/4x3/de.svg?url';
import flagEs from '~/assets/flags/es.svg?url';

const props = defineProps({
    // "header" (compact in the bar, a full row in the mobile menu) or
    // "footer" (flag plus the language name, list opening upwards).
    variant: {
        type: String,
        default: 'header',
    },
});

const FLAGS = {
    en: flagUs,
    es: flagEs,
    zh: flagCn,
    ar: flagSa,
    pt: flagBr,
    id: flagId,
    fr: flagFr,
    ja: flagJp,
    ru: flagRu,
    de: flagDe,
};

const { t, locale, localeInfo, locales, setLocale } = useI18n();
const route = useRoute();
const router = useRouter();

const listId = `language-list-${props.variant}`;
const root = ref(null);
const toggle = ref(null);
const list = ref(null);
const open = ref(false);
const activeIndex = ref(0);

function currentIndex() {
    return Math.max(0, locales.findIndex((option) => option.code === locale.value));
}

async function show() {
    activeIndex.value = currentIndex();
    open.value = true;
    await nextTick();
    list.value?.focus({ preventScroll: true });
    // In the mobile menu the list opens in the flow, maybe below the fold.
    if (getComputedStyle(list.value).position === 'static') {
        list.value.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
}

function close({ focus = false } = {}) {
    open.value = false;
    if (focus) {
        toggle.value?.focus({ preventScroll: true });
    }
}

async function pick(code) {
    close({ focus: true });
    if (code === locale.value) {
        return;
    }
    await setLocale(code, { persist: true });
    trackEvent('Language', { lang: code });
    // An explicit choice replaces a ?lang= the page was opened with, so a
    // reload doesn't switch back.
    if (route.query[LOCALE_QUERY] !== undefined) {
        const query = { ...route.query };
        delete query[LOCALE_QUERY];
        router.replace({ query, hash: route.hash });
    }
}

function move(index) {
    activeIndex.value = (index + locales.length) % locales.length;
    list.value?.querySelector(`#${listId}-${locales[activeIndex.value].code}`)?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(event) {
    if (!open.value) {
        if (['ArrowDown', 'ArrowUp'].includes(event.key) && event.target === toggle.value) {
            event.preventDefault();
            show();
        }
        return;
    }
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            move(activeIndex.value + 1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            move(activeIndex.value - 1);
            break;
        case 'Home':
            event.preventDefault();
            move(0);
            break;
        case 'End':
            event.preventDefault();
            move(locales.length - 1);
            break;
        case 'Enter':
        case ' ':
            if (event.target === list.value) {
                event.preventDefault();
                pick(locales[activeIndex.value].code);
            }
            break;
        case 'Escape':
            event.preventDefault();
            // Keep the page's own Escape handlers (lightboxes) out of it.
            event.stopPropagation();
            close({ focus: true });
            break;
        case 'Tab':
            close();
            break;
        default:
            break;
    }
}

// Focus left the switcher (Tab away, a click elsewhere): close the list.
function onFocusOut(event) {
    if (open.value && !root.value?.contains(event.relatedTarget)) {
        close();
    }
}

function onDocumentPointerDown(event) {
    if (open.value && !event.composedPath().includes(root.value)) {
        close();
    }
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown));
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.language-switcher {
    position: relative;
    flex: 0 0 auto;
    color: var(--cream);
}

.language-switcher__face {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--gogh-yellow);
        outline-offset: 2px;
    }
}

.language-switcher__flag {
    display: block;
    flex: 0 0 auto;
    width: 20px;
    height: 15px;
    border-radius: 2px;
    object-fit: cover;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.language-switcher__code {
    font-family: $font_mono;
    font-size: 1.1rem;
    font-weight: 500;
    letter-spacing: 0.06em;
}

.language-switcher__caret {
    opacity: 0.7;
    transition: transform 0.3s $ease_out_expo;

    .is-open & {
        transform: rotate(180deg);
    }
}

.language-switcher__list {
    position: absolute;
    z-index: 20;
    inset-inline-end: 0;
    top: calc(100% + 8px);
    min-width: 220px;
    max-height: min(70vh, 460px);
    margin: 0;
    padding: 6px;
    overflow-y: auto;
    list-style: none;
    border: 1px solid var(--ink-line);
    background: var(--ink-2);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);

    &:focus {
        outline: none;
    }
}

.language-switcher__option {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 40px;
    padding: 8px 12px;
    color: var(--cream);
    font-size: 1.5rem;
    cursor: pointer;

    &.is-active {
        background: rgba(255, 255, 255, 0.08);
    }

    &.is-selected {
        font-weight: 600;
    }

    // The keyboard's current option, while the list has focus.
    .language-switcher__list:focus-visible &.is-active {
        outline: 1px solid var(--gogh-yellow);
        outline-offset: -1px;
    }
}

.language-switcher__option-name {
    flex: 1 1 auto;
}

.language-switcher__check {
    flex: 0 0 auto;
    color: var(--gogh-yellow);
}

// In the bar: a 40px box like the theme and dice buttons.
.language-switcher--header {
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    transition: background-color 0.25s ease, border-color 0.25s ease;

    &:hover,
    &.is-open {
        border-color: rgba(255, 255, 255, 0.4);
        background-color: rgba(255, 255, 255, 0.08);
    }

    .language-switcher__face {
        padding: 0 10px;
    }

    .language-switcher__name {
        display: none;
    }

    // The mobile menu: one more full-width row, and the list opens in place.
    @media (max-width: 991.98px) {
        width: 100%;
        height: auto;
        border: 0;
        border-bottom: 1px solid var(--ink-line);

        &:hover,
        &.is-open {
            background-color: transparent;
        }

        .language-switcher__face {
            gap: 10px;
            width: 100%;
            height: auto;
            min-height: $tap_target_min;
            padding: 11px 4px;
        }

        .language-switcher__code {
            display: none;
        }

        .language-switcher__name {
            display: inline;
            flex: 1 1 auto;
            font-size: 1.5rem;
            font-weight: 500;
            text-align: start;
        }

        .language-switcher__list {
            position: static;
            max-height: none;
            margin-bottom: 10px;
            box-shadow: none;
        }
    }
}

// In the footer: the language name, and the list opens upwards.
.language-switcher--footer {
    border: 1px solid currentColor;

    .language-switcher__face {
        padding: 8px 12px;
        opacity: 0.85;
        transition: opacity 0.25s ease;

        &:hover {
            opacity: 1;
        }
    }

    .language-switcher__code {
        display: none;
    }

    .language-switcher__name {
        font-size: 1.4rem;
    }

    .language-switcher__list {
        top: auto;
        bottom: calc(100% + 8px);
    }
}
</style>
