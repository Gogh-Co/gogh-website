<template>
    <TerminalFrame :theme="theme" :title="`user@linux: ~ — ${themeName}`">
        <div class="home-preview">
            <div v-for="(line, lineIndex) in lines" :key="lineIndex" class="home-preview__line">
                <template v-if="line.length">
                    <span
                        v-for="(segment, segmentIndex) in line"
                        :key="segmentIndex"
                        :class="{ 'home-preview__bold': segment.bold }"
                        :style="{ color: colorFor(segment.color) }"
                    >{{ segment.text }}</span>
                </template>
                <template v-else>&nbsp;</template>
            </div>
            <div class="home-preview__line">
                <span
                    v-for="(segment, segmentIndex) in prompt('~/projects/gogh')"
                    :key="segmentIndex"
                    :class="{ 'home-preview__bold': segment.bold }"
                    :style="{ color: colorFor(segment.color) }"
                >{{ segment.text }}</span>
                <span class="home-preview__cursor" :style="{ backgroundColor: theme.cursor || theme.foreground }"></span>
            </div>
        </div>
    </TerminalFrame>
</template>

<script setup>
import TerminalFrame from './TerminalFrame.vue';

// A default Ubuntu-style bash session in $HOME, coloured the way stock
// dircolors / PS1 / git do it, so a palette can be judged on everyday output
// rather than on swatches. Colour slots: 02 red, 03 green, 05 blue, 07 cyan.
const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

const themeName = computed(() => (props.theme?.name || props.theme?.theme || 'Theme').toString());

function colorFor(key) {
    return key ? props.theme[key] : props.theme.foreground;
}

function seg(text, color = null, bold = false) {
    return { text, color, bold };
}

// Stock Ubuntu PS1: bold green user@host, bold blue working directory.
function prompt(path) {
    return [
        seg('user@linux', 'color_03', true),
        seg(':'),
        seg(path, 'color_05', true),
        seg('$ '),
    ];
}

const dir = (name) => seg(name, 'color_05', true);
const exe = (name) => seg(name, 'color_03', true);
const archive = (name) => seg(name, 'color_02', true);
const link = (name) => seg(name, 'color_07', true);

const lines = [
    [...prompt('~'), seg('ls')],
    [dir('Desktop'), seg('    '), dir('Downloads'), seg('  '), dir('Pictures'), seg('  '), dir('Templates'), seg('  '), archive('backup.tar.gz'), seg('  '), seg('notes.txt')],
    [dir('Documents'), seg('  '), dir('Music'), seg('      '), dir('Public'), seg('    '), dir('Videos'), seg('     '), exe('deploy.sh'), seg('      '), link('projects'), seg(' -> /srv/projects')],
    [...prompt('~'), seg('ls -la')],
    [seg('total 68')],
    [seg('drwxr-x--- 17 user user 4096 Nov 25 09:14 '), dir('.')],
    [seg('drwxr-xr-x  3 root root 4096 Oct  2 18:40 '), dir('..')],
    [seg('-rw-r--r--  1 user user 3771 Oct  2 18:40 '), seg('.bashrc')],
    [seg('drwx------ 12 user user 4096 Nov 24 21:07 '), dir('.config')],
    [seg('-rwxr-xr-x  1 user user  512 Nov 22 10:03 '), exe('deploy.sh')],
    [seg('-rw-r--r--  1 user user 9.1M Nov 21 08:55 '), archive('backup.tar.gz')],
    [seg('lrwxrwxrwx  1 user user   13 Nov 18 12:20 '), link('projects'), seg(' -> /srv/projects')],
    [...prompt('~'), seg('cd projects/gogh && git status')],
    [seg('On branch main')],
    [seg("Your branch is up to date with 'origin/main'.")],
    [],
    [seg('Changes to be committed:')],
    [seg('        '), seg('new file:   themes/aurora.yml', 'color_03')],
    [],
    [seg('Changes not staged for commit:')],
    [seg('        '), seg('modified:   README.md', 'color_02')],
    [],
    [seg('Untracked files:')],
    [seg('        '), seg('notes.md', 'color_02')],
];
</script>

<style lang="scss" scoped>
.home-preview__line {
    white-space: pre;
}

.home-preview__bold {
    font-weight: 700;
}

.home-preview__cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.15em;
    vertical-align: text-bottom;
    animation: home-preview-blink 1s step-end infinite;
}

@keyframes home-preview-blink {
    50% {
        opacity: 0;
    }
}
</style>
