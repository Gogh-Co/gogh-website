// Background music for the live session's hacker mode, served from
// public/music so the page doesn't depend on a third party. One track is
// picked at random each time the mode starts, and another follows when it
// ends. The Pixabay tracks fall under the Pixabay Content License; Fesliyan
// Studios asks free users to credit "FesliyanStudios.com Background Music"
// with a link, which the page shows while their track plays.

export interface HackerTrack {
    src: string;
    title: string;
    artist: string;
    source: string;
    url: string;
}

export const HACKER_TRACKS: HackerTrack[] = [
    {
        src: '/music/djartmusic-the-return-of-the-8-bit-era-301292.mp3',
        title: 'The Return of the 8-bit Era',
        artist: 'DJARTMUSIC',
        source: 'Pixabay',
        url: 'https://pixabay.com/music/video-games-the-return-of-the-8-bit-era-301292/',
    },
    {
        src: '/music/djartmusic-my-8-bit-hero-301280.mp3',
        title: 'My 8-bit Hero',
        artist: 'DJARTMUSIC',
        source: 'Pixabay',
        url: 'https://pixabay.com/music/video-games-my-8-bit-hero-301280/',
    },
    {
        src: '/music/2019-12-11_-_Retro_Platforming_-_David_Fesliyan.mp3',
        title: 'Retro Platforming',
        artist: 'David Fesliyan',
        source: 'FesliyanStudios.com Background Music',
        url: 'https://www.FesliyanStudios.com',
    },
    {
        src: '/music/2021-08-30_-_Boss_Time_-_www.FesliyanStudios.com.mp3',
        title: 'Boss Time',
        artist: 'David Fesliyan',
        source: 'FesliyanStudios.com Background Music',
        url: 'https://www.FesliyanStudios.com',
    },
    {
        src: '/music/retro-bgm-chan-server-room-523662.mp3',
        title: 'Server Room',
        artist: 'Retro-BGM-Chan',
        source: 'Pixabay',
        url: 'https://pixabay.com/music/electro-server-room-%E3%81%95%E3%83%BC%E3%81%B0%E3%83%BC%E3%82%8B%E3%83%BC%E3%82%80-523662/',
    },
];

// A random track index, never the same as `previous` when there is a choice.
export function pickHackerTrack(previous = -1, random: () => number = Math.random): number {
    if (HACKER_TRACKS.length < 2) return 0;
    if (previous < 0) return Math.floor(random() * HACKER_TRACKS.length);
    const index = Math.floor(random() * (HACKER_TRACKS.length - 1));
    return index >= previous ? index + 1 : index;
}
