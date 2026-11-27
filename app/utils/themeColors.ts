import chroma from 'chroma-js';
import { translateEn, type Translator } from '~/i18n/translate';

// What each palette slot is and where the theme page previews paint it. The
// roles (messages slotRoles.*) mirror HomePreviewTerminal (dircolors / PS1 /
// git status) and CodePreviewTerminal (TOKEN_COLOR_KEYS), so the text on a
// theme page describes exactly what its previews show. Labels and roles
// default to English; pass the page's translator (useI18n().t) for others.
export interface ColorSlot {
    key: string;
    label: string;
    role: string;
}

const BASE_KEYS = ['background', 'foreground', 'cursor'];
const NORMAL_KEYS = Array.from({ length: 8 }, (_, index) => `color_${String(index + 1).padStart(2, '0')}`);
const BRIGHT_KEYS = Array.from({ length: 8 }, (_, index) => `color_${String(index + 9).padStart(2, '0')}`);

function slotsFor(keys: string[], t: Translator): ColorSlot[] {
    return keys.map((key) => ({ key, label: t(`colors.${key}`), role: t(`slotRoles.${key}`) }));
}

export function baseColorSlots(t: Translator = translateEn): ColorSlot[] {
    return slotsFor(BASE_KEYS, t);
}

export function normalColorSlots(t: Translator = translateEn): ColorSlot[] {
    return slotsFor(NORMAL_KEYS, t);
}

export function brightColorSlots(t: Translator = translateEn): ColorSlot[] {
    return slotsFor(BRIGHT_KEYS, t);
}

export const BASE_COLOR_SLOTS: ColorSlot[] = baseColorSlots();
export const NORMAL_COLOR_SLOTS: ColorSlot[] = normalColorSlots();
export const BRIGHT_COLOR_SLOTS: ColorSlot[] = brightColorSlots();

// The coloured slots readers judge a theme by: black/white (01, 08, 09, 16)
// are left out because on a dark/light theme one of each is meant to blend in.
const ACCENT_KEYS = ['color_02', 'color_03', 'color_04', 'color_05', 'color_06', 'color_07',
    'color_10', 'color_11', 'color_12', 'color_13', 'color_14', 'color_15'];

const ALL_KEYS = new Set([...BASE_KEYS, ...NORMAL_KEYS, ...BRIGHT_KEYS]);

export function slotLabel(key: string, t: Translator = translateEn): string {
    return ALL_KEYS.has(key) ? t(`colors.${key}`) : key;
}

export function safeHex(value: unknown): string | null {
    return typeof value === 'string' && chroma.valid(value) ? chroma(value).hex() : null;
}

export function contrastRatio(a: unknown, b: unknown): number | null {
    const hexA = safeHex(a);
    const hexB = safeHex(b);
    return hexA && hexB ? chroma.contrast(hexA, hexB) : null;
}

// Message key (levels.*) for a contrastLevel() value.
export function contrastLevelKey(level: string): string {
    return {
        AAA: 'levels.aaa',
        AA: 'levels.aa',
        'AA Large': 'levels.aaLarge',
        Low: 'levels.low',
        Fail: 'levels.fail',
    }[level] ?? '';
}

// WCAG 2 levels for normal-size text.
export function contrastLevel(ratio: number | null): 'AAA' | 'AA' | 'AA Large' | 'Low' | '' {
    if (ratio === null) return '';
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'AA Large';
    return 'Low';
}

export function isLightColor(value: unknown): boolean {
    const hex = safeHex(value);
    return hex ? chroma(hex).luminance() > 0.18 : false;
}

// Text colour that reads on top of a swatch.
export function inkFor(value: unknown): string {
    const hex = safeHex(value);
    if (!hex) return '#000000';
    return chroma.contrast(hex, '#000000') >= chroma.contrast(hex, '#ffffff') ? '#000000' : '#ffffff';
}

