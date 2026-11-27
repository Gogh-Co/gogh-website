<template>
    <div
        class="terminal-frame"
        :style="{
            '--win-bg': theme.background,
            '--win-fg': theme.foreground,
            '--win-red': theme.color_02,
            '--win-yellow': theme.color_04,
            '--win-green': theme.color_03,
        }"
    >
        <div class="terminal-frame__bar">
            <div class="terminal-frame__btns" aria-hidden="true">
                <span class="terminal-frame__btn"></span>
                <span class="terminal-frame__btn"></span>
                <span class="terminal-frame__btn"></span>
            </div>
            <div class="terminal-frame__title">{{ title }}</div>
        </div>
        <div
            class="terminal-frame__body"
            :style="{ backgroundColor: theme.background, color: theme.foreground }"
        >
            <slot />
        </div>
    </div>
</template>

<script setup>
// Window chrome shared by the theme page's terminal previews (Linux home,
// JS code). Mirrors the title bar of Terminal.vue so every slide reads as
// the same window.
defineProps({
    theme: {
        type: Object,
        required: true,
    },
    title: {
        type: String,
        default: '',
    },
});
</script>

<style lang="scss" scoped>
@use './window-chrome' as chrome;

.terminal-frame {
    @include chrome.window-root;
    box-sizing: border-box;
    margin: 0 0 50px;
    box-shadow: 2px 4px 20px rgba(27, 27, 27, 0.95);
}

.terminal-frame__bar {
    @include chrome.window-bar;
}

.terminal-frame__title {
    @include chrome.window-title;
}

.terminal-frame__btns {
    @include chrome.window-btns;
}

.terminal-frame__btn {
    @include chrome.window-btn;
}

.terminal-frame__body {
    box-sizing: border-box;
    overflow-x: auto;
    padding: 20px 24px;
    font-family: 'Roboto Mono', 'DejaVu Sans Mono', 'Ubuntu Mono', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.55;
    text-align: left;

    @media (min-width: 768px) {
        padding: 24px 30px;
        font-size: 14px;
    }
}
</style>
