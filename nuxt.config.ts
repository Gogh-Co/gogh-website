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

      title: 'Gogh - Color Schemes',

      meta: [
        {
          'http-equiv': 'X-UA-Compatible',
          content: 'IE=edge',
        },
        {
          name: 'description',
          content: 'Color Schemes for Terminals',
        },
        {
          name: 'author',
          content: 'Miguel D. Quintero',
        },
      ],

      link: [
        {
          rel: 'author',
          href: 'humans.txt',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: 'favicons/favicon.png',
        },
        {
          rel: 'icon',
          href: 'favicons/favicon.ico',
        },
      ],

      script: [
        {
          src: 'https://plausible.arcano.site/js/pa-Fw7nMNFtqNmPh7jU-bDaj.js',
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