const HUE_NAMES: Array<[number, string]> = [
    [15, 'red'], [45, 'orange'], [70, 'yellow'], [100, 'olive'], [160, 'green'],
    [200, 'teal'], [250, 'blue'], [290, 'indigo'], [320, 'purple'], [345, 'magenta'], [360, 'red'],
];

// Plain-words description of a colour ("near-black blue-tinted"), from the
// colorWords.* messages.
export function describeColor(value: unknown, t: Translator = translateEn): string {
    const hex = safeHex(value);
    if (!hex) return '';

    const [lightness, chromaValue, hue] = chroma(hex).lch();
    let tone = 'midTone';
    if (lightness < 12) tone = 'nearBlack';
    else if (lightness < 35) tone = 'dark';
    else if (lightness > 92) tone = 'nearWhite';
    else if (lightness > 70) tone = 'light';
    const toneWord = t(`colorWords.tone.${tone}`);

    if (Number.isNaN(hue) || chromaValue < 6) {
        return tone === 'midTone' ? t('colorWords.neutralGrey') : t('colorWords.neutral', { tone: toneWord });
    }

    const hueName = HUE_NAMES.find(([limit]) => hue < limit)?.[1] ?? 'red';
    return chromaValue < 22
        ? t('colorWords.tinted', { tone: toneWord, tint: t(`colorWords.tint.${hueName}`) })
        : t('colorWords.strong', { tone: toneWord, hue: t(`colorWords.hue.${hueName}`) });
}

export interface ColorSummary {
    variant: 'light' | 'dark';
    backgroundDescription: string;
    foregroundDescription: string;
    foregroundContrast: number | null;
    foregroundLevel: string;
    readableAccents: number;
    totalAccents: number;
    strongest: { key: string; label: string; ratio: number } | null;
    weakest: { key: string; label: string; ratio: number } | null;
    brightMatchesNormal: boolean;
    brightShift: 'brighter' | 'darker' | 'similar' | 'same';
    sentences: string[];
}

function formatRatio(ratio: number): string {
    return `${ratio.toFixed(1)}:1`;
}

export function themeVariant(theme: Record<string, any>): 'light' | 'dark' {
    if (theme?.variant === 'light' || theme?.variant === 'dark') {
        return theme.variant;
    }
    return isLightColor(theme?.background) ? 'light' : 'dark';
}

