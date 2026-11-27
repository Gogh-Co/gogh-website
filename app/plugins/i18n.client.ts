import { LOCALE_COOKIE, LOCALE_QUERY, matchLocale, readCookie, resolveLocale } from '~/i18n/config';

// Applies the visitor's language once the prerendered (English) page has
// hydrated: switching earlier would make the hydrated markup disagree with
// the HTML. The inline boot script in <head> already set <html lang/dir>
// and hides the page until this runs, so nothing flashes.
export default defineNuxtPlugin((nuxtApp) => {
    const { setLocale } = useI18n();
    const router = useRouter();
    let applied = false;

    function initialLocale(): string {
        const fromBoot = (window as Window & { __GOGH_LOCALE__?: string }).__GOGH_LOCALE__;
        if (fromBoot && matchLocale(fromBoot)) {
            return fromBoot;
        }
        return resolveLocale({
            query: router.currentRoute.value.query[LOCALE_QUERY],
            cookie: readCookie(document.cookie, LOCALE_COOKIE),
            languages: navigator.languages?.length ? navigator.languages : [navigator.language],
        });
    }

    async function applyInitialLocale() {
        if (applied) {
            return;
        }
        applied = true;
        try {
            await setLocale(initialLocale());
        } finally {
            markI18nReady();
        }
    }

    nuxtApp.hook('app:suspense:resolve', applyInitialLocale);
    // Error pages may never resolve the page suspense.
    onNuxtReady(applyInitialLocale);

    // A link that carries ?lang= inside the site switches the page too (but,
    // like on first load, doesn't overwrite the saved choice).
    router.afterEach((to) => {
        if (!applied) {
            return;
        }
        const match = matchLocale(to.query[LOCALE_QUERY]);
        if (match) {
            setLocale(match);
        }
    });
});
