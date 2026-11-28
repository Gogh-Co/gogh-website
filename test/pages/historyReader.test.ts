import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import { injectHead } from '#imports';
import { renderSSRHead } from 'unhead/server';
import HistoryPage from '@/pages/history.vue';
import { HISTORY_CHAPTERS } from '@/utils/historyData';

// Exercise the real article and exhibits, without starting visual effects in
// the test DOM. Readability is a test-only dependency, never a client bundle.
vi.mock('~/utils/historyHover', () => ({ createHistoryHover: () => () => {} }));
vi.mock('~/utils/historyField', () => ({ createHistoryField: () => () => {} }));
mockNuxtImport('useSmoothScroll', () => () => ({ start() {}, stop() {} }));
mockNuxtImport('useGsap', () => () => ({
    gsap: { matchMedia: () => ({ add() {}, revert() {} }) },
    ScrollTrigger: { refresh() {} },
}));

const COPIES = import.meta.glob<{ default: { hero: { title: string; titleAccent: string } } }>(
    '../../app/i18n/history/*.ts', { eager: true },
);
const locales = Object.entries(COPIES).map(([path, module]) => [path.match(/(\w+)\.ts$/)![1]!, module.default] as const);
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
let unmount: (() => void) | undefined;

afterEach(() => { unmount?.(); unmount = undefined; });

describe.each(locales)('Firefox article extraction (%s)', (language, copy) => {
    it('retains every chapter, paragraph, illustration and reference in reading order', async () => {
        useI18n().locale.value = language;
        const wrapper = await mountSuspended(HistoryPage, { global: { stubs: { Header: true, CubeDepth: true } } });
        unmount = () => wrapper.unmount();
        await vi.waitFor(() => expect(wrapper.get('#history-title').text()).toBe(`${copy.hero.title} ${copy.hero.titleAccent}`));

        const doc = document.implementation.createHTMLDocument(`${copy.hero.title} ${copy.hero.titleAccent}`);
        // Include the page's actual Article metadata. In CJK languages the
        // extractor cannot infer a headline by counting space-separated words.
        const head = useNuxtApp().vueApp.runWithContext(() => injectHead());
        doc.head.innerHTML = renderSSRHead(head).headTags;
        const base = doc.createElement('base');
        base.href = 'https://gogh.website/history/';
        doc.head.append(base);
        doc.body.innerHTML = wrapper.html();
        doc.documentElement.lang = wrapper.get('article').attributes('lang')!;
        doc.documentElement.dir = wrapper.get('article').attributes('dir')!;
        const paragraphs = [...doc.querySelectorAll('.h-chapter__text p')].map(p => normalize(p.textContent!));
        const headings = [...doc.querySelectorAll('.h-chapter__title')].map(h => normalize(h.textContent!));
        const sources = [...doc.querySelectorAll<HTMLAnchorElement>('.h-source')].map(a => a.href);
        const captions = [...doc.querySelectorAll('.hfig__caption')].map(p => normalize(p.textContent!));

        expect(isProbablyReaderable(doc)).toBe(true);
        const article = new Readability(doc.cloneNode(true) as Document).parse();
        expect(article).not.toBeNull();
        expect(article!.title).toBe(`${copy.hero.title} ${copy.hero.titleAccent}`);
        const output = document.implementation.createHTMLDocument();
        output.body.innerHTML = article!.content!;
        const text = normalize(article!.textContent!);

        // Exact prose coverage catches a chapter being silently dropped by a
        // link-density heuristic, even if its heading was retained.
        let position = -1;
        for (const paragraph of paragraphs) {
            expect(text, paragraph).toContain(paragraph);
            const next = text.indexOf(paragraph);
            expect(next).toBeGreaterThan(position);
            position = next;
        }
        // Mozilla can retain the main headline as an h2 in non-Latin scripts;
        // the chapter headings must still all survive in their original order.
        expect([...output.querySelectorAll('h2')].map(h => normalize(h.textContent!)).filter(text => headings.includes(text))).toEqual(headings);
        const links = [...output.querySelectorAll<HTMLAnchorElement>('a')].map(a => a.href);
        for (const source of sources) expect(links, source).toContain(source);
        for (const caption of captions) expect(text, caption).toContain(caption);
        expect(output.querySelectorAll('img')).toHaveLength(HISTORY_CHAPTERS.length);
        expect(output.querySelectorAll('figcaption')).toHaveLength(HISTORY_CHAPTERS.length);
        expect(output.querySelector('button, input, select, canvas, nav, aside')).toBeNull();
    });
});
