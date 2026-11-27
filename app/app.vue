<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
    <Footer />
    <ClientOnly>
        <GoToTop />
    </ClientOnly>
</template>

<script setup>
import Footer from '@/components/Footer/Footer.vue';
import GoToTop from '@/components/Buttons/GoToTop.vue';

const { app } = useRuntimeConfig();
const { localeInfo } = useI18n();

function withBase(path) {
    const base = (app?.baseURL || '/').replace(/\/?$/, '/');
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return `${base}${cleanPath}`;
}

useHead({
    // English in the prerendered HTML; the visitor's language once applied.
    htmlAttrs: {
        lang: () => localeInfo.value.htmlLang,
        dir: () => localeInfo.value.dir,
    },
    link: [
        { rel: 'apple-touch-icon', sizes: '57x57', href: withBase('favicons/apple-icon-57x57.png') },
        { rel: 'apple-touch-icon', sizes: '60x60', href: withBase('favicons/apple-icon-60x60.png') },
        { rel: 'apple-touch-icon', sizes: '72x72', href: withBase('favicons/apple-icon-72x72.png') },
        { rel: 'apple-touch-icon', sizes: '76x76', href: withBase('favicons/apple-icon-76x76.png') },
        { rel: 'apple-touch-icon', sizes: '114x114', href: withBase('favicons/apple-icon-114x114.png') },
        { rel: 'apple-touch-icon', sizes: '120x120', href: withBase('favicons/apple-icon-120x120.png') },
        { rel: 'apple-touch-icon', sizes: '144x144', href: withBase('favicons/apple-icon-144x144.png') },
        { rel: 'apple-touch-icon', sizes: '152x152', href: withBase('favicons/apple-icon-152x152.png') },
        { rel: 'apple-touch-icon', sizes: '180x180', href: withBase('favicons/apple-icon-180x180.png') },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: withBase('favicons/android-icon-192x192.png') },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: withBase('favicons/favicon-32x32.png') },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: withBase('favicons/favicon-96x96.png') },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: withBase('favicons/favicon-16x16.png') },
        { rel: 'manifest', href: withBase('favicons/manifest.json') },
        { rel: 'author', href: SITE_AUTHOR.url },
    ],
    meta: [
        { name: 'msapplication-TileColor', content: '#121f2a' },
        { name: 'msapplication-TileImage', content: withBase('favicons/ms-icon-144x144.png') },
        // Matches the header so mobile browser chrome blends into it.
        { name: 'theme-color', content: '#121f2a', key: 'theme-color' },
    ],
    script: [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'WebSite',
                        '@id': `${SITE_URL}/#website`,
                        name: SITE_NAME,
                        url: `${SITE_URL}/`,
                        description: SITE_DESCRIPTION,
                        inLanguage: 'en',
                        publisher: { '@id': `${SITE_URL}/#author` },
                    },
                    {
                        '@type': 'SoftwareApplication',
                        '@id': `${SITE_URL}/#software`,
                        name: SITE_NAME,
                        url: `${SITE_URL}/`,
                        description: SITE_DESCRIPTION,
                        image: SITE_IMAGE,
                        applicationCategory: 'DeveloperApplication',
                        operatingSystem: 'Linux, macOS, Windows',
                        isAccessibleForFree: true,
                        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                        license: 'https://opensource.org/licenses/MIT',
                        sameAs: [SITE_REPOSITORY],
                        author: { '@id': `${SITE_URL}/#author` },
                    },
                    {
                        '@type': 'Person',
                        '@id': `${SITE_URL}/#author`,
                        name: SITE_AUTHOR.name,
                        url: SITE_AUTHOR.url,
                        sameAs: [SITE_AUTHOR.url, `https://x.com/${SITE_AUTHOR.twitter.slice(1)}`],
                    },
                ],
            }),
        },
    ],
});

useSeoMeta({
    ogSiteName: SITE_NAME,
    ogType: 'website',
    ogLocale: () => localeInfo.value.ogLocale,
    ogImage: SITE_IMAGE,
    ogImageType: 'image/png',
    ogImageWidth: SITE_IMAGE_WIDTH,
    ogImageHeight: SITE_IMAGE_HEIGHT,
    ogImageAlt: SITE_IMAGE_ALT,
    twitterCard: 'summary_large_image',
    twitterImage: SITE_IMAGE,
    twitterImageAlt: SITE_IMAGE_ALT,
    twitterSite: SITE_AUTHOR.twitter,
    twitterCreator: SITE_AUTHOR.twitter,
});
</script>

<style lang="scss">
@use '@/app.scss';
</style>
