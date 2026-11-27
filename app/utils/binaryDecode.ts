// "Decode" text effect: every letter and digit of an element's text is shown
// as a random 0/1 bit, then the real characters resolve (left to right, or in
// a random order).
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

// Same, but only the characters at the indexes in `done` are real.
function scrambleSome(text: string, done: Set<number>): string {
    let out = '';
    let i = 0;
    for (const ch of text) {
        out += done.has(i) || !/[\p{L}\p{N}]/u.test(ch) ? ch : randomBit();
        i += ch.length;
    }
    return out;
}

function shuffled(text: string): number[] {
    const order: number[] = [];
    let i = 0;
    for (const ch of text) {
        if (/[\p{L}\p{N}]/u.test(ch)) order.push(i);
        i += ch.length;
    }
    for (let k = order.length - 1; k > 0; k -= 1) {
        const j = Math.floor(Math.random() * (k + 1));
        [order[k], order[j]] = [order[j]!, order[k]!];
    }
    return order;
}

interface DecodeOptions {
    // Time for a text node to fully resolve, once it starts.
    duration?: number;
    // Wait before resolving starts; the text already shows bits meanwhile.
    delay?: number;
    // 'ltr' resolves left to right; 'random' settles the letters in any order.
    order?: 'ltr' | 'random';
    // Minimum time between two flips of the bits still shown (0: every frame).
    // A steadier flicker reads calmer on large type.
    rate?: number;
}

interface Track {
    node: Text;
    text: string;
    written: string;
    order: number[] | null;
}

const running = new WeakMap<Element, () => void>();

export function binaryDecode(element: Element | null | undefined, { duration = 600, delay = 0, order = 'ltr', rate = 0 }: DecodeOptions = {}): void {
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
            tracks.push({ node, text, written, order: order === 'random' ? shuffled(text) : null });
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
    let lastFlip = 0;
    const tick = (now: number) => {
        if (!start) {
            start = now;
        }
        const progress = (now - start) / duration;
        if (progress < 1 && now - lastFlip < rate) {
            frame = requestAnimationFrame(tick);
            return;
        }
        lastFlip = now;
        pending = pending.filter((track) => {
            if (track.node.nodeValue !== track.written) {
                return false;
            }
            if (progress >= 1) {
                track.node.nodeValue = track.text;
                return false;
            }
            track.written = track.order
                ? scrambleSome(track.text, new Set(track.order.slice(0, Math.floor(progress * track.order.length))))
                : scramble(track.text, Math.floor(progress * track.text.length));
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

interface WordsOptions {
    // When the first word starts resolving, and the gap to the next one.
    delay?: number;
    stagger?: number;
    duration?: number;
}

// The heroes' title: each word, already written in bits, resolves on its own
// (staggered, letters in random order, a steady flicker). Bits are wider than
// most letters, so every word is held at its real width meanwhile and the
// title never reflows. Returns a cleanup that releases the widths early.
export function decodeWords(words: HTMLElement[], { delay = 700, stagger = 180, duration = 1100 }: WordsOptions = {}): () => void {
    words.forEach((word, index) => {
        word.style.width = `${word.getBoundingClientRect().width}px`;
        binaryDecode(word, { delay: delay + index * stagger, duration, order: 'random', rate: 70 });
    });
    const release = () => words.forEach((word) => word.style.removeProperty('width'));
    const timer = setTimeout(release, delay + duration + words.length * stagger + 100);
    return () => {
        clearTimeout(timer);
        release();
    };
}
