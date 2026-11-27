import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '@/utils/analytics';

describe('trackEvent', () => {
    afterEach(() => {
        vi.useRealTimers();
        delete (window as unknown as { plausible?: unknown }).plausible;
    });

    it('sends the event with string props and drops empty ones', () => {
        const plausible = vi.fn();
        (window as unknown as { plausible: unknown }).plausible = plausible;

        trackEvent('Install Copy', { place: 'home-hero', os: 'linux', theme: '', count: 3 });

        expect(plausible).toHaveBeenCalledWith('Install Copy', { props: { place: 'home-hero', os: 'linux', count: '3' } });
    });

    it('ignores an identical event fired again within a second', () => {
        vi.useFakeTimers();
        const plausible = vi.fn();
        (window as unknown as { plausible: unknown }).plausible = plausible;

        trackEvent('Share', { network: 'x' });
        trackEvent('Share', { network: 'x' });
        trackEvent('Share', { network: 'reddit' });
        vi.advanceTimersByTime(1100);
        trackEvent('Share', { network: 'x' });

        expect(plausible).toHaveBeenCalledTimes(3);
    });

    it('does nothing when Plausible is not loaded or throws', () => {
        expect(() => trackEvent('Download', { kind: 'generator' })).not.toThrow();
        (window as unknown as { plausible: unknown }).plausible = () => {
            throw new Error('blocked');
        };
        expect(() => trackEvent('Download', { kind: 'wallpaper' })).not.toThrow();
    });
});
