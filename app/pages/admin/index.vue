<template>
    <Header />

    <div class="gogh-content admin-page" :style="{ '--admin-font-scale': fontScale }">
        <div class="container">
            <div class="admin-header">
                <h2>Admin</h2>

                <div class="admin-font-controls" role="group" aria-label="Text size">
                    <button type="button" class="admin-font-button" :disabled="fontScale <= MIN_FONT_SCALE" aria-label="Decrease text size" @click="decreaseFontScale">
                        A−
                    </button>
                    <button type="button" class="admin-font-button" :disabled="fontScale >= MAX_FONT_SCALE" aria-label="Increase text size" @click="increaseFontScale">
                        A+
                    </button>
                </div>
            </div>

            <div v-if="phase === 'loading'" class="admin-status admin-status--loading">
                Checking access…
            </div>

            <div v-else-if="phase === 'signed-out'" class="admin-status">
                <p>Sign in with GitHub to continue.</p>
            </div>

            <div v-else-if="phase === 'forbidden'" class="admin-status admin-status--error">
                <p>Your GitHub account is not authorized for this panel.</p>
            </div>

            <div v-else-if="phase === 'error'" class="admin-status admin-status--error">
                <p>Could not load admin status: {{ errorMessage }}</p>
                <button type="button" class="admin-action" @click="load">Retry</button>
            </div>

            <div v-else-if="phase === 'ready' && status" class="admin-panels">
                <section class="admin-panel">
                    <h3>Signed in as</h3>
                    <div class="admin-identity">
                        <img class="admin-identity__avatar" :src="status.admin.avatarUrl" :alt="`${status.admin.login} avatar`" width="40" height="40">
                        <span>{{ status.admin.login }}</span>
                        <span class="admin-identity__id">#{{ status.admin.id }}</span>
                    </div>
                </section>

                <section class="admin-panel">
                    <h3>Worker &amp; configuration</h3>
                    <ul class="admin-list">
                        <li>Worker: {{ status.worker.ok ? 'healthy' : 'unhealthy' }} (checked {{ formatDateTime(status.worker.time) }})</li>
                        <li>GitHub OAuth client id configured: {{ status.config.githubClientIdConfigured ? 'yes' : 'no' }}</li>
                        <li>Session encryption key configured: {{ status.config.sessionKeyConfigured ? 'yes' : 'no' }}</li>
                        <li>Admin allowlist configured: {{ status.config.adminIdsConfigured ? 'yes' : 'no' }}</li>
                    </ul>
                </section>

                <section class="admin-panel">
                    <h3>Session</h3>
                    <ul class="admin-list">
                        <li>Issued: {{ formatDateTime(status.session.issuedAt) }}</li>
                        <li>Expires: {{ formatDateTime(status.session.expiresAt) }}</li>
                    </ul>
                </section>

                <section class="admin-panel">
                    <h3>Your Gogh Gist</h3>
                    <ul class="admin-list">
                        <li>Created: {{ formatDateTime(status.gist.createdAt) }}</li>
                        <li>Last synchronized: {{ formatDateTime(status.gist.updatedAt) }}</li>
                        <li>Favorites: {{ status.gist.favoritesCount }}</li>
                        <li v-if="status.gist.recreated">A new Gist was created just now (none was found).</li>
                    </ul>

                    <div class="admin-actions">
                        <a :href="status.gist.gistUrl" target="_blank" rel="noopener noreferrer" class="admin-action admin-action--link">
                            View on GitHub ↗
                        </a>
                        <button type="button" class="admin-action" :disabled="syncing" @click="onForceSync">
                            {{ syncing ? 'Syncing…' : 'Force synchronization' }}
                        </button>
                        <button type="button" class="admin-action" :disabled="recovering" @click="onRecoverGist">
                            {{ recovering ? 'Working…' : 'Recover / recreate Gist' }}
                        </button>
                    </div>
                    <p v-if="actionMessage" class="admin-action-message">{{ actionMessage }}</p>
                </section>

                <section class="admin-panel">
                    <h3>Current gogh.yaml</h3>
                    <pre v-if="gistYaml" class="admin-yaml">{{ gistYaml }}</pre>
                    <p v-else>Loading…</p>
                </section>

                <section v-if="syncLog.length" class="admin-panel">
                    <h3>Recent sync errors (this browser)</h3>
                    <ul class="admin-list">
                        <li v-for="(entry, index) in syncLog" :key="index">
                            {{ formatDateTime(entry.at) }} — {{ entry.message }}
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    </div>

    <Footer />
</template>

<script setup>
import Header from '@/components/Header/Header.vue';
import Footer from '@/components/Footer/Footer.vue';

useSeoMeta({ title: 'Gogh - Admin', robots: 'noindex, nofollow' });

const { user, checkAuth } = useAuth();
const { fetchStatus, forceSync, recoverGist, fetchGist } = useAdmin();

const phase = ref('loading');
const status = ref(null);
const gistYaml = ref('');
const errorMessage = ref('');
const syncing = ref(false);
const recovering = ref(false);
const actionMessage = ref('');
const syncLog = ref([]);

const FONT_SCALE_STORAGE_KEY = 'gogh-admin-font-scale';
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.6;
const FONT_SCALE_STEP = 0.15;
const fontScale = ref(1);

function clampFontScale(value) {
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
}

function setFontScale(value) {
    fontScale.value = clampFontScale(value);
    try {
        localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(fontScale.value));
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }
}

function increaseFontScale() {
    setFontScale(fontScale.value + FONT_SCALE_STEP);
}

function decreaseFontScale() {
    setFontScale(fontScale.value - FONT_SCALE_STEP);
}

function formatDateTime(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

async function load() {
    phase.value = 'loading';
    errorMessage.value = '';

    // Always re-check, even if some other component on the page already
    // has: this page's authorization comes from the /api/admin/status call
    // below, not from a client-cached belief about being signed in, and a
    // session can have expired since anything earlier ran this session.
    await checkAuth();

    if (!user.value) {
        phase.value = 'signed-out';
        return;
    }

    const result = await fetchStatus();
    if (!result.ok) {
        phase.value = result.code === 'forbidden' ? 'forbidden' : result.code === 'unauthenticated' ? 'signed-out' : 'error';
        errorMessage.value = result.message;
        return;
    }

    status.value = result.data;
    phase.value = 'ready';

    const gistResult = await fetchGist();
    if (gistResult.ok) {
        gistYaml.value = gistResult.data.rawYaml;
    }
}

async function onForceSync() {
    syncing.value = true;
    actionMessage.value = '';
    const result = await forceSync();
    syncing.value = false;
    actionMessage.value = result.ok ? 'Synchronized.' : `Sync failed: ${result.message}`;
    if (result.ok) await load();
}

async function onRecoverGist() {
    recovering.value = true;
    actionMessage.value = '';
    const result = await recoverGist();
    recovering.value = false;
    actionMessage.value = result.ok
        ? (result.data.recreated ? 'A new Gist was created.' : 'Existing Gist confirmed healthy.')
        : `Recovery failed: ${result.message}`;
    if (result.ok) await load();
}

onMounted(() => {
    try {
        const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
        if (saved) {
            const parsed = Number(saved);
            if (!Number.isNaN(parsed)) fontScale.value = clampFontScale(parsed);
        }
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }

    syncLog.value = readSyncLog();
    load();
});
</script>

<style lang="scss" scoped>
@use './index.scss';
</style>
