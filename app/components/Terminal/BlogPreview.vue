<template>
    <div
        class="browser-frame"
        :style="{
            '--win-bg': theme.background,
            '--win-fg': theme.foreground,
            '--win-red': theme.color_02,
            '--win-yellow': theme.color_04,
            '--win-green': theme.color_03,
        }"
    >
        <div class="browser-frame__bar">
            <span class="browser-frame__dots" aria-hidden="true"><span></span><span></span><span></span></span>
            <span class="browser-frame__address">notes.example.dev/blog</span>
        </div>

        <!-- A plain blog styled only with the theme's 16 colours, the way
             terminal-inspired static-site themes (Hugo, Jekyll...) do it. -->
        <div class="blog" :style="vars">
            <header class="blog__header">
                <span class="blog__logo">~/notes<span class="blog__caret">_</span></span>
                <nav class="blog__nav" :aria-label="t('previews.blog.navAria')">
                    <span class="blog__nav-item blog__nav-item--active">Posts</span>
                    <span class="blog__nav-item">Tags</span>
                    <span class="blog__nav-item">About</span>
                    <span class="blog__nav-item blog__nav-item--muted">RSS</span>
                </nav>
            </header>

            <div class="blog__layout">
                <main class="blog__main">
                    <article class="blog__post">
                        <div class="blog__meta">Nov 25, 2026 · 6 min read</div>
                        <div class="blog__title">Picking a terminal palette you can live with</div>
                        <div class="blog__tags">
                            <span class="blog__tag blog__tag--magenta">#terminal</span>
                            <span class="blog__tag blog__tag--green">#colors</span>
                            <span class="blog__tag blog__tag--yellow">#dotfiles</span>
                        </div>
                        <div class="blog__text">
                            After a year of switching schemes every week, I settled on {{ themeName }}. It keeps
                            <span class="blog__link">long sessions readable</span> and still makes
                            <code class="blog__inline-code">git diff</code> easy to scan.
                        </div>
                        <blockquote class="blog__quote">
                            Pick the palette for the errors you read at 2 a.m., not for the screenshot.
                        </blockquote>
                        <pre class="blog__code"><span class="t-comment"># install it in one line</span>
<span class="t-function">bash</span> -c <span class="t-string">"$(wget -qO- gogh.website/gogh)"</span> -- <span class="t-string">"{{ themeName }}"</span>
<span class="t-keyword">export</span> <span class="t-constant">TERM_THEME</span>=<span class="t-number">256</span></pre>
                        <div class="blog__more">Read more →</div>
                    </article>

                    <article class="blog__post blog__post--compact">
                        <div class="blog__meta">Nov 12, 2026 · 3 min read</div>
                        <div class="blog__title blog__title--small">Dotfiles that survive a reinstall</div>
                        <div class="blog__text">Symlinks, a bootstrap script and nothing clever. <span class="blog__link">Continue →</span></div>
                    </article>
                </main>

                <aside class="blog__aside">
                    <section class="blog__card">
                        <div class="blog__card-title">About</div>
                        <div class="blog__text blog__text--small">Notes on shells, editors and the small tools in between.</div>
                    </section>
                    <section class="blog__card">
                        <div class="blog__card-title">Tags</div>
                        <ul class="blog__tag-list">
                            <li><span class="blog__dot blog__dot--red"></span>linux <span>12</span></li>
                            <li><span class="blog__dot blog__dot--blue"></span>neovim <span>8</span></li>
                            <li><span class="blog__dot blog__dot--cyan"></span>shell <span>5</span></li>
                        </ul>
                    </section>
                    <section class="blog__card">
                        <div class="blog__card-title">Newsletter</div>
                        <span class="blog__input">you@example.com</span>
                        <span class="blog__button">Subscribe</span>
                    </section>
                </aside>
            </div>

            <footer class="blog__footer">© 2026 notes · built with a static site generator</footer>
        </div>
    </div>
</template>

<script setup>
const { t } = useI18n();
const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

const themeName = computed(() => (props.theme?.name || props.theme?.theme || 'Theme').toString());

// Every colour as a CSS variable so the stylesheet stays declarative.
const vars = computed(() => {
    const t = props.theme;
    const result = {
        '--bg': t.background,
        '--fg': t.foreground,
        '--surface': mixColors(t.background, t.foreground, 0.06),
        '--line': mixColors(t.background, t.foreground, 0.16),
        '--button-ink': inkOnFill(t.color_05, t.background),
    };
    for (let index = 1; index <= 16; index++) {
        const key = `color_${String(index).padStart(2, '0')}`;
        result[`--c${String(index).padStart(2, '0')}`] = t[key];
    }
    return result;
});
</script>

