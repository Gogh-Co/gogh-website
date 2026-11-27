import { defineComponent, h, type VNode } from 'vue';
import { NuxtLink } from '#components';

// Renders the history page's light inline markup without v-html:
// **bold**, *italic*, `code` and [label](url). Site paths (/wcsg) become
// NuxtLinks; anything else opens in a new tab.
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

export function renderInline(text: string): (VNode | string)[] {
    const nodes: (VNode | string)[] = [];
    let last = 0;
    for (const match of text.matchAll(TOKEN)) {
        const token = match[0];
        const start = match.index ?? 0;
        if (start > last) {
            nodes.push(text.slice(last, start));
        }
        if (token.startsWith('**')) {
            nodes.push(h('strong', token.slice(2, -2)));
        } else if (token.startsWith('`')) {
            nodes.push(h('code', token.slice(1, -1)));
        } else if (token.startsWith('[')) {
            const [, label = '', href = ''] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/) ?? [];
            nodes.push(href.startsWith('/')
                ? h(NuxtLink, { to: href }, () => renderInline(label))
                : h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, renderInline(label)));
        } else {
            nodes.push(h('em', token.slice(1, -1)));
        }
        last = start + token.length;
    }
    if (last < text.length) {
        nodes.push(text.slice(last));
    }
    return nodes;
}

export default defineComponent({
    name: 'RichText',
    props: {
        text: { type: String, required: true },
        tag: { type: String, default: 'p' },
    },
    setup(props) {
        return () => h(props.tag, renderInline(props.text));
    },
});
