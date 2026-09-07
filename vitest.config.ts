import { defineVitestConfig } from '@nuxt/test-utils/config';

// Composables under test rely on Nuxt auto-imports (useState, $fetch,
// useRoute, ...), so tests run inside the @nuxt/test-utils "nuxt"
// environment rather than plain node/happy-dom - see docs/FRONTEND.md
// "Frontend build/test commands".
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/**/*.test.ts'],
  },
});
