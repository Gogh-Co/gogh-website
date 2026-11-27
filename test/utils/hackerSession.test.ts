import { describe, it, expect } from 'vitest';
import { SESSION_COLS, SESSION_ROWS, renderTerminalSession, sessionStateAt } from '@/utils/terminalSession';
import { buildHackerSession, cursorCell } from '@/utils/hackerSession';

const theme = {
    name: 'Dracula',
    variant: 'dark',
    background: '#282A36',
    foreground: '#F8F8F2',
    cursor: '#F8F8F2',
    ...Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`color_${String(index + 1).padStart(2, '0')}`, `#${String(index + 10).repeat(3)}`])),
};

const SLOTS = new Set(['fg', 'bg', 'cursor', ...Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, '0'))]);

describe('hackerSession', () => {
    const session = buildHackerSession(theme, 'Dracula');

    it('loops in under a minute and a half', () => {
        expect(session.total).toBeGreaterThan(35_000);
        expect(session.total).toBeLessThan(90_000);
    });

    it('splits the loop into contiguous chapters', () => {
        expect(session.chapters.map((chapter) => chapter.id)).toEqual(['boot', 'nmap', 'exploit', 'decrypt', 'mainframe', 'escape', 'rain', 'exit']);
        session.chapters.forEach((chapter, index) => {
            expect(chapter.end).toBeGreaterThan(chapter.start);
            if (index > 0) expect(chapter.start).toBe(session.chapters[index - 1].end);
        });
        expect(session.chapters.at(-1)?.end).toBe(session.total);
    });

    it('renders every step as a full screen of palette slots that fits the grid', () => {
        const state = session.initial();
        const screens = new Set<string>();
        for (const step of session.steps) {
            step.run?.(state);
            const rows = renderTerminalSession(state);
            screens.add(state.screen);
            expect(rows).toHaveLength(SESSION_ROWS);
            for (const row of rows) {
                expect(row.reduce((sum, part) => sum + part.t.length, 0)).toBeLessThanOrEqual(SESSION_COLS);
                for (const part of row) {
                    if (part.c) expect(SLOTS.has(part.c), part.c).toBe(true);
                    if (part.bg) expect(SLOTS.has(part.bg), part.bg).toBe(true);
                    // ASCII only, so every glyph takes exactly one cell.
                    expect(/^[\x20-\x7e]*$/.test(part.t), part.t).toBe(true);
                }
            }
        }
        expect([...screens].sort()).toEqual(['full', 'shell']);
    });

    it('ends on the same screen it starts with', () => {
        expect(renderTerminalSession(sessionStateAt(session, session.steps.length))).toEqual(renderTerminalSession(session.initial()));
        expect(sessionStateAt(session, session.steps.length).alert).toBe(false);
    });

    it('decrypts the theme palette in the poster frame', () => {
        const rows = renderTerminalSession(sessionStateAt(session, session.posterIndex));
        const text = rows.map((row) => row.map((part) => part.t).join('')).join('\n');
        expect(text).toContain('[#101010]');
        expect(text).toContain('[#252525]');
        expect(text).toContain('VAULT OPEN');
    });

    it('finds the cursor on the shell prompt', () => {
        const cell = cursorCell(renderTerminalSession(session.initial()));
        expect(cell).toEqual({ col: 23, row: 0 });
    });

    it('is deterministic for a theme', () => {
        const again = buildHackerSession(theme, 'Dracula');
        expect(again.total).toBe(session.total);
        expect(renderTerminalSession(sessionStateAt(again, 300))).toEqual(renderTerminalSession(sessionStateAt(session, 300)));
    });
});
