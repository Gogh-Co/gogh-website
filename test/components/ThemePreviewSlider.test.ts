import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import ThemePreviewSlider from '@/components/Terminal/ThemePreviewSlider.vue';

const theme = {
    name: 'Test Theme',
    background: '#101010',
    foreground: '#eeeeee',
    cursor: '#ffffff',
    ...Object.fromEntries(
        Array.from({ length: 16 }, (_, index) => [
            `color_${String(index + 1).padStart(2, '0')}`,
            `#${String(index + 1).padStart(2, '0')}${String(index + 1).padStart(2, '0')}${String(index + 1).padStart(2, '0')}`,
        ]),
    ),
};

function activeSlideLabel(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
    return wrapper.findAll('.preview-slider__slide')
        .find((slide) => slide.attributes('aria-hidden') === 'false')
        ?.attributes('aria-label');
}

describe('ThemePreviewSlider', () => {
    it('renders the palette, Linux home and JavaScript previews', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        expect(wrapper.findAll('.preview-slider__slide')).toHaveLength(3);
        expect(wrapper.find('.terminal').exists()).toBe(true);
        expect(wrapper.text()).toContain('user@linux');
        expect(wrapper.text()).toContain('loadTheme');
        expect(activeSlideLabel(wrapper)).toBe('1 of 3: Palette');
    });

    it('moves with the arrows and wraps around', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        await wrapper.find('.preview-slider__arrow--next').trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('2 of 3: Linux home');
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1]);

        await wrapper.find('.preview-slider__arrow--prev').trigger('click');
        await wrapper.find('.preview-slider__arrow--prev').trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('3 of 3: JavaScript');
    });

    it('jumps straight to a preview from its tab', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        await wrapper.findAll('.preview-slider__tab')[2]!.trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('3 of 3: JavaScript');
    });

    it('paints JavaScript tokens with the theme slots', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        const keyword = wrapper.find('.code-preview__token--keyword');
        const string = wrapper.find('.code-preview__token--string');
        expect(keyword.attributes('style')).toContain('color: #060606');
        expect(string.attributes('style')).toContain('color: #030303');
    });
});
