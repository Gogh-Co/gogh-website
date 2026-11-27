import { describe, it, expect } from 'vitest';
import {
    SESSION_COLS,
    SESSION_ROWS,
    buildTerminalSession,
    cursorVisible,
    renderTerminalSession,
    sessionFrames,
    sessionStateAt,
} from '@/utils/terminalSession';

const theme = {
    name: 'Dracula',
    variant: 'dark',
    background: '#282A36',
    foreground: '#F8F8F2',
    cursor: '#F8F8F2',
    ...Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`color_${String(index + 1).padStart(2, '0')}`, '#BD93F9'])),
};

const SLOTS = new Set(['fg', 'bg', 'cursor', ...Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'))]);

describe('terminalSession', () => {
    const session = buildTerminalSession(theme, 'Dracula');

    it('loops in roughly half a minute', () => {
        expect(session.total).toBeGreaterThan(25_000);
        expect(session.total).toBeLessThan(45_000);
    });

    it('splits the loop into contiguous chapters', () => {
        expect(session.chapters.map((chapter) => chapter.id)).toEqual(['git', 'vim', 'commit', 'push', 'ssh', 'fastfetch', 'htop', 'exit']);
        expect(session.chapters[0].start).toBe(0);
        session.chapters.forEach((chapter, index) => {
            expect(chapter.end).toBeGreaterThan(chapter.start);
            if (index > 0) expect(chapter.start).toBe(session.chapters[index - 1].end);
        });
        expect(session.chapters.at(-1)?.end).toBe(session.total);
    });

    it('renders every step as a full screen of palette slots', () => {
        const state = session.initial();
        const screens = new Set<string>();
        for (const step of session.steps) {
            step.run?.(state);
            const rows = renderTerminalSession(state);
            screens.add(state.screen);
            expect(rows).toHaveLength(SESSION_ROWS);
            for (const row of rows) {
                const width = row.reduce((sum, part) => sum + part.t.length, 0);
                expect(width).toBeLessThanOrEqual(SESSION_COLS);
                for (const part of row) {
                    if (part.c) expect(SLOTS.has(part.c)).toBe(true);
                    if (part.bg) expect(SLOTS.has(part.bg)).toBe(true);
                }
            }
        }
        expect([...screens].sort()).toEqual(['htop', 'shell', 'vim']);
    });

    it('ends on the same screen it starts with, so the loop is seamless', () => {
        const first = renderTerminalSession(session.initial());
        const last = renderTerminalSession(sessionStateAt(session, session.steps.length));
        expect(last).toEqual(first);
    });

    it('types the theme cursor color into the theme file in vim', () => {
        const vimStart = session.chapters.find((chapter) => chapter.id === 'vim');
        const commit = session.chapters.find((chapter) => chapter.id === 'commit');
        const state = sessionStateAt(session, (commit?.stepIndex ?? 0) - 3);
        expect(vimStart).toBeTruthy();
        expect(state.screen).toBe('vim');
        expect(state.vim?.lines).toContain("cursor: '#F8F8F2'      # Cursor");
        expect(state.vim?.lines[1]).toBe("name: 'Dracula'");
    });

    it('blinks the cursor like the page: solid after a keystroke, then 530 ms on and off', () => {
        expect(cursorVisible(0)).toBe(true);
        expect(cursorVisible(900)).toBe(true);
        expect(cursorVisible(1100)).toBe(false);
        expect(cursorVisible(1600)).toBe(true);
    });

    it('splits one loop into distinct export frames that add up to the whole loop', () => {
        const frames = sessionFrames(session, 20);
        const duration = frames.reduce((sum, frame) => sum + frame.duration, 0);
        expect(duration).toBe(session.total);
        expect(frames.length).toBeGreaterThan(200);
        expect(frames.length).toBeLessThan(2000);
        frames.forEach((frame, index) => {
            expect(frame.rows).toHaveLength(SESSION_ROWS);
            if (index > 0) expect(frame.start).toBe(frames[index - 1].start + frames[index - 1].duration);
        });
        expect(frames.some((frame) => frame.title.endsWith('htop'))).toBe(true);
    });

    it('is deterministic for a theme, so server and client render the same poster', () => {
        const again = buildTerminalSession(theme, 'Dracula');
        expect(again.total).toBe(session.total);
        expect(renderTerminalSession(sessionStateAt(again, again.posterIndex)))
            .toEqual(renderTerminalSession(sessionStateAt(session, session.posterIndex)));
    });
});
