import chroma from 'chroma-js';

// What each palette slot is and where the theme page previews paint it. The
// roles mirror HomePreviewTerminal (dircolors / PS1 / git status) and
// CodePreviewTerminal (TOKEN_COLOR_KEYS), so the text on a theme page
// describes exactly what its previews show.
export interface ColorSlot {
    key: string;
    label: string;
    role: string;
}

export const BASE_COLOR_SLOTS: ColorSlot[] = [
    { key: 'background', label: 'Background', role: 'Behind every line of text in the terminal window.' },
    { key: 'foreground', label: 'Foreground', role: 'Default text: command output, file names without a type colour, plain code.' },
    { key: 'cursor', label: 'Cursor', role: 'The block cursor after the prompt.' },
];

export const NORMAL_COLOR_SLOTS: ColorSlot[] = [
    { key: 'color_01', label: 'Black', role: 'Status bars and dark highlights in TUIs such as tmux or htop.' },
    { key: 'color_02', label: 'Red', role: 'Archives in ls, unstaged and untracked files in git status, constants in code.' },
    { key: 'color_03', label: 'Green', role: 'The user@host prompt, executables, staged files, strings in code.' },
    { key: 'color_04', label: 'Yellow', role: 'Numbers, types and decorators in code; warnings in many tools.' },
    { key: 'color_05', label: 'Blue', role: 'Directories and the working path in the prompt, function names in code.' },
    { key: 'color_06', label: 'Magenta', role: 'Keywords in code (import, const, def, return...).' },
    { key: 'color_07', label: 'Cyan', role: 'Symbolic links in ls, object properties in code.' },
    { key: 'color_08', label: 'White', role: 'Light text and selections in TUIs; secondary text on light themes.' },
];

export const BRIGHT_COLOR_SLOTS: ColorSlot[] = [
    { key: 'color_09', label: 'Bright Black', role: 'Comments and line numbers in code, shell autosuggestions.' },
    { key: 'color_10', label: 'Bright Red', role: 'Bold or emphasised red text, e.g. error headings.' },
    { key: 'color_11', label: 'Bright Green', role: 'Bold or emphasised green text.' },
    { key: 'color_12', label: 'Bright Yellow', role: 'Bold or emphasised yellow text, search matches in some tools.' },
    { key: 'color_13', label: 'Bright Blue', role: 'Bold or emphasised blue text.' },
    { key: 'color_14', label: 'Bright Magenta', role: 'Bold or emphasised magenta text.' },
    { key: 'color_15', label: 'Bright Cyan', role: 'Bold or emphasised cyan text.' },
    { key: 'color_16', label: 'Bright White', role: 'Bold white text, the brightest tone in the palette.' },
];

// The coloured slots readers judge a theme by: black/white (01, 08, 09, 16)
// are left out because on a dark/light theme one of each is meant to blend in.
const ACCENT_KEYS = ['color_02', 'color_03', 'color_04', 'color_05', 'color_06', 'color_07',
    'color_10', 'color_11', 'color_12', 'color_13', 'color_14', 'color_15'];

const ALL_SLOTS = [...BASE_COLOR_SLOTS, ...NORMAL_COLOR_SLOTS, ...BRIGHT_COLOR_SLOTS];

export function slotLabel(key: string): string {
    return ALL_SLOTS.find((slot) => slot.key === key)?.label ?? key;
}

export function safeHex(value: unknown): string | null {
    return typeof value === 'string' && chroma.valid(value) ? chroma(value).hex() : null;
}

export function contrastRatio(a: unknown, b: unknown): number | null {
    const hexA = safeHex(a);
    const hexB = safeHex(b);
    return hexA && hexB ? chroma.contrast(hexA, hexB) : null;
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

// Plain-words description of a colour ("near-black, blue-tinted").
export function describeColor(value: unknown): string {
    const hex = safeHex(value);
    if (!hex) return '';

    const [lightness, chromaValue, hue] = chroma(hex).lch();
    let tone = 'mid-tone';
    if (lightness < 12) tone = 'near-black';
    else if (lightness < 35) tone = 'dark';
    else if (lightness > 92) tone = 'near-white';
    else if (lightness > 70) tone = 'light';

    if (Number.isNaN(hue) || chromaValue < 6) {
        return tone === 'mid-tone' ? 'neutral grey' : `${tone} neutral`;
    }

    const hueName = HUE_NAMES.find(([limit]) => hue < limit)?.[1] ?? 'red';
    const strength = chromaValue < 22 ? `${hueName}-tinted` : hueName;
    return `${tone} ${strength}`;
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
export function summarizeThemeColors(theme: Record<string, any>): ColorSummary {
    const name = (theme?.name || 'This theme').toString();
    const variant = themeVariant(theme);
    const background = theme?.background;

    const foregroundContrast = contrastRatio(theme?.foreground, background);
    const foregroundLevel = contrastLevel(foregroundContrast);

    const accents = ACCENT_KEYS
        .map((key) => ({ key, label: slotLabel(key), ratio: contrastRatio(theme?.[key], background) }))
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

    const backgroundDescription = describeColor(background);
    const foregroundDescription = describeColor(theme?.foreground);
    const author = (theme?.author_name || '').toString().trim();

    const sentences: string[] = [];
    sentences.push(
        `${name} is a ${variant} terminal color scheme${author ? ` by ${author}` : ''}, `
        + `built on a ${backgroundDescription || variant} background (${safeHex(background) ?? 'n/a'}).`,
    );

    if (foregroundContrast !== null) {
        const verdict = {
            AAA: 'comfortably above the WCAG AAA target of 7:1',
            AA: 'above the WCAG AA target of 4.5:1',
            'AA Large': 'enough for large or bold text, but under the 4.5:1 WCAG AA target for body text',
            Low: 'under the 3:1 minimum, so long reading sessions may be tiring',
        }[foregroundLevel as 'AAA' | 'AA' | 'AA Large' | 'Low'];
        sentences.push(
            `Default text is ${foregroundDescription || 'the foreground colour'} (${safeHex(theme?.foreground)}), `
            + `with a contrast ratio of ${formatRatio(foregroundContrast)} against the background: ${verdict}.`,
        );
    }

    if (accents.length && strongest && weakest) {
        sentences.push(
            `${readableAccents} of its ${accents.length} accent colors reach 4.5:1 on the background. `
            + `${strongest.label} stands out the most (${formatRatio(strongest.ratio)})`
            + (weakest.key !== strongest.key ? ` and ${weakest.label} is the subtlest (${formatRatio(weakest.ratio)}).` : '.'),
        );
    }

    if (pairs.length) {
        sentences.push({
            same: 'The bright row repeats the normal colors, so bold text keeps the same hue and tone.',
            brighter: 'The bright row is a lighter version of the normal colors, so bold and highlighted text pops out.',
            darker: 'The bright row is darker than the normal colors, a common choice on light backgrounds.',
            similar: 'The bright row keeps roughly the same lightness as the normal colors, shifting hue or saturation instead.',
        }[brightShift]);
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
