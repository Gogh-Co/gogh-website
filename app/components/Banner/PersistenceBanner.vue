<template>
    <div v-if="!dismissed && !user" class="persistence-banner" role="note">
        <p class="persistence-banner__text">
            Favorites save in this browser. Sign in with GitHub to sync across devices.
        </p>

        <button
            type="button"
            class="persistence-banner__help"
            aria-haspopup="dialog"
            :aria-expanded="helpOpen"
            aria-label="How does this work?"
            title="How does this work?"
            @click="helpOpen = true"
        >
            ?
        </button>

        <button type="button" class="persistence-banner__dismiss" aria-label="Dismiss notification" @click="dismiss">
            ×
        </button>

    </div>

    <!--
        Teleported to <body>: `.persistence-banner` above uses `transform`
        (to center itself on wide screens), which - per the CSS spec -
        makes it the containing block for any `position: fixed` descendant.
        Left inline, this lightbox would be confined to the banner's own
        small box instead of covering the viewport. Teleporting it out of
        that DOM subtree sidesteps the issue entirely.
    -->
    <Teleport to="body">
        <div v-if="helpOpen" class="persistence-banner__lightbox" @click.self="helpOpen = false">
            <div class="persistence-banner__lightbox-content" role="dialog" aria-modal="true" aria-labelledby="persistence-help-title">
                <button
                    type="button"
                    class="persistence-banner__lightbox-close"
                    aria-label="Close"
                    @click="helpOpen = false"
                >
                    ×
                </button>

                <h3 id="persistence-help-title">How favorites are saved</h3>
                <p>Clicking the star on a theme saves it in this browser only, right away - no account needed.</p>
                <p>Signing in with GitHub additionally creates a small public Gist in your account named <code>gogh.yaml</code>, so your favorites follow you to any other device you sign in on.</p>
                <p>Signing out never deletes anything - your local favorites stay, and your Gist is untouched until you sign back in.</p>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
const DISMISSED_STORAGE_KEY = 'gogh-persistence-banner-dismissed';

const { user } = useAuth();
const helpOpen = ref(false);
const dismissed = ref(false);

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
