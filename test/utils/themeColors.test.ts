import { describe, it, expect } from 'vitest';
import { summarizeThemeColors, contrastLevel, describeColor } from '@/utils/themeColors';

const dark = {
    name: 'Test Dark',
    author_name: 'Someone',
    variant: 'dark',
    background: '#101010',
    foreground: '#eeeeee',
    cursor: '#eeeeee',
    color_01: '#000000', color_02: '#ff5555', color_03: '#50fa7b', color_04: '#f1fa8c',
    color_05: '#2222aa', color_06: '#ff79c6', color_07: '#8be9fd', color_08: '#bbbbbb',
    color_09: '#555555', color_10: '#ff6e6e', color_11: '#69ff94', color_12: '#ffffa5',
    color_13: '#4444dd', color_14: '#ff92df', color_15: '#a4ffff', color_16: '#ffffff',
};

describe('summarizeThemeColors', () => {
    it('reports foreground contrast and its WCAG level', () => {
        const summary = summarizeThemeColors(dark);
        expect(summary.variant).toBe('dark');
        expect(summary.foregroundContrast).toBeGreaterThan(15);
        expect(summary.foregroundLevel).toBe('AAA');
        expect(summary.sentences[0]).toContain('Test Dark is a dark terminal color scheme by Someone');
    });

    it('finds the strongest and weakest accents', () => {
        const summary = summarizeThemeColors(dark);
        expect(summary.totalAccents).toBe(12);
        expect(summary.weakest?.key).toBe('color_05');
        expect(summary.readableAccents).toBeLessThan(12);
    });

    it('detects a bright row that repeats the normal one', () => {
        const same = { ...dark };
        for (let i = 1; i <= 8; i++) {
            same[`color_${String(i + 8).padStart(2, '0')}` as keyof typeof same] = dark[`color_0${i}` as keyof typeof dark];
        }
        expect(summarizeThemeColors(same).brightShift).toBe('same');
        expect(summarizeThemeColors(dark).brightShift).toBe('brighter');
    });

    it('falls back to the background luminance without a variant', () => {
        expect(summarizeThemeColors({ ...dark, variant: undefined, background: '#fafafa' }).variant).toBe('light');
    });
});

describe('helpers', () => {
    it('maps ratios to WCAG levels', () => {
        expect(contrastLevel(8)).toBe('AAA');
        expect(contrastLevel(5)).toBe('AA');
        expect(contrastLevel(3.2)).toBe('AA Large');
        expect(contrastLevel(1.5)).toBe('Low');
        expect(contrastLevel(null)).toBe('');
    });

    it('describes colors in plain words', () => {
        expect(describeColor('#000000')).toBe('near-black neutral');
        expect(describeColor('#1e2a4a')).toMatch(/dark .*blue|dark .*indigo/);
    });
});
