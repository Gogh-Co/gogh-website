import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerEndpoint, mountSuspended } from '@nuxt/test-utils/runtime';
import FavoritesSignInBanner from '@/components/Terminal/FavoritesSignInBanner.vue';

// useAuth/useFavorites are useState-backed Nuxt auto-imports shared across
// every test in this file - reset them so one test's outcome can't leak
// into the next (mirrors test/pages/admin.test.ts).
beforeEach(() => {
    const { user } = useAuth();
    user.value = null;
    localStorage.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function fakePopup() {
    return { closed: false, close: vi.fn() } as unknown as Window;
}

describe('FavoritesSignInBanner', () => {
    it('renders nothing when not visible', async () => {
        const wrapper = await mountSuspended(FavoritesSignInBanner, { props: { visible: false } });
        expect(wrapper.text()).toBe('');
    });

    it('shows the sign-in nudge when visible', async () => {
        const wrapper = await mountSuspended(FavoritesSignInBanner, { props: { visible: true } });
        expect(wrapper.text()).toContain('Sign in with GitHub');
        expect(wrapper.text()).toContain('instead of just this browser');
    });

    it('emits close when the dismiss button is clicked', async () => {
        const wrapper = await mountSuspended(FavoritesSignInBanner, { props: { visible: true } });
        await wrapper.find('.favorites-sign-in-banner__close').trigger('click');
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('completing sign-in merges favorites and closes the banner', async () => {
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 1, login: 'octocat', avatarUrl: 'a', isAdmin: false },
        }));
        const mergeSpy = vi.fn(() => ({ ok: true, data: { favorites: ['nord'], gistId: 'g1', gistUrl: 'x', updatedAt: 't', createdAt: 't', recreated: false } }));
        registerEndpoint('/api/favorites', { method: 'GET', handler: mergeSpy });

        const popup = fakePopup();
        vi.stubGlobal('open', vi.fn().mockReturnValue(popup));

        const wrapper = await mountSuspended(FavoritesSignInBanner, { props: { visible: true } });
        await wrapper.find('.favorites-sign-in-banner__signin').trigger('click');

        window.dispatchEvent(
            new MessageEvent('message', { data: { source: 'gogh-auth', type: 'auth_success' }, origin: window.location.origin }),
        );

        await vi.waitUntil(() => wrapper.emitted('close') !== undefined);
        expect(mergeSpy).toHaveBeenCalled();
    });
});
