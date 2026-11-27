import { shallowReactive } from 'vue';
import {
    DEFAULT_LOCALE,
    LOCALE_COOKIE,
    LOCALE_COOKIE_MAX_AGE,
    LOCALE_PENDING_CLASS,
    LOCALES,
    localeInfo,
    matchLocale,
} from '~/i18n/config';
import {
    createTranslator,
    formatNumber,
    interpolate,
    resolveTemplate,
    type MessageParams,
    type MessageTree,
    type Translator,
} from '~/i18n/translate';
import en from '~/i18n/messages/en';

// The site's translations (see i18n/config.ts for how the language is
// picked). Pages are prerendered in English; in the browser the visitor's
// language is applied right after hydration (plugins/i18n.client.ts), so
// the hydrated markup always matches the prerender.

// English ships with the app; every other language is its own chunk,
// fetched the first time it is needed.
const LOADERS: Record<string, () => Promise<{ default: MessageTree }>> = {
    es: () => import('~/i18n/messages/es'),
    zh: () => import('~/i18n/messages/zh'),
    ar: () => import('~/i18n/messages/ar'),
    pt: () => import('~/i18n/messages/pt'),
    id: () => import('~/i18n/messages/id'),
    fr: () => import('~/i18n/messages/fr'),
    ja: () => import('~/i18n/messages/ja'),
    ru: () => import('~/i18n/messages/ru'),
    de: () => import('~/i18n/messages/de'),
};

// Shared by every component (and, on the server, only ever holds English).
const loaded = shallowReactive<Record<string, MessageTree>>({ en });
const pendingLoads = new Map<string, Promise<void>>();
const translators = new Map<string, { messages: MessageTree; translate: Translator }>();

// Resolves once the first locale has been applied after hydration. Things
// that measure text on mount (the hero's decoding title) wait for it.
let resolveReady: () => void = () => {};
const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
});
if (import.meta.server) {
    resolveReady();
}

async function loadMessages(code: string): Promise<void> {
    if (loaded[code]) {
        return;
    }
    const loader = LOADERS[code];
    if (!loader) {
        return;
    }
    let pending = pendingLoads.get(code);
    if (!pending) {
        pending = loader()
            .then((module) => {
                loaded[code] = module.default;
            })
            .finally(() => pendingLoads.delete(code));
        pendingLoads.set(code, pending);
    }
    await pending;
}

function translatorFor(code: string): Translator {
    const messages = loaded[code] ?? en;
    const cached = translators.get(code);
    if (cached && cached.messages === messages) {
        return cached.translate;
    }
    const translate = createTranslator(code, messages, en);
    translators.set(code, { messages, translate });
    return translate;
}

function writeCookie(code: string) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function applyDocumentLocale(code: string) {
    const info = localeInfo(code);
    const root = document.documentElement;
    root.lang = info.htmlLang;
    root.dir = info.dir;
    root.classList.remove(LOCALE_PENDING_CLASS);
}

export function useI18n() {
    const locale = useState<string>('i18n-locale', () => DEFAULT_LOCALE);

    // Reads the locale and its messages, so templates and computeds that
    // call it re-render when either changes.
    const t: Translator = (key: string, params?: MessageParams) => {
        const code = locale.value;
        // Touch the reactive entry so a language that finishes loading later re-renders.
        void loaded[code];
        return translatorFor(code)(key, params);
    };

    // The raw message (plural form picked, placeholders left in), for I18nT.
    function template(key: string, params?: MessageParams): string {
        const code = locale.value;
        return resolveTemplate(code, loaded[code], en, key, params) ?? key;
    }

    function format(text: string, params?: MessageParams): string {
        return interpolate(locale.value, text, params);
    }

    const info = computed(() => localeInfo(locale.value));

    // persist: the visitor picked it (switcher), so it is remembered in the
    // cookie. A ?lang= visit applies the language without saving it.
    async function setLocale(code: string, { persist = false }: { persist?: boolean } = {}) {
        const match = matchLocale(code) ?? DEFAULT_LOCALE;
        try {
            await loadMessages(match);
        } catch (error) {
            console.error(`[i18n] Could not load "${match}" messages`, error);
            if (import.meta.client) {
                document.documentElement.classList.remove(LOCALE_PENDING_CLASS);
            }
            return;
        }
        locale.value = match;
        if (import.meta.client) {
            if (persist) {
                writeCookie(match);
            }
            await nextTick();
            applyDocumentLocale(match);
            // Translated copy changes section heights: re-measure the
            // scroll-driven animations.
            if (typeof window !== 'undefined') {
                requestAnimationFrame(() => useGsap().ScrollTrigger.refresh());
            }
        }
    }

    function n(value: number): string {
        return formatNumber(locale.value, value);
    }

    return {
        locale,
        localeInfo: info,
        locales: LOCALES,
        t,
        n,
        template,
        format,
        setLocale,
        ready,
    };
}

// Called once by the client plugin when the first locale is in place.
export function markI18nReady() {
    resolveReady();
}

export function whenI18nReady(): Promise<void> {
    return ready;
}
