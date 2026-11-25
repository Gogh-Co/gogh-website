<template>
    <svg
        class="mock-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        :width="size"
        :height="size"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <template v-if="name === 'wifi'">
            <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M9 16a4.5 4.5 0 0 1 6 0" />
            <circle cx="12" cy="19.5" r="1" fill="currentColor" />
        </template>
        <polyline v-else-if="name === 'bluetooth'" points="7,7 17,16.5 12,21.5 12,2.5 17,7.5 7,17" />
        <template v-else-if="name === 'volume'">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
        </template>
        <template v-else-if="name === 'power'">
            <path d="M12 3v8" />
            <path d="M7 6.5a8 8 0 1 0 10 0" />
        </template>
        <template v-else-if="name === 'search'">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5.5 5.5" />
        </template>
        <polygon v-else-if="name === 'play'" points="8,5 19,12 8,19" fill="currentColor" />
        <template v-else-if="name === 'pause'">
            <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
            <rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
        </template>
        <template v-else-if="name === 'next'">
            <polygon points="6,6 14.5,12 6,18" fill="currentColor" />
            <path d="M18 6v12" />
        </template>
        <template v-else-if="name === 'prev'">
            <polygon points="18,6 9.5,12 18,18" fill="currentColor" />
            <path d="M6 6v12" />
        </template>
        <path v-else-if="name === 'moon'" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        <template v-else-if="name === 'sun'">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </template>
        <template v-else-if="name === 'bell'">
            <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
            <path d="M10 21h4" />
        </template>
        <template v-else-if="name === 'music'">
            <path d="M9 18V5.5l11-2V16" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="17.5" cy="16" r="2.5" />
        </template>
        <template v-else-if="name === 'apps'">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </template>
        <template v-else-if="name === 'terminal'">
            <rect x="3" y="4.5" width="18" height="15" rx="2" />
            <path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" />
        </template>
        <template v-else-if="name === 'globe'">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </template>
        <template v-else-if="name === 'image'">
            <rect x="3.5" y="5" width="17" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M20.5 16l-5-5-8.5 8" />
        </template>
        <template v-else-if="name === 'sliders'">
            <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
            <circle cx="15" cy="7" r="2" />
            <circle cx="9" cy="17" r="2" />
        </template>
        <template v-else-if="name === 'folder'">
            <path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
        </template>
        <template v-else-if="name === 'home'">
            <path d="M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5" />
        </template>
        <template v-else-if="name === 'clock'">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
        </template>
        <path v-else-if="name === 'star'" d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" />
        <template v-else-if="name === 'trash'">
            <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
        </template>
        <template v-else-if="name === 'download'">
            <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />
        </template>
        <template v-else-if="name === 'network'">
            <rect x="9" y="3.5" width="6" height="5" rx="1" />
            <rect x="3" y="15.5" width="6" height="5" rx="1" />
            <rect x="15" y="15.5" width="6" height="5" rx="1" />
            <path d="M12 8.5v3.5M6 15.5V12h12v3.5" />
        </template>
        <template v-else-if="name === 'battery'">
            <rect x="3" y="7.5" width="16" height="9" rx="2" />
            <path d="M21.5 10.5v3" />
            <rect x="5" y="9.5" width="9" height="5" rx="1" fill="currentColor" stroke="none" />
        </template>
        <template v-else-if="name === 'chevron-left'">
            <path d="M14.5 6l-6 6 6 6" />
        </template>
        <template v-else-if="name === 'chevron-right'">
            <path d="M9.5 6l6 6-6 6" />
        </template>
        <template v-else-if="name === 'menu'">
            <path d="M5 7h14M5 12h14M5 17h14" />
        </template>
        <template v-else-if="name === 'camera'">
            <path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
            <circle cx="12" cy="12.5" r="3.5" />
        </template>
        <template v-else>
            <circle cx="12" cy="12" r="8" />
        </template>
    </svg>
</template>

<script setup>
// Simple line icons for the desktop mockups, drawn from basic shapes so
// they render the same everywhere without an icon font.
defineProps({
    name: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        default: 14,
    },
});
</script>

<style scoped>
.mock-icon {
    display: inline-block;
    flex: 0 0 auto;
    vertical-align: middle;
}
</style>
