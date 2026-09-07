export interface GoghUser {
    id: number;
    login: string;
    avatarUrl: string;
    isAdmin: boolean;
}

interface AuthMessage {
    source: 'gogh-auth';
    type: 'auth_success' | 'auth_error';
    code?: string;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

const POPUP_FEATURES = 'width=520,height=680,menubar=no,toolbar=no,location=no,status=no';

function isAuthMessage(data: unknown): data is AuthMessage {
    if (typeof data !== 'object' || data === null) return false;
    const record = data as Record<string, unknown>;
    if (record['source'] !== 'gogh-auth') return false;
    return record['type'] === 'auth_success' || record['type'] === 'auth_error';
}

export function useAuth() {
    const user = useState<GoghUser | null>('gogh-auth-user', () => null);
    const authChecked = useState<boolean>('gogh-auth-checked', () => false);

    async function checkAuth(): Promise<void> {
        try {
            const res = await $fetch<
                { ok: true; authenticated: false } | { ok: true; authenticated: true; user: GoghUser }
            >('/auth/me', { timeout: 8000 });
            user.value = res.authenticated ? res.user : null;
        } catch {
            // Network/Worker failure - treat as signed-out rather than
            // throwing; the UI degrades to anonymous mode.
            user.value = null;
        } finally {
            authChecked.value = true;
        }
    }

    /**
     * Opens the GitHub sign-in flow in a popup. The parent (this function)
     * validates every postMessage strictly before trusting it: the exact
     * origin this site is served from, AND a minimal, explicitly-typed
     * payload shape (see isAuthMessage) - never `event.data` used directly.
     * No token or session content ever travels through postMessage; the
     * message is a bare success/error signal, and the caller must still call
     * checkAuth() to learn who is signed in (see docs/FRONTEND.md
     * "Popup OAuth integration").
     *
     * Falls back to a top-level navigation when the popup is blocked (or
     * closed before completing) - the caller's current page is preserved as
     * `return_to` so the user lands back where they started.
     */
    function login(returnTo: string): Promise<LoginResult> {
        const expectedOrigin = window.location.origin;
        const loginUrl = (mode: 'popup' | 'redirect') =>
            `/auth/login?mode=${mode}&return_to=${encodeURIComponent(returnTo)}`;

        const popup = window.open(loginUrl('popup'), 'gogh-auth', POPUP_FEATURES);

        if (!popup) {
            window.location.assign(loginUrl('redirect'));
            // Top-level navigation is already underway; this promise never
            // resolves in practice (the page is unloading).
            return new Promise(() => {});
        }

        return new Promise<LoginResult>((resolve) => {
            let settled = false;

            function finish(result: LoginResult) {
                if (settled) return;
                settled = true;
                window.removeEventListener('message', onMessage);
                clearInterval(pollClosed);
                resolve(result);
            }

            function onMessage(event: MessageEvent) {
                if (event.origin !== expectedOrigin) return;
                if (!isAuthMessage(event.data)) return;

                if (event.data.type === 'auth_success') {
                    checkAuth().then(() => finish({ ok: true }));
                } else {
                    finish({ ok: false, error: event.data.code ?? 'unknown_error' });
                }
            }

            const pollClosed = setInterval(() => {
                if (popup.closed) {
                    finish({ ok: false, error: 'popup_closed' });
                }
            }, 500);

            window.addEventListener('message', onMessage);
        });
    }

    async function logout(): Promise<void> {
        try {
            await $fetch('/auth/logout', { method: 'POST', timeout: 8000 });
        } catch {
            // Even if the request fails, clear client-side state below so the
            // UI doesn't strand the user in a falsely-authenticated view.
        }
        user.value = null;
    }

    return { user, authChecked, checkAuth, login, logout };
}
