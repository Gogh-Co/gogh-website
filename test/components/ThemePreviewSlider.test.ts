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
    it('renders the palette, Linux home, JavaScript and Python previews', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        expect(wrapper.findAll('.preview-slider__slide')).toHaveLength(4);
        expect(wrapper.find('.terminal').exists()).toBe(true);
        expect(wrapper.text()).toContain('user@linux');
        expect(wrapper.text()).toContain('loadTheme.js');
        expect(wrapper.text()).toContain('load_theme.py');
        expect(activeSlideLabel(wrapper)).toBe('1 of 4: Palette');
    });

    it('moves with the arrows and wraps around', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        await wrapper.find('.preview-slider__arrow--next').trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('2 of 4: Linux home');
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1]);

        await wrapper.find('.preview-slider__arrow--prev').trigger('click');
        await wrapper.find('.preview-slider__arrow--prev').trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('4 of 4: Python');
    });

    it('jumps straight to a preview from its tab', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        await wrapper.findAll('.preview-slider__tab')[2]!.trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('3 of 4: JavaScript');

        await wrapper.findAll('.preview-slider__tab')[3]!.trigger('click');
        expect(activeSlideLabel(wrapper)).toBe('4 of 4: Python');
    });

    it('paints JavaScript tokens with the theme slots', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });

        const keyword = wrapper.find('.code-preview__token--keyword');
        const string = wrapper.find('.code-preview__token--string');
        expect(keyword.attributes('style')).toContain('color: #060606');
        expect(string.attributes('style')).toContain('color: #030303');
    });

    it('highlights Python keywords, decorators and comments', async () => {
        const wrapper = await mountSuspended(ThemePreviewSlider, { props: { theme } });
        const python = wrapper.findAll('.preview-slider__slide')[3]!;

        const keywords = python.findAll('.code-preview__token--keyword').map((token) => token.text().trim());
        expect(keywords).toEqual(expect.arrayContaining(['def', 'class', 'import', 'raise']));
        expect(python.find('.code-preview__token--decorator').text()).toBe('@dataclass');
        expect(python.find('.code-preview__token--comment').attributes('style')).toContain('color: #090909');
    });
});
