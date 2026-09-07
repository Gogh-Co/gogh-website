<template>
    <transition name="favorites-sign-in-banner">
        <div v-if="visible" class="favorites-sign-in-banner" role="status">
            <p class="favorites-sign-in-banner__text">
                <strong>Sign in with GitHub</strong> to keep your favorites — they'll be saved to your account instead of just this browser.
            </p>

            <div class="favorites-sign-in-banner__actions">
                <button
                    type="button"
                    class="favorites-sign-in-banner__signin"
                    :disabled="pending"
                    @click="onSignIn"
                >
                    Sign in with GitHub
                </button>
                <button
                    type="button"
                    class="favorites-sign-in-banner__close"
                    aria-label="Dismiss notification"
                    @click="emit('close')"
                >
                    ×
                </button>
            </div>
        </div>
    </transition>
</template>

<script setup>
defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['close']);

const { user, login } = useAuth();
const { mergeAfterLogin } = useFavorites();

const pending = ref(false);

async function onSignIn() {
    pending.value = true;
    try {
        const result = await login(useRoute().fullPath);
        if (result.ok && user.value) {
            await mergeAfterLogin(user.value.id);
            emit('close');
        }
    } finally {
        pending.value = false;
    }
}
</script>

<style lang="scss" scoped>
@use './FavoritesSignInBanner.scss';
</style>
