<template>
    <transition name="favorites-sign-in-banner">
        <div v-if="visible" class="favorites-sign-in-banner" role="status">
            <I18nT keypath="favoritesBanner.text" tag="p" class="favorites-sign-in-banner__text">
                <template #signIn><strong>{{ t('auth.signIn') }}</strong></template>
            </I18nT>

            <div class="favorites-sign-in-banner__actions">
                <button
                    type="button"
                    class="favorites-sign-in-banner__signin"
                    :disabled="pending"
                    @click="onSignIn"
                >
                    {{ t('auth.signIn') }}
                </button>
                <button
                    type="button"
                    class="favorites-sign-in-banner__close"
                    :aria-label="t('common.dismiss')"
                    @click="emit('close')"
                >
                    ×
                </button>
            </div>
        </div>
    </transition>
</template>

<script setup>
import I18nT from '@/components/I18nT';

defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['close']);
const { t } = useI18n();

const { user, login } = useAuth();
const { mergeAfterLogin } = useFavorites();

const pending = ref(false);

async function onSignIn() {
    pending.value = true;
    try {
        const result = await login(useRoute().fullPath, 'favorites-banner');
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
