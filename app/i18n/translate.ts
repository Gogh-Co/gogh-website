// Message lookup and formatting, independent of Vue/Nuxt so plain utils
// (theme summaries, color descriptions) can take a translator too.
//
// Messages are nested objects of strings. A string may hold {name}
// placeholders. A plural message is an object of Intl.PluralRules
// categories (zero/one/two/few/many/other, "other" required) picked by the
// `count` param; an explicit "zero" also wins for 0 in languages whose rules
// have no zero category. Number params are formatted for the locale.

import en from './messages/en';

export interface MessageTree {
    [key: string]: string | MessageTree;
}

export type MessageParams = Record<string, string | number | null | undefined>;
export type Translator = (key: string, params?: MessageParams) => string;

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

// Western digits everywhere: hex codes and ratios sit next to these numbers.
const NUMBER_LOCALES: Record<string, string> = { ar: 'ar-u-nu-latn' };

const pluralRules = new Map<string, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();

function pluralCategory(locale: string, count: number): string {
    let rules = pluralRules.get(locale);
    if (!rules) {
        rules = new Intl.PluralRules(locale);
        pluralRules.set(locale, rules);
    }
    return rules.select(count);
}

export function formatNumber(locale: string, value: number): string {
    let format = numberFormats.get(locale);
    if (!format) {
        format = new Intl.NumberFormat(NUMBER_LOCALES[locale] ?? locale);
        numberFormats.set(locale, format);
    }
    return format.format(value);
}

export function lookup(tree: MessageTree | undefined, key: string): string | MessageTree | undefined {
    let node: string | MessageTree | undefined = tree;
    for (const part of key.split('.')) {
        if (!node || typeof node === 'string') {
            return undefined;
        }
        node = node[part];
    }
    return node;
}

export function isPluralMessage(value: unknown): value is MessageTree {
    return !!value
        && typeof value === 'object'
        && typeof (value as MessageTree).other === 'string'
        && Object.keys(value).every((key) => PLURAL_CATEGORIES.has(key));
}

// The raw template for a key (plural form already picked), or null.
export function resolveTemplate(
    locale: string,
    messages: MessageTree | undefined,
    fallback: MessageTree,
    key: string,
    params?: MessageParams,
): string | null {
    const pick = (value: string | MessageTree | undefined): string | null => {
        if (typeof value === 'string') {
            return value;
        }
        if (isPluralMessage(value)) {
            const count = Number(params?.count ?? 0);
            const form = (count === 0 && value.zero) || value[pluralCategory(locale, count)] || value.other;
            return typeof form === 'string' ? form : null;
        }
        return null;
    };
    return pick(lookup(messages, key)) ?? pick(lookup(fallback, key));
}

export function interpolate(locale: string, template: string, params?: MessageParams): string {
    if (!params) {
        return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name];
        if (value === undefined || value === null) {
            return match;
        }
        return typeof value === 'number' ? formatNumber(locale, value) : String(value);
    });
}

export function createTranslator(locale: string, messages: MessageTree | undefined, fallback: MessageTree = en): Translator {
    return (key, params) => {
        const template = resolveTemplate(locale, messages, fallback, key, params);
        return template === null ? key : interpolate(locale, template, params);
    };
}

// English, for code that runs without a Vue context (and for tests).
export const translateEn: Translator = createTranslator('en', en, en);

// Every dotted key of a message tree, plural messages counted as one key.
export function messageKeys(tree: MessageTree, prefix = ''): string[] {
    return Object.entries(tree).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'string' || isPluralMessage(value) ? [path] : messageKeys(value, path);
    });
}
