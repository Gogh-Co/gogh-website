<template>
    <!-- Sits beside FavoriteButton on a gallery card as a visual cue: the
         card itself is already a link to the same page, so this one stays
         out of the tab order and away from screen readers. -->
    <NuxtLink
        class="theme-page-link"
        :to="themePagePath(themeName)"
        :title="`${themeName} theme page`"
        tabindex="-1"
        aria-hidden="true"
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
