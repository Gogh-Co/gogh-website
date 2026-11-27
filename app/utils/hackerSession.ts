import { safeHex } from './themeColors';
import { themeSlug } from './themeSlug';
import {
    SESSION_COLS,
    SESSION_ROWS,
    bold,
    createSessionScript,
    hashString,
    lineLength,
    mulberry32,
    padLine,
    plain,
    seg,
    type SessionLine,
    type SessionSlot,
    type SessionState,
    type TerminalSession,
} from './terminalSession';

// "Hacker mode" for the theme page's live session: a movie-style break-in
// that plays in a loop. A port scan, an exploit, a vault key decrypted into
// the theme's own palette, a power grid override, a countertrace and some
// digital rain. Every host, city and system in it is made up. It is written
// with the same script blocks as the daily session, and the page paints it
// through CRT, bloom and cursor-trail shaders (see hackerShader.ts).

const LOCAL_TITLE = 'ghost@nullsec: ~/ops';
const ROOT_TITLE = 'root@aegis-9: /core';

const localPrompt = (): SessionLine => [bold('ghost', '10'), seg('@', '09'), bold('nullsec', '11'), seg(' ~/ops ', '13'), bold('>> ', '14')];
const rootPrompt = (): SessionLine => [bold('root@aegis-9', '10'), seg(':', '09'), bold('/core', '13'), bold('# ', '10')];

// Figlet-style letters (ASCII only, so every glyph is one cell wide).
const LETTERS: Record<string, string[]> = {
    G: ['  ____ ', ' / ___|', '| |  _ ', '| |_| |', ' \\____|'],
    H: [' _   _ ', '| | | |', '| |_| |', '|  _  |', '|_| |_|'],
    O: ['  ___  ', ' / _ \\ ', '| | | |', '| |_| |', ' \\___/ '],
    S: [' ____  ', '/ ___| ', '\\___ \\ ', ' ___) |', '|____/ '],
    T: [' _____ ', '|_   _|', '  | |  ', '  | |  ', '  |_|  '],
    E: [' _____ ', '| ____|', '|  _|  ', '| |___ ', '|_____|'],
    L: [' _     ', '| |    ', '| |    ', '| |___ ', '|_____|'],
};

function banner(word: string): SessionLine[] {
    const colors: SessionSlot[] = ['10', '12', '11', '15', '13', '14'];
    return [0, 1, 2, 3, 4].map((row) => [
        seg('  '),
        ...[...word].map((letter, index) => bold(LETTERS[letter]?.[row] ?? '', colors[index % colors.length])),
    ]);
}

const HEX = '0123456789abcdef';
const NOISE = 'abcdef0123456789$#@%&*+=<>?/\\|{}[]';

const pick = (rand: () => number, chars: string) => chars[Math.floor(rand() * chars.length)];
const randomHex = (rand: () => number, length: number) => Array.from({ length }, () => pick(rand, HEX)).join('');

// A cell grid for full-screen frames, merged back into segments per row.
interface Cell {
    ch: string;
    c?: SessionSlot;
    bg?: SessionSlot;
    b?: boolean;
}

function cellsToLine(cells: Cell[]): SessionLine {
    const out: SessionLine = [];
    for (const cell of cells) {
        const last = out[out.length - 1];
        if (last && last.c === cell.c && last.bg === cell.bg && !!last.b === !!cell.b) {
            last.t += cell.ch;
        } else {
            out.push({ t: cell.ch, c: cell.c, bg: cell.bg, b: cell.b || undefined });
        }
    }
    return out;
}

const bar = (amount: number, width: number, fill: SessionSlot, empty: SessionSlot = '09'): SessionLine => {
    const filled = Math.max(0, Math.min(width, Math.round(amount * width)));
    return [
        seg('['),
        ...(filled ? [seg(' '.repeat(filled), undefined, { bg: fill })] : []),
        ...(width - filled ? [seg('.'.repeat(width - filled), empty)] : []),
        seg(']'),
    ];
};

