import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import type { MessageParams } from '~/i18n/translate';

// A translated message with markup inside: each {placeholder} that has a
// slot of the same name renders that slot (a link, <strong>, <code>...),
// the rest come from `params`.
//
//   <I18nT keypath="footer.madeBy" tag="span">
//       <template #author><a href="...">Miguel</a></template>
//   </I18nT>
export default defineComponent({
    name: 'I18nT',
    props: {
        keypath: {
            type: String,
            required: true,
        },
        // Wrapper element; an empty string renders the parts without one.
        tag: {
            type: String,
            default: 'span',
        },
        params: {
            type: Object as PropType<MessageParams>,
            default: () => ({}),
        },
    },
    setup(props, { slots }) {
        const { template, format } = useI18n();

        return () => {
            // The plural form is picked with every param (a slot can stand
            // for {count}), then slots replace their placeholders and params
            // fill the rest.
            const text = template(props.keypath, props.params);
            const children: VNodeChild[] = [];
            let last = 0;
            const pushText = (end: number) => {
                if (end > last) {
                    children.push(format(text.slice(last, end), props.params));
                }
            };
            for (const match of text.matchAll(/\{(\w+)\}/g)) {
                const slot = slots[match[1]!];
                if (!slot) {
                    continue;
                }
                pushText(match.index!);
                children.push(slot());
                last = match.index! + match[0].length;
            }
            pushText(text.length);
            return props.tag ? h(props.tag, children) : children;
        };
    },
});
