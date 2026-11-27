// Site languages and how the visitor's one is chosen. Plain TypeScript (no
// Nuxt auto-imports) so nuxt.config.ts can build the boot script from it.
//
// The language never lives in the path: every page has one URL. It is
// picked, most specific first, from:
//   1. ?lang=xx on the URL: opens that page in a language without changing
//      the visitor's saved choice (handy for sharing a theme in Spanish).
//   2. The gogh_lang cookie: the language the visitor picked in the switcher.
//   3. The browser's languages (navigator.languages), first supported match.
//   4. English.

export interface LocaleInfo {
    // Short code used in the cookie, ?lang= and the message files.
    code: string;
    // Native name for the language switcher.
    name: string;
    // <html lang>.
    htmlLang: string;
    dir: 'ltr' | 'rtl';
    // og:locale.
    ogLocale: string;
    // Whether the script separates words with spaces (CJK does not).
    spaced: boolean;
}

export const LOCALES: LocaleInfo[] = [
    { code: 'en', name: 'English', htmlLang: 'en', dir: 'ltr', ogLocale: 'en_US', spaced: true },
    { code: 'es', name: 'Español', htmlLang: 'es', dir: 'ltr', ogLocale: 'es_ES', spaced: true },
    { code: 'zh', name: '简体中文', htmlLang: 'zh-Hans', dir: 'ltr', ogLocale: 'zh_CN', spaced: false },
    { code: 'ar', name: 'العربية', htmlLang: 'ar', dir: 'rtl', ogLocale: 'ar_AR', spaced: true },
    { code: 'pt', name: 'Português', htmlLang: 'pt-BR', dir: 'ltr', ogLocale: 'pt_BR', spaced: true },
    { code: 'id', name: 'Bahasa Indonesia', htmlLang: 'id', dir: 'ltr', ogLocale: 'id_ID', spaced: true },
    { code: 'fr', name: 'Français', htmlLang: 'fr', dir: 'ltr', ogLocale: 'fr_FR', spaced: true },
    { code: 'ja', name: '日本語', htmlLang: 'ja', dir: 'ltr', ogLocale: 'ja_JP', spaced: false },
    { code: 'ru', name: 'Русский', htmlLang: 'ru', dir: 'ltr', ogLocale: 'ru_RU', spaced: true },
    { code: 'de', name: 'Deutsch', htmlLang: 'de', dir: 'ltr', ogLocale: 'de_DE', spaced: true },
];

export const DEFAULT_LOCALE = 'en';
export const LOCALE_COOKIE = 'gogh_lang';
export const LOCALE_QUERY = 'lang';
// A year; the choice is refreshed every time the visitor picks a language.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
// <html> carries this class while a non-English page waits for its messages,
// so the English prerender never flashes.
export const LOCALE_PENDING_CLASS = 'i18n-pending';

const CODES = LOCALES.map((locale) => locale.code);

export function localeInfo(code: string): LocaleInfo {
    return LOCALES.find((locale) => locale.code === code) ?? LOCALES[0]!;
}

// "es-MX", "pt_BR", "ZH-tw" -> "es", "pt", "zh". Unsupported -> null.
export function matchLocale(tag: unknown): string | null {
    if (typeof tag !== 'string') {
        return null;
    }
    const value = tag.trim().toLowerCase().replace(/_/g, '-');
    if (!value) {
        return null;
    }
    if (CODES.includes(value)) {
        return value;
    }
    const primary = value.split('-')[0] ?? '';
    return CODES.includes(primary) ? primary : null;
}

export function readCookie(cookieHeader: string | null | undefined, name: string): string | null {
    if (!cookieHeader) {
        return null;
    }
    for (const part of cookieHeader.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) {
            continue;
        }
        if (part.slice(0, index).trim() === name) {
            try {
                return decodeURIComponent(part.slice(index + 1).trim());
            } catch {
                return null;
            }
        }
    }
    return null;
}

export interface LocaleSources {
    query?: unknown;
    cookie?: unknown;
    languages?: readonly unknown[];
}

export function resolveLocale({ query, cookie, languages = [] }: LocaleSources): string {
    const fromQuery = matchLocale(Array.isArray(query) ? query[0] : query);
    if (fromQuery) {
        return fromQuery;
    }
    const fromCookie = matchLocale(cookie);
    if (fromCookie) {
        return fromCookie;
    }
    for (const language of languages) {
        const match = matchLocale(language);
        if (match) {
            return match;
        }
    }
    return DEFAULT_LOCALE;
}

// Inline <head> script: runs before the first paint, applies <html lang/dir>
// right away and hides the English prerender while the visitor's language
// loads (the CSS below shows the page anyway after a moment, so a failed
// load never leaves it blank). Mirrors resolveLocale().
export function localeBootScript(): string {
    const locales = Object.fromEntries(LOCALES.map((locale) => [locale.code, [locale.htmlLang, locale.dir]]));
    return `(function(){try{var L=${JSON.stringify(locales)};`
        + 'function m(t){if(typeof t!=="string")return null;t=t.trim().toLowerCase().replace(/_/g,"-");'
        + 'if(L[t])return t;t=t.split("-")[0];return L[t]?t:null}'
        + `var q=new URLSearchParams(location.search).get(${JSON.stringify(LOCALE_QUERY)});`
        + `var c=(document.cookie.match(/(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)/)||[])[1];`
        + 'var n=navigator.languages||[navigator.language];var r=m(q)||m(c?decodeURIComponent(c):"");'
        + `for(var i=0;!r&&i<n.length;i++)r=m(n[i]);r=r||${JSON.stringify(DEFAULT_LOCALE)};`
        + 'var h=document.documentElement;h.lang=L[r][0];h.dir=L[r][1];window.__GOGH_LOCALE__=r;'
        + `if(r!==${JSON.stringify(DEFAULT_LOCALE)})h.classList.add(${JSON.stringify(LOCALE_PENDING_CLASS)})}catch(e){}})();`;
}

export const LOCALE_PENDING_STYLE = `html.${LOCALE_PENDING_CLASS} body{opacity:0;animation:i18n-reveal 0s linear 1.6s forwards}`
    + '@keyframes i18n-reveal{to{opacity:1}}';
