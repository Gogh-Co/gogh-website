<template>
    <div class="terminal-frame">
        <div class="terminal-frame__bar">
            <div class="terminal-frame__title">{{ title }}</div>
            <div class="terminal-frame__btns" aria-hidden="true">
                <span class="terminal-frame__btn terminal-frame__btn--min"></span>
                <span class="terminal-frame__btn terminal-frame__btn--max"></span>
                <span class="terminal-frame__btn terminal-frame__btn--close"></span>
            </div>
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
// Window chrome shared by the lightbox's alternative previews (Linux home,
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
.terminal-frame {
    box-sizing: border-box;
    margin: 0 0 50px;
    box-shadow: 2px 4px 20px rgba(27, 27, 27, 0.95);
}

.terminal-frame__bar {
    position: relative;
    height: 25px;
    border-radius: 5px 5px 0 0;
    background-color: #d9d9d9;
    text-align: center;
}

.terminal-frame__title {
    position: absolute;
    top: 4px;
    right: 0;
    left: 0;
    overflow: hidden;
    padding: 0 70px;
    color: #424242;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.2;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.terminal-frame__btns {
    position: absolute;
    top: 7px;
    right: 10px;
    font-size: 0;
}

.terminal-frame__btn {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin: 0 4px;
    border-radius: 100px;
}

.terminal-frame__btn--min {
    background-color: #868686;
}

.terminal-frame__btn--max {
    background-color: #656565;
}

.terminal-frame__btn--close {
    background-color: #171717;
}

.terminal-frame__body {
    box-sizing: border-box;
    overflow-x: auto;
    padding: 20px 24px;
    border: 1px solid #d9d9d9;
    border-radius: 0 0 5px 5px;
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
