// Custom events for Plausible (the script and its queue stub live in
// nuxt.config.ts). Pageviews, outbound links, file downloads and form
// submissions are captured by the script itself; this covers the actions
// that don't leave a trace on their own (copying, blob downloads, filters…).
//
// Goals to add in the Plausible dashboard (Site settings → Goals → Custom
// event), one per name below:
//   Install Copy   place, os, theme   copied an install command
//   Download       kind, theme        session GIF/MP4, generator YAML, wallpaper, WCAG data
//   Session        action, format,    live session: play / pause / chapter jump /
//                  chapter            export-start / export-cancel / export-error
//   Share          network            a share button (or "copy-link")
//   Favorite       action, theme,     starred / unstarred a theme (gallery card or
//                  place              the live session's star)
//   Random Theme   via                dice button or the R key
//   Search         query, results     gallery search, sent once typing settles
//   Gallery Filter filter, field      a gallery filter button / colour filter
//   Gallery View   view               compact / detailed
//   Color Copy     slot               a hex copied from a theme's palette
//   Sign In        source             a completed GitHub sign-in (popup)
//   Language       lang               a language picked in the switcher
//
// Elements can also be tagged without JS: class="plausible-event-name=Share
// plausible-event-network=x" (spaces as "+"). Only use that where no
// ancestor stops the click from bubbling to the document.

type EventProps = Record<string, string | number | boolean | null | undefined>;

type PlausibleFn = (event: string, options?: { props?: Record<string, string> }) => void;

// The same event with the same props inside this window is a double click or
// a re-render, not a second action.
const REPEAT_WINDOW_MS = 1000;
const recent = new Map<string, number>();

export function trackEvent(event: string, props?: EventProps): void {
    if (typeof window === 'undefined') {
        return;
    }

    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(props ?? {})) {
        if (value !== undefined && value !== null && value !== '') {
            // Plausible caps property values at 2000 chars; ours are short.
            clean[key] = String(value).slice(0, 120);
        }
    }

    const signature = `${event}|${JSON.stringify(clean)}`;
    const now = Date.now();
    const last = recent.get(signature);
    if (last !== undefined && now - last < REPEAT_WINDOW_MS) {
        return;
    }
    if (recent.size > 100) {
        recent.clear();
    }
    recent.set(signature, now);

    try {
        const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
        if (typeof plausible === 'function') {
            plausible(event, Object.keys(clean).length ? { props: clean } : undefined);
        }
    } catch {
        // Analytics must never break the page.
    }
}
