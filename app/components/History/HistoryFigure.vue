<template>
    <figure class="hfig" :class="{ 'hfig--flush': flush }">
        <figcaption class="hfig__label">
            <span class="hfig__dot" aria-hidden="true"></span>
            {{ label }}
        </figcaption>
        <!-- The live experiment is complementary; captions remain in Reader View. -->
        <aside class="hfig__stage" :aria-label="label">
            <slot />
        </aside>
        <p v-if="caption" class="hfig__caption">{{ caption }}</p>
    </figure>
</template>

<script setup>
// Frame shared by the history page's interactive figures: a numbered label,
// the figure itself and a one-line caption.
defineProps({
    label: { type: String, required: true },
    caption: { type: String, default: '' },
    // No inner padding (figures that draw edge to edge).
    flush: { type: Boolean, default: false },
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/base' as *;

.hfig {
    position: relative;
    display: flex;
    flex-direction: column;
    margin: 0;
    border: 1px solid var(--ink-line);
    background:
        radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--accent, #f1c40f) 7%, transparent), transparent 60%),
        var(--ink-2);
    color: var(--cream);
}

.hfig__label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ink-line);
    color: var(--muted);
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.hfig__dot {
    width: 8px;
    height: 8px;
    background: var(--accent, var(--gogh-yellow));
    box-shadow: 0 0 12px var(--accent, var(--gogh-yellow));
}

.hfig__stage {
    flex: 1;
    padding: 20px;

    @include m768 {
        padding: 28px;
    }

    .hfig--flush & {
        padding: 0;
    }
}

.hfig__caption.hfig__caption {
    margin: 0;
    padding: 14px 20px 18px;
    border-top: 1px solid var(--ink-line);
    color: var(--muted);
    font-size: 1.3rem;
    line-height: 1.5;
}
</style>
