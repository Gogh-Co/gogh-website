<template>
    <!--
        The whole banner signs in on click (a bigger target than the logo
        alone); the logo stays the real button for keyboard and screen
        readers. "How it works" and the close button stop the click.
    -->
    <div
        v-if="!dismissed && !user"
        class="persistence-banner"
        :class="{ 'is-pending': pending }"
        role="note"
        @click="onSignIn"
    >
        <span class="persistence-banner__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21z"/></svg>
        </span>

        <!--
            Plain <div>s on purpose: app.scss styles every <p> inside
            `.gogh-content.gogh-content` (dark, 12px, 30px margin), and that
            selector outranks this component's scoped classes.
        -->
        <div class="persistence-banner__copy">
            <div class="persistence-banner__title">{{ t('persistence.title') }}</div>
            <div class="persistence-banner__text">
                {{ t('persistence.text') }}
                <button
                    type="button"
                    class="persistence-banner__help"
                    aria-haspopup="dialog"
                    :aria-expanded="helpOpen"
                    @click.stop="helpOpen = true"
                >
                    {{ t('persistence.howItWorks') }}
                </button>
            </div>
        </div>

        <button
            type="button"
            class="persistence-banner__signin"
            :aria-label="t('auth.signIn')"
            :title="t('auth.signIn')"
            :disabled="pending"
            @click.stop="onSignIn"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" aria-hidden="true">
                <path fill="currentColor" d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.44-2.44-.97-2.44-.97c-.33-.84-.81-1.06-.81-1.06c-.66-.45.05-.44.05-.44c.73.05 1.12.75 1.12.75c.65 1.11 1.7.79 2.12.6c.06-.47.25-.79.46-.97c-1.6-.18-3.29-.8-3.29-3.57c0-.79.28-1.43.75-1.94c-.08-.18-.32-.92.07-1.92c0 0 .61-.2 2 .74a6.94 6.94 0 0 1 3.64 0c1.39-.94 2-.74 2-.74c.39 1 .15 1.74.07 1.92c.47.51.75 1.15.75 1.94c0 2.78-1.69 3.39-3.3 3.57c.26.22.49.66.49 1.33l-.01 1.97c0 .21.15.46.55.38A8 8 0 0 0 8 0"/>
            </svg>
        </button>

        <button type="button" class="persistence-banner__dismiss" :aria-label="t('common.dismiss')" @click.stop="dismiss">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg>
        </button>
    </div>

    <!--
        Teleported to <body>: `.persistence-banner` animates in with
        `transform` and has `backdrop-filter`, and either one - per the CSS
        spec - makes it the containing block for any `position: fixed`
        descendant. Left inline, this lightbox would be confined to the
        banner's own small box instead of covering the viewport.
    -->
    <Teleport to="body">
        <div v-if="helpOpen" class="persistence-banner__lightbox" @click.self="helpOpen = false">
            <div class="persistence-banner__lightbox-content" role="dialog" aria-modal="true" aria-labelledby="persistence-help-title">
                <button
                    type="button"
                    class="persistence-banner__lightbox-close"
                    :aria-label="t('common.close')"
                    @click="helpOpen = false"
                >
                    ×
                </button>

                <h3 id="persistence-help-title">{{ t('persistence.helpTitle') }}</h3>
                <p>{{ t('persistence.helpLocal') }}</p>
                <I18nT keypath="persistence.helpGist" tag="p">
                    <template #file><code>gogh.yaml</code></template>
                </I18nT>
                <p>{{ t('persistence.helpSignOut') }}</p>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import I18nT from '@/components/I18nT';

const { t } = useI18n();
const DISMISSED_STORAGE_KEY = 'gogh-persistence-banner-dismissed';

const { user, login } = useAuth();
const { mergeAfterLogin } = useFavorites();
const helpOpen = ref(false);
const dismissed = ref(false);
const pending = ref(false);

// Same flow as the header's AuthControl: once signed in, `user` is set and
// the banner hides itself (v-if="!user").
async function onSignIn() {
    if (pending.value) return;
    pending.value = true;
    try {
        const result = await login(useRoute().fullPath, 'persistence-banner');
        if (result.ok && user.value) {
            await mergeAfterLogin(user.value.id);
        }
    } finally {
        pending.value = false;
    }
}

function dismiss() {
    dismissed.value = true;
    try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, '1');
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }
}

onMounted(() => {
    try {
        if (localStorage.getItem(DISMISSED_STORAGE_KEY) === '1') {
            dismissed.value = true;
        }
    } catch {
        // Ignore storage failures (private browsing, disabled storage, etc.).
    }
});
</script>

<style lang="scss" scoped>
@use './PersistenceBanner.scss';
</style>
