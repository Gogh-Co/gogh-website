// Theme list loading shared by the gallery and the per-theme pages.
// /api/themes is a Nitro route that only exists at build time (the site is
// generated and served from GitHub Pages), so at runtime the browser falls
// back to the GitHub API directly.
const THEMES_API_PATH = '/api/themes';
const GITHUB_THEMES_RAW_API = 'https://api.github.com/repos/Gogh-Co/Gogh/contents/data/themes-min.json?ref=master';

export function normalizeThemes(remoteThemes: unknown): Record<string, any>[] {
    if (Array.isArray(remoteThemes)) {
        return remoteThemes;
    }

    const data = (remoteThemes as { data?: unknown } | null)?.data;
    if (Array.isArray(data)) {
        return data;
    }

    return [];
}

// Throws when neither source answers.
export async function fetchThemeList(): Promise<Record<string, any>[]> {
    try {
        return normalizeThemes(await $fetch(THEMES_API_PATH, { timeout: 12000 }));
    } catch {
        return normalizeThemes(await $fetch(GITHUB_THEMES_RAW_API, {
            timeout: 12000,
            headers: {
                Accept: 'application/vnd.github.raw+json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }));
    }
}

export function getThemeDisplayName(theme: Record<string, any> | null | undefined): string {
    return (theme?.name || theme?.theme || '').toString();
}
