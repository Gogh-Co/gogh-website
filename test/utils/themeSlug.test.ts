import { describe, it, expect } from 'vitest';
import { themeSlug, themePagePath } from '@/utils/themeSlug';

describe('themeSlug', () => {
    it('lowercases and hyphenates names', () => {
        expect(themeSlug('Noche')).toBe('noche');
        expect(themeSlug('Catppuccin Mocha')).toBe('catppuccin-mocha');
        expect(themeSlug('Black Metal (Bathory)')).toBe('black-metal-bathory');
        expect(themeSlug('Hopscotch.256')).toBe('hopscotch-256');
    });

    it('keeps "+" apart from the base name', () => {
        expect(themeSlug('Dark+')).toBe('dark-plus');
        expect(themeSlug('Vs Code Light+')).toBe('vs-code-light-plus');
    });

    it('strips accents', () => {
        expect(themeSlug('Café Crème')).toBe('cafe-creme');
    });

    it('moves names that clash with site routes out of the way', () => {
        expect(themeSlug('Gogh')).toBe('gogh-theme');
        expect(themeSlug('Generator')).toBe('generator-theme');
    });

    it('never returns an empty slug', () => {
        expect(themeSlug('')).toBe('theme');
        expect(themeSlug('+++')).toBe('plus-plus-plus');
        expect(themeSlug('***')).toBe('theme');
    });

    it('builds the page path with a trailing slash', () => {
        expect(themePagePath('Noche')).toBe('/noche/');
    });
});
