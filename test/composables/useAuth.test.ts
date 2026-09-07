import { describe, it, expect, vi, afterEach } from 'vitest';
import { registerEndpoint } from '@nuxt/test-utils/runtime';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

function fakePopup() {
    return { closed: false, close: vi.fn() } as unknown as Window;
}

describe('useAuth - checkAuth', () => {
    it('sets user from a successful /auth/me response', async () => {
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 1, login: 'octocat', avatarUrl: 'a', isAdmin: false },
        }));

        const { user, checkAuth, authChecked } = useAuth();
        await checkAuth();
        expect(user.value).toEqual({ id: 1, login: 'octocat', avatarUrl: 'a', isAdmin: false });
        expect(authChecked.value).toBe(true);
    });

    it('sets user to null when unauthenticated', async () => {
        registerEndpoint('/auth/me', () => ({ ok: true, authenticated: false }));
        const { user, checkAuth } = useAuth();
        await checkAuth();
        expect(user.value).toBeNull();
    });

    it('degrades to signed-out (not a thrown error) when the Worker is unreachable', async () => {
        registerEndpoint('/auth/me', () => {
            throw new Error('boom');
        });
        const { user, checkAuth, authChecked } = useAuth();
        await expect(checkAuth()).resolves.toBeUndefined();
        expect(user.value).toBeNull();
        expect(authChecked.value).toBe(true);
    });
});

describe('useAuth - login popup postMessage handling', () => {
    it('accepts a well-formed success message from the correct origin', async () => {
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 1, login: 'octocat', avatarUrl: 'a', isAdmin: false },
        }));
        const popup = fakePopup();
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const { login, user } = useAuth();
        const resultPromise = login('/themes');

        window.dispatchEvent(
            new MessageEvent('message', { data: { source: 'gogh-auth', type: 'auth_success' }, origin: window.location.origin }),
        );

        const result = await resultPromise;
        expect(result).toEqual({ ok: true });
        expect(user.value?.login).toBe('octocat');
    });

    it('ignores a message from an unexpected origin, even with an otherwise valid payload', async () => {
        const popup = fakePopup();
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const { login } = useAuth();
        const resultPromise = login('/themes');

        window.dispatchEvent(
            new MessageEvent('message', { data: { source: 'gogh-auth', type: 'auth_success' }, origin: 'https://evil.example' }),
        );

        let settled = false;
        resultPromise.then(() => { settled = true; });
        await new Promise((r) => setTimeout(r, 20));
        expect(settled).toBe(false);
    });

    it('ignores a message missing the expected source/type shape', async () => {
        const popup = fakePopup();
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const { login } = useAuth();
        const resultPromise = login('/themes');

        window.dispatchEvent(new MessageEvent('message', { data: { hello: 'world' }, origin: window.location.origin }));
        window.dispatchEvent(new MessageEvent('message', { data: 'just a string', origin: window.location.origin }));
        window.dispatchEvent(new MessageEvent('message', { data: { source: 'someone-else', type: 'auth_success' }, origin: window.location.origin }));

        let settled = false;
        resultPromise.then(() => { settled = true; });
        await new Promise((r) => setTimeout(r, 20));
        expect(settled).toBe(false);
    });

    it('resolves with an error result on an auth_error message, without calling /auth/me', async () => {
        const authMeSpy = vi.fn(() => ({ ok: true, authenticated: false }));
        registerEndpoint('/auth/me', authMeSpy);
        const popup = fakePopup();
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const { login } = useAuth();
        const resultPromise = login('/themes');

        window.dispatchEvent(
            new MessageEvent('message', { data: { source: 'gogh-auth', type: 'auth_error', code: 'access_denied' }, origin: window.location.origin }),
        );

        const result = await resultPromise;
        expect(result).toEqual({ ok: false, error: 'access_denied' });
        expect(authMeSpy).not.toHaveBeenCalled();
    });

    it('resolves with popup_closed if the popup is closed before completing', async () => {
        vi.useFakeTimers();
        const popup = { closed: false } as unknown as Window;
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const { login } = useAuth();
        const resultPromise = login('/themes');

        (popup as { closed: boolean }).closed = true;
        await vi.advanceTimersByTimeAsync(600);

        const result = await resultPromise;
        expect(result).toEqual({ ok: false, error: 'popup_closed' });
    });

    it('falls back to a top-level navigation when the popup is blocked', () => {
        vi.stubGlobal('open', vi.fn().mockReturnValue(null));
        const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});

        const { login } = useAuth();
        void login('/themes');

        expect(assignSpy).toHaveBeenCalledTimes(1);
        const [navigatedTo] = assignSpy.mock.calls[0]!;
        expect(navigatedTo).toContain('/auth/login?mode=redirect');
        expect(navigatedTo).toContain(encodeURIComponent('/themes'));
    });
});
