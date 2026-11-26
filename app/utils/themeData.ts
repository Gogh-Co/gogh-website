// Theme list loading shared by the gallery and the per-theme pages.
// /api/themes is a Nitro route that only exists at build time (the site is
// generated and served from GitHub Pages), so at runtime the browser falls
// back to the GitHub API directly.
import { themePagePath } from './themeSlug';

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

// Theme page paths for the header's Random button. The list is fetched once
// per session and shared; a failed fetch is dropped so the next click retries.
let themePathsPromise: Promise<string[]> | null = null;

export function loadThemePagePaths(): Promise<string[]> {
    if (!themePathsPromise) {
        themePathsPromise = fetchThemeList()
            .then((list) => [...new Set(list.map(getThemeDisplayName).filter(Boolean).map(themePagePath))])
            .catch((error) => {
                themePathsPromise = null;
                throw error;
            });
    }

    return themePathsPromise;
}

// A random theme page, never the one being viewed (`currentPath`).
export async function pickRandomThemePagePath(currentPath = ''): Promise<string | null> {
    const paths = await loadThemePagePaths();
    const current = `/${currentPath.replace(/^\/+|\/+$/g, '')}/`.toLowerCase();
    const candidates = paths.length > 1 ? paths.filter((path) => path !== current) : paths;

    if (!candidates.length) {
        return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
}
