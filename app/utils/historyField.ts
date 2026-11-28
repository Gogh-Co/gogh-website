// A viewport-sized hidden layer shared by all chapters. Its coordinates belong
// to the section, so discoveries stay in place as the reader scrolls.
interface Archive {
    color: string;
    lines: string[];
    secret: string[];
}

const ARCHIVES: Record<string, Archive> = {
    paper: {
        color: '#e8bd80',
        lines: ['01001000 01000101 01001100 01001100 01001111', 'ASCII · 7 BIT · 128 CHARACTERS', '0x07  BEL     0x0A  LF     0x0D  CR', '> PRINT "HELLO, WORLD!"', '01010100 01011001 01010000 01000101', 'TTY / PAPER / INK / RETURN'],
        secret: ['  /\\_/\\', ' ( o.o )', '  > ^ <', 'HELLO, WORLD!'],
    },
    glass: {
        color: '#56ef85',
        lines: ['VT100 READY_', '80 COLUMNS × 24 ROWS', '01010000 01001000 01001111 01010011', '$ echo "LET THERE BE LIGHT"', 'P1 / P3 / P4', 'ESC [ 2 J    ESC [ H'],
        secret: ['   ▄█▄  ▄█▄', '  ██████████', '  ██ ████ ██', '    ▀    ▀', 'SPACE INVADERS_'],
    },
    escape: {
        color: '#efcf63',
        lines: ['ESC [ PARAMETERS m', '\\e[1;32mHELLO\\e[0m', '0x1B  0x5B  0x33  0x31  0x6D', 'CSI / SGR / OSC / BEL', 'printf "\\033[38;5;208mCOLOR\\033[0m"', 'ESCAPED SUCCESSFULLY_'],
        secret: ['+--------+', '|  ESC   |', '+--------+', 'YOU FOUND THE EXIT.'],
    },
    eight: {
        color: '#ef8071',
        lines: ['30 31 32 33 34 35 36 37', 'BLACK RED GREEN YELLOW BLUE MAGENTA CYAN WHITE', '000 001 010 011 100 101 110 111', '3 BITS = 8 NAMES', 'ANSI ≠ RGB', 'printf "\\e[31mRED\\e[0m"'],
        secret: ['  ▄████▄', ' ██████', ' ██████', '  ▀████▀  · · ·', 'PLAYER ONE_'],
    },
    sixteen: {
        color: '#7edfa4',
        lines: ['8 NORMAL + 8 BRIGHT', '90 91 92 93 94 95 96 97', '0000 0001 0010 0011 0100 0101 0110 0111', '1000 1001 1010 1011 1100 1101 1110 1111', 'BOLD / BRIGHT / INTENSITY', 'FOUR BITS. SIXTEEN POSSIBILITIES.'],
        secret: ['▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄', '▀ ▀ ▀ ▀ ▀ ▀ ▀ ▀', '8 + 8 = 16', 'LEVEL UP_'],
    },
    cube: {
        color: '#79b5f0',
        lines: ['16 + 36r + 6g + b', '0 95 135 175 215 255', '16 + 216 + 24 = 256', 'ESC[38;5;208m', 'r g b ∈ {0, 1, 2, 3, 4, 5}', 'INDEX / CUBE / GRAYSCALE'],
        secret: ['     +----+', '    /    /|', '   +----+ |', '   |    | +', '   +----+/', 'THE NEXT DIMENSION_'],
    },
    truecolor: {
        color: '#c59bea',
        lines: ['#C0FFEE     #BADA55     #FACADE', '256 × 256 × 256 = 16,777,216', 'ESC[38;2;R;G;Bm', '11111111 01111001 11000110', 'RGB / 24 BIT / DIRECT COLOR', 'THERE IS NO PALETTE LIMIT_'],
        secret: ['   /\\_/\\', '== ( ^.^ ) ===', '== /|___|\\ ===', '#C0FFEE BREAK_'],
    },
    themes: {
        color: '#64c6bc',
        lines: ['background: "#0D1926"', 'foreground: "#ECF0F1"', 'name: "Gogh"', 'palette: [red, green, yellow, blue, magenta, cyan]', '$ sudo make me a theme', 'SAME CODE. ANOTHER WORLD.'],
        secret: ['    ( (', '   .----.', '   |    |)', '   `----´', 'sudo make me a theme_'],
    },
    science: {
        color: '#e2cb79',
        lines: ['Y = 0.2126 R + 0.7152 G + 0.0722 B', '(L1 + 0.05) / (L2 + 0.05)', 'sRGB → LINEAR → LUMINANCE', 'AA 4.5:1     AAA 7:1', 'OKLCH / LIGHTNESS / CHROMA / HUE', 'THE ANSWER IS IN THE CONTRAST_'],
        secret: ['   .-------.', ' /    ◉     \\', ' \\         /', '   `-------´', 'THE ANSWER: 42_'],
    },
    etiquette: {
        color: '#d4d4cf',
        lines: ['$ NO_COLOR=1', 'if [ -t 1 ]; then color; fi', 'RESPECT THE READER_', 'TERM=dumb', 'NO_COLOR / FORCE_COLOR / ISATTY', 'SILENCE IS ALSO A PALETTE.'],
        secret: ['   /\\_/\\', '  ( -.- )', '   > z <', 'NO_COLOR. NO NOISE._'],
    },
    today: {
        color: '#78b6e8',
        lines: ['CPU → GLYPH ATLAS → GPU → PIXEL', 'ALACRITTY / KITTY / GHOSTTY', '↑ ↑ ↓ ↓ ← → ← → B A', '01000111 01001111 01000111 01001000', 'THE TERMINAL IS STILL A CANVAS.', 'NEXT FRAME_'],
        secret: ['↑ ↑ ↓ ↓ ← → ← →', '      B A', '   +1 LIFE', 'KEEP EXPLORING_'],
    },
};
const SPECTRUM = ['#df6b72', '#deb85b', '#7ed79b', '#62c6cf', '#80a5ec', '#bc92e5'];
const SECTION = '.h-chapter, .h-hero, .h-index, .h-outro';
const CONTROL = 'a, button, input, select, textarea, [contenteditable], [role="slider"]';
const PROTECTED = '.h-chapter__copy h2, .h-chapter__copy p, .h-chapter__text p, .hfig, .h-sources, .h-hero__inner h1, .h-hero__note, .h-index__header, .h-card, .h-outro__inner';

