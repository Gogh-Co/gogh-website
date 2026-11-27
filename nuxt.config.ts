// https://nuxt.com/docs/api/configuration/nuxt-config
import { themeSlug } from './app/utils/themeSlug'
import { LOCALE_PENDING_STYLE, localeBootScript } from './app/i18n/config'

const devPort = Number(
  import.meta.env.NUXT_PORT ||
  import.meta.env.PORT ||
  3000
)

const enableDevtools = import.meta.env.NUXT_DEVTOOLS === 'true'

const THEMES_RAW_URL = 'https://raw.githubusercontent.com/Gogh-Co/Gogh/master/data/themes-min.json'

// One prerendered page per theme (gogh.website/<slug>/). The gallery only
// server-renders its first 60 cards, so the crawler alone would miss most
// of them. If GitHub is unreachable the build still succeeds, and the
// crawler picks up whatever theme pages the gallery and prev/next links reach.
async function themePageRoutes(): Promise<string[]> {
  try {
    const response = await fetch(THEMES_RAW_URL, { signal: AbortSignal.timeout(20000) })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const body = await response.json()
    const themes: Array<Record<string, unknown>> = Array.isArray(body) ? body : (body?.data ?? [])

    return [...new Set(
      themes
        .map((theme) => String(theme?.name || theme?.theme || ''))
        .filter(Boolean)
        .map((name) => `/${themeSlug(name)}/`),
    )]
  } catch (error) {
    console.warn(`[gogh] Could not list themes for prerendering: ${(error as Error).message}`)
    return []
  }
}

export default defineNuxtConfig({
  srcDir: 'app/',

  devServer: {
    host: 'localhost',
    port: devPort,
  },

  app: {
    baseURL: '/',

    head: {
      charset: 'utf-8',

      viewport: 'width=device-width, initial-scale=1',

      // Fallback for pages that don't set their own (e.g. the generated
      // 404.html); real pages override these via useSeoMeta.
      title: 'Gogh - Terminal Color Schemes',

      meta: [
        {
          name: 'description',
          content: 'Terminal color schemes for Linux, macOS and Windows: GNOME Terminal, Konsole, Alacritty, Kitty, Ghostty, WezTerm, iTerm2, Tilix, Mintty and more.',
        },
        {
          name: 'author',
          content: 'Miguel D. Quintero',
        },
      ],

      link: [
        {
          rel: 'icon',
          href: '/favicons/favicon.ico',
          sizes: 'any',
        },
      ],

      style: [
        // Hides a non-English page until its translation is applied (see
        // app/i18n/config.ts); shown anyway after a moment.
        { innerHTML: LOCALE_PENDING_STYLE },
      ],

      script: [
        // Must run before the first paint: picks the visitor's language
        // (?lang=, cookie, browser) and sets <html lang/dir>.
        { innerHTML: localeBootScript() },

        {
          src: 'https://analytics.arcano.site/js/pa-Fw7nMNFtqNmPh7jU-bDaj.js',
          async: true,
        },

        {
          innerHTML: `
            window.plausible = window.plausible || function () {
              (plausible.q = plausible.q || []).push(arguments)
            }

            plausible.init = plausible.init || function (i) {
              plausible.o = i || {}
            }

            plausible.init()
          `,
        },
      ],
    },
  },

  vite: {
    build: {
      modulePreload: {
        polyfill: false,
      },
    },

    optimizeDeps: {
      include: [
        'chroma-js',
      ],
    },

    server: {
      ws: {
        host: 'localhost',
        clientPort: devPort,
        protocol: 'ws',
      },
    },

    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
  },

  hooks: {
    async 'nitro:config'(nitroConfig) {
      if (nitroConfig.dev) {
        return
      }

      nitroConfig.prerender ??= {}
      nitroConfig.prerender.routes = [
        ...(nitroConfig.prerender.routes ?? []),
        '/sitemap.xml',
        ...(await themePageRoutes()),
      ]
    },
  },

  modules: [
    'nuxt-color-picker',
  ],

  devtools: {
    enabled: enableDevtools,
  },

  compatibilityDate: '2024-04-03',
})
