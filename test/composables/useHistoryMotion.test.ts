import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { HISTORY_MOTION_KEY, useHistoryMotion } from '@/composables/useHistoryMotion';

describe('history motion preference', () => {
    let matches: boolean;
    let notify: () => void;
    let motion: ReturnType<typeof useHistoryMotion>;
    const wrappers: ReturnType<typeof mount>[] = [];
    const mountPreference = () => {
        const wrapper = mount(defineComponent({ setup() { motion = useHistoryMotion(); return () => h('div'); } }));
        wrappers.push(wrapper);
        return wrapper;
    };
    beforeEach(() => {
        localStorage.removeItem(HISTORY_MOTION_KEY);
        matches = false;
        vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
            get matches() { return matches; },
            addEventListener(_event: string, callback: () => void) { notify = callback; },
            removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList);
    });
    afterEach(() => { wrappers.forEach(w => w.unmount()); wrappers.length = 0; vi.restoreAllMocks(); localStorage.removeItem(HISTORY_MOTION_KEY); });

    it('persists the choice and restores it on a new visit', () => {
        const first = mountPreference();
        expect(motion.enabled.value).toBe(true);
        motion.setCalm(true);
        expect(motion.enabled.value).toBe(false);
        expect(localStorage.getItem(HISTORY_MOTION_KEY)).toBe('calm');
        first.unmount(); wrappers.pop();
        mountPreference();
        expect(motion.calm.value).toBe(true);
        expect(motion.enabled.value).toBe(false);
        motion.setCalm(false);
        expect(localStorage.getItem(HISTORY_MOTION_KEY)).toBe('full');
    });

    it('respects live system preferences and saved changes in another tab', () => {
        mountPreference();
        matches = true; notify();
        expect(motion.systemReduced.value).toBe(true);
        expect(motion.enabled.value).toBe(false);
        matches = false; notify();
        expect(motion.enabled.value).toBe(true);
        window.dispatchEvent(new StorageEvent('storage', { key: HISTORY_MOTION_KEY, newValue: 'calm' }));
        expect(motion.enabled.value).toBe(false);
    });

    it('remains usable when browser storage is blocked', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('blocked'); });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked'); });
        mountPreference();
        expect(() => motion.setCalm(true)).not.toThrow();
        expect(motion.enabled.value).toBe(false);
    });
});
