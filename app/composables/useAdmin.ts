export interface AdminStatus {
    admin: { id: number; login: string; avatarUrl: string };
    worker: { ok: boolean; time: string };
    config: {
        githubClientIdConfigured: boolean;
        sessionKeyConfigured: boolean;
        adminIdsConfigured: boolean;
    };
    session: { issuedAt: string; expiresAt: string };
    gist: {
        gistId: string;
        gistUrl: string;
        createdAt: string;
        updatedAt: string;
        favoritesCount: number;
        recreated: boolean;
    };
}

export interface GistSnapshot {
    gistId: string;
    gistUrl: string;
    createdAt: string;
    updatedAt: string;
    rawYaml: string;
    recreated: boolean;
}

type AdminResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

function toResult<T>(promise: Promise<{ ok: true; data: T }>): Promise<AdminResult<T>> {
    return promise
        .then((res) => ({ ok: true as const, data: res.data }))
        .catch((error: unknown) => {
            const data = (error as { data?: { error?: { code?: string; message?: string } } })?.data;
            return {
                ok: false as const,
                code: data?.error?.code ?? 'internal_error',
                message: data?.error?.message ?? 'Request failed',
            };
        });
}

/**
 * All /api/admin/* authorization is enforced server-side, independently, on
 * every call - this composable never assumes a prior successful call means
 * later ones will also succeed, and never gates rendering on a
 * client-known "is admin" flag by itself (see docs/FRONTEND.md
 * "Admin page behavior").
 */
export function useAdmin() {
    function fetchStatus(): Promise<AdminResult<AdminStatus>> {
        return toResult($fetch('/api/admin/status', { timeout: 12000 }));
    }

    function forceSync(): Promise<AdminResult<{ favorites: string[]; gistId: string; gistUrl: string; updatedAt: string; conflict: boolean }>> {
        return toResult($fetch('/api/admin/sync', { method: 'POST', timeout: 15000 }));
    }

    function recoverGist(): Promise<AdminResult<{ favorites: string[]; gistId: string; gistUrl: string; updatedAt: string; recreated: boolean }>> {
        return toResult($fetch('/api/admin/recover-gist', { method: 'POST', timeout: 15000 }));
    }

    function fetchGist(): Promise<AdminResult<GistSnapshot>> {
        return toResult($fetch('/api/gist', { timeout: 12000 }));
    }

    return { fetchStatus, forceSync, recoverGist, fetchGist };
}
