// Link previews (WhatsApp, Telegram, Slack, Facebook...) come from the Open
// Graph / Twitter tags, but some crawlers only read the start of the page.
// WhatsApp in particular gives up before the end of a large <head>. By default
// unhead puts these meta tags after every inlined <style> block, which on a
// theme page is ~400KB into the HTML, so WhatsApp showed no preview at all.
// This moves them right after <title>, before the scripts and styles.

// Title is 10 and the import map 25 in unhead's server order (capo).
const SOCIAL_META_WEIGHT = 15;

function isSocialMeta(props: Record<string, unknown>) {
    const key = String(props.property || props.name || '');
    return key === 'description' || key.startsWith('og:') || key.startsWith('twitter:');
}

export default defineNuxtPlugin({
    name: 'gogh:social-meta-first',
    setup(nuxtApp) {
        const head = nuxtApp.ssrContext?.head;
        head?.hooks?.hook('entries:normalize', ({ tags }) => {
            for (const tag of tags) {
                // useSeoMeta() entries arrive as one `_flatMeta` tag that
                // unhead later unpacks into meta tags, each keeping its weight.
                if (tag.tag === '_flatMeta' || (tag.tag === 'meta' && isSocialMeta(tag.props))) {
                    tag.tagPriority = SOCIAL_META_WEIGHT;
                }
            }
        });
    },
});
