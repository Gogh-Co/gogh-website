// URL slug for a theme's own page (gogh.website/<slug>/). Theme pages share
// the site root with static pages, public files and the Worker's routes, so
// a name that would land on one of those gets a "-theme" suffix instead
// ("Gogh" -> /gogh-theme/, since /gogh is the install script).
export const RESERVED_THEME_SLUGS = new Set([
    'admin',
    'api',
    'auth',
    'favicons',
    'generator',
    'gogh',
    'stats',
    'terminals',
    'wallpapers',
    'wcsg',
]);

export function themeSlug(name: unknown): string {
    const slug = String(name ?? '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        // "Dark+" and "Dark" must not collide.
        .replace(/\+/g, ' plus ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (!slug) {
        return 'theme';
    }

    return RESERVED_THEME_SLUGS.has(slug) ? `${slug}-theme` : slug;
}

export function themePagePath(name: unknown): string {
    return `/${themeSlug(name)}/`;
}