// Everything the theme page says about a palette, computed from its hex
// values so it stays true for all ~1,200 themes without hand-written copy.
export function summarizeThemeColors(theme: Record<string, any>, t: Translator = translateEn): ColorSummary {
    const name = (theme?.name || 'This theme').toString();
    const variant = themeVariant(theme);
    const background = theme?.background;

    const foregroundContrast = contrastRatio(theme?.foreground, background);
    const foregroundLevel = contrastLevel(foregroundContrast);

    const accents = ACCENT_KEYS
        .map((key) => ({ key, label: slotLabel(key, t), ratio: contrastRatio(theme?.[key], background) }))
        .filter((accent): accent is { key: string; label: string; ratio: number } => accent.ratio !== null);

    const readableAccents = accents.filter((accent) => accent.ratio >= 4.5).length;
    const sorted = [...accents].sort((a, b) => b.ratio - a.ratio);
    const strongest = sorted[0] ?? null;
    const weakest = sorted[sorted.length - 1] ?? null;

    // Bright row vs normal row: identical, or shifted lighter/darker.
    const pairs = Array.from({ length: 8 }, (_, index) => [
        safeHex(theme?.[`color_${String(index + 1).padStart(2, '0')}`]),
        safeHex(theme?.[`color_${String(index + 9).padStart(2, '0')}`]),
    ]).filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]));

    const brightMatchesNormal = pairs.length > 0 && pairs.every(([normal, bright]) => normal === bright);
    const averageShift = pairs.length
        ? pairs.reduce((sum, [normal, bright]) => sum + (chroma(bright).lch()[0] - chroma(normal).lch()[0]), 0) / pairs.length
        : 0;
    let brightShift: ColorSummary['brightShift'] = 'similar';
    if (brightMatchesNormal) brightShift = 'same';
    else if (averageShift > 3) brightShift = 'brighter';
    else if (averageShift < -3) brightShift = 'darker';

    const backgroundDescription = describeColor(background, t);
    const foregroundDescription = describeColor(theme?.foreground, t);
    const author = (theme?.author_name || '').toString().trim();
    const variantKey = variant === 'light' ? 'Light' : 'Dark';

    const sentences: string[] = [];
    sentences.push(t(`summary.intro${variantKey}${author ? 'By' : ''}`, {
        name,
        author,
        description: backgroundDescription || t(`common.${variant}`).toLocaleLowerCase(),
        hex: safeHex(background) ?? t('common.notAvailable'),
    }));

    if (foregroundContrast !== null) {
        const verdict = t({
            AAA: 'summary.verdictAAA',
            AA: 'summary.verdictAA',
            'AA Large': 'summary.verdictAALarge',
            Low: 'summary.verdictLow',
        }[foregroundLevel as 'AAA' | 'AA' | 'AA Large' | 'Low']);
        sentences.push(t('summary.foreground', {
            description: foregroundDescription || t('summary.foregroundFallback'),
            hex: safeHex(theme?.foreground),
            ratio: formatRatio(foregroundContrast),
            verdict,
        }));
    }

    if (accents.length && strongest && weakest) {
        const accentsSentence = t('summary.accents', { readable: readableAccents, total: accents.length });
        const standout = weakest.key !== strongest.key
            ? t('summary.strongestAndWeakest', {
                strongest: strongest.label,
                strongestRatio: formatRatio(strongest.ratio),
                weakest: weakest.label,
                weakestRatio: formatRatio(weakest.ratio),
            })
            : t('summary.strongestOnly', { strongest: strongest.label, strongestRatio: formatRatio(strongest.ratio) });
        sentences.push(accentsSentence, standout);
    }

    if (pairs.length) {
        sentences.push(t({
            same: 'summary.brightSame',
            brighter: 'summary.brightBrighter',
            darker: 'summary.brightDarker',
            similar: 'summary.brightSimilar',
        }[brightShift]));
    }

    return {
        variant,
        backgroundDescription,
        foregroundDescription,
        foregroundContrast,
        foregroundLevel,
        readableAccents,
        totalAccents: accents.length,
        strongest,
        weakest,
        brightMatchesNormal,
        brightShift,
        sentences,
    };
}

// A tint between two theme colours (surfaces, borders) for the mockup
// previews; falls back to the first colour when either value is invalid.
export function mixColors(a: unknown, b: unknown, amount: number): string {
    const hexA = safeHex(a);
    const hexB = safeHex(b);
    if (!hexA || !hexB) return hexA || hexB || '#000000';
    return chroma.mix(hexA, hexB, amount, 'rgb').hex();
}

// Text colour for a filled element (button, active tab): the theme's own
// background when it reads on the fill, else black or white.
export function inkOnFill(fill: unknown, background: unknown): string {
    const fillHex = safeHex(fill);
    const backgroundHex = safeHex(background);
    if (fillHex && backgroundHex && chroma.contrast(fillHex, backgroundHex) >= 3) {
        return backgroundHex;
    }
    return inkFor(fillHex);
}

// Theme colours as CSS custom properties for the mockup previews:
// --bg/--fg/--cursor, --c01..--c16, and three surface tints for panels,
// raised panels and hairlines.
export function themeCssVars(theme: Record<string, any>): Record<string, string> {
    const vars: Record<string, string> = {
        '--bg': theme?.background,
        '--fg': theme?.foreground,
        '--cursor': theme?.cursor || theme?.foreground,
        '--surface': mixColors(theme?.background, theme?.foreground, 0.06),
        '--surface-2': mixColors(theme?.background, theme?.foreground, 0.12),
        '--line': mixColors(theme?.background, theme?.foreground, 0.22),
    };
    for (let index = 1; index <= 16; index++) {
        const slot = String(index).padStart(2, '0');
        vars[`--c${slot}`] = theme?.[`color_${slot}`];
    }
    return vars;
}
