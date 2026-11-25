export const SITE_URL = 'https://gogh.website';
export const SITE_NAME = 'Gogh';
// Bump ?v= whenever og-image.png changes: social networks cache the image by URL.
export const SITE_IMAGE = `${SITE_URL}/og-image.png?v=2`;
export const SITE_IMAGE_WIDTH = 1200;
export const SITE_IMAGE_HEIGHT = 630;
export const SITE_IMAGE_ALT = 'Gogh logo and 16-color palette over syntax-highlighted code';
export const SITE_DESCRIPTION = 'Terminal color schemes for Linux, macOS and Windows: GNOME Terminal, Konsole, Alacritty, Kitty, Ghostty, WezTerm, iTerm2, Tilix, Mintty and more.';
export const SITE_AUTHOR = {
    name: 'Miguel D. Quintero',
    url: 'https://github.com/Mgldvd',
    twitter: '@Mgldvd_tech',
};
export const SITE_REPOSITORY = 'https://github.com/Gogh-Co/Gogh';

export function canonicalUrl(path: string): string {
    return `${SITE_URL}${path}`;
}
