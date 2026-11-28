import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import FigAscii from '@/components/History/FigAscii.vue';
import FigSgr from '@/components/History/FigSgr.vue';
import FigPhosphor from '@/components/History/FigPhosphor.vue';
import en from '@/i18n/history/en';

describe('history exhibits', () => {
    it('keeps an ASCII character selected after a hover preview ends', async () => {
        const wrapper = await mountSuspended(FigAscii, { props: { copy: en.figures.paper } });
        const bell = wrapper.get('button[aria-label="BEL · 7"]');
        await bell.trigger('focus');
        expect(bell.attributes('aria-pressed')).toBe('true');
        expect(wrapper.get('.ascii__big').text()).toBe('BEL');

        const backspace = wrapper.get('button[aria-label="BS · 8"]');
        await backspace.trigger('pointerenter');
        expect(wrapper.get('.ascii__big').text()).toBe('BS');
        // Leaving the whole grid ends the preview, so crossing the gaps never flashes back.
        await wrapper.get('.ascii__grid').trigger('pointerleave');
        expect(wrapper.get('.ascii__big').text()).toBe('BEL');

        await backspace.trigger('click');
        expect(wrapper.get('.ascii__big').text()).toBe('BS');
        expect(wrapper.get('.ascii__forms').text()).toContain('0x08');
        wrapper.unmount();
    });

    it('builds the SGR command for printf, bash and zsh', async () => {
        const wrapper = await mountSuspended(FigSgr, { props: { copy: en.figures.escape, ui: { copy: 'Copy', copied: 'Copied' } } });
        const command = () => wrapper.get('.sgr__line code').text();
        expect(command()).toMatch(/^printf '\\e\[1;31m.*\\e\[0m\\n'$/);
        const shells = wrapper.findAll('.sgr__shells button');
        await shells[1]!.trigger('click');
        expect(command()).toMatch(/^echo -e '\\e\[1;31m.*\\e\[0m'$/);
        await shells[2]!.trigger('click');
        expect(command()).toMatch(/^echo '\\e\[1;31m.*\\e\[0m'$/);
        wrapper.unmount();
    });

    it('lets the keyboard compare phosphors and keeps one radio in the tab order', async () => {
        const wrapper = await mountSuspended(FigPhosphor, { props: { copy: en.figures.glass } });
        const radios = wrapper.findAll('[role="radio"]');
        await radios[0]!.trigger('keydown', { key: 'ArrowRight' });
        expect(radios[1]!.attributes('aria-checked')).toBe('true');
        expect(wrapper.get('.crt__status output').text()).toBe(en.figures.glass.p3);
        expect(wrapper.get('.crt').attributes('style')).toContain('--phosphor: #ffb000');
        expect(radios.map(radio => radio.attributes('tabindex'))).toEqual(['-1', '0', '-1']);

        await radios[1]!.trigger('keydown', { key: 'End' });
        expect(wrapper.get('.crt__status output').text()).toBe(en.figures.glass.p4);
        await radios[2]!.trigger('keydown', { key: 'ArrowRight' });
        expect(radios[0]!.attributes('aria-checked')).toBe('true');
        wrapper.unmount();
    });
});
