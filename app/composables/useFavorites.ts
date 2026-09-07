// Anonymous favorites persist in localStorage under this key regardless of
// auth state; once signed in, the user's Gist becomes the source of truth
// and this key becomes a local cache/optimistic-UI layer instead (see
// docs/FRONTEND.md "Synchronization states"). Favorites are stored as Gogh's
// stable theme identifier -- theme.name, exactly as used elsewhere in this
// app (see getThemeName() in pages/index.vue) -- never a display label that
// could change independently of it (in this app they're the same field, but
// the point is we never invent a second, parallel id).
const FAVORITES_STORAGE_KEY = 'gogh-favorites';

// Namespaced per numeric GitHub user id so a shared/public browser can't mix
// up two different accounts' cached Gist association. This is ONLY a
// performance hint for the Worker (see docs/FRONTEND.md "Gist cache
// behavior") -- the Worker independently re-validates it belongs to the
// signed-in user before trusting it.
function gistIdStorageKey(ghId: number): string {
    return `gogh-gist-id-${ghId}`;
}

const SYNC_LOG_STORAGE_KEY = 'gogh-sync-log';
const SYNC_LOG_MAX_ENTRIES = 20;
const SYNC_DEBOUNCE_MS = 700;

// Module-level (not inside useFavorites()) so every call site shares the
// same debounce window - two components both calling toggleFavorite in
// quick succession must still coalesce into one PUT, not race two
// independent timers.
let debounceHandle: ReturnType<typeof setTimeout> | null = null;

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface FavoritesApiData {
    favorites: string[];
    gistId: string;
    gistUrl: string;
    updatedAt: string;
    createdAt: string;
    recreated: boolean;
    conflict?: boolean;
}

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage failures (private browsing, disabled storage, quota, etc.).
    }
}

function loadLocalFavorites(): string[] {
    const value = readJson<unknown>(FAVORITES_STORAGE_KEY, []);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === 'string');
}

function appendSyncLog(entry: { at: string; message: string }) {
    const log = readJson<{ at: string; message: string }[]>(SYNC_LOG_STORAGE_KEY, []);
    log.push(entry);
    writeJson(SYNC_LOG_STORAGE_KEY, log.slice(-SYNC_LOG_MAX_ENTRIES));
}

export function readSyncLog(): { at: string; message: string }[] {
    return readJson(SYNC_LOG_STORAGE_KEY, []);
}

export function useFavorites() {
    const favorites = useState<string[]>('gogh-favorites-state', () => []);
    const syncState = useState<SyncState>('gogh-sync-state', () => 'idle');
    // The Gist `updated_at` last observed from the server, used for the
    // optimistic-concurrency check on the next write (see
    // docs/API.md "Ongoing synchronization algorithm").
    const lastKnownRevision = useState<string | undefined>('gogh-sync-revision', () => undefined);

    function isFavorite(themeName: string): boolean {
        return favorites.value.includes(themeName);
    }

    /** Loads whatever is in localStorage. Call once, client-side only (e.g. Header.vue's onMounted), before render depends on favorite state. */
    function initFavorites() {
        favorites.value = loadLocalFavorites();
    }

    function persistLocal() {
        writeJson(FAVORITES_STORAGE_KEY, favorites.value);
    }

    function getCachedGistId(ghId: number): string | undefined {
        try {
            return localStorage.getItem(gistIdStorageKey(ghId)) ?? undefined;
        } catch {
            return undefined;
        }
    }

    function setCachedGistId(ghId: number, gistId: string) {
        try {
            localStorage.setItem(gistIdStorageKey(ghId), gistId);
        } catch {
            // Ignore storage failures - purely an optimization cache.
        }
    }

    async function syncNow(ghId: number) {
        syncState.value = 'syncing';
        try {
            const res = await $fetch<{ ok: true; data: FavoritesApiData }>('/api/favorites', {
                method: 'PUT',
                body: {
                    favorites: favorites.value,
                    gistId: getCachedGistId(ghId),
                    expectedRevision: lastKnownRevision.value,
                },
                timeout: 12000,
            });

            // Reconcile with the authoritative server result: on a detected
            // conflict this is a union, not necessarily what we optimistically
            // sent - overwrite local state so the UI never drifts from the
            // Gist (see docs/API.md "Multi-device conflict strategy").
            favorites.value = res.data.favorites;
            persistLocal();
            setCachedGistId(ghId, res.data.gistId);
            lastKnownRevision.value = res.data.updatedAt;
            syncState.value = 'synced';
        } catch (error) {
            syncState.value = 'error';
            appendSyncLog({ at: new Date().toISOString(), message: describeError(error) });
        }
    }

    /** Optimistic toggle: UI and localStorage update immediately, then a debounced sync fires for authenticated users. Anonymous users only ever touch localStorage. */
    function toggleFavorite(themeName: string, ghId: number | null) {
        const set = new Set(favorites.value);
        if (set.has(themeName)) {
            set.delete(themeName);
        } else {
            set.add(themeName);
        }
        favorites.value = Array.from(set).sort();
        persistLocal();

        if (ghId === null) return;

        if (debounceHandle) clearTimeout(debounceHandle);
        debounceHandle = setTimeout(() => {
            debounceHandle = null;
            void syncNow(ghId);
        }, SYNC_DEBOUNCE_MS);
    }

    /**
     * Runs once, immediately after a successful login: fetches the user's
     * remote favorites, unions them with whatever accumulated locally while
     * anonymous, and - only if that union adds anything new - pushes it back
     * with one PUT. Set-union only; never deletes a favorite that exists on
     * just one side (see docs/API.md "Initial merge behavior"). This is
     * deliberately different from ongoing sync (toggleFavorite), which does
     * support deletion once this initial reconciliation has run once.
     */
    async function mergeAfterLogin(ghId: number) {
        syncState.value = 'syncing';
        try {
            const cachedGistId = getCachedGistId(ghId);
            const res = await $fetch<{ ok: true; data: FavoritesApiData }>('/api/favorites', {
                method: 'GET',
                query: cachedGistId ? { gist_id: cachedGistId } : {},
                timeout: 12000,
            });

            setCachedGistId(ghId, res.data.gistId);
            lastKnownRevision.value = res.data.updatedAt;

            const remote = res.data.favorites;
            const union = Array.from(new Set([...remote, ...favorites.value])).sort();
            favorites.value = union;
            persistLocal();

            const remoteAlreadyHadEverything =
                union.length === remote.length && union.every((name, i) => name === remote[i]);

            if (remoteAlreadyHadEverything) {
                syncState.value = 'synced';
            } else {
                await syncNow(ghId);
            }
        } catch (error) {
            syncState.value = 'error';
            appendSyncLog({ at: new Date().toISOString(), message: describeError(error) });
        }
    }

    /** Called on logout: stops treating favorites as synced to any account. Local favorites (the last-known merged state) are deliberately left in place - see docs/FRONTEND.md "Logout". */
    function resetSyncStateOnLogout() {
        syncState.value = 'idle';
        lastKnownRevision.value = undefined;
    }

    return {
        favorites,
        syncState,
        isFavorite,
        initFavorites,
        toggleFavorite,
        mergeAfterLogin,
        resetSyncStateOnLogout,
    };
}

function describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'data' in error) {
        const data = (error as { data?: { error?: { code?: string; message?: string } } }).data;
        if (data?.error?.code) return `${data.error.code}: ${data.error.message ?? ''}`.trim();
    }
    if (error instanceof Error) return error.message;
    return 'Unknown sync error';
}
