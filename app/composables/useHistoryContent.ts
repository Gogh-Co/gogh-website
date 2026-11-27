import { shallowReactive } from 'vue';
import en from '~/i18n/history/en';

// The /history page's long-form copy, one file per language in
// app/i18n/history/ (kept apart from the UI messages so the article only
// downloads on this page). English ships with the page and is what gets
// prerendered; any other language is fetched when the visitor's locale asks
// for it, and a language without a file reads the English text.

export type HistoryContent = typeof en;

const MODULES = import.meta.glob<{ default: HistoryContent }>('../i18n/history/*.ts');

const LOADERS: Record<string, () => Promise<{ default: HistoryContent }>> = {};
for (const [path, loader] of Object.entries(MODULES)) {
    const code = path.match(/\/(\w+)\.ts$/)?.[1];
    if (code && code !== 'en') {
        LOADERS[code] = loader;
    }
}

const loaded = shallowReactive<Record<string, HistoryContent>>({ en });
const pending = new Map<string, Promise<void>>();

function load(code: string): Promise<void> {
    if (loaded[code] || !LOADERS[code]) {
        return Promise.resolve();
    }
    let promise = pending.get(code);
    if (!promise) {
        promise = LOADERS[code]!()
            .then((module) => {
                loaded[code] = module.default;
            })
            .catch((error) => console.error(`[history] Could not load "${code}" copy`, error))
            .finally(() => pending.delete(code));
        pending.set(code, promise);
    }
    return promise;
}

export function historyLocales(): string[] {
    return ['en', ...Object.keys(LOADERS)];
}

export function useHistoryContent() {
    const { locale } = useI18n();

    if (import.meta.client) {
        watch(locale, (code) => {
            load(code).then(() => {
                // Translated copy changes section heights.
                requestAnimationFrame(() => useGsap().ScrollTrigger.refresh());
            });
        }, { immediate: true });
    }

    return computed<HistoryContent>(() => loaded[locale.value] ?? en);
}
