<template>
    <!-- Sits beside FavoriteButton on a gallery card. Clicks and Enter/Space
         must not bubble to the card, which would open the lightbox instead. -->
    <NuxtLink
        class="theme-page-link"
        :to="themePagePath(themeName)"
        :aria-label="`Open the ${themeName} theme page`"
        :title="`${themeName} theme page`"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <!-- Material Symbols "arrow_outward" (Apache 2.0) -->
            <path fill="currentColor" d="M6.4 18L5 16.6L14.6 7H6V5h12v12h-2V8.4z" />
        </svg>
    </NuxtLink>
</template>

<script setup>
defineProps({
    themeName: {
        type: String,
        required: true,
    },
});
</script>

<style lang="scss" scoped>
@use './ThemePageLink.scss';
</style>
