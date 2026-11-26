// "Decode" text effect: every letter and digit of an element's text is shown
// as a random 0/1 bit, then the real characters resolve left to right.
// Client-only; it rewrites text nodes in place and always restores them.

const GLYPH = /[\p{L}\p{N}]/gu;

export function randomBit(): string {
    return Math.random() < 0.5 ? '0' : '1';
}

export function randomBits(length: number): string {
    let out = '';
    for (let i = 0; i < length; i += 1) {
        out += randomBit();
    }
    return out;
}

function scramble(text: string, revealed: number): string {
    return text.slice(0, revealed) + text.slice(revealed).replace(GLYPH, randomBit);
}

interface DecodeOptions {
    // Time for a text node to fully resolve, once it starts.
    duration?: number;
    // Wait before resolving starts; the text already shows bits meanwhile.
    delay?: number;
}

interface Track {
    node: Text;
    text: string;
    written: string;
}

const running = new WeakMap<Element, () => void>();

export function binaryDecode(element: Element | null | undefined, { duration = 600, delay = 0 }: DecodeOptions = {}): void {
    if (!element || typeof document === 'undefined') {
        return;
    }

    // Restart cleanly if this element is already decoding.
    running.get(element)?.();

    const tracks: Track[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        const text = node.nodeValue ?? '';
        if (text.trim()) {
            const written = scramble(text, 0);
            node.nodeValue = written;
            tracks.push({ node, text, written });
        }
    }

    if (!tracks.length) {
        return;
    }

    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = tracks;

    const finish = () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        for (const track of pending) {
            // Vue may have replaced the text meanwhile; never write back stale copy.
            if (track.node.nodeValue === track.written) {
                track.node.nodeValue = track.text;
            }
        }
        pending = [];
        running.delete(element);
    };

    running.set(element, finish);

    let start = 0;
    const tick = (now: number) => {
        if (!start) {
            start = now;
        }
        const progress = (now - start) / duration;
        pending = pending.filter((track) => {
            if (track.node.nodeValue !== track.written) {
                return false;
            }
            if (progress >= 1) {
                track.node.nodeValue = track.text;
                return false;
            }
            track.written = scramble(track.text, Math.floor(progress * track.text.length));
            track.node.nodeValue = track.written;
            return true;
        });

        if (pending.length) {
            frame = requestAnimationFrame(tick);
        } else {
            finish();
        }
    };

    timer = setTimeout(() => {
        frame = requestAnimationFrame(tick);
    }, delay);
}
