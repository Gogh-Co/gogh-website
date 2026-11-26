// The Gogh logo's color blocks: 8 columns x 2 rows (normal colors on top,
// bright ones below). Shared by the header logo and the hero wordmark.
export const GOGH_LOGO_COLORS = [
    '#243342', '#C54133', '#27AE60', '#EDB20A', '#2479D0', '#7D3EA0', '#1D8579', '#C9CCCD',
    '#34495E', '#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#2AA198', '#ECF0F1',
];

// The Gogh palette as a theme object, for components that take their colors
// from a theme's ANSI slots (the share buttons in the footer and home page).
export const GOGH_SHARE_THEME: Record<string, string> = {
    background: '#0A0F14',
    foreground: '#ECF0F1',
    ...Object.fromEntries(GOGH_LOGO_COLORS.map((color, index) => [`color_${String(index + 1).padStart(2, '0')}`, color])),
};
