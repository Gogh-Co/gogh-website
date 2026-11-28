import { createHistoryInk, type HistoryInk } from './historyInk';

// Pointer coordinates stay outside Vue's render cycle. Only the hovered
// illustration (or exhibit) and its short return to rest request frames.
export function createHistoryHover(root: HTMLElement): () => void {
    const media = window.matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)');
    const selector = '.h-stage__sticky, .h-chapter__figure, .h-card, .h-hero';
    const properties = ['--hover-x', '--hover-y', '--hover-u', '--hover-v', '--hover-active'];
    type Pose = { x: number; y: number; active: number };
    type Scene = { element: HTMLElement; current: Pose; target: Pose; ink?: HistoryInk | null };
    const scenes = new Map<HTMLElement, Scene>();
    let active: Scene | undefined;
    let frame = 0;
    let lastTime = 0;
    let disposed = false;

    function clear(scene: Scene) {
        scene.ink?.dispose();
        properties.forEach(property => scene.element.style.removeProperty(property));
        scene.element.removeAttribute('data-hover-active');
    }

    function render(time: number) {
        frame = 0;
        const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
        lastTime = time;
        const ease = 1 - Math.exp(-dt * 11);
        for (const [element, scene] of scenes) {
            const { current, target } = scene;
            current.x += (target.x - current.x) * ease;
            current.y += (target.y - current.y) * ease;
            current.active += (target.active - current.active) * ease;
            const settled = Math.abs(target.x - current.x) + Math.abs(target.y - current.y)
                + Math.abs(target.active - current.active) < .002;
            if (settled) Object.assign(current, target);
            if (!current.active && settled) { clear(scene); scenes.delete(element); continue; }
            element.style.setProperty('--hover-x', current.x.toFixed(4));
            element.style.setProperty('--hover-y', current.y.toFixed(4));
            element.style.setProperty('--hover-u', `${((current.x + 1) * 50).toFixed(2)}%`);
            element.style.setProperty('--hover-v', `${((current.y + 1) * 50).toFixed(2)}%`);
            element.style.setProperty('--hover-active', current.active.toFixed(4));
            const animating = scene.ink?.paint(current.x, current.y, current.active, time);
            if (!settled || animating) wake();
        }
    }

    function wake() {
        if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(render);
    }

    function reset(immediate = false) {
        active = undefined;
        for (const scene of scenes.values()) {
            scene.target = { x: 0, y: 0, active: 0 };
            if (immediate) clear(scene);
        }
        if (immediate) {
            cancelAnimationFrame(frame);
            frame = lastTime = 0;
            scenes.clear();
        } else { lastTime = 0; wake(); }
    }

    function zone(target: EventTarget | null) {
        const element = target instanceof Element ? target.closest<HTMLElement>(selector) : null;
        return element && root.contains(element) ? element : null;
    }

    function move(event: PointerEvent) {
        if (event.pointerType !== 'mouse' || !media.matches || document.hidden) return;
        const element = zone(event.target);
        if (!element) { if (active) reset(); return; }
        if (active?.element !== element) {
            reset();
            let scene = scenes.get(element);
            if (!scene) {
                scene = { element, current: { x: 0, y: 0, active: 0 }, target: { x: 0, y: 0, active: 1 } };
                const surface = element.querySelector<HTMLElement>('.h-stage__media');
                const chapter = element.closest('.h-chapter')?.id;
                if (surface && chapter) scene.ink = createHistoryInk(surface, chapter);
                scenes.set(element, scene);
            }
            active = scene;
            element.setAttribute('data-hover-active', '');
        }
        // The light follows the drawing even where its frame extends behind
        // the copy; text and form controls themselves never track the mouse.
        const box = (element.querySelector('.h-stage__media, .h-hero__media') || element).getBoundingClientRect();
        if (!box.width || !box.height) return;
        const clamp = (value: number) => Math.max(-1, Math.min(1, value));
        active!.target = {
            x: clamp((event.clientX - box.left) / box.width * 2 - 1),
            y: clamp((event.clientY - box.top) / box.height * 2 - 1),
            active: 1,
        };
        active!.ink?.energize(performance.now());
        wake();
    }

    function leave(event: PointerEvent) {
        if (active && zone(event.relatedTarget) !== active.element) reset();
    }
    const onScroll = () => { if (active) reset(); };
    const onPreference = () => reset(true);
    const onBlur = () => reset(true);
    const onVisibility = () => { if (document.hidden) reset(true); };

    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerout', leave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    media.addEventListener('change', onPreference);

    return () => {
        disposed = true;
        reset(true);
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerout', leave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
        media.removeEventListener('change', onPreference);
    };
}
