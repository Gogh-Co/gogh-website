<template>
    <TerminalFrame :theme="theme" :title="`${languageConfig.fileName} — ${themeName}`">
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
// source code with the 16 ANSI colours: each token type maps to one slot.
const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
    // Key of LANGUAGES below; anything else falls back to JavaScript.
    language: {
        type: String,
        default: 'javascript',
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
    decorator: 'color_04',
    constant: 'color_02',
    plain: null,
};

const LANGUAGES = {
    javascript: {
        fileName: 'loadTheme.js',
        commentPattern: '\\/\\/.*',
        keywords: [
            'import', 'from', 'export', 'const', 'let', 'async', 'await', 'function',
            'for', 'try', 'catch', 'return', 'throw', 'new',
        ],
        constants: ['true', 'false', 'null', 'undefined'],
        builtinTypes: [],
        source: `// Load a saved theme, retrying before giving up.
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
}`,
    },
    python: {
        fileName: 'load_theme.py',
        commentPattern: '#.*',
        keywords: [
            'import', 'from', 'def', 'class', 'return', 'for', 'in', 'try', 'except',
            'as', 'raise', 'if', 'else', 'with', 'not', 'and', 'or',
        ],
        constants: ['True', 'False', 'None', 'self'],
        builtinTypes: ['str', 'int', 'list', 'dict', 'bool'],
        source: `# Load a saved theme, retrying before giving up.
import json
from dataclasses import dataclass
from pathlib import Path

MAX_RETRIES = 3


@dataclass
class Theme:
    name: str
    colors: list[str]
    loaded: bool = False


def load_theme(name: str = "Dracula") -> Theme:
    path = Path("themes") / f"{name}.json"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            data = json.loads(path.read_text("utf8"))
            return Theme(data["name"], data["colors"], loaded=True)
        except OSError as error:
            print(f"Attempt {attempt} failed: {error}")

    raise LookupError(f'Theme "{name}" not found')`,
    },
};

function buildTokenPattern(commentPattern) {
    return new RegExp(
        `(${commentPattern})`
        + '|((?:\\b[rbfu])?(?:\'(?:[^\'\\\\]|\\\\.)*\'|"(?:[^"\\\\]|\\\\.)*"|`(?:[^`\\\\]|\\\\.)*`))'
        + '|(\\b\\d+(?:\\.\\d+)?\\b)'
        + '|(@[A-Za-z_][\\w.]*)'
        + '|([A-Za-z_$][\\w$]*)'
        + '|(\\s+)|(.)',
        'g',
    );
}

function classifyWord(word, before, after, config) {
    if (config.keywords.has(word)) return 'keyword';
    if (config.constants.has(word)) return 'constant';
    if (config.builtinTypes.has(word)) return 'type';
    if (/^[A-Z][A-Z0-9_]+$/.test(word)) return 'constant';
    if (/^[A-Z]/.test(word)) return 'type';
    if (/^\s*\(/.test(after)) return 'function';
    if (/\.\s*$/.test(before) || /^\s*:(?!:)/.test(after)) return 'property';
    return 'plain';
}

function tokenizeLine(line, config) {
    const tokens = [];
    for (const match of line.matchAll(config.pattern)) {
        const [text, comment, string, number, decorator, word] = match;
        let type = 'plain';
        if (comment) type = 'comment';
        else if (string) type = 'string';
        else if (number) type = 'number';
        else if (decorator) type = 'decorator';
        else if (word) {
            type = classifyWord(word, line.slice(0, match.index), line.slice(match.index + text.length), config);
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

// Tokenize each language once, on first use, and share it across instances.
const highlightCache = new Map();

function highlight(language) {
    if (!highlightCache.has(language)) {
        const definition = LANGUAGES[language];
        const config = {
            pattern: buildTokenPattern(definition.commentPattern),
            keywords: new Set(definition.keywords),
            constants: new Set(definition.constants),
            builtinTypes: new Set(definition.builtinTypes),
        };
        highlightCache.set(language, definition.source.split('\n').map((line) => tokenizeLine(line, config)));
    }
    return highlightCache.get(language);
}

const languageConfig = computed(() => LANGUAGES[props.language] || LANGUAGES.javascript);
const highlightedLines = computed(() => highlight(props.language in LANGUAGES ? props.language : 'javascript'));

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
