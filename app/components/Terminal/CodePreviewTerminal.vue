<template>
    <TerminalFrame :theme="theme" :title="`loadTheme.js — ${themeName}`">
        <div class="code-preview">
            <div v-for="(line, lineIndex) in highlightedLines" :key="lineIndex" class="code-preview__line">
                <span class="code-preview__gutter" :style="{ color: theme.color_09 }">{{ lineIndex + 1 }}</span>
                <span class="code-preview__code"><span
                    v-for="(token, tokenIndex) in line"
                    :key="tokenIndex"
                    :class="`code-preview__token--${token.type}`"
                    :style="{ color: colorFor(token.type) }"
                >{{ token.text }}</span></span>
            </div>
        </div>
    </TerminalFrame>
</template>

<script setup>
import TerminalFrame from './TerminalFrame.vue';

// Shows the palette as a terminal editor (vim, nano, micro...) would paint
// JavaScript with the 16 ANSI colours: each token type maps to one slot.
const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

const TOKEN_COLOR_KEYS = {
    comment: 'color_09',
    keyword: 'color_06',
    string: 'color_03',
    number: 'color_04',
    function: 'color_05',
    property: 'color_07',
    type: 'color_04',
    constant: 'color_02',
    plain: null,
};

const SOURCE = `// Load a saved theme, retrying before giving up.
import { readFile } from 'node:fs/promises';

const DEFAULT_THEME = 'Dracula';
const MAX_RETRIES = 3;

export async function loadTheme(name = DEFAULT_THEME) {
    const cache = new Map();

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const raw = await readFile(\`./themes/\${name}.json\`, 'utf8');
            const theme = JSON.parse(raw);
            cache.set(theme.name, { ...theme, loaded: true });
            return theme;
        } catch (error) {
            console.warn(\`Attempt \${attempt} failed:\`, error.message);
        }
    }

    throw new Error(\`Theme "\${name}" not found\`);
}`;

const KEYWORDS = new Set([
    'import', 'from', 'export', 'const', 'let', 'async', 'await', 'function',
    'for', 'try', 'catch', 'return', 'throw', 'new',
]);
const CONSTANTS = new Set(['true', 'false', 'null', 'undefined']);

const TOKEN_PATTERN = /(\/\/.*)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;

function classifyWord(word, before, after) {
    if (KEYWORDS.has(word)) return 'keyword';
    if (CONSTANTS.has(word)) return 'constant';
    if (/^[A-Z][A-Z0-9_]+$/.test(word)) return 'constant';
    if (/^[A-Z]/.test(word)) return 'type';
    if (/^\s*\(/.test(after)) return 'function';
    if (/\.\s*$/.test(before) || /^\s*:/.test(after)) return 'property';
    return 'plain';
}

function tokenizeLine(line) {
    const tokens = [];
    for (const match of line.matchAll(TOKEN_PATTERN)) {
        const [text, comment, string, number, word] = match;
        let type = 'plain';
        if (comment) type = 'comment';
        else if (string) type = 'string';
        else if (number) type = 'number';
        else if (word) {
            type = classifyWord(word, line.slice(0, match.index), line.slice(match.index + text.length));
        }

        const previous = tokens[tokens.length - 1];
        if (previous && previous.type === type) {
            previous.text += text;
        } else {
            tokens.push({ type, text });
        }
    }
    return tokens.length ? tokens : [{ type: 'plain', text: ' ' }];
}

const highlightedLines = SOURCE.split('\n').map(tokenizeLine);

const themeName = computed(() => (props.theme?.name || props.theme?.theme || 'Theme').toString());

function colorFor(type) {
    const key = TOKEN_COLOR_KEYS[type];
    return key ? props.theme[key] : props.theme.foreground;
}
</script>

<style lang="scss" scoped>
.code-preview__line {
    display: flex;
    white-space: pre;
}

.code-preview__gutter {
    flex: 0 0 auto;
    min-width: 2ch;
    margin-right: 2ch;
    text-align: right;
    user-select: none;
}

.code-preview__token--comment {
    font-style: italic;
}

.code-preview__token--keyword {
    font-weight: 700;
}
</style>
