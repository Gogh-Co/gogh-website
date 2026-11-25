// https://nuxt.com/docs/api/configuration/nuxt-config

const devPort = Number(
  import.meta.env.NUXT_PORT ||
  import.meta.env.PORT ||
  3000
)

const enableDevtools = import.meta.env.NUXT_DEVTOOLS === 'true'

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
          content: '1,200+ free color schemes for terminal emulators like GNOME Terminal, iTerm2, Tilix, Konsole and Alacritty. Preview any theme and install it with one command.',
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

      script: [
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
        'clipboard',
        'prismjs',
        'prismjs/components/prism-bash',
      ],
    },

    server: {
      hmr: {
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

  modules: [
    'nuxt-color-picker',
  ],

  plugins: [
    '~/assets/static/prism.client',
  ],

  devtools: {
    enabled: enableDevtools,
  },

  compatibilityDate: '2024-04-03',
})
