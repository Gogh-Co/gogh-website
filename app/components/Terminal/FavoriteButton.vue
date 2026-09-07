<template>
    <button
        type="button"
        class="favorite-button"
        :class="{ 'is-active': active }"
        :aria-pressed="active"
        :aria-label="active ? `Remove ${themeName} from favorites` : `Add ${themeName} to favorites`"
        @click.stop="emit('toggle')"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
            <path
                v-if="active"
                fill="currentColor"
                d="m12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41l-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"
            />
            <path
                v-else
                fill="currentColor"
                d="M12 15.4l-3.76 2.27l1-4.28l-3.32-2.88l4.38-.38L12 6.1l1.71 4.04l4.38.38l-3.32 2.88l1 4.28zm0-12.4L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08L12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.32-1.68-.56-1.75l-4.83-.41z"
            />
        </svg>
    </button>
</template>

<script setup>
defineProps({
    active: {
        type: Boolean,
        default: false,
    },
    themeName: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(['toggle']);
</script>

<style lang="scss" scoped>
@use './FavoriteButton.scss';
</style>
