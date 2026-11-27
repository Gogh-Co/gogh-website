import { describe, expect, it } from 'vitest';
import en from '@/i18n/history/en';
import { HISTORY_CHAPTERS } from '@/utils/historyData';

// Every translation of the /history article must have exactly the English
// shape (same keys, same array lengths), and keep its links, inline code and
// placeholders, so the page never renders a missing paragraph or label.
const MODULES = import.meta.glob<{ default: unknown }>('../../app/i18n/history/*.ts', { eager: true });
const TRANSLATIONS = Object.entries(MODULES)
    .map(([path, module]) => [path.match(/(\w+)\.ts$/)![1]!, module.default] as const)
    .filter(([code]) => code !== 'en');

function shape(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(shape);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, shape(item)]));
    }
    return typeof value;
}

function strings(value: unknown, path = ''): [string, string][] {
    if (typeof value === 'string') {
        return [[path, value]];
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
    }
    return [];
}

const urls = (text: string) => [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
const codes = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('history copy (English)', () => {
    it('has copy for every chapter', () => {
        for (const chapter of HISTORY_CHAPTERS) {
            expect(en.chapters[chapter.id], chapter.id).toBeDefined();
            expect(en.figures[chapter.id], chapter.id).toBeDefined();
        }
    });
});

describe.each(TRANSLATIONS)('history copy (%s)', (_code, messages) => {
    const english = new Map(strings(en));
    const translated = strings(messages);

    it('has the English shape', () => {
        expect(shape(messages)).toEqual(shape(en));
    });

    it('keeps links, inline code and placeholders', () => {
        for (const [path, text] of translated) {
            const source = english.get(path) ?? '';
            expect(urls(text), path).toEqual(urls(source));
            expect(codes(text), path).toEqual(codes(source));
            expect(placeholders(text), path).toEqual(placeholders(source));
        }
    });
});
