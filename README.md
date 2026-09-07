# Gogh Website (Nuxt)

<div align="center">
<img src="https://raw.githubusercontent.com/Gogh-Co/Gogh/master/.images/gogh/Gogh-logo-dark.png" alt="Gogh" width="100%">
</div>

<div align="center">
:small_blue_diamond: <a href="http://Gogh-Co.github.io/Gogh"> Visit the Website </a> :small_blue_diamond:
</div>


Nuxt-based website for browsing and previewing Gogh terminal color schemes.

## Overview

- Framework: Nuxt 4 + Vue 3
- Styles: SCSS + Bootstrap
- Base URL: `/Gogh/`
- Theme source: GitHub API (server-side proxy at `/api/themes`)

The app fetches theme data from GitHub on the server to avoid browser CORS issues.

## Requirements

- Node.js 20+
- Bun

## Run in development

```bash
bun run dev
```

Default local URL:

- http://localhost:3000/Gogh/

## Build and preview

Build:

```bash
bun run build
```

Preview:

```bash
bun run preview
```

Generate static output:

```bash
bun run generate
```

## Available scripts

- `dev`: starts Nuxt in development mode
- `build`: creates production build
- `preview`: runs local server for production build
- `generate`: generates static site output

## Project structure

This repository uses Nuxt's `app/` source directory layout.

- `app/pages/index.vue`: main catalog and terminal previews
- `app/components/Terminal/`: terminal preview component
- `app/components/Header/`: top header/logo component
- `app/assets/sass/`: shared styles, mixins, and base partials
- `app/assets/static/prism.client.ts`: Prism highlighting plugin
- `server/api/themes.get.ts`: server endpoint that fetches and decodes theme JSON from GitHub API

## Data source

Themes are pulled from:

- https://api.github.com/repos/Gogh-Co/Gogh/contents/data/themes-min.json?ref=master

The server endpoint decodes the Base64 payload and returns normalized JSON to the frontend.

## Notes

- If dev server selects a different port, open the URL printed by Nuxt.
- Because the app uses `baseURL: /Gogh/`, local and deployed paths must include `/Gogh/`.

## Authentication & favorite synchronization

Visitors can favorite themes without an account (star icon on each theme
card); this is purely local (`localStorage`, key `gogh-favorites`, holding
Gogh's stable theme identifier - `theme.name` - not a display label).
Signing in with GitHub (top-right of the header) additionally synchronizes
favorites through a public GitHub Gist the user owns, via a private
Cloudflare Worker backend (`Gogh-Co/gogh-website-worker`, a separate
repository - this repo contains **no** backend/OAuth implementation, only
the browser-side integration). All backend calls go to
`https://gogh.website/auth/*` and `/api/*`, same-origin, intercepted by
Cloudflare in front of GitHub Pages - see that repository's
`docs/DEPLOYMENT.md` for the routing details and `docs/API.md` for the full
contract these composables talk to.

Key pieces, all under `app/composables/`:

- **`useAuth.ts`** - GitHub sign-in. Opens `/auth/login` in a popup;
  strictly validates every `postMessage` (exact origin + an explicit
  `{ source: 'gogh-auth', type }` shape) before trusting it - no token or
  session content ever travels through `postMessage`, only a bare
  success/error signal; the parent then calls `GET /auth/me` to learn who
  signed in. Falls back to a top-level `/auth/login?mode=redirect`
  navigation if the popup is blocked. `logout()` clears the local session
  only - it does not touch the user's Gist or GitHub favorites, which
  resume on the next sign-in.
- **`useFavorites.ts`** - anonymous persistence, the optimistic
  toggle-then-debounced-sync flow (~700ms, `syncState`:
  `idle | syncing | synced | error`), the first-login merge (local ∪
  remote, additions only - see the Worker's `docs/API.md`), and the
  Gist-id `localStorage` cache (`gogh-gist-id-<numeric GitHub id>` -
  namespaced per account so a shared browser can't mix up two users'
  associations; always re-validated server-side, never trusted on its own).
- **`useAdmin.ts`** - thin client for the `/api/admin/*` endpoints, used
  only by `app/pages/admin/index.vue`. Carries no privileged logic itself -
  every authorization decision is made server-side, independently, per
  request (see the Worker's `docs/SECURITY.md`); this page has no client-side
  gate that would matter if bypassed.

`app/components/Auth/AuthControl.vue` (header sign-in/avatar control) and
`app/components/Terminal/FavoriteButton.vue` (the per-card star toggle) are
the two new UI pieces; everything else (theme cards, filters, layout) is
unchanged.

### Admin panel

`/admin/` (`app/pages/admin/index.vue`) reuses the normal GitHub session -
there is no separate admin login. It always calls `GET /api/admin/status`
and renders based on the **actual HTTP outcome** (401/403/200), never on a
client-side `isAdmin` flag alone (that flag only ever affects whether the
"Admin panel" link is shown in the header). Shows: admin identity, Worker
health, config-readiness booleans (never secret values), session
issued/expiry, the admin's own Gist (id, link, current `gogh.yaml`, last
sync time), a "Force synchronization" action, a "Recover / recreate Gist"
action, and a small locally-kept (this-browser-only) recent-sync-error log.

## Testing

```bash
npm test         # vitest run, in the Nuxt test environment (@nuxt/test-utils)
npm run test:watch
```

All `/auth/*` and `/api/*` calls in tests go through
`registerEndpoint()` (from `@nuxt/test-utils/runtime`) against a local test
Nitro server - no real network calls, no dependency on the actual Worker
being deployed. Covers: anonymous favorite persistence, optimistic
toggling + debounce, first-login merge semantics, `postMessage` origin/shape
validation (including malformed-payload and wrong-origin rejection),
popup-blocked fallback, and the admin page's three authorization-driven
render states (signed-out, forbidden, authorized).