<style lang="scss" scoped>
@use './window-chrome' as chrome;

.browser-frame {
    @include chrome.window-root;
    margin: 0 0 30px;
    box-shadow: 2px 4px 20px rgba(27, 27, 27, 0.6);
}

// Same bar as the terminal windows, but the address field takes the
// centre, so the buttons stay in the flow instead of floating.
.browser-frame__bar {
    @include chrome.window-bar;
    justify-content: flex-start;
    gap: 14px;
}

.browser-frame__dots {
    display: inline-flex;
    flex-shrink: 0;
    gap: 7px;
    font-size: 0;

    span {
        @include chrome.window-btn;
    }
}

.browser-frame__address {
    flex: 1;
    overflow: hidden;
    padding: 4px 12px;
    border: 1px solid color-mix(in srgb, var(--win-fg) 12%, transparent);
    border-radius: 0;
    background: var(--win-bg);
    color: color-mix(in srgb, var(--win-fg) 75%, transparent);
    font-family: 'Roboto', sans-serif;
    font-size: 1.2rem;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.blog {
    container-type: inline-size;
    padding: 20px 24px 14px;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Roboto Mono', 'DejaVu Sans Mono', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    text-align: left;
}

.blog__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 0 14px;
    border-bottom: 1px dashed var(--line);
}

.blog__logo {
    color: var(--c05);
    font-weight: 700;
    font-size: 15px;
}

.blog__caret {
    color: var(--fg);
    animation: blog-blink 1s step-end infinite;
}

.blog__nav {
    display: flex;
    gap: 16px;
}

.blog__nav-item {
    color: var(--fg);
}

.blog__nav-item--active {
    color: var(--c05);
    border-bottom: 2px solid var(--c05);
}

.blog__nav-item--muted {
    color: var(--c09);
}

.blog__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    gap: 24px;
    padding: 18px 0;

    @container (max-width: 560px) {
        grid-template-columns: minmax(0, 1fr);
    }
}

.blog__post {
    display: grid;
    gap: 10px;
    padding: 0 0 18px;

    & + & {
        padding-top: 16px;
        border-top: 1px dashed var(--line);
    }
}

.blog__meta {
    color: var(--c09);
    font-size: 12px;
}

.blog__title {
    margin: 0;
    color: var(--fg);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
}

.blog__title--small {
    font-size: 15px;
}

.blog__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.blog__tag {
    padding: 0 8px;
    border: 1px solid currentColor;
    font-size: 12px;
}

.blog__tag--magenta { color: var(--c06); }
.blog__tag--green { color: var(--c03); }
.blog__tag--yellow { color: var(--c04); }

.blog__link {
    color: var(--c05);
    text-decoration: underline;
    text-underline-offset: 3px;
}

.blog__inline-code {
    padding: 1px 5px;
    background: var(--surface);
    color: var(--c02);
    font-size: 12px;
}

.blog__quote {
    margin: 0;
    padding: 4px 0 4px 14px;
    border-left: 3px solid var(--c04);
    color: var(--c08);
    font-style: italic;
}

.blog__code {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--fg);
    font-size: 12px;
    line-height: 1.6;
    white-space: pre;

    .t-comment { color: var(--c09); font-style: italic; }
    .t-keyword { color: var(--c06); font-weight: 700; }
    .t-string { color: var(--c03); }
    .t-number { color: var(--c04); }
    .t-function { color: var(--c05); }
    .t-constant { color: var(--c02); }
}

.blog__more {
    color: var(--c05);
    font-weight: 700;
}

.blog__aside {
    display: grid;
    align-content: start;
    gap: 14px;
}

.blog__card {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--line);
    background: var(--surface);
}

.blog__card-title {
    margin: 0;
    color: var(--c03);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.blog__text--small {
    font-size: 12px;
}

.blog__tag-list {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 12px;

    li {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    li span:last-child {
        margin-left: auto;
        color: var(--c09);
    }
}

.blog__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.blog__dot--red { background: var(--c02); }
.blog__dot--blue { background: var(--c05); }
.blog__dot--cyan { background: var(--c07); }

.blog__input {
    padding: 4px 8px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--c09);
    font-size: 12px;
}

.blog__button {
    padding: 5px 8px;
    background: var(--c05);
    color: var(--button-ink);
    font-size: 12px;
    font-weight: 700;
    text-align: center;
}

.blog__footer {
    padding: 10px 0 0;
    border-top: 1px dashed var(--line);
    color: var(--c09);
    font-size: 11px;
}

@keyframes blog-blink {
    50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
    .blog__caret { animation: none; }
}
</style>
