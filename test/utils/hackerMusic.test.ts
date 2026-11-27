import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HACKER_TRACKS, pickHackerTrack } from '@/utils/hackerMusic';

describe('hackerMusic', () => {
    it('serves every track from the site itself', () => {
        expect(HACKER_TRACKS).toHaveLength(8);
        for (const track of HACKER_TRACKS) {
            expect(track.src.startsWith('/music/')).toBe(true);
            expect(existsSync(join(process.cwd(), 'public', track.src)), track.src).toBe(true);
            expect(track.url).toMatch(/^https:\/\//);
        }
    });

    it('never picks the same track twice in a row', () => {
        for (let previous = 0; previous < HACKER_TRACKS.length; previous++) {
            for (const roll of [0, 0.2, 0.5, 0.79, 0.999]) {
                const next = pickHackerTrack(previous, () => roll);
                expect(next).not.toBe(previous);
                expect(next).toBeGreaterThanOrEqual(0);
                expect(next).toBeLessThan(HACKER_TRACKS.length);
            }
        }
    });

    it('can pick any track to start with', () => {
        const picks = new Set([0, 0.2, 0.4, 0.6, 0.99].map((roll) => pickHackerTrack(-1, () => roll)));
        expect(picks.size).toBeGreaterThan(3);
    });
});
