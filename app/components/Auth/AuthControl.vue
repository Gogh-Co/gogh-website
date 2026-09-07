<template>
    <div class="auth-control">
        <button
            v-if="!user"
            type="button"
            class="auth-control__signin"
            :disabled="pending"
            @click="onSignIn"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path fill="currentColor" d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.44-2.44-.97-2.44-.97c-.33-.84-.81-1.06-.81-1.06c-.66-.45.05-.44.05-.44c.73.05 1.12.75 1.12.75c.65 1.11 1.7.79 2.12.6c.06-.47.25-.79.46-.97c-1.6-.18-3.29-.8-3.29-3.57c0-.79.28-1.43.75-1.94c-.08-.18-.32-.92.07-1.92c0 0 .61-.2 2 .74a6.94 6.94 0 0 1 3.64 0c1.39-.94 2-.74 2-.74c.39 1 .15 1.74.07 1.92c.47.51.75 1.15.75 1.94c0 2.78-1.69 3.39-3.3 3.57c.26.22.49.66.49 1.33l-.01 1.97c0 .21.15.46.55.38A8 8 0 0 0 8 0"/>
            </svg>
            <span>Sign in with GitHub</span>
        </button>

        <div v-else class="auth-control__menu">
            <button
                type="button"
                class="auth-control__avatar-button"
                :aria-expanded="menuOpen"
                aria-haspopup="menu"
                @click="menuOpen = !menuOpen"
            >
                <img class="auth-control__avatar" :src="user.avatarUrl" :alt="`${user.login} avatar`" width="26" height="26">
                <span class="auth-control__login">{{ user.login }}</span>
                <span class="auth-control__sync-dot" :class="`auth-control__sync-dot--${syncState}`" :title="syncStateLabel"></span>
            </button>

            <div v-if="menuOpen" class="auth-control__panel" role="menu">
                <NuxtLink v-if="user.isAdmin" to="/admin/" class="auth-control__panel-item" role="menuitem" @click="menuOpen = false">
                    Admin panel
                </NuxtLink>
                <button type="button" class="auth-control__panel-item" role="menuitem" @click="onSignOut">
                    Sign out
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
const { user, login, logout } = useAuth();
const { syncState, mergeAfterLogin, resetSyncStateOnLogout } = useFavorites();

const pending = ref(false);
const menuOpen = ref(false);

const syncStateLabel = computed(() => {
    switch (syncState.value) {
        case 'syncing': return 'Syncing favorites…';
        case 'synced': return 'Favorites synced';
        case 'error': return 'Favorites sync error';
        default: return '';
    }
});

async function onSignIn() {
    pending.value = true;
    try {
        const result = await login(useRoute().fullPath);
        if (result.ok && user.value) {
            await mergeAfterLogin(user.value.id);
        }
    } finally {
        pending.value = false;
    }
}

async function onSignOut() {
    menuOpen.value = false;
    await logout();
    resetSyncStateOnLogout();
}
</script>

<style lang="scss" scoped>
@use './AuthControl.scss';
</style>
