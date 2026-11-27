import { safeHex } from './themeColors';
import { themeSlug } from './themeSlug';

// A made-up terminal session for the theme page's "Live session" section:
// git, vim, a commit and a push, then ssh into a server, fastfetch and htop.
// The script is data (a list of timed steps that mutate a small state) and
// the screen is a pure render of that state into rows of colored segments.
// Segments name palette slots, never hex values, so the same session paints
// itself with whichever theme the page shows.

export const SESSION_COLS = 88;
export const SESSION_ROWS = 24;

// Palette slot a segment paints with: '01'..'16', or the theme's base colors.
export type SessionSlot = string;

export interface SessionSegment {
    t: string;
    c?: SessionSlot;
    bg?: SessionSlot;
    b?: boolean;
    i?: boolean;
    cur?: 'block' | 'bar';
}

export type SessionLine = SessionSegment[];

interface HtopProc {
    pid: number;
    user: string;
    virt: string;
    res: string;
    shr: string;
    state: string;
    cpu: number;
    mem: number;
    time: number;
    command: string;
    thread?: boolean;
}

interface HtopFrame {
    cpus: Array<[number, number, number]>;
    mem: [number, number, number];
    swap: number;
    running: number;
    uptime: number;
    load: [number, number, number];
    procs: HtopProc[];
    selected: number;
}

interface VimState {
    file: string;
    lines: string[];
    row: number;
    col: number;
    mode: 'normal' | 'insert' | 'command';
    command: string;
    message: string;
}

export interface SessionState {
    title: string;
    screen: 'shell' | 'vim' | 'htop' | 'full';
    lines: SessionLine[];
    input: { prompt: SessionLine; text: string } | null;
    vim: VimState | null;
    htop: HtopFrame | null;
    // A full-screen app drawn row by row (the hacker session's dashboards).
    full?: SessionLine[] | null;
    // Hacker mode effects: bumped for each glitch burst, and the red alert.
    glitch?: number;
    alert?: boolean;
    // Bumped on every keystroke, so the cursor restarts its blink.
    keys: number;
}

export interface SessionStep {
    ms: number;
    run?: (state: SessionState) => void;
}

export interface SessionChapter {
    id: string;
    label: string;
    stepIndex: number;
    start: number;
    end: number;
}

export interface TerminalSession {
    steps: SessionStep[];
    // times[i] is when step i runs, in ms from the start of the loop.
    times: number[];
    total: number;
    chapters: SessionChapter[];
    // The frame shown before the loop starts (server render, reduced motion).
    posterIndex: number;
    file: string;
    initial: () => SessionState;
}

export const seg = (t: string, c?: SessionSlot, extra: Partial<SessionSegment> = {}): SessionSegment => ({ t, c, ...extra });
export const bold = (t: string, c?: SessionSlot): SessionSegment => seg(t, c, { b: true });
export const plain = (text: string): SessionLine => [seg(text)];

