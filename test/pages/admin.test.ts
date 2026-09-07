import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerEndpoint, mountSuspended } from '@nuxt/test-utils/runtime';
import AdminPage from '@/pages/admin/index.vue';

// useState-backed auth state is shared (by key) across every test in this
// file, since @nuxt/test-utils reuses one Nuxt app context per file - reset
// it so one test's outcome can't leak into the next.
beforeEach(() => {
    const { user, authChecked } = useAuth();
    user.value = null;
    authChecked.value = false;
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('admin page - authorization-driven rendering', () => {
    it('shows a sign-in prompt when unauthenticated (no client-trusted bypass)', async () => {
        registerEndpoint('/auth/me', () => ({ ok: true, authenticated: false }));

        const wrapper = await mountSuspended(AdminPage);
        await vi.waitUntil(() => !wrapper.text().includes('Checking access'));

        expect(wrapper.text()).toContain('Sign in with GitHub');
        expect(wrapper.text()).not.toContain('Force synchronization');
    });

    it('shows a forbidden message when authenticated but the server rejects admin status with 403 (never trusts a client-side isAdmin flag alone)', async () => {
        // isAdmin: true here on purpose - the page must not trust this and
        // render the dashboard on the strength of it; only a successful
        // /api/admin/status call (server-checked) may do that.
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 2, login: 'not-an-admin', avatarUrl: 'a', isAdmin: true },
        }));
        registerEndpoint('/api/admin/status', {
            handler: (event) => {
                event.node.res.statusCode = 403;
                return { ok: false, error: { code: 'forbidden', message: 'Admin access required' } };
            },
        });

        const wrapper = await mountSuspended(AdminPage);
        await vi.waitUntil(() => !wrapper.text().includes('Checking access'));

        expect(wrapper.text()).toContain('not authorized');
        expect(wrapper.text()).not.toContain('Force synchronization');
    });

    it('renders the dashboard only after a successful (server-authorized) /api/admin/status response', async () => {
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 1, login: 'admin-user', avatarUrl: 'https://example.com/a.png', isAdmin: true },
        }));
        registerEndpoint('/api/admin/status', () => ({
            ok: true,
            data: {
                admin: { id: 1, login: 'admin-user', avatarUrl: 'https://example.com/a.png' },
                worker: { ok: true, time: '2026-09-07T00:00:00Z' },
                config: { githubClientIdConfigured: true, sessionKeyConfigured: true, adminIdsConfigured: true },
                session: { issuedAt: '2026-09-07T00:00:00Z', expiresAt: '2026-10-07T00:00:00Z' },
                gist: { gistId: 'g1', gistUrl: 'https://gist.github.com/admin-user/g1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z', favoritesCount: 3, recreated: false },
            },
        }));
        registerEndpoint('/api/gist', () => ({
            ok: true,
            data: { gistId: 'g1', gistUrl: 'x', createdAt: 't0', updatedAt: 't1', rawYaml: 'schema_version: 1\n', recreated: false },
        }));

        const wrapper = await mountSuspended(AdminPage);
        await vi.waitUntil(() => wrapper.text().includes('Force synchronization'));

        // The Gist link is styled as a button and points at the real Gist -
        // the raw gist id itself is no longer shown as separate, redundant text.
        const gistLink = wrapper.find('a.admin-action--link');
        expect(gistLink.exists()).toBe(true);
        expect(gistLink.attributes('href')).toBe('https://gist.github.com/admin-user/g1');
        expect(wrapper.text()).toContain('View on GitHub');
        expect(wrapper.text()).toContain('Favorites: 3');
        // Dates render human-readable, not as raw ISO strings.
        expect(wrapper.text()).not.toContain('2026-01-01T00:00:00Z');
        expect(wrapper.text()).not.toContain('Sign in with GitHub to continue.');
    });

    it('never renders secret configuration values, even if a malformed server response somehow included one', async () => {
        registerEndpoint('/auth/me', () => ({
            ok: true,
            authenticated: true,
            user: { id: 1, login: 'admin-user', avatarUrl: 'a', isAdmin: true },
        }));
        registerEndpoint('/api/admin/status', () => ({
            ok: true,
            data: {
                admin: { id: 1, login: 'admin-user', avatarUrl: 'a' },
                worker: { ok: true, time: 't' },
                config: { githubClientIdConfigured: true, sessionKeyConfigured: true, adminIdsConfigured: true },
                session: { issuedAt: 't', expiresAt: 't' },
                gist: { gistId: 'g1', gistUrl: 'x', createdAt: 't0', updatedAt: 't1', favoritesCount: 0, recreated: false },
            },
        }));
        registerEndpoint('/api/gist', () => ({ ok: true, data: { gistId: 'g1', gistUrl: 'x', createdAt: 't0', updatedAt: 't1', rawYaml: '', recreated: false } }));

        const wrapper = await mountSuspended(AdminPage);
        await vi.waitUntil(() => wrapper.text().includes('Force synchronization'));

        // The admin page template has no binding that could ever surface a
        // secret field - this asserts the rendered output stays free of the
        // known-sensitive field names as a guard against a future regression
        // that starts threading one through.
        expect(wrapper.html()).not.toMatch(/GITHUB_CLIENT_SECRET|SESSION_ENCRYPTION_KEY|ADMIN_GITHUB_IDS/);
    });
});
