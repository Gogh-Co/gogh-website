// Lenis only follows a native scroll (like the router's scroll to the top on
// a new page) when it isn't animating. If the visitor clicks a link while a
// wheel glide is still running, e.g. the next-theme link at the bottom of a
// theme page, Lenis keeps steering toward its old target and the new page
// opens scrolled to the bottom. Cancelling the glide hands the scroll back
// to the router.
export default defineNuxtPlugin((nuxtApp) => {
    const router = useRouter();

    const cancelGlide = () => getLenis()?.reset();

    // Stop the glide as soon as the page changes, so the old page doesn't keep
    // moving while the new one loads...
    router.beforeEach((to, from) => {
        if (to.path !== from.path) {
            cancelGlide();
        }
    });

    // ...and again right before the router scrolls (it waits for this hook),
    // in case a wheel event started a new glide in between.
    nuxtApp.hook('page:loading:end', cancelGlide);
});