export function hashString(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

// Small seeded PRNG: the same theme always gets the same typing rhythm and
// htop readings, so the server render and the client agree.
export function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const YAML_COMMENTS: Record<string, string> = {
    color_01: 'Black (Host)',
    color_02: 'Red (Syntax string)',
    color_03: 'Green (Command)',
    color_04: 'Yellow (Command second)',
    color_05: 'Blue (Path)',
    color_06: 'Magenta (Syntax var)',
    color_07: 'Cyan (Prompt)',
    color_08: 'White',
    color_09: 'Bright Black',
    color_10: 'Bright Red (Command error)',
    color_11: 'Bright Green (Exec)',
    color_12: 'Bright Yellow',
    color_13: 'Bright Blue (Folder)',
    color_14: 'Bright Magenta',
    color_15: 'Bright Cyan',
    color_16: 'Bright White',
    background: 'Background',
    foreground: 'Foreground (Text)',
    cursor: 'Cursor',
};

function yamlColorLine(theme: Record<string, any>, key: string): string {
    const hex = (safeHex(theme?.[key]) || safeHex(theme?.foreground) || '#ffffff').toUpperCase();
    return `${`${key}: '${hex}'`.padEnd(23)}# ${YAML_COMMENTS[key]}`;
}

function quoteYaml(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
}

// The theme file as Gogh stores it, minus the cursor line typed in vim.
function themeFileLines(theme: Record<string, any>, name: string): string[] {
    const author = (theme?.author_name || theme?.author || '').toString().trim();
    const variant = theme?.variant === 'light' ? 'light' : 'dark';
    const slot = (index: number) => `color_${String(index).padStart(2, '0')}`;
    return [
        '---',
        `name: ${quoteYaml(name)}`,
        `author: ${quoteYaml(author)}`,
        `variant: '${variant}'`,
        '',
        ...[1, 2, 3, 4, 5, 6, 7, 8].map((index) => yamlColorLine(theme, slot(index))),
        '',
        ...[9, 10, 11, 12, 13, 14, 15, 16].map((index) => yamlColorLine(theme, slot(index))),
        '',
        yamlColorLine(theme, 'background'),
        yamlColorLine(theme, 'foreground'),
        '',
    ];
}

const LOCAL_TITLE = 'user@linux: ~/projects/gogh';
const REMOTE_TITLE = 'deploy@srv-01: ~';

const localPrompt = (): SessionLine => [
    bold('user@linux', '03'),
    seg(':'),
    bold('~/projects/gogh', '05'),
    seg(' (main)', '06'),
    seg('$ '),
];

// The server's prompt is red, the usual warning that this shell is production.
const remotePrompt = (): SessionLine => [bold('deploy@srv-01', '02'), seg(':'), bold('~', '05'), seg('$ ')];

function gitLog(name: string): SessionLine[] {
    const deco = (refs: SessionSegment[]) => [seg(' (', '04'), ...refs, seg(') ', '04')];
    return [
        [seg('3f9c2a1', '04'), ...deco([bold('HEAD -> ', '07'), bold('main', '03')]), seg(`feat(themes): add ${name}`)],
        [seg('b6db0a0', '04'), ...deco([bold('origin/main', '02'), seg(', ', '04'), bold('origin/HEAD', '02')]), seg('chore(deps): update vue-router to 5.5.3')],
        [seg('3dd0f25', '04'), seg(' fix(gallery): shuffle scrolls back up to #themes')],
        [seg('b42cdeb', '04'), seg(' fix(scroll): open a new page at the top')],
    ];
}

function sshBanner(): SessionLine[] {
    return [
        plain('Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-49-generic x86_64)'),
        [],
        plain('  System load:  0.42               Processes:             163'),
        plain('  Usage of /:   37.5% of 78.60GB   Users logged in:       1'),
        plain('  Memory usage: 41%                IPv4 address for eth0: 10.0.0.12'),
        plain('  Swap usage:   1%'),
        [],
        plain('Last login: Wed Nov 25 21:14:03 2026 from 192.168.1.20'),
    ];
}

// fastfetch with a small striped logo and the two rows of palette swatches.
function fastfetchLines(): SessionLine[] {
    const stripes = ['02', '04', '03', '07', '05', '06'];
    const info: SessionLine[] = [
        [bold('deploy', '05'), seg('@'), bold('srv-01', '05')],
        plain('-------------'),
        ...[
            ['OS', 'Ubuntu 24.04.1 LTS x86_64'],
            ['Host', 'Standard PC (Q35 + ICH9, 2009)'],
            ['Kernel', 'Linux 6.8.0-49-generic'],
            ['Uptime', '12 days, 4 hours, 21 mins'],
            ['Packages', '812 (dpkg), 6 (snap)'],
            ['Shell', 'bash 5.2.21'],
            ['CPU', 'AMD EPYC 7B13 (8) @ 3.05 GHz'],
            ['Memory', '3.21 GiB / 7.70 GiB (42%)'],
            ['Disk (/)', '29.48 GiB / 78.60 GiB (38%) - ext4'],
            ['Local IP (eth0)', '10.0.0.12/24'],
        ].map(([key, value]) => [bold(key, '05'), seg(`: ${value}`)]),
        [],
        ['01', '02', '03', '04', '05', '06', '07', '08'].map((slot) => seg('   ', undefined, { bg: slot })),
        ['09', '10', '11', '12', '13', '14', '15', '16'].map((slot) => seg('   ', undefined, { bg: slot })),
    ];

    return info.map((line, row) => {
        const stripe = row - 2;
        const logo = stripe >= 0 && stripe < stripes.length
            ? [seg(' '.repeat(2 + stripes.length - 1 - stripe)), seg(' '.repeat(10), undefined, { bg: stripes[stripe] }), seg(' '.repeat(3 + stripe))]
            : [seg(' '.repeat(20))];
        return [...logo, ...line];
    });
}

const HTOP_PROCS: HtopProc[] = [
    { pid: 1342, user: 'deploy', virt: '1.21G', res: '184M', shr: '42.1M', state: 'S', cpu: 12, mem: 2.3, time: 8406, command: 'node /srv/app/server.js' },
    { pid: 1356, user: 'deploy', virt: '1.21G', res: '184M', shr: '42.1M', state: 'S', cpu: 4, mem: 2.3, time: 1833, command: 'node /srv/app/server.js', thread: true },
    { pid: 887, user: 'postgres', virt: '218M', res: '31.2M', shr: '28.9M', state: 'S', cpu: 3.5, mem: 0.4, time: 4210, command: 'postgres: walwriter' },
    { pid: 2210, user: 'deploy', virt: '12.3M', res: '4.8M', shr: '3.2M', state: 'R', cpu: 2, mem: 0.1, time: 21, command: 'htop' },
    { pid: 912, user: 'www-data', virt: '58.6M', res: '9.9M', shr: '6.1M', state: 'S', cpu: 1.3, mem: 0.1, time: 987, command: 'nginx: worker process' },
    { pid: 640, user: 'redis', virt: '72.4M', res: '7.3M', shr: '5.5M', state: 'S', cpu: 0.7, mem: 0.1, time: 3144, command: 'redis-server 127.0.0.1:6379' },
    { pid: 910, user: 'www-data', virt: '58.6M', res: '9.6M', shr: '6.0M', state: 'S', cpu: 0.4, mem: 0.1, time: 851, command: 'nginx: worker process' },
    { pid: 1, user: 'root', virt: '166M', res: '13.0M', shr: '8.4M', state: 'S', cpu: 0, mem: 0.2, time: 412, command: '/sbin/init' },
    { pid: 423, user: 'root', virt: '47.9M', res: '15.6M', shr: '14.5M', state: 'S', cpu: 0, mem: 0.2, time: 198, command: '/lib/systemd/systemd-journald' },
    { pid: 611, user: 'root', virt: '288M', res: '21.4M', shr: '17.1M', state: 'S', cpu: 0, mem: 0.3, time: 244, command: '/usr/libexec/udisks2/udisksd' },
    { pid: 702, user: 'root', virt: '15.4M', res: '8.6M', shr: '7.4M', state: 'S', cpu: 0, mem: 0.1, time: 37, command: 'sshd: /usr/sbin/sshd -D' },
    { pid: 2187, user: 'root', virt: '17.2M', res: '10.9M', shr: '9.1M', state: 'S', cpu: 0, mem: 0.1, time: 5, command: 'sshd: deploy [priv]' },
    { pid: 2198, user: 'deploy', virt: '8.7M', res: '5.3M', shr: '3.6M', state: 'S', cpu: 0, mem: 0.1, time: 2, command: '-bash' },
    { pid: 733, user: 'root', virt: '6.9M', res: '2.8M', shr: '2.5M', state: 'S', cpu: 0, mem: 0, time: 11, command: '/usr/sbin/cron -f' },
];

const HTOP_TICK_MS = 520;

function htopFrames(rand: () => number, count: number): HtopFrame[] {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    let cpus: Array<[number, number, number]> = Array.from({ length: 8 }, () => [2 + rand() * 4, 6 + rand() * 30, 2 + rand() * 8]);
    let procs = HTOP_PROCS.map((proc) => ({ ...proc }));
    const frames: HtopFrame[] = [];

    for (let tick = 0; tick < count; tick++) {
        cpus = cpus.map(([low, normal, kernel]) => [
            clamp(low + (rand() - 0.5) * 4, 0.5, 8),
            clamp(normal + (rand() - 0.45) * 22, 2, 70),
            clamp(kernel + (rand() - 0.5) * 6, 0.5, 14),
        ]);
        procs = procs.map((proc) => {
            const cpu = proc.cpu > 0 || rand() < 0.08
                ? clamp(proc.cpu + (rand() - 0.5) * Math.max(1.5, proc.cpu * 0.6), 0, 40)
                : 0;
            return { ...proc, cpu, time: proc.time + Math.round(cpu * HTOP_TICK_MS / 1000) };
        });
        frames.push({
            cpus,
            mem: [41 + rand() * 1.5, 6, 22],
            swap: 0.6,
            running: 1 + Math.floor(rand() * 3),
            uptime: 1051297 + Math.round(tick * HTOP_TICK_MS / 1000),
            load: [0.42 + tick * 0.01, 0.37, 0.31],
            procs,
            // Two presses of the down arrow halfway through.
            selected: tick < 5 ? 0 : tick < 7 ? 1 : 2,
        });
    }
    return frames;
}

// The building blocks of a session script: timed steps, chapters, typing
// with a human rhythm, commands, printed output and progress counters.
// Both the daily session and the hacker session are written with these.
export function createSessionScript(rand: () => number) {
    const steps: SessionStep[] = [];
    const marks: Array<{ id: string; label: string; stepIndex: number }> = [];

    const step = (ms: number, run?: SessionStep['run']) => {
        steps.push({ ms: Math.round(ms), run });
    };
    const pause = (ms: number) => {
        steps[steps.length - 1].ms += Math.round(ms);
    };
    const chapter = (id: string, label = id) => marks.push({ id, label, stepIndex: steps.length });

    const keyDelay = (char: string) => {
        let ms = 34 + rand() * 44;
        if (char === ' ') ms += 22;
        if (/[A-Z"'(){}|&:#/.-]/.test(char)) ms += 28;
        if (rand() < 0.06) ms += 150;
        return ms;
    };
    const typeKeys = (text: string, apply: (state: SessionState, char: string) => void) => {
        for (const char of text) {
            step(keyDelay(char), (state) => {
                apply(state, char);
                state.keys++;
            });
        }
    };
    const prompt = (makePrompt: () => SessionLine, ms: number) => step(ms, (state) => {
        state.input = { prompt: makePrompt(), text: '' };
    });
    // Types a command at the prompt, waits a beat and presses Enter.
    const command = (text: string, { think = 320, wait = 120 } = {}) => {
        typeKeys(text, (state, char) => {
            if (state.input) state.input.text += char;
        });
        pause(think);
        step(wait, (state) => {
            if (state.input) {
                state.lines.push([...state.input.prompt, seg(state.input.text)]);
                state.input = null;
            }
            state.keys++;
        });
    };
    const print = (lines: SessionLine[], perLine = 40) => {
        for (const line of lines) {
            step(perLine, (state) => {
                state.lines.push(line);
            });
        }
    };
    const replaceLast = (line: SessionLine, ms: number) => step(ms, (state) => {
        state.lines[state.lines.length - 1] = line;
    });
    const progress = (label: string, total: number, done: string, ms = 55) => {
        const line = (count: number) => plain(`${label}: ${String(Math.round(count / total * 100)).padStart(3)}% (${count}/${total})`);
        step(ms, (state) => {
            state.lines.push(line(0));
        });
        for (let count = 1; count < total; count++) {
            replaceLast(line(count), ms);
        }
        replaceLast(plain(`${label}: 100% (${total}/${total})${done}`), ms);
    };

    // Turns the steps into a timeline: when each step runs and where each
    // chapter starts and ends.
    const finish = (rest: Pick<TerminalSession, 'posterIndex' | 'file' | 'initial'>): TerminalSession => {
        const times: number[] = [];
        let total = 0;
        for (const item of steps) {
            times.push(total);
            total += item.ms;
        }
        const chapters = marks.map((mark, index) => ({
            ...mark,
            start: times[mark.stepIndex],
            end: index + 1 < marks.length ? times[marks[index + 1].stepIndex] : total,
        }));
        return { steps, times, total, chapters, ...rest };
    };

    return { steps, step, pause, chapter, keyDelay, typeKeys, prompt, command, print, replaceLast, progress, finish };
}

export function buildTerminalSession(theme: Record<string, any>, themeName: string): TerminalSession {
    const name = (themeName || theme?.name || 'Theme').toString();
    const slug = themeSlug(name) || 'theme';
    const file = `themes/${slug}.yml`;
    const rand = mulberry32(hashString(name));
    const fileLines = themeFileLines(theme, name);
    const cursorLine = yamlColorLine(theme, 'cursor');
    const savedLines = fileLines.length + 1;
    const savedBytes = [...fileLines, cursorLine].join('\n').length + 1;

    const script = createSessionScript(rand);
    const { step, pause, chapter, typeKeys, prompt, command, print, progress } = script;
    const { steps } = script;
    const vim = (run: (vim: VimState) => void) => (state: SessionState) => {
        if (state.vim) run(state.vim);
    };

    // 1. git: what changed?
    chapter('git');
    step(700);
    command('git status -s', { think: 300 });
    print([
        [seg(' '), seg('M', '02'), seg(' README.md')],
        [seg('??', '02'), seg(` ${file}`)],
    ], 30);
    prompt(localPrompt, 700);

    // 2. vim: finish the theme file with its cursor line.
    chapter('vim');
    command(`vim ${file}`, { think: 280, wait: 260 });
    step(950, (state) => {
        state.screen = 'vim';
        state.title = `${file} (~/projects/gogh) - VIM`;
        state.vim = {
            file,
            lines: [...fileLines],
            row: 0,
            col: 0,
            mode: 'normal',
            command: '',
            message: `"${file}" ${fileLines.length}L, ${fileLines.join('\n').length + 1}B`,
        };
    });
    step(480, vim((v) => {
        v.row = v.lines.length - 1;
        v.col = 0;
        v.message = '';
    }));
    step(380, vim((v) => {
        v.lines.splice(v.row + 1, 0, '');
        v.row++;
        v.col = 0;
        v.mode = 'insert';
        v.message = '-- INSERT --';
    }));
    typeKeys(cursorLine, (state, char) => {
        const v = state.vim;
        if (!v) return;
        v.lines[v.row] += char;
        v.col = v.lines[v.row].length;
    });
    pause(420);
    step(520, vim((v) => {
        v.mode = 'normal';
        v.message = '';
        v.col = Math.max(0, v.lines[v.row].length - 1);
    }));
    step(140, vim((v) => {
        v.mode = 'command';
        v.command = '';
    }));
    typeKeys('wq', (state, char) => {
        if (state.vim) state.vim.command += char;
    });
    pause(260);
    step(420, vim((v) => {
        v.mode = 'normal';
        v.command = '';
        v.message = `"${file}" ${savedLines}L, ${savedBytes}B written`;
    }));
    step(0, (state) => {
        state.screen = 'shell';
        state.title = LOCAL_TITLE;
        state.vim = null;
    });
    prompt(localPrompt, 650);

    // 3. Commit it and look at the log.
    chapter('commit');
    command(`git add . && git commit -m "feat(themes): add ${name}"`, { think: 380, wait: 260 });
    print([
        plain(`[main 3f9c2a1] feat(themes): add ${name}`),
        plain(` 2 files changed, ${savedLines + 1} insertions(+), 1 deletion(-)`),
        plain(` create mode 100644 ${file}`),
    ], 45);
    prompt(localPrompt, 520);
    command('git log --oneline -4', { think: 260, wait: 90 });
    print(gitLog(name), 35);
    prompt(localPrompt, 900);

    // 4. Push.
    chapter('push');
    command('git push', { think: 240, wait: 420 });
    print([plain('Enumerating objects: 9, done.'), plain('Counting objects: 100% (9/9), done.'), plain('Delta compression using up to 8 threads')], 70);
    progress('Compressing objects', 5, ', done.');
    progress('Writing objects', 5, ', 1.21 KiB | 1.21 MiB/s, done.', 70);
    print([
        plain('Total 5 (delta 3), reused 0 (delta 0), pack-reused 0'),
        plain('remote: Resolving deltas: 100% (3/3), completed with 3 local objects.'),
        plain('To github.com:Gogh-Co/Gogh.git'),
        plain('   b6db0a0..3f9c2a1  main -> main'),
    ], 60);
    prompt(localPrompt, 800);

    // 5. ssh into the server.
    chapter('ssh');
    command('ssh deploy@srv-01', { think: 330, wait: 900 });
    step(0, (state) => {
        state.title = REMOTE_TITLE;
    });
    print(sshBanner(), 45);
    prompt(remotePrompt, 700);

    // 6. fastfetch: the palette swatches at the bottom.
    chapter('fastfetch');
    command('fastfetch', { think: 250, wait: 380 });
    print(fastfetchLines(), 28);
    const posterIndex = steps.length + 1;
    prompt(remotePrompt, 1900);

    // 7. htop, scrolling down two processes.
    chapter('htop');
    command('htop', { think: 220, wait: 200 });
    const frames = htopFrames(rand, 11);
    frames.forEach((frame, index) => {
        step(HTOP_TICK_MS, (state) => {
            if (index === 0) {
                state.screen = 'htop';
                state.title = 'deploy@srv-01: htop';
            }
            state.htop = frame;
        });
    });
    step(0, (state) => {
        state.screen = 'shell';
        state.title = REMOTE_TITLE;
        state.htop = null;
        state.keys++;
    });
    prompt(remotePrompt, 520);

    // 8. Log out, clear the screen and start over.
    chapter('exit');
    command('exit', { think: 260, wait: 140 });
    print([plain('logout'), plain('Connection to srv-01 closed.')], 160);
    step(0, (state) => {
        state.title = LOCAL_TITLE;
    });
    prompt(localPrompt, 700);
    command('clear', { think: 300, wait: 0 });
    step(800, (state) => {
        state.lines = [];
        state.input = { prompt: localPrompt(), text: '' };
    });

    const initial = (): SessionState => ({
        title: LOCAL_TITLE,
        screen: 'shell',
        lines: [],
        input: { prompt: localPrompt(), text: '' },
        vim: null,
        htop: null,
        keys: 0,
    });

    return script.finish({ posterIndex, file, initial });
}

// The state after the first `stepIndex` steps, built from scratch.
export function sessionStateAt(session: TerminalSession, stepIndex: number): SessionState {
    const state = session.initial();
    const end = Math.min(Math.max(stepIndex, 0), session.steps.length);
    for (let index = 0; index < end; index++) {
        session.steps[index].run?.(state);
    }
    return state;
}

// Cursor blink, as the page's CSS draws it: solid for 530 ms after each
// keystroke, then 530 ms on, 530 ms off.
export const CURSOR_BLINK_MS = 530;

export function cursorVisible(sinceKeystroke: number): boolean {
    if (sinceKeystroke < CURSOR_BLINK_MS) return true;
    return (sinceKeystroke - CURSOR_BLINK_MS) % (CURSOR_BLINK_MS * 2) < CURSOR_BLINK_MS;
}

export interface SessionFrame {
    start: number;
    duration: number;
    title: string;
    rows: SessionLine[];
    cursorOn: boolean;
}

// One loop as a list of distinct screens, for exporting it as a GIF or video:
// samples the timeline every `sampleMs` and merges samples that look the same
// into one longer frame.
export function sessionFrames(session: TerminalSession, sampleMs = 20): SessionFrame[] {
    const state = session.initial();
    const frames: SessionFrame[] = [];
    let index = 0;
    let keys = state.keys;
    let keyTime = 0;
    let previous = '';

    for (let time = 0; time < session.total; time += sampleMs) {
        while (index < session.steps.length && session.times[index] <= time) {
            session.steps[index].run?.(state);
            index++;
        }
        if (state.keys !== keys) {
            keys = state.keys;
            keyTime = time;
        }

        const rows = renderTerminalSession(state);
        const cursorOn = cursorVisible(time - keyTime);
        const signature = `${state.title}\n${cursorOn}\n${JSON.stringify(rows)}`;
        const last = frames[frames.length - 1];
        if (last && signature === previous) {
            last.duration += sampleMs;
        } else {
            frames.push({ start: time, duration: sampleMs, title: state.title, rows, cursorOn });
            previous = signature;
        }
    }

    const last = frames[frames.length - 1];
    if (last) last.duration = Math.max(1, session.total - last.start);
    return frames;
}

/* ------------------------------------------------------------------------ */
/* Rendering                                                                 */
/* ------------------------------------------------------------------------ */

export const lineLength = (line: SessionLine) => line.reduce((sum, part) => sum + part.t.length, 0);

export const padLine = (line: SessionLine, width: number, extra: Partial<SessionSegment> = {}): SessionLine => {
    const length = lineLength(line);
    return length < width ? [...line, seg(' '.repeat(width - length), extra.c, extra)] : line;
};

// Puts the cursor on column `col`, splitting the segment under it. A block
// cursor inverts the cell; a bar keeps it and draws a line on its left.
function withCursor(line: SessionLine, col: number, shape: 'block' | 'bar'): SessionLine {
    const out: SessionLine = [];
    let position = 0;
    let placed = false;
    const cursorCell = (char: string, base: SessionSegment | null): SessionSegment => (shape === 'block'
        ? { t: char, c: 'bg', bg: 'cursor', b: base?.b, cur: 'block' }
        : { ...(base || {}), t: char, cur: 'bar' });

    for (const part of line) {
        const end = position + part.t.length;
        if (!placed && col >= position && col < end) {
            const offset = col - position;
            if (offset > 0) out.push({ ...part, t: part.t.slice(0, offset) });
            out.push(cursorCell(part.t[offset], part));
            if (offset + 1 < part.t.length) out.push({ ...part, t: part.t.slice(offset + 1) });
            placed = true;
        } else {
            out.push(part);
        }
        position = end;
    }
    if (!placed) {
        if (col > position) out.push(seg(' '.repeat(col - position)));
        out.push(cursorCell(' ', null));
    }
    return out;
}

// Splits a line into rows of at most `width` columns, as a terminal wraps.
function wrapLine(line: SessionLine, width = SESSION_COLS): SessionLine[] {
    const rows: SessionLine[] = [[]];
    let used = 0;
    for (const part of line) {
        let rest = part.t;
        while (rest.length) {
            if (used === width) {
                rows.push([]);
                used = 0;
            }
            const take = rest.slice(0, width - used);
            rows[rows.length - 1].push({ ...part, t: take });
            used += take.length;
            rest = rest.slice(take.length);
        }
    }
    return rows;
}

// Cuts a full-screen app's row at the screen edge.
export const clipLine = (line: SessionLine): SessionLine => wrapLine(line)[0];

function renderShell(state: SessionState): SessionLine[] {
    const lines = [...state.lines];
    if (state.input) {
        const line = [...state.input.prompt, seg(state.input.text)];
        lines.push(withCursor(line, lineLength(line), 'block'));
    } else {
        // A command is running: the cursor waits on the next line.
        lines.push(withCursor([], 0, 'block'));
    }
    const rows = lines.flatMap((line) => wrapLine(line)).slice(-SESSION_ROWS);
    while (rows.length < SESSION_ROWS) rows.push([]);
    return rows;
}

// Vim-like YAML highlighting: keys, quoted strings, comments, the document marker.
function yamlSegments(text: string): SessionLine {
    if (text === '---') return [seg(text, '06')];
    const match = /^(\s*)([\w-]+)(:)(\s*)('[^']*'?)?(\s*)(#.*)?$/.exec(text);
    if (!match) return text ? [seg(text)] : [];
    const [, indent, key, colon, space, value = '', gap = '', comment = ''] = match;
    return [
        seg(indent),
        seg(key, '07'),
        seg(colon),
        seg(space),
        seg(value, '03'),
        seg(gap),
        seg(comment, '09', { i: true }),
    ].filter((part) => part.t);
}

function renderVim(v: VimState): SessionLine[] {
    const height = SESSION_ROWS - 1;
    const top = Math.max(0, v.row - (height - 1));
    const gutter = Math.max(3, String(v.lines.length).length);
    const rows: SessionLine[] = [];

    for (let screenRow = 0; screenRow < height; screenRow++) {
        const index = top + screenRow;
        if (index >= v.lines.length) {
            rows.push([bold('~', '05')]);
            continue;
        }
        const current = index === v.row;
        const number = seg(`${String(index + 1).padStart(gutter)} `, current ? '04' : '09', { b: current });
        let line: SessionLine = [number, ...yamlSegments(v.lines[index])];
        if (current && v.mode !== 'command') {
            line = withCursor(line, gutter + 1 + v.col, v.mode === 'insert' ? 'bar' : 'block');
        }
        rows.push(line);
    }

    let status: SessionLine;
    if (v.mode === 'command') {
        status = withCursor([seg(`:${v.command}`)], v.command.length + 1, 'block');
    } else {
        const line = v.lines[v.row] || '';
        const position = line.length ? `${v.row + 1},${v.col + 1}` : `${v.row + 1},0-1`;
        const scroll = v.lines.length <= height ? 'All' : top === 0 ? 'Top' : top + height >= v.lines.length ? 'Bot' : `${Math.round(top / (v.lines.length - height) * 100)}%`;
        const message = v.message === '-- INSERT --' ? bold(v.message) : seg(v.message);
        status = [message, seg(' '.repeat(Math.max(1, SESSION_COLS - 18 - v.message.length))), seg(`${position.padEnd(14)}${scroll}`)];
    }
    rows.push(status);
    return rows;
}

// One htop meter: "  0[|||||||       24.1%]", the bar split into colored parts.
function meter(label: string, parts: Array<[number, SessionSlot]>, text: string, width: number): SessionLine {
    const inner = width - label.length - 2;
    const cells: Array<{ ch: string; c?: SessionSlot }> = Array.from({ length: inner }, () => ({ ch: ' ' }));
    let filled = 0;
    let sum = 0;
    for (const [value, slot] of parts) {
        sum += value;
        const until = Math.min(inner, Math.round(sum / 100 * inner));
        for (; filled < until; filled++) cells[filled] = { ch: '|', c: slot };
    }
    for (let index = 0; index < text.length; index++) {
        cells[inner - text.length + index] = { ch: text[index], c: '09' };
    }

    const out: SessionLine = [bold(label, '07'), bold('[')];
    for (const cell of cells) {
        const last = out[out.length - 1];
        if (last && last.c === cell.c && !last.b && out.length > 2) {
            last.t += cell.ch;
        } else {
            out.push(seg(cell.ch, cell.c));
        }
    }
    out.push(bold(']'));
    return out;
}

const formatTime = (centiseconds: number) => {
    const minutes = Math.floor(centiseconds / 6000);
    const seconds = Math.floor(centiseconds / 100) % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`;
};

const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const clock = [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
    return `${days} days, ${clock}`;
};

const memSlot = (value: string): SessionSlot | undefined => (/[MG]$/.test(value) ? '07' : undefined);

function renderHtop(frame: HtopFrame): SessionLine[] {
    const half = SESSION_COLS / 2;
    const rows: SessionLine[] = [];
    const sideBySide = (left: SessionLine, right: SessionLine) => [...padLine(left, half), ...right];
    const cpu = (index: number) => {
        const [low, normal, kernel] = frame.cpus[index];
        return meter(String(index).padStart(3), [[low, '05'], [normal, '03'], [kernel, '02']], `${(low + normal + kernel).toFixed(1)}%`, half - 1);
    };

    for (let index = 0; index < 4; index++) {
        rows.push(sideBySide(cpu(index), cpu(index + 4)));
    }
    const [used, buffers, cache] = frame.mem;
    rows.push(sideBySide(
        meter('Mem', [[used, '03'], [buffers, '05'], [cache, '04']], `${(used / 100 * 7.7).toFixed(2)}G/7.70G`, half - 1),
        [seg('Tasks: ', '07'), bold('64'), seg(', '), bold('211'), seg(' thr; '), bold(String(frame.running), '03'), seg(' running')],
    ));
    rows.push(sideBySide(
        meter('Swp', [[frame.swap, '02']], '12.0M/2.00G', half - 1),
        [seg('Load average: ', '07'), bold(frame.load[0].toFixed(2)), seg(` ${frame.load[1].toFixed(2)} `), seg(frame.load[2].toFixed(2), '09')],
    ));
    rows.push(sideBySide([], [seg('Uptime: ', '07'), bold(formatUptime(frame.uptime))]));
    rows.push([]);

    const header = (cpuLabel: string) => [
        seg(`${'PID'.padStart(5)} ${'USER'.padEnd(9)} ${'PRI'.padStart(3)} ${'NI'.padStart(3)} ${'VIRT'.padStart(5)} ${'RES'.padStart(5)} ${'SHR'.padStart(5)} S `, '01', { bg: '03' }),
        seg(cpuLabel, '01', { bg: '07' }),
        seg(` ${'MEM%'.padStart(4)} ${'TIME+'.padStart(9)}  Command`, '01', { bg: '03' }),
    ];
    rows.push(padLine(header('CPU%'.padStart(5)), SESSION_COLS, { c: '01', bg: '03' }));

    const listHeight = SESSION_ROWS - rows.length - 1;
    frame.procs.slice(0, listHeight).forEach((proc, index) => {
        const cells: SessionLine = [
            seg(`${String(proc.pid).padStart(5)} ${proc.user.padEnd(9)} ${'20'.padStart(3)} ${'0'.padStart(3)} `),
            seg(proc.virt.padStart(5), memSlot(proc.virt)),
            seg(' '),
            seg(proc.res.padStart(5), memSlot(proc.res)),
            seg(' '),
            seg(proc.shr.padStart(5), memSlot(proc.shr)),
            seg(' '),
            proc.state === 'R' ? bold('R', '03') : seg(proc.state),
            seg(` ${proc.cpu.toFixed(1).padStart(5)} ${proc.mem.toFixed(1).padStart(4)} ${formatTime(proc.time).padStart(9)}  `),
            seg(proc.command, proc.thread ? '03' : undefined),
        ];
        if (index === frame.selected) {
            // The selection bar repaints the whole row.
            const text = cells.map((part) => part.t).join('');
            rows.push(padLine([seg(text, '01', { bg: '07' })], SESSION_COLS, { c: '01', bg: '07' }));
        } else {
            rows.push(cells);
        }
    });
    while (rows.length < SESSION_ROWS - 1) rows.push([]);

    const keys: Array<[string, string]> = [['F1', 'Help'], ['F2', 'Setup'], ['F3', 'Search'], ['F4', 'Filter'], ['F5', 'Tree'], ['F6', 'SortBy'], ['F7', 'Nice -'], ['F8', 'Nice +'], ['F9', 'Kill'], ['F10', 'Quit']];
    const bar = keys.flatMap(([key, label]) => [seg(key), seg(label.padEnd(6), '01', { bg: '07' })]);
    rows.push(padLine(bar, SESSION_COLS, { c: '01', bg: '07' }));
    return rows;
}

// The screen for a state: always SESSION_ROWS rows of segments.
export function renderTerminalSession(state: SessionState): SessionLine[] {
    if (state.screen === 'full' && state.full) {
        const rows = state.full.slice(0, SESSION_ROWS).map(clipLine);
        while (rows.length < SESSION_ROWS) rows.push([]);
        return rows;
    }
    if (state.screen === 'vim' && state.vim) return renderVim(state.vim).map(clipLine);
    if (state.screen === 'htop' && state.htop) return renderHtop(state.htop).map(clipLine);
    return renderShell(state);
}
