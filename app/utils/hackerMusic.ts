// Background music for the live session's hacker mode, served from
// public/music so the page doesn't depend on a third party. One track is
// picked at random each time the mode starts, and another follows when it
// ends. The keygen tracks are scene modules rendered to MP3, credited to
// their composers. The Pixabay tracks fall under the Pixabay Content License; Fesliyan
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
    {
        // A Fasttracker II module from a HOODLUM keygen, rendered to MP3
        // with libopenmpt (the module credits "estrayk ^ paradox").
        src: '/music/hoodlum-coldfea-intro.mp3',
        title: 'ColdFea intro',
        artist: 'estrayk ^ Paradox (HOODLUM)',
        source: 'Keygen Music',
        url: 'https://keygenmusic.tk/#track=HOODLUM/HOODLUM%20-%20ColdFea%20intro.xm',
    },
    {
        // The 0BiT Fax Spider 2.1 keygen's module, "Caramel Condition" by
        // ko0x (2010), rendered to MP3 with libopenmpt.
        src: '/music/0bit-fax-spider-kg.mp3',
        title: 'Caramel Condition (Fax Spider 2.1 kg)',
        artist: 'ko0x (0BiT)',
        source: 'Keygen Music',
        url: 'https://keygenmusic.tk/#track=!Others/0BiT%20-%20Fax%20Spider%202.1%20kg.xm',
    },
    {
        // The ROGUE Jyotish Tools 1.8.4.0 keygen's module, "water" by
        // sP0ts!/dYnAmiTe, rendered to MP3 with libopenmpt.
        src: '/music/rogue-jyotish-tools-kg.mp3',
        title: 'water (Jyotish Tools 1.8.4.0 kg)',
        artist: 'sP0ts! / dYnAmiTe (ROGUE)',
        source: 'Keygen Music',
        url: 'https://keygenmusic.tk/#track=ROGUE/ROGUE%20-%20Jyotish%20Tools%201.8.4.0%20kg.xm',
    },
];

// A random track index, never the same as `previous` when there is a choice.
export function pickHackerTrack(previous = -1, random: () => number = Math.random): number {
    if (HACKER_TRACKS.length < 2) return 0;
    if (previous < 0) return Math.floor(random() * HACKER_TRACKS.length);
    const index = Math.floor(random() * (HACKER_TRACKS.length - 1));
    return index >= previous ? index + 1 : index;
}