const header = (text: string, slot: SessionSlot): SessionLine => padLine([seg(` ${text}`, 'bg', { bg: slot, b: true })], SESSION_COLS, { c: 'bg', bg: slot });

const centered = (line: SessionLine, width = SESSION_COLS): SessionLine => {
    const left = Math.max(0, Math.floor((width - lineLength(line)) / 2));
    return [seg(' '.repeat(left)), ...line];
};

function hexDump(rand: () => number, rows: number): SessionLine[] {
    const words = 'ORBITAL-UPLINK-AEGIS9-ROOTKEY-PHANTOM-0451-';
    let address = 0x7ffd3a10;
    let offset = Math.floor(rand() * words.length);
    return Array.from({ length: rows }, () => {
        const bytes = Array.from({ length: 16 }, () => Math.floor(rand() * 256));
        const ascii = Array.from({ length: 16 }, (_, index) => (rand() < 0.55 ? words[(offset + index) % words.length] : '.')).join('');
        offset += 16;
        const line: SessionLine = [
            seg(`0x${address.toString(16)}  `, '09'),
            seg(bytes.map((value) => value.toString(16).padStart(2, '0')).join(' '), '03'),
            seg('  |', '09'),
            seg(ascii, '11'),
            seg('|', '09'),
        ];
        address += 16;
        return line;
    });
}

// The vault: one key fragment per palette slot; each one scrambles until it
// locks on the theme's real color and shows its swatch.
function vaultFrame(rand: () => number, hexes: string[], locked: number, final: boolean): SessionLine[] {
    const rows: SessionLine[] = [
        header('VAULT DECRYPTOR  //  /core/keys.vlt  //  AES-4096-GCM', '05'),
        [],
        [seg('  cracking 16 key fragments on 1024 GPU cores', '09'), seg('   rate ', '09'), bold(`${(1.6 + rand() * 0.9).toFixed(2)}e18`, '12'), seg(' keys/s', '09')],
        [],
    ];
    for (let index = 0; index < 16; index++) {
        const slot = String(index + 1).padStart(2, '0');
        const done = index < locked;
        const value = done ? hexes[index] : `#${Array.from({ length: 6 }, () => pick(rand, 'ABCDEF0123456789')).join('')}`;
        rows.push([
            seg('  FRAGMENT ', '09'),
            bold(slot, done ? '11' : '09'),
            seg(`  color_${slot}  `, done ? 'fg' : '09'),
            done ? bold(`[${value}]`, '11') : seg(`[${value}]`, rand() < 0.5 ? '03' : '09'),
            seg('  '),
            done ? seg('      ', undefined, { bg: slot }) : seg(' ?????', '09'),
            seg('  '),
            seg(done ? 'OK  ' : 'scan', done ? '11' : '12', { b: done }),
            seg(`  ${randomHex(rand, 32)}`, rand() < 0.3 ? '03' : '09'),
        ]);
    }
    rows.push([]);
    const amount = locked / 16;
    rows.push([seg('  '), ...bar(amount, 48, final ? '11' : '03'), bold(` ${String(Math.round(amount * 100)).padStart(3)}%`, final ? '11' : '12'), seg(`  ${locked}/16 fragments`, '09')]);
    rows.push(final
        ? [seg('  '), seg(' VAULT OPEN ', 'bg', { bg: '11', b: true }), seg('  key assembled, all 16 fragments verified', '11')]
        : [seg('  brute forcing ', '09'), seg(randomHex(rand, 24), '03')]);
    return rows;
}

const SECTORS = ['NEO-KYOTO', 'VOSTOK-7', 'NEW LAGOS', 'ARCOLOGY 9', 'PORT ZERO', 'HELIOPOLIS', 'MERIDIAN', 'TERMINUS', 'SKYHARBOR', 'DEEPWELL'];

interface GridState {
    rerouted: number;
    trace: number;
    loads: number[];
    blink: boolean;
    log: string;
}