export function createHistoryField(root: HTMLElement): () => void {
    const canvas = document.createElement('canvas');
    canvas.className = 'h-history-field';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.fieldState = 'idle';
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const layer = document.createElement('canvas');
    const paint = layer.getContext('2d');
    const mask = document.createElement('canvas');
    const ink = mask.getContext('2d');
    if (!ctx || !paint || !ink) return () => {};
    root.prepend(canvas);
    const media = matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)');
    let section: HTMLElement | null = null;
    let archive = ARCHIVES.themes!;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let lastTime = 0;
    let lastMove = 0;
    let inside = false;
    let pressing = false;
    let hold = 0;
    let radius = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let disposed = false;
    let wallKey = '';
    let protectedNodes: Element[] = [];
    let secretSpots: { x: number; y: number }[] = [];
    const tail = Array.from({ length: 5 }, () => ({ x: 0, y: 0 }));

    function size() {
        if (width === innerWidth && height === innerHeight) return;
        width = innerWidth; height = innerHeight;
        wallKey = '';
        dpr = Math.min(devicePixelRatio || 1, 1.5, 1800 / width);
        canvas.width = layer.width = Math.round(width * dpr);
        canvas.height = layer.height = Math.round(height * dpr);
        mask.width = Math.ceil(width / 4); mask.height = Math.ceil(height / 4);
    }

    function sleep() {
        cancelAnimationFrame(frame); frame = lastTime = 0;
        inside = pressing = false; radius = hold = 0;
        canvas.dataset.fieldState = 'idle';
        delete canvas.dataset.fieldSecret;
        ctx!.clearRect(0, 0, canvas.width, canvas.height);
    }

    function wake() {
        if (!frame && !disposed && media.matches && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function draw(now: number) {
        frame = 0;
        if (!media.matches || document.hidden || !section?.isConnected) { sleep(); return; }
        size();
        const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 1 / 60;
        lastTime = now;
        const ease = 1 - Math.exp(-dt * 10);
        x += (targetX - x) * ease; y += (targetY - y) * ease;
        hold += ((pressing ? 1 : 0) - hold) * (1 - Math.exp(-dt * (pressing ? 1.8 : 4)));
        const idle = Math.min(1, Math.max(0, 1 - (now - lastMove - 3500) / 1500));
        const full = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
        const desired = inside ? (230 + hold * hold * full) * (pressing ? 1 : idle) : 0;
        radius += (desired - radius) * (1 - Math.exp(-dt * 7));
        if (radius < .7 && !desired) { sleep(); return; }
        canvas.dataset.fieldState = pressing ? 'expanding' : inside && idle > 0 ? 'active' : 'fading';
        const box = section.getBoundingClientRect();
        const top = Math.max(0, box.top);
        const bottom = Math.min(height, box.bottom);
        ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx!.clearRect(0, 0, width, height);
        if (bottom <= top) { sleep(); return; }

        // Rasterize the stationary archive and its foreground cutouts only
        // when text, geometry or the slow binary clock changes. Pointer motion
        // now composites a cached image instead of re-typesetting every frame.
        const rectangles = protectedNodes.map(node => node.getBoundingClientRect())
            .filter(rect => rect.bottom >= 0 && rect.top <= height);
        const geometry = rectangles.map(rect => [rect.left, rect.top, rect.width, rect.height].map(n => n.toFixed(1)).join(',')).join(';');
        const key = `${box.top.toFixed(1)}:${Math.floor(now / 450)}:${geometry}`;
        if (key !== wallKey) {
            wallKey = key;
            // A hidden archive wall, anchored to this chapter rather than the cursor.
            paint!.setTransform(dpr, 0, 0, dpr, 0, 0);
            paint!.globalCompositeOperation = 'source-over';
            paint!.globalAlpha = 1;
            paint!.clearRect(0, 0, width, height);
            const wash = paint!.createLinearGradient(0, 0, width, height);
            wash.addColorStop(0, '#0d1720'); wash.addColorStop(1, '#101c22');
            paint!.fillStyle = wash; paint!.fillRect(0, top, width, bottom - top);
            paint!.font = '500 12px "Roboto Mono", monospace';
            paint!.textBaseline = 'top';
            const first = Math.floor((top - box.top) / 26);
            const last = Math.ceil((bottom - box.top) / 26);
            const columns = Math.ceil(width / 400);
            for (let row = first; row <= last; row++) {
                const yy = box.top + row * 26;
                for (let col = 0; col < columns; col++) {
                    const index = row + col * 3;
                    paint!.globalAlpha = row % 4 === 0 ? .24 : .64;
                    paint!.fillStyle = section.id === 'etiquette' ? archive.color
                        : row % 4 === 0 ? '#88929a' : index % 3 === 0 ? SPECTRUM[(index + 60) % 6]! : archive.color;
                    const code = row % 4 === 0
                        ? Array.from({ length: 40 }, (_, i) => ((i * 13 + row * 7 + col + Math.floor(now / 450)) % 11 < 5 ? '0' : '1')).join('')
                        : archive.lines[((index % archive.lines.length) + archive.lines.length) % archive.lines.length]!;
                    paint!.fillText(code, col * 400 + 18, yy, 365);
                }
            }

            // Deliberate discoveries repeat sparsely through the whole reading area.
            // Alternate sides; they never follow the pointer like a floating badge.
            secretSpots = [];
            const start = Math.max(0, Math.floor((top - box.top - 180) / 420));
            const end = Math.ceil((bottom - box.top) / 420);
            for (let row = start; row <= end; row++) {
                const left = ['paper', 'sixteen', 'science'].includes(section.id);
                const side = section.id === 'etiquette' ? .08 : left ? .22 : .72;
                const sx = width * (row % 2 ? 1 - side : side);
                const offset = section.id === 'eight' ? 370 : section.id === 'truecolor' ? 120 : 170;
                const sy = box.top + offset + row * 420;
                secretSpots.push({ x: sx + 70, y: sy + 40 });
                paint!.globalAlpha = .94;
                paint!.fillStyle = archive.color;
                paint!.font = '500 17px "Roboto Mono", monospace';
                archive.secret.forEach((line, i) => {
                    if (section!.id === 'truecolor' && i === 1) paint!.fillStyle = SPECTRUM[4]!;
                    paint!.fillText(line, sx, sy + i * 21);
                });
            }

            // The archive is scenery: foreground type and controls stay clear.
            paint!.globalCompositeOperation = 'destination-out';
            paint!.fillStyle = '#000';
            paint!.globalAlpha = 1;
            paint!.shadowColor = '#000'; paint!.shadowBlur = 20;
            rectangles.forEach(rect => {
                paint!.fillRect(rect.left - 6, rect.top - 5, rect.width + 12, rect.height + 10);
            });
            paint!.shadowBlur = 0; paint!.globalAlpha = 1;
            paint!.globalCompositeOperation = 'source-over';
        }
        delete canvas.dataset.fieldSecret;
        if (secretSpots.some(spot => Math.hypot(x - spot.x, (y - spot.y) * 1.15) < radius * .65)) {
            canvas.dataset.fieldSecret = section.id || 'gogh';
        }

        // A soft, irregular aperture with a short fluid trail, like the HERO.
        ink!.setTransform(.25, 0, 0, .25, 0, 0);
        ink!.globalCompositeOperation = 'source-over';
        ink!.clearRect(0, 0, width + 4, height + 4);
        ink!.globalCompositeOperation = 'lighter';
        function dab(xx: number, yy: number, rr: number, strength: number) {
            if (rr < 1) return;
            const gradient = ink!.createRadialGradient(xx, yy, rr * .15, xx, yy, rr);
            gradient.addColorStop(0, `rgba(255,255,255,${strength})`);
            gradient.addColorStop(.52, `rgba(255,255,255,${strength * .76})`);
            gradient.addColorStop(1, '#fff0');
            ink!.fillStyle = gradient; ink!.fillRect(xx - rr, yy - rr, rr * 2, rr * 2);
        }
        dab(x, y, radius, 1);
        let lead = { x, y };
        tail.forEach((drop, i) => {
            const follow = 1 - Math.exp(-dt * (8 - i));
            drop.x += (lead.x - drop.x) * follow; drop.y += (lead.y - drop.y) * follow;
            dab(drop.x, drop.y, radius * (.72 - i * .09), .5);
            lead = drop;
        });
        for (let i = 0; i < 4; i++) {
            const angle = now * .0003 * (i % 2 ? 1 : -1) + i * Math.PI * .5;
            dab(x + Math.cos(angle) * radius * .43, y + Math.sin(angle) * radius * .38,
                radius * (.5 + Math.sin(now * .001 + i) * .08), .65);
        }

        ctx!.save(); ctx!.beginPath(); ctx!.rect(0, top, width, bottom - top); ctx!.clip();
        ctx!.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, width, height);
        ctx!.globalCompositeOperation = 'destination-in';
        ctx!.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, width, height);
        ctx!.restore();
        wake();
    }

    function move(event: PointerEvent) {
        if (!media.matches || event.pointerType !== 'mouse' || document.hidden) return;
        const next = event.target instanceof Element ? event.target.closest<HTMLElement>(SECTION) : null;
        if (!next || !root.contains(next)) { leave(); return; }
        if (next !== section) {
            sleep(); section = next;
            wallKey = '';
            protectedNodes = [...section.querySelectorAll(PROTECTED)];
            archive = ARCHIVES[next.id] || ARCHIVES.themes!;
            canvas.dataset.fieldChapter = next.id || (next.matches('.h-hero') ? 'hero' : 'gogh');
        }
        if (!inside && radius < 1) {
            x = event.clientX; y = event.clientY;
            tail.forEach(drop => { drop.x = x; drop.y = y; });
        }
        targetX = event.clientX; targetY = event.clientY;
        lastMove = performance.now(); inside = true; wake();
    }
    function leave() { inside = pressing = false; if (radius) wake(); }
    function down(event: PointerEvent) {
        if (!inside || event.button !== 0 || event.pointerType !== 'mouse') return;
        if (!(event.target instanceof Element) || event.target.closest(`${CONTROL}, p, h1, h2, h3, pre, code, label, .hfig`)) return;
        pressing = true; lastMove = performance.now(); wake();
    }
    function release() { pressing = false; lastMove = performance.now(); wake(); }
    function preference() {
        sleep();
        if (!media.matches) {
            canvas.width = canvas.height = layer.width = layer.height = mask.width = mask.height = 1;
            width = height = 0;
        }
    }
    function visibility() { if (document.hidden) sleep(); }
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);
    root.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('scroll', leave, { passive: true });
    window.addEventListener('blur', sleep);
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', preference);
    return () => {
        disposed = true; sleep(); canvas.remove();
        canvas.width = canvas.height = layer.width = layer.height = mask.width = mask.height = 1;
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerleave', leave);
        root.removeEventListener('pointercancel', leave);
        root.removeEventListener('pointerdown', down);
        window.removeEventListener('pointerup', release);
        window.removeEventListener('scroll', leave);
        window.removeEventListener('blur', sleep);
        document.removeEventListener('visibilitychange', visibility);
        media.removeEventListener('change', preference);
    };
}
