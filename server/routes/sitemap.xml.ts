import { getThemeDisplayName } from '../../app/utils/themeData';
import { themePagePath } from '../../app/utils/themeSlug';

// Prerendered at generate time (see nuxt.config.ts): the hand-maintained
// static pages plus one entry per theme page, so search engines find all
// ~1,200 theme pages even though the gallery only renders 60 at a time.
const SITE_URL = 'https://gogh.website';

const STATIC_PAGES = [
    { path: '/', lastmod: '2026-11-25', changefreq: 'weekly', priority: '1.0' },
    { path: '/generator/', lastmod: '2026-09-04', changefreq: 'monthly', priority: '0.8' },
    { path: '/stats/', lastmod: '2026-09-04', changefreq: 'monthly', priority: '0.6' },
    { path: '/wcsg/', lastmod: '2026-09-04', changefreq: 'monthly', priority: '0.6' },
    { path: '/wallpapers/', lastmod: '2026-09-04', changefreq: 'monthly', priority: '0.5' },
    { path: '/terminals/', lastmod: '2026-09-04', changefreq: 'monthly', priority: '0.5' },
];

function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(path: string, extra: { lastmod?: string; changefreq: string; priority: string }): string {
    return [
        '  <url>',
        `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
        extra.lastmod ? `    <lastmod>${extra.lastmod}</lastmod>` : '',
        `    <changefreq>${extra.changefreq}</changefreq>`,
        `    <priority>${extra.priority}</priority>`,
        '  </url>',
    ].filter(Boolean).join('\n');
}

export default defineEventHandler(async (event) => {
    let themes: Array<Record<string, unknown>> = [];
    try {
        themes = await $fetch<Array<Record<string, unknown>>>('/api/themes');
    } catch {
        // Still publish the static pages if GitHub is unreachable at build time.
    }

    const themePaths = [...new Set(
        themes
            .map(getThemeDisplayName)
            .filter(Boolean)
            .map(themePagePath),
    )].sort();

    const entries = [
        ...STATIC_PAGES.map((page) => urlEntry(page.path, page)),
        ...themePaths.map((path) => urlEntry(path, { changefreq: 'monthly', priority: '0.4' })),
    ];

    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...entries,
        '</urlset>',
        '',
    ].join('\n');
});
