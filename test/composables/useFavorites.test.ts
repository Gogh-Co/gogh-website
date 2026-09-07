import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { readBody, getQuery } from 'h3';

// useFavorites/useState/etc. are Nuxt auto-imports, available globally in
// this test environment (see vitest.config.ts: environment: 'nuxt').

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useFavorites - anonymous persistence', () => {
    it('starts empty until initFavorites() reads localStorage', () => {
        localStorage.setItem('gogh-favorites', JSON.stringify(['dracula', 'nord']));
        const { favorites, initFavorites } = useFavorites();
        expect(favorites.value).toEqual([]);
        initFavorites();
        expect(favorites.value).toEqual(['dracula', 'nord']);
    });

    it('tolerates missing/corrupt localStorage content', () => {
        localStorage.setItem('gogh-favorites', 'not json{{{');
        const { favorites, initFavorites } = useFavorites();
        initFavorites();
        expect(favorites.value).toEqual([]);
    });

    it('toggling without a signed-in user only touches localStorage (no network call)', async () => {
        const putSpy = vi.fn(() => ({ ok: true, data: { favorites: [], gistId: 'g', gistUrl: 'x', updatedAt: 't', createdAt: 't', recreated: false } }));
        registerEndpoint('/api/favorites', { method: 'PUT', handler: putSpy });

        const { favorites, toggleFavorite, initFavorites } = useFavorites();
        initFavorites();
        toggleFavorite('nord', null);

        expect(favorites.value).toEqual(['nord']);
        expect(JSON.parse(localStorage.getItem('gogh-favorites')!)).toEqual(['nord']);

        await new Promise((r) => setTimeout(r, 900));
        expect(putSpy).not.toHaveBeenCalled();
    });

    it('toggling the same theme twice removes it again', () => {
        const { favorites, toggleFavorite, initFavorites } = useFavorites();
        initFavorites();
        toggleFavorite('nord', null);
        toggleFavorite('nord', null);
        expect(favorites.value).toEqual([]);
    });
});

describe('useFavorites - optimistic toggling + debounced sync (authenticated)', () => {
    it('updates local state immediately, and groups rapid toggles into one debounced PUT', async () => {
        vi.useFakeTimers();
        const putBodies: unknown[] = [];
        registerEndpoint('/api/favorites', {
            method: 'PUT',
            handler: async (event) => {
                putBodies.push(await readBody(event));
                return { ok: true, data: { favorites: ['dracula', 'gruvbox-dark'], gistId: 'g1', gistUrl: 'https://gist.github.com/x/g1', updatedAt: 't2', createdAt: 't0' } };
            },
        });

        const { favorites, toggleFavorite, initFavorites, syncState } = useFavorites();
        initFavorites();

        toggleFavorite('dracula', 42);
        toggleFavorite('gruvbox-dark', 42);
        expect(favorites.value).toEqual(['dracula', 'gruvbox-dark']);
        expect(putBodies).toHaveLength(0);

        await vi.advanceTimersByTimeAsync(1000);
        // The debounced $fetch is real I/O against the test Nitro server;
        // fake-timer microtask flushing alone doesn't drain that, so finish
        // the wait with real timers.
        vi.useRealTimers();
        await vi.waitUntil(() => syncState.value !== 'syncing');

        expect(putBodies).toHaveLength(1);
        expect((putBodies[0] as { favorites: string[] }).favorites).toEqual(['dracula', 'gruvbox-dark']);
        expect(syncState.value).toBe('synced');
    });

    it('sets syncState to "error" and logs it when the PUT fails, without throwing', async () => {
        vi.useFakeTimers();
        registerEndpoint('/api/favorites', {
            method: 'PUT',
            handler: (event) => {
                event.node.res.statusCode = 502;
                return { ok: false, error: { code: 'github_unavailable', message: 'upstream down' } };
            },
        });

        const { toggleFavorite, initFavorites, syncState } = useFavorites();
        initFavorites();
        toggleFavorite('nord', 42);

        await vi.advanceTimersByTimeAsync(1000);
        vi.useRealTimers();
        await vi.waitUntil(() => syncState.value !== 'syncing');

        expect(syncState.value).toBe('error');
        const log = readSyncLog();
        expect(log.length).toBeGreaterThan(0);
        expect(log.at(-1)!.message).toContain('github_unavailable');
    });
});

describe('useFavorites - initial login merge (set union, never deletes)', () => {
    it('unions local and remote favorites and pushes the union when it adds something new', async () => {
        localStorage.setItem('gogh-favorites', JSON.stringify(['local-only']));
        let putCount = 0;

        registerEndpoint('/api/favorites', {
            method: 'GET',
            handler: () => ({ ok: true, data: { favorites: ['remote-only'], gistId: 'g1', gistUrl: 'x', updatedAt: 't1', createdAt: 't0', recreated: false } }),
        });
        registerEndpoint('/api/favorites', {
            method: 'PUT',
            handler: async (event) => {
                putCount++;
                const body = await readBody<{ favorites: string[] }>(event);
                return { ok: true, data: { favorites: body.favorites, gistId: 'g1', gistUrl: 'x', updatedAt: 't2', createdAt: 't0' } };
            },
        });

        const { favorites, initFavorites, mergeAfterLogin, syncState } = useFavorites();
        initFavorites();
        await mergeAfterLogin(7);

        expect(favorites.value).toEqual(['local-only', 'remote-only']);
        expect(putCount).toBe(1);
        expect(syncState.value).toBe('synced');
    });

    it('does not write anything when the remote set already has everything local had', async () => {
        localStorage.setItem('gogh-favorites', JSON.stringify(['nord']));
        let putCount = 0;

        registerEndpoint('/api/favorites', {
            method: 'GET',
            handler: () => ({ ok: true, data: { favorites: ['dracula', 'nord'], gistId: 'g1', gistUrl: 'x', updatedAt: 't1', createdAt: 't0', recreated: false } }),
        });
        registerEndpoint('/api/favorites', { method: 'PUT', handler: () => { putCount++; return { ok: true, data: {} }; } });

        const { favorites, initFavorites, mergeAfterLogin, syncState } = useFavorites();
        initFavorites();
        await mergeAfterLogin(7);

        expect(favorites.value).toEqual(['dracula', 'nord']);
        expect(putCount).toBe(0);
        expect(syncState.value).toBe('synced');
    });

    it('sends the previously cached gist id for this account as a query parameter', async () => {
        localStorage.setItem('gogh-gist-id-7', 'cached-gist-id');
        let receivedGistId: string | undefined;

        registerEndpoint('/api/favorites', {
            method: 'GET',
            handler: (event) => {
                receivedGistId = getQuery(event).gist_id as string | undefined;
                return { ok: true, data: { favorites: [], gistId: 'cached-gist-id', gistUrl: 'x', updatedAt: 't1', createdAt: 't0', recreated: false } };
            },
        });

        const { initFavorites, mergeAfterLogin } = useFavorites();
        initFavorites();
        await mergeAfterLogin(7);

        expect(receivedGistId).toBe('cached-gist-id');
    });

    it('caches the gist id per numeric GitHub user id after merging', async () => {
        registerEndpoint('/api/favorites', {
            method: 'GET',
            handler: () => ({ ok: true, data: { favorites: [], gistId: 'gist-for-user-7', gistUrl: 'x', updatedAt: 't1', createdAt: 't0', recreated: false } }),
        });

        const { initFavorites, mergeAfterLogin } = useFavorites();
        initFavorites();
        await mergeAfterLogin(7);

        expect(localStorage.getItem('gogh-gist-id-7')).toBe('gist-for-user-7');
    });
});
