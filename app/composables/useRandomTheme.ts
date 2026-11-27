// Opening a random theme page, shared by the header's dice button, the R key
// and the floating dice next to "back to top". One loading flag for all of
// them, so a second press while the theme list loads is ignored everywhere.
export function useRandomTheme() {
    const route = useRoute();
    const randomLoading = useState<boolean>('gogh-random-loading', () => false);

    // Warm the theme list on hover/focus so the click itself feels instant.
    function prefetchThemePaths() {
        loadThemePagePaths().catch(() => {});
    }

    // `beforeNavigate` runs once a theme has been picked (the header closes
    // its mobile menu there).
    async function openRandomTheme(via = 'button', beforeNavigate?: () => void) {
        if (randomLoading.value) {
            return;
        }
        randomLoading.value = true;
        try {
            const path = await pickRandomThemePagePath(route.path);
            if (path) {
                trackEvent('Random Theme', { via });
                beforeNavigate?.();
                await navigateTo(path);
            }
        } catch {
            // Theme list unavailable (offline / API rate limit): stay put.
        } finally {
            randomLoading.value = false;
        }
    }

    return { randomLoading, prefetchThemePaths, openRandomTheme };
}