function gridFrame(grid: GridState): SessionLine[] {
    const rows: SessionLine[] = [
        header('HELIOS POWER GRID  //  SECTOR CONTROL  //  OPERATOR: ROOT', grid.trace > 0 ? '02' : '05'),
        [],
        [bold(`  ${'SECTOR'.padEnd(8)}${'CITY'.padEnd(14)}${'LOAD'.padEnd(37)}STATUS`, 'fg')],
    ];
    SECTORS.forEach((city, index) => {
        const rerouted = index < grid.rerouted;
        const load = grid.loads[index] ?? 0;
        rows.push([
            seg(`  ${String(index + 1).padStart(2, '0')}      `, '09'),
            seg(city.padEnd(14), rerouted ? '12' : 'fg'),
            ...bar(load, 28, rerouted ? '12' : load > 0.85 ? '10' : '11'),
            seg(` ${String(Math.round(load * 100)).padStart(3)}%  `, '09'),
            rerouted ? bold('REROUTED', '12') : bold('ONLINE  ', '11'),
        ]);
    });
    rows.push([]);
    if (grid.trace > 0) {
        const alarm = ' !! COUNTERTRACE DETECTED  //  CERBERUS-SOC IS TRACING THIS SESSION !! ';
        rows.push(grid.blink
            ? [seg('  '), seg(alarm, 'bg', { bg: '10', b: true })]
            : [seg('  '), seg(alarm, '10', { b: true })]);
        rows.push([]);
        rows.push([seg('  TRACE  ', '10'), ...bar(grid.trace, 52, '10'), bold(` ${String(Math.round(grid.trace * 100)).padStart(3)}%`, '10')]);
        const hops = ['VOID', 'OSLO', 'PERTH', 'QUITO', 'SEOUL', 'LAGOS', 'REYKJAVIK'];
        const found = Math.min(hops.length, Math.floor(grid.trace * hops.length));
        rows.push([seg('  hops found: ', '09'), ...hops.map((hop, index) => seg(`${hop} `, index < found ? '10' : '09', { b: index < found }))]);
    } else {
        rows.push([seg('  grid integrity nominal. no active trace.', '09')]);
    }
    while (rows.length < SESSION_ROWS - 1) rows.push([]);
    rows.push([bold('  override> ', '14'), seg(grid.log, 'fg')]);
    return rows;
}

// Digital rain in the palette: bright heads, fading green tails.
function rainFrames(rand: () => number, count: number, message: string): SessionLine[][] {
    const columns = Array.from({ length: SESSION_COLS / 2 }, () => ({
        head: -Math.floor(rand() * SESSION_ROWS * 1.5),
        speed: 0.6 + rand() * 0.9,
        tail: 5 + Math.floor(rand() * 12),
        chars: Array.from({ length: SESSION_ROWS }, () => pick(rand, NOISE)),
    }));
    const frames: SessionLine[][] = [];
    for (let frame = 0; frame < count; frame++) {
        const grid: Cell[][] = Array.from({ length: SESSION_ROWS }, () => Array.from({ length: SESSION_COLS }, () => ({ ch: ' ' })));
        columns.forEach((column, index) => {
            column.head += column.speed;
            if (column.head - column.tail > SESSION_ROWS) {
                column.head = -Math.floor(rand() * 8);
                column.speed = 0.6 + rand() * 0.9;
            }
            if (rand() < 0.3) column.chars[Math.floor(rand() * SESSION_ROWS)] = pick(rand, NOISE);
            const head = Math.floor(column.head);
            for (let offset = 0; offset <= column.tail; offset++) {
                const row = head - offset;
                if (row < 0 || row >= SESSION_ROWS) continue;
                const fade = offset / column.tail;
                grid[row]![index * 2] = {
                    ch: column.chars[row] ?? ' ',
                    c: offset === 0 ? 'fg' : fade < 0.25 ? '11' : fade < 0.7 ? '03' : '09',
                    b: offset < 3,
                };
            }
        });
        // The message burns in during the second half.
        if (frame > count / 2) {
            const box = ` ${message} `;
            const row = Math.floor(SESSION_ROWS / 2);
            const left = Math.floor((SESSION_COLS - box.length) / 2);
            const shown = Math.min(box.length, Math.round((frame - count / 2) / (count / 2) * box.length * 1.6));
            for (let index = -2; index < box.length + 2; index++) {
                for (const r of [row - 1, row, row + 1]) {
                    if (left + index >= 0 && left + index < SESSION_COLS) grid[r]![left + index] = { ch: ' ' };
                }
            }
            for (let index = 0; index < shown; index++) {
                grid[row]![left + index] = { ch: box[index] ?? ' ', c: '11', b: true };
            }
        }
        frames.push(grid.map(cellsToLine));
    }
    return frames;
}

