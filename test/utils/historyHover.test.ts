import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHistoryHover } from '@/utils/historyHover';

describe('history hover lifecycle', () => {
    let root: HTMLElement;
    let stage: HTMLElement;
    let image: HTMLImageElement;
    let dispose: () => void;
    let frames: Map<number, FrameRequestCallback>;
    let media: MediaQueryList;
    let change: () => void;
    let time: number;

    function settle() {
        for (let i = 0; frames.size && i < 180; i++) {
            const current = [...frames.values()];
            frames.clear();
            time += 16.67;
            current.forEach(callback => callback(time));
        }
        expect(frames.size).toBe(0);
    }

    function move(pointerType = 'mouse') {
        image.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType, clientX: 850, clientY: 180 }));
    }

    beforeEach(() => {
        time = 0;
        frames = new Map();
        let id = 0;
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
        vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame));
        vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
        media = {
            matches: true,
            addEventListener: (_event: string, callback: () => void) => { change = callback; },
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList;
        vi.spyOn(window, 'matchMedia').mockReturnValue(media);
        root = document.createElement('main');
        root.innerHTML = '<section class="h-stage__sticky"><div class="h-stage__media"><img style="transform: translateX(13px)"></div><header>Title</header></section>';
        document.body.append(root);
        stage = root.querySelector('section')!;
        image = root.querySelector('img')!;
        root.querySelector('.h-stage__media')!.getBoundingClientRect = () => ({ left: 100, top: 0, width: 1000, height: 600 }) as DOMRect;
        dispose = createHistoryHover(root);
    });

    afterEach(() => {
        dispose();
        root.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('tracks the drawing, keeps the scroll transform, and stops scheduling at rest', () => {
        move();
        settle();
        expect(Number(stage.style.getPropertyValue('--hover-x'))).toBeCloseTo(.5);
        expect(Number(stage.style.getPropertyValue('--hover-y'))).toBeCloseTo(-.4);
        expect(stage.style.getPropertyValue('--hover-active')).toBe('1.0000');
        expect(image.style.transform).toBe('translateX(13px)');
        expect(root.style.length).toBe(0);
    });

    it('returns to rest on exit without resetting when crossing children', () => {
        move();
        settle();
        image.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: stage.querySelector('header') }));
        expect(frames.size).toBe(0);
        image.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
        settle();
        expect(stage.style.length).toBe(0);
        expect(stage.hasAttribute('data-hover-active')).toBe(false);
    });

    it('ignores touch and disabled motion, and clears a running effect when preferences change', () => {
        move('touch');
        expect(frames.size).toBe(0);
        move();
        expect(frames.size).toBe(1);
        Object.defineProperty(media, 'matches', { value: false });
        change();
        expect(frames.size).toBe(0);
        expect(stage.style.length).toBe(0);
        move();
        expect(frames.size).toBe(0);
    });

    it('cleans up pending animation and listeners when the page unmounts', () => {
        move();
        dispose();
        expect(frames.size).toBe(0);
        expect(stage.style.length).toBe(0);
        move();
        expect(frames.size).toBe(0);
        expect(media.removeEventListener).toHaveBeenCalled();
    });
});
