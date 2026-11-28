// Data behind the /history page: chapter order, the references each chapter
// links to, and the palettes its figures draw. None of it is translated:
// document titles stay in their original language, and the copy that is
// translated lives in app/i18n/history/*.ts, keyed by the same chapter ids.

export type HistoryChapterId =
    | 'paper' | 'glass' | 'escape' | 'eight' | 'sixteen' | 'cube'
    | 'truecolor' | 'themes' | 'science' | 'etiquette' | 'today';

export type SourceKind = 'standard' | 'spec' | 'docs' | 'article' | 'reference' | 'project';

export interface HistorySource {
    kind: SourceKind;
    title: string;
    publisher: string;
    url: string;
}

export interface HistoryChapter {
    id: HistoryChapterId;
    // Illustration in public/history/ (generated for this page).
    image: string;
    // Main accent of the chapter (eyebrow, progress, links).
    accent: string;
    sources: HistorySource[];
}

const WIKIPEDIA = 'Wikipedia';
const XTERM_CTLSEQS: HistorySource = {
    kind: 'spec',
    title: 'XTerm Control Sequences',
    publisher: 'invisible-island.net · Thomas E. Dickey',
    url: 'https://invisible-island.net/xterm/ctlseqs/ctlseqs.html',
};

export const HISTORY_CHAPTERS: HistoryChapter[] = [
    {
        id: 'paper',
        image: 'teletype',
        accent: '#f4efe6',
        sources: [
            { kind: 'standard', title: 'RFC 20: ASCII format for Network Interchange', publisher: 'IETF · 1969', url: 'https://www.rfc-editor.org/rfc/rfc20' },
            { kind: 'reference', title: 'C0 and C1 control codes', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/C0_and_C1_control_codes' },
            { kind: 'reference', title: 'Teletype Model 33', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/Teletype_Model_33' },
        ],
    },
    {
        id: 'glass',
        image: 'phosphor',
        accent: '#33ff66',
        sources: [
            { kind: 'docs', title: 'VT100 User Guide', publisher: 'vt100.net · DEC, 1978', url: 'https://vt100.net/docs/vt100-ug/' },
            { kind: 'reference', title: 'Phosphor: standard phosphor types', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/Phosphor#Standard_phosphor_types' },
            { kind: 'reference', title: 'Computer terminal', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/Computer_terminal' },
        ],
    },
    {
        id: 'escape',
        image: 'escape',
        accent: '#f1c40f',
        sources: [
            { kind: 'standard', title: 'ECMA-48: Control Functions for Coded Character Sets', publisher: 'Ecma International · 5th edition, 1991', url: 'https://ecma-international.org/publications-and-standards/standards/ecma-48/' },
            XTERM_CTLSEQS,
            { kind: 'docs', title: 'Console Virtual Terminal Sequences', publisher: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences' },
            { kind: 'reference', title: 'ANSI escape code', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/ANSI_escape_code' },
        ],
    },
    {
        id: 'eight',
        image: 'ansi',
        accent: '#e74c3c',
        sources: [
            { kind: 'reference', title: 'ANSI escape code: 3-bit and 4-bit colors', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/ANSI_escape_code#3-bit_and_4-bit' },
            { kind: 'reference', title: 'Color Graphics Adapter', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/Color_Graphics_Adapter' },
            { kind: 'article', title: 'Updating the Windows Console Colors', publisher: 'Microsoft Command Line blog · 2017', url: 'https://devblogs.microsoft.com/commandline/updating-the-windows-console-colors/' },
        ],
    },
    {
        id: 'sixteen',
        image: 'palette',
        accent: '#2ecc71',
        sources: [
            XTERM_CTLSEQS,
            { kind: 'reference', title: 'VGA text mode', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/VGA_text_mode' },
            { kind: 'project', title: 'Gogh: theme format and installers', publisher: 'GitHub · Gogh-Co', url: 'https://github.com/Gogh-Co/Gogh' },
        ],
    },
    {
        id: 'cube',
        image: 'cube256',
        accent: '#3498db',
        sources: [
            { kind: 'reference', title: 'ANSI escape code: 8-bit colors', publisher: WIKIPEDIA, url: 'https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit' },
            { kind: 'docs', title: 'XTerm FAQ', publisher: 'invisible-island.net', url: 'https://invisible-island.net/xterm/xterm.faq.html' },
            XTERM_CTLSEQS,
        ],
    },
    {
        id: 'truecolor',
        image: 'truecolor',
        accent: '#9b59b6',
        sources: [
            { kind: 'standard', title: 'ITU-T T.416: Open Document Architecture, character content', publisher: 'ITU · 1993', url: 'https://www.itu.int/rec/T-REC-T.416-199303-I/en' },
            { kind: 'project', title: 'termstandard/colors: Truecolor support in terminals', publisher: 'GitHub', url: 'https://github.com/termstandard/colors' },
            { kind: 'article', title: '24-bit Color in the Windows Console', publisher: 'Microsoft Command Line blog · 2016', url: 'https://devblogs.microsoft.com/commandline/24-bit-color-in-the-windows-console/' },
            { kind: 'docs', title: 'terminfo(5)', publisher: 'man7.org', url: 'https://man7.org/linux/man-pages/man5/terminfo.5.html' },
            { kind: 'article', title: 'macOS Tahoe', publisher: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/MacOS_Tahoe' },
        ],
    },
    {
        id: 'themes',
        image: 'modern-matte',
        accent: '#2aa198',
        sources: [
            XTERM_CTLSEQS,
            { kind: 'project', title: 'Solarized', publisher: 'Ethan Schoonover · 2011', url: 'https://ethanschoonover.com/solarized/' },
            { kind: 'project', title: 'Tinted Theming (base16)', publisher: 'GitHub', url: 'https://github.com/tinted-theming/home' },
            { kind: 'project', title: 'Gogh', publisher: 'GitHub · since 2013', url: 'https://github.com/Gogh-Co/Gogh' },
        ],
    },
    {
        id: 'science',
        image: 'subpixel',
        accent: '#f1c40f',
        sources: [
            { kind: 'standard', title: 'A Standard Default Color Space for the Internet: sRGB', publisher: 'W3C · 1996', url: 'https://www.w3.org/Graphics/Color/sRGB' },
            { kind: 'standard', title: 'WCAG 2.1: contrast ratio', publisher: 'W3C', url: 'https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio' },
            { kind: 'spec', title: 'CSS Color Module Level 4: OKLab and OKLCH', publisher: 'W3C', url: 'https://www.w3.org/TR/css-color-4/#ok-lab' },
            { kind: 'project', title: 'APCA: Accessible Perceptual Contrast Algorithm', publisher: 'GitHub · Myndex', url: 'https://github.com/Myndex/SAPC-APCA' },
        ],
    },
    {
        id: 'etiquette',
        image: 'nocolor',
        accent: '#e74c3c',
        sources: [
            { kind: 'project', title: 'NO_COLOR', publisher: 'no-color.org · 2017', url: 'https://no-color.org/' },
            { kind: 'project', title: 'FORCE_COLOR', publisher: 'force-color.org', url: 'https://force-color.org/' },
            { kind: 'docs', title: 'tput(1)', publisher: 'man7.org', url: 'https://man7.org/linux/man-pages/man1/tput.1.html' },
            { kind: 'docs', title: 'terminfo(5)', publisher: 'man7.org', url: 'https://man7.org/linux/man-pages/man5/terminfo.5.html' },
        ],
    },
    {
        id: 'today',
        image: 'gpu',
        accent: '#3498db',
        sources: [
            { kind: 'project', title: 'Alacritty', publisher: 'GitHub', url: 'https://github.com/alacritty/alacritty' },
            { kind: 'project', title: 'Ghostty', publisher: 'ghostty.org', url: 'https://ghostty.org/' },
            { kind: 'docs', title: 'Kitty: underline colors and styles', publisher: 'sw.kovidgoyal.net', url: 'https://sw.kovidgoyal.net/kitty/underlines/' },
            { kind: 'project', title: 'Windows Terminal', publisher: 'GitHub · Microsoft', url: 'https://github.com/microsoft/terminal' },
        ],
    },
];

/* ---------------------------------------------------------------------------
 * Fig. 1: ASCII control characters 0–31.
 * ------------------------------------------------------------------------- */
export const ASCII_CONTROLS = [
    'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
    'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
    'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
    'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
];

/* ---------------------------------------------------------------------------
 * Fig. 4: how real systems drew SGR 30–37 / 90–97 by default.
 * ------------------------------------------------------------------------- */
export interface SystemPalette {
    name: string;
    year: string;
    // 16 colors: 8 normal, then 8 bright.
    colors: string[];
}

export const SYSTEM_PALETTES: SystemPalette[] = [
    {
        name: 'VGA (IBM PC)',
        year: '1987',
        colors: ['#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
            '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff'],
    },
    {
        name: 'Windows console',
        year: '1993',
        colors: ['#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
            '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff'],
    },
    {
        name: 'xterm',
        year: '1984',
        colors: ['#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
            '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff'],
    },
    {
        name: 'PuTTY',
        year: '1999',
        colors: ['#000000', '#bb0000', '#00bb00', '#bbbb00', '#0000bb', '#bb00bb', '#00bbbb', '#bbbbbb',
            '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff'],
    },
    {
        name: 'Terminal.app',
        year: '2001',
        colors: ['#000000', '#c23621', '#25bc24', '#adad27', '#492ee1', '#d338d3', '#33bbc8', '#cbcccd',
            '#818383', '#fc391f', '#31e722', '#eaec23', '#5833ff', '#f935f8', '#14f0f0', '#e9ebeb'],
    },
    {
        name: 'Tango (GNOME Terminal)',
        year: '2000s',
        colors: ['#2e3436', '#cc0000', '#4e9a06', '#c4a000', '#3465a4', '#75507b', '#06989a', '#d3d7cf',
            '#555753', '#ef2929', '#8ae234', '#fce94f', '#729fcf', '#ad7fa8', '#34e2e2', '#eeeeec'],
    },
    {
        name: 'Campbell (Windows 10)',
        year: '2017',
        colors: ['#0c0c0c', '#c50f1f', '#13a10e', '#c19c00', '#0037da', '#881798', '#3a96dd', '#cccccc',
            '#767676', '#e74856', '#16c60c', '#f9f1a5', '#3b78ff', '#b4009e', '#61d6d6', '#f2f2f2'],
    },
];

/* ---------------------------------------------------------------------------
 * The xterm palette and the 256-color table (Fig. 5, 6, 7).
 * ------------------------------------------------------------------------- */
export const XTERM_16 = SYSTEM_PALETTES[2]!.colors;

export const CUBE_LEVELS = [0, 95, 135, 175, 215, 255];

function hex2(value: number): string {
    return value.toString(16).padStart(2, '0');
}

export function rgbHex(r: number, g: number, b: number): string {
    return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export interface Xterm256Entry {
    index: number;
    hex: string;
    block: 'system' | 'cube' | 'gray';
    // Cube coordinates (0-5), or the gray step (0-23).
    r?: number;
    g?: number;
    b?: number;
    step?: number;
}

export function xterm256(): Xterm256Entry[] {
    const entries: Xterm256Entry[] = XTERM_16.map((hex, index) => ({ index, hex, block: 'system' }));
    for (let r = 0; r < 6; r += 1) {
        for (let g = 0; g < 6; g += 1) {
            for (let b = 0; b < 6; b += 1) {
                entries.push({
                    index: 16 + 36 * r + 6 * g + b,
                    hex: rgbHex(CUBE_LEVELS[r]!, CUBE_LEVELS[g]!, CUBE_LEVELS[b]!),
                    block: 'cube',
                    r,
                    g,
                    b,
                });
            }
        }
    }
    for (let step = 0; step < 24; step += 1) {
        const value = 8 + step * 10;
        entries.push({ index: 232 + step, hex: rgbHex(value, value, value), block: 'gray', step });
    }
    return entries;
}

/* ---------------------------------------------------------------------------
 * Fig. 8 and 9: a few Gogh themes, copied from data/themes-min.json so the
 * page renders (and prerenders) without fetching the whole collection.
 * ------------------------------------------------------------------------- */
export interface HistoryTheme {
    name: string;
    variant: 'dark' | 'light';
    background: string;
    foreground: string;
    cursor: string;
    colors: string[];
}

export const HISTORY_THEMES: HistoryTheme[] = [
    { name: 'Gogh', variant: 'dark', background: '#0D1926', foreground: '#ECF0F1', cursor: '#ECF0F1', colors: ['#243342', '#C54133', '#27AE60', '#EDB20A', '#2479D0', '#7D3EA0', '#1D8579', '#C9CCCD', '#34495E', '#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#2AA198', '#ECF0F1'] },
    { name: 'Dracula', variant: 'dark', background: '#282A36', foreground: '#F8F8F2', cursor: '#F8F8F2', colors: ['#21222C', '#FF5555', '#50FA7B', '#F1FA8C', '#BD93F9', '#FF79C6', '#8BE9FD', '#F8F8F2', '#6272A4', '#FF6E6E', '#69FF94', '#FFFFA5', '#D6ACFF', '#FF92DF', '#A4FFFF', '#FFFFFF'] },
    { name: 'Solarized Dark', variant: 'dark', background: '#001E27', foreground: '#708284', cursor: '#708284', colors: ['#002831', '#D11C24', '#738A05', '#A57706', '#2176C7', '#C61C6F', '#259286', '#EAE3CB', '#001E27', '#BD3613', '#475B62', '#536870', '#708284', '#5956BA', '#819090', '#FCF4DC'] },
    { name: 'Gruvbox Dark', variant: 'dark', background: '#282828', foreground: '#EBDBB2', cursor: '#EBDBB2', colors: ['#282828', '#CC241D', '#98971A', '#D79921', '#458588', '#B16286', '#689D6A', '#A89984', '#928374', '#FB4934', '#B8BB26', '#FABD2F', '#83A598', '#D3869B', '#8EC07C', '#EBDBB2'] },
    { name: 'Nord', variant: 'dark', background: '#2E3440', foreground: '#D8DEE9', cursor: '#ECEFF4', colors: ['#3B4252', '#BF616A', '#A3BE8C', '#EBCB8B', '#81A1C1', '#B48EAD', '#88C0D0', '#E5E9F0', '#4C566A', '#BF616A', '#A3BE8C', '#EBCB8B', '#81A1C1', '#B48EAD', '#8FBCBB', '#ECEFF4'] },
    { name: 'Catppuccin Mocha', variant: 'dark', background: '#1E1E2E', foreground: '#CDD6F4', cursor: '#F5E0DC', colors: ['#45475A', '#F38BA8', '#A6E3A1', '#F9E2AF', '#89B4FA', '#F5C2E7', '#94E2D5', '#A6ADC8', '#585B70', '#F37799', '#89D88B', '#EBD391', '#74A8FC', '#F2AEDE', '#6BD7CA', '#BAC2DE'] },
    { name: 'TokyoNight', variant: 'dark', background: '#1A1B26', foreground: '#C0CAF5', cursor: '#C0CAF5', colors: ['#15161E', '#F7768E', '#9ECE6A', '#E0AF68', '#7AA2F7', '#BB9AF7', '#7DCFFF', '#A9B1D6', '#414868', '#F7768E', '#9ECE6A', '#E0AF68', '#7AA2F7', '#BB9AF7', '#7DCFFF', '#C0CAF5'] },
    { name: 'Atom One Dark', variant: 'dark', background: '#21252B', foreground: '#ABB2BF', cursor: '#ABB2BF', colors: ['#21252B', '#E06C75', '#98C379', '#E5C07B', '#61AFEF', '#C678DD', '#56B6C2', '#ABB2BF', '#767676', '#E06C75', '#98C379', '#E5C07B', '#61AFEF', '#C678DD', '#56B6C2', '#ABB2BF'] },
    { name: 'Campbell', variant: 'dark', background: '#0C0C0C', foreground: '#CCCCCC', cursor: '#FFFFFF', colors: ['#0C0C0C', '#C50F1F', '#13A10E', '#C19C00', '#0037DA', '#881798', '#3A96DD', '#CCCCCC', '#767676', '#E74856', '#16C60C', '#F9F1A5', '#3B78FF', '#B4009E', '#61D6D6', '#F2F2F2'] },
    { name: 'Solarized Light', variant: 'light', background: '#FCF4DC', foreground: '#536870', cursor: '#536870', colors: ['#002831', '#D11C24', '#738A05', '#A57706', '#2176C7', '#C61C6F', '#259286', '#EAE3CB', '#001E27', '#BD3613', '#475B62', '#536870', '#708284', '#5956BA', '#819090', '#FCF4DC'] },
    { name: 'Catppuccin Latte', variant: 'light', background: '#EFF1F5', foreground: '#4C4F69', cursor: '#DC8A78', colors: ['#5C5F77', '#D20F39', '#40A02B', '#DF8E1D', '#1E66F5', '#EA76CB', '#179299', '#ACB0BE', '#6C6F85', '#DE293E', '#49AF3D', '#EEA02D', '#456EFF', '#FE85D8', '#2D9FA8', '#BCC0CC'] },
];

/* ---------------------------------------------------------------------------
 * Color math shared by the figures.
 * ------------------------------------------------------------------------- */
export function hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace('#', '');
    return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number];
}

// WCAG 2.x relative luminance of an sRGB color.
export function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map((channel) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrast(a: string, b: string): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [light, dark] = la > lb ? [la, lb] : [lb, la];
    return (light + 0.05) / (dark + 0.05);
}

// Nearest palette entry by squared distance in RGB (how a terminal without
// direct color approximates a 24-bit value).
export function nearestColor(rgb: [number, number, number], palette: [number, number, number][]): [number, number, number] {
    let best = palette[0]!;
    let bestDistance = Infinity;
    for (const candidate of palette) {
        const dr = candidate[0] - rgb[0];
        const dg = candidate[1] - rgb[1];
        const db = candidate[2] - rgb[2];
        const distance = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }
    return best;
}