export function buildHackerSession(theme: Record<string, any>, themeName: string): TerminalSession {
    const name = (themeName || theme?.name || 'Theme').toString();
    const short = name.length > 28 ? `${name.slice(0, 27)}~` : name;
    const slug = themeSlug(name) || 'theme';
    const rand = mulberry32(hashString(`hacker:${name}`));
    const hexes = Array.from({ length: 16 }, (_, index) => {
        const key = `color_${String(index + 1).padStart(2, '0')}`;
        return (safeHex(theme?.[key]) || safeHex(theme?.foreground) || '#ffffff').toUpperCase();
    });

    const script = createSessionScript(rand);
    const { steps, step, pause, chapter, prompt, command, print, replaceLast } = script;
    const glitch = (state: SessionState) => {
        state.glitch = (state.glitch ?? 0) + 1;
    };
    const full = (rows: SessionLine[], title?: string) => (state: SessionState) => {
        state.screen = 'full';
        state.full = rows;
        if (title) state.title = title;
    };
    const backToShell = (title: string) => (state: SessionState) => {
        state.screen = 'shell';
        state.full = null;
        state.title = title;
        state.keys++;
    };

    // 1. Boot the toolkit through seven made-up hops.
    chapter('boot');
    step(700);
    command('./ghostshell --stealth --hops 7', { think: 300, wait: 520 });
    step(0, glitch);
    print([...banner('GHOSTSHELL'), []], 45);
    print([
        [seg('[+] ', '11'), seg('ghostshell 6.6.6 // operator '), bold(short, '14')],
        [seg('[+] ', '11'), seg('chaining 7 hops: '), seg('REYKJAVIK > LAGOS > SEOUL > QUITO > PERTH > OSLO > VOID', '15')],
        [seg('[+] ', '11'), seg('spoofed MAC '), seg('de:ad:be:ef:13:37', '12'), seg('   entropy pool '), seg('4096 bits', '12')],
        [seg('[+] ', '11'), seg('palette loaded: '), ...Array.from({ length: 16 }, (_, index) => seg('  ', undefined, { bg: String(index + 1).padStart(2, '0') }))],
    ], 90);
    prompt(localPrompt, 800);

    // 2. Scan a made-up orbital array.
    chapter('nmap');
    command('nmap -sS -T5 -p- aegis-9.orbit.void', { think: 280, wait: 700 });
    const port = (spec: string, state: string, service: string, version: string): SessionLine => [
        seg(spec.padEnd(11), '15'),
        bold(state.padEnd(10), state === 'open' ? '11' : '12'),
        seg(service.padEnd(12)),
        seg(version, '09'),
    ];
    print([
        plain('Starting Nmap 7.95 at 2077-11-27 03:13 UTC'),
        [seg('Nmap scan report for '), bold('aegis-9.orbit.void', '13'), seg(' (10.13.37.9)')],
        [seg('Host is up (0.0013s latency). Not shown: 65530 closed ports', '09')],
        [bold('PORT       STATE     SERVICE     VERSION')],
        port('22/tcp', 'open', 'ssh', 'OpenSSH 9.9p1'),
        port('443/tcp', 'open', 'https', 'orbital-gw 4.2'),
        port('1337/tcp', 'open', 'uplink', 'AEGIS-9 telemetry'),
        port('6666/tcp', 'open', 'sat-ctrl', 'sat-control 0.9b'),
        port('31337/tcp', 'filtered', 'unknown', ''),
        [],
        [bold('[!] ', '10'), bold('CVE-2077-0451', '10'), seg('  uplink auth bypass  '), seg(' CRITICAL 10.0 ', 'bg', { bg: '10', b: true })],
    ], 75);
    prompt(localPrompt, 900);

    // 3. The exploit: a hex dump, a payload, four firewalls, root.
    chapter('exploit');
    command('python3 breach.py --target 10.13.37.9 --payload phantom', { think: 260, wait: 300 });
    print(hexDump(rand, 9), 38);
    const spinner = '|/-\\';
    print([[seg('[*] ', '12'), seg('injecting payload '), seg('|', '14')]], 60);
    for (let tick = 1; tick < 14; tick++) {
        replaceLast([seg('[*] ', '12'), seg('injecting payload '), seg(spinner[tick % 4] ?? '|', '14'), seg(` ${'.'.repeat(tick % 4)}`, '09')], 75);
    }
    replaceLast([seg('[*] ', '12'), seg('injecting payload '), bold('done', '11')], 120);
    for (let layer = 1; layer <= 4; layer++) {
        const line = (amount: number): SessionLine => [
            seg('[*] ', '12'),
            seg(`firewall ${layer}/4 `),
            ...bar(amount, 32, layer === 4 ? '14' : '11'),
            amount >= 1 ? bold(' BYPASSED', '11') : seg(` ${String(Math.round(amount * 100)).padStart(3)}%`, '09'),
        ];
        print([line(0)], 60);
        for (let tick = 1; tick <= 7; tick++) {
            replaceLast(line(tick / 7), 42 + rand() * 30);
        }
    }
    step(260, glitch);
    const granted = ' A C C E S S   G R A N T E D ';
    const boxWidth = granted.length + 12;
    print([
        [],
        [seg('  '), seg(' '.repeat(boxWidth), undefined, { bg: '11' })],
        [seg('  '), seg(' '.repeat(6), undefined, { bg: '11' }), seg(granted, 'bg', { bg: '11', b: true }), seg(' '.repeat(6), undefined, { bg: '11' })],
        [seg('  '), seg(' '.repeat(boxWidth), undefined, { bg: '11' })],
        [],
        [seg('[+] ', '11'), seg('root shell on '), bold('aegis-9', '13'), seg(' (uid=0 gid=0)')],
    ], 70);
    step(0, (state) => {
        state.title = ROOT_TITLE;
    });
    prompt(rootPrompt, 900);

    // 4. Decrypt the vault: its sixteen fragments are this theme's colors.
    chapter('decrypt');
    command('decrypt --vault /core/keys.vlt --cipher AES-4096', { think: 260, wait: 380 });
    const vaultTitle = 'root@aegis-9: decrypt keys.vlt';
    const vaultSteps = 40;
    for (let frame = 0; frame < vaultSteps; frame++) {
        const locked = Math.max(0, Math.min(16, Math.floor((frame - 4) / 2)));
        step(frame === 0 ? 70 : 62, full(vaultFrame(rand, hexes, locked, false), vaultTitle));
    }
    step(0, glitch);
    step(2300, full(vaultFrame(rand, hexes, 16, true), vaultTitle));
    const posterIndex = steps.length;
    step(0, backToShell(ROOT_TITLE));
    print([[seg('[+] ', '11'), seg('vault open: '), bold('16/16', '11'), seg(' fragments recovered, key '), seg(randomHex(rand, 24), '12')]], 60);
    prompt(rootPrompt, 700);

    // 5. Override a made-up power grid; halfway through, someone notices.
    chapter('mainframe');
    command('helios --override --sector ALL --force', { think: 300, wait: 420 });
    const grid: GridState = {
        rerouted: 0,
        trace: 0,
        loads: SECTORS.map(() => 0.55 + rand() * 0.4),
        blink: false,
        log: 'handshake ok. taking control of 10 sectors',
    };
    const gridTitle = 'root@aegis-9: helios-grid';
    const snapshot = () => gridFrame({ ...grid, loads: [...grid.loads] });
    const jitter = () => {
        grid.loads = grid.loads.map((load, index) => (index < grid.rerouted
            ? Math.max(0.08, load * 0.7)
            : Math.min(0.99, Math.max(0.4, load + (rand() - 0.5) * 0.12))));
    };
    step(500, full(snapshot(), gridTitle));
    for (let sector = 1; sector <= SECTORS.length; sector++) {
        grid.rerouted = sector;
        grid.log = `rerouting sector ${String(sector).padStart(2, '0')} (${SECTORS[sector - 1]})...`;
        jitter();
        step(150 + rand() * 90, full(snapshot()));
    }
    grid.log = 'all sectors rerouted.';
    step(500, full(snapshot()));
    step(0, (state) => {
        state.alert = true;
        glitch(state);
    });
    for (let tick = 1; tick <= 18; tick++) {
        grid.trace = Math.min(0.97, tick / 18 * 0.97);
        grid.blink = tick % 2 === 0;
        grid.log = tick < 10 ? 'WARNING: inbound trace. hold...' : 'trace closing in. BURN IT. BURN IT NOW.';
        jitter();
        step(120, tick % 6 === 0 ? (state) => {
            full(snapshot())(state);
            glitch(state);
        } : full(snapshot()));
    }
    pause(400);

    // 6. Burn the route and the logs before the trace completes.
    chapter('escape');
    step(0, backToShell(ROOT_TITLE));
    print([[bold('[!] ', '10'), bold('countertrace at 97%', '10'), seg(' // source: '), bold('CERBERUS-SOC', '10')]], 80);
    prompt(rootPrompt, 260);
    command('burn --route all && shred -fuz /var/log/*', { think: 140, wait: 260 });
    ['VOID', 'OSLO', 'PERTH', 'QUITO', 'SEOUL', 'LAGOS', 'REYKJAVIK'].forEach((hop, index) => {
        print([[seg(`    hop ${7 - index}  `, '09'), seg(hop.padEnd(11), '15'), bold('burned', '10')]], 95);
    });
    script.progress('Shredding logs', 6, ', done.', 70);
    step(160, (state) => {
        state.alert = false;
        glitch(state);
    });
    print([[seg('[+] ', '11'), bold('trace lost.', '11'), seg(' you were never here.', '09')]], 80);
    prompt(rootPrompt, 800);

    // 7. Digital rain, painted with the palette.
    chapter('rain');
    command(`rain --palette ${slug}`, { think: 260, wait: 300 });
    const message = `the palette is yours, ${short.toLowerCase()}.`;
    rainFrames(rand, 52, message).forEach((rows, index) => {
        step(68, full(rows, index === 0 ? 'root@aegis-9: rain' : undefined));
    });
    pause(900);
    step(0, backToShell(ROOT_TITLE));
    prompt(rootPrompt, 500);

    // 8. Leave, clear the screen and start over.
    chapter('exit');
    command('exit', { think: 240, wait: 140 });
    print([plain('logout'), [seg('Connection to aegis-9 closed.', '09')]], 160);
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
        full: null,
        glitch: 0,
        alert: false,
        keys: 0,
    });

    return script.finish({ posterIndex, file: `${slug}.vlt`, initial });
}

// Where the cursor sits on a rendered screen, in cells, or null if hidden.
export function cursorCell(rows: SessionLine[]): { col: number; row: number } | null {
    for (let row = 0; row < rows.length; row++) {
        let col = 0;
        for (const part of rows[row] ?? []) {
            if (part.cur) return { col, row };
            col += part.t.length;
        }
    }
    return null;
}
