import { describe, it, expect, vi, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import chroma from 'chroma-js';
import ThemeShareButtons from '@/components/Terminal/ThemeShareButtons.vue';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('ThemeShareButtons', () => {
    it('links every network to the site URL in a new tab', async () => {
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Dracula' } });
        const links = wrapper.findAll('a.share-buttons__btn');

        expect(links.map((link) => link.attributes('aria-label'))).toEqual([
            'Share on X', 'Share on Facebook', 'Share on LinkedIn', 'Share on Reddit',
            'Share on Bluesky', 'Share on WhatsApp', 'Share on Telegram',
        ]);
        for (const link of links) {
            expect(decodeURIComponent(link.attributes('href')!)).toContain('https://gogh.website/');
            expect(link.attributes('target')).toBe('_blank');
            expect(link.attributes('rel')).toContain('noopener');
        }
    });

    it('uses only the theme name as post text', async () => {
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Dracula' } });
        const x = wrapper.find('a[aria-label="Share on X"]').attributes('href')!;

        expect(new URL(x).searchParams.get('text')).toBe('Dracula · Gogh');
    });

    it('copies the site URL and confirms it', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Dracula' } });

        await wrapper.find('button.share-buttons__btn').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(writeText).toHaveBeenCalledWith('https://gogh.website/');
        expect(wrapper.find('button.share-buttons__btn').attributes('aria-label')).toBe('Link copied');
    });

    it('colours each network from the open theme', async () => {
        const theme = {
            background: '#101010', foreground: '#eeeeee',
            color_02: '#ff5555', color_03: '#50fa7b', color_05: '#6272ff', color_06: '#ff79c6',
            color_07: '#8be9fd', color_13: '#7aa2ff', color_15: '#a4ffff',
        };
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Test', theme } });

        const brand = (label: string) => wrapper.find(`[aria-label="${label}"]`).attributes('style');
        expect(brand('Share on Reddit')).toContain('--brand: #ff5555');
        expect(brand('Share on WhatsApp')).toContain('--brand: #50fa7b');
        expect(brand('Share on X')).toContain('--brand: #eeeeee');
        expect(brand('Copy link')).toContain('--brand: #ff79c6');
    });

    it('brightens theme colours too dark to see on the backdrop', async () => {
        const theme = { background: '#ffffff', foreground: '#000000', color_02: '#1a0000' };
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Light', theme } });

        const style = wrapper.find('[aria-label="Share on Reddit"]').attributes('style')!;
        const color = style.match(/--brand: (#[0-9a-f]{6})/)![1];
        expect(color).not.toBe('#1a0000');
        expect(chroma.contrast(color, '#05080c')).toBeGreaterThanOrEqual(3);
    });

    it('links to share-card preview tools for the site URL', async () => {
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Dracula' } });
        const links = wrapper.findAll('.share-previews__link');

        expect(links.map((link) => link.text())).toEqual(['Facebook', 'LinkedIn', 'OpenGraph.xyz', 'Metatags.io']);
        for (const link of links) {
            expect(decodeURIComponent(link.attributes('href')!)).toContain('https://gogh.website/');
            expect(link.attributes('target')).toBe('_blank');
        }
    });

    it('shares a theme page URL when one is given', async () => {
        const url = 'https://gogh.website/dracula/';
        const writeText = vi.fn().mockResolvedValue(undefined);
        vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
        const wrapper = await mountSuspended(ThemeShareButtons, { props: { themeName: 'Dracula', url } });

        const facebook = wrapper.find('a[aria-label="Share on Facebook"]').attributes('href')!;
        expect(new URL(facebook).searchParams.get('u')).toBe(url);
        expect(decodeURIComponent(wrapper.find('.share-previews__link').attributes('href')!)).toContain(url);

        await wrapper.find('button.share-buttons__btn').trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(writeText).toHaveBeenCalledWith(url);
    });
});
