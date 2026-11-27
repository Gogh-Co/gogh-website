import { describe, expect, it } from 'vitest';
import {
    LOCALE_COOKIE,
    LOCALE_PENDING_CLASS,
    localeBootScript,
    matchLocale,
    readCookie,
    resolveLocale,
} from '@/i18n/config';
import { createTranslator, translateEn } from '@/i18n/translate';
import { describeColor, summarizeThemeColors } from '@/utils/themeColors';
import es from '@/i18n/messages/es';
import ru from '@/i18n/messages/ru';
import ar from '@/i18n/messages/ar';

describe('matchLocale', () => {
    it('maps regional tags to the site languages', () => {
        expect(matchLocale('es-MX')).toBe('es');
        expect(matchLocale('pt_BR')).toBe('pt');
        expect(matchLocale('ZH-tw')).toBe('zh');
        expect(matchLocale(' de ')).toBe('de');
    });

    it('rejects anything else', () => {
        expect(matchLocale('ko')).toBeNull();
        expect(matchLocale('')).toBeNull();
        expect(matchLocale(undefined)).toBeNull();
        expect(matchLocale(['es'])).toBeNull();
    });
});

describe('resolveLocale', () => {
    it('prefers ?lang=, then the cookie, then the browser, then English', () => {
        expect(resolveLocale({ query: 'fr', cookie: 'es', languages: ['de'] })).toBe('fr');
        expect(resolveLocale({ cookie: 'es', languages: ['de'] })).toBe('es');
        expect(resolveLocale({ languages: ['ko-KR', 'ja-JP', 'de'] })).toBe('ja');
        expect(resolveLocale({ languages: ['ko-KR'] })).toBe('en');
        expect(resolveLocale({})).toBe('en');
    });

    it('ignores unsupported values at each step', () => {
        expect(resolveLocale({ query: 'xx', cookie: 'yy', languages: ['ru'] })).toBe('ru');
        expect(resolveLocale({ query: ['de', 'fr'] })).toBe('de');
    });
});

describe('readCookie', () => {
    it('reads one cookie out of the header', () => {
        expect(readCookie(`a=1; ${LOCALE_COOKIE}=pt; b=2`, LOCALE_COOKIE)).toBe('pt');
        expect(readCookie('a=1', LOCALE_COOKIE)).toBeNull();
        expect(readCookie('', LOCALE_COOKIE)).toBeNull();
    });
});

describe('localeBootScript', () => {
    function boot({ search = '', cookie = '', languages = [] as string[] }) {
        const classes = new Set<string>();
        const html = { lang: '', dir: '', classList: { add: (name: string) => classes.add(name) } };
        const win: Record<string, unknown> = {};
        new Function('window', 'document', 'navigator', 'location', localeBootScript())(
            win,
            { documentElement: html, cookie },
            { languages, language: languages[0] },
            { search },
        );
        return { locale: win.__GOGH_LOCALE__, lang: html.lang, dir: html.dir, pending: classes.has(LOCALE_PENDING_CLASS) };
    }

    it('matches resolveLocale and sets <html> before the app loads', () => {
        expect(boot({ search: '?lang=ar', cookie: `${LOCALE_COOKIE}=es`, languages: ['de'] }))
            .toEqual({ locale: 'ar', lang: 'ar', dir: 'rtl', pending: true });
        expect(boot({ cookie: `x=1; ${LOCALE_COOKIE}=zh`, languages: ['de'] }))
            .toEqual({ locale: 'zh', lang: 'zh-Hans', dir: 'ltr', pending: true });
        expect(boot({ languages: ['pt-BR'] }).locale).toBe('pt');
        expect(boot({ languages: ['ko'] })).toEqual({ locale: 'en', lang: 'en', dir: 'ltr', pending: false });
    });
});

describe('translator', () => {
    it('interpolates, picks plural forms and formats numbers for the locale', () => {
        const t = createTranslator('ru', ru);
        expect(t('common.themesCount', { count: 1 })).toBe('1 тема');
        expect(t('common.themesCount', { count: 3 })).toBe('3 темы');
        expect(t('common.themesCount', { count: 1235 })).toMatch(/^1\s235 тем$/);
        expect(t('common.themesCount', { count: 1234 })).toMatch(/^1\s234 темы$/);
        expect(createTranslator('es', es)('pager.allThemes', { count: 1234 })).toBe('Los 1234 temas');
        expect(createTranslator('ar', ar)('pager.allThemes', { count: 1234 })).toBe('كل السمات (1,234)');
        expect(translateEn('common.themesCount', { count: 1 })).toBe('1 theme');
    });

    it('falls back to English, then to the key', () => {
        const t = createTranslator('es', { common: { all: 'Todos' } });
        expect(t('common.all')).toBe('Todos');
        expect(t('common.close')).toBe('Close');
        expect(t('nope.missing')).toBe('nope.missing');
    });
});

describe('translated theme summaries', () => {
    const theme = {
        name: 'Test Dark',
        author_name: 'Someone',
        variant: 'dark',
        background: '#101010',
        foreground: '#eeeeee',
        color_01: '#000000', color_02: '#ff5555', color_03: '#50fa7b', color_04: '#f1fa8c',
        color_05: '#2222aa', color_06: '#ff79c6', color_07: '#8be9fd', color_08: '#bbbbbb',
        color_09: '#555555', color_10: '#ff6e6e', color_11: '#69ff94', color_12: '#ffffa5',
        color_13: '#4444dd', color_14: '#ff92df', color_15: '#a4ffff', color_16: '#ffffff',
    };

    it('writes the sentences in the given language', () => {
        const t = createTranslator('es', es);
        const summary = summarizeThemeColors(theme, t);
        expect(summary.sentences[0]).toBe('Test Dark es un esquema de color oscuro para terminal creado por Someone, construido sobre un fondo casi negro neutro (#101010).');
        expect(summary.strongest?.label).not.toMatch(/Bright|Red|Green/);
        expect(describeColor('#1e2a4a', t)).toMatch(/oscuro/);
    });
});
