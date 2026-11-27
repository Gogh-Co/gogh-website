// Theme list loading shared by the gallery, the stats and the per-theme pages.
// /api/themes is a Nitro route that only exists at build time (the site is
// generated and served as static files), so in the browser it is always a 404.
// The browser reads the raw file instead: raw.githubusercontent.com sends
// `Access-Control-Allow-Origin: *` and has no per-IP quota, unlike
// api.github.com, which answers 403 after 60 unauthenticated requests an hour.
import { themePagePath } from './themeSlug';

const THEMES_API_PATH = '/api/themes';
const GITHUB_THEMES_RAW_URL = 'https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes-min.json';
const GITHUB_THEMES_CONTENTS_API = 'https://api.github.com/repos/Gogh-Co/Gogh/contents/data/themes-min.json?ref=master';

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

function fetchRawThemes(): Promise<unknown> {
    // raw.githubusercontent.com serves the file as text/plain, so parse it here.
    return $fetch(GITHUB_THEMES_RAW_URL, { timeout: 12000, parseResponse: JSON.parse });
}

function fetchContentsApiThemes(): Promise<unknown> {
    return $fetch(GITHUB_THEMES_CONTENTS_API, {
        timeout: 12000,
        headers: {
            Accept: 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
}

// Throws when no source answers with a non-empty list.
export async function fetchThemeList(): Promise<Record<string, any>[]> {
    const sources = import.meta.server
        ? [() => $fetch(THEMES_API_PATH, { timeout: 12000 })]
        : [fetchRawThemes, fetchContentsApiThemes];

    let lastError: unknown = new Error('Theme list is empty');
    for (const source of sources) {
        try {
            const themes = normalizeThemes(await source());
            if (themes.length > 0) {
                return themes;
            }
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError;
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
