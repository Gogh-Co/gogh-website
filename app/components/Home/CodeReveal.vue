<template>
    <canvas ref="canvas" class="code-reveal" aria-hidden="true"></canvas>
</template>

<script setup>
// What lies under the paint: a wall of code and binary, revealed only where
// the pointer goes. A shapeless blot of "ink" follows the cursor: a core with
// lobes drifting around it and a short trail of droplets (metaballs), its
// field warped by noise so the edge forms inlets and bulges, wet with a thin
// rim of light. The hidden layer is written in the active theme: its own YAML
// with the real hex values (each one painted in its color), a few lines of
// shell, and rows of bits that keep flipping, a handful of them lit. A click
// splashes the ink; holding the press spreads it until the whole hero is code,
// and letting go lets the paint flow back. Behind the wordmark, the hidden
// layer also holds the logo's color bar, softly blurred: the ink finds it
// wherever it passes over "Gogh".

const props = defineProps({
    // A Gogh theme: name, background, foreground, color_01 .. color_16.
    theme: {
        type: Object,
        required: true,
    },
    // The element the logo glow sits behind (the "Gogh" wordmark), and the
    // logo's 16 colors (8 columns x 2 rows).
    glowAnchor: {
        type: Object,
        default: null,
    },
    glowColors: {
        type: Array,
        default: () => [],
    },
});

const GLOW_ALPHA = 0.6;

const CODE_FONT = '"Roboto Mono", ui-monospace, monospace';
// One mask pixel covers MASK_SCALE x MASK_SCALE CSS pixels.
const MASK_SCALE = 4;
// Field level where the ink's edge sits, and the soft band around it.
const EDGE = 0.5;
const EDGE_SOFT = 0.06;
const RIM_BAND = 0.05;
const NOISE_SIZE = 256;

const COLOR_NOTES = {
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
};

const KEYWORDS = new Set(['export', 'for', 'in', 'do', 'done', 'if', 'then', 'else', 'fi', 'local', 'return', 'while', 'const', 'await', 'function', 'case', 'esac']);

const canvas = ref(null);

let ctx = null;
let width = 0;
let height = 0;
let dpr = 1;
let frame = 0;
let running = false;
let onScreen = false;
let reduced = false;
let resizeObserver = null;
let visibilityObserver = null;
let host = null;

// Hidden layer: an offscreen canvas holding the whole wall of text.
let text = null;
let textCtx = null;
let grid = null; // { cols, rows, charW, lineH, size, cells: [{ ch, color, bit, hot }] }
let colors = null;

// Mask: the metaball field (low res), the thresholded ink and its rim.
let field = null;
let fieldCtx = null;
let ink = null;
let inkCtx = null;
let rim = null;
let rimCtx = null;
let noise = null;
let falloff = [];

// Ink state.
let radius = 160;
let pointer = { x: 0, y: 0, inside: false, lastMove: 0 };
const head = { x: 0, y: 0, r: 0 };
const trail = Array.from({ length: 6 }, (_, i) => ({ x: 0, y: 0, r: 0, k: 0.34 - i * 0.04, f: 0.66 - i * 0.085 }));
const pulses = [];
// Lobes drifting around the head, so the ink never settles into a circle.
const lobes = Array.from({ length: 5 }, () => ({ x: 0, y: 0, r: 0 }));
let speed = 0;
let boost = 0;
// Press and hold: the ink keeps spreading until the whole hero is code.
const HOLD_TIME = 3200;
const HOLD_RELEASE = 1100;
let pressing = false;
let hold = 0;
let revealed = false;
let lastTime = 0;
let lastFlip = 0;
let lastHot = 0;
let hotCells = [];

/* ---------------------------------------------------------------- colors */

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
    const value = parseInt(full.slice(0, 6), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgba(hex, alpha) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(hexA, hexB, t) {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const c = a.map((value, i) => Math.round(value + (b[i] - value) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function pick(key, fallback) {
    const value = props.theme?.[key];
    return /^#?[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function buildColors() {
    const bg = pick('background', '#0D1926');
    const fg = pick('foreground', '#E7E7E7');
    colors = {
        bg,
        fg,
        paper: mixHex(bg, fg, 0.035),
        text: rgba(fg, 0.82),
        dim: rgba(fg, 0.42),
        punct: rgba(fg, 0.55),
        bit: rgba(fg, 0.17),
        hot: pick('color_10', '#E74C3C'),
        rim: pick('color_12', '#F1C40F'),
        string: pick('color_03', '#27AE60'),
        keyword: pick('color_14', '#9B59B6'),
        variable: pick('color_15', '#2AA198'),
        number: pick('color_12', '#F1C40F'),
        key: pick('color_13', '#3498DB'),
        call: pick('color_05', '#2479D0'),
    };
}

/* ------------------------------------------------------------------ code */

function toBinary(hex) {
    return hexToRgb(hex).map((n) => n.toString(2).padStart(8, '0')).join(' ');
}

// The hidden source, written in (and about) the active theme.
function buildCode() {
    const theme = props.theme || {};
    const name = String(theme.name || theme.theme || 'Gogh');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const bg = pick('background', '#0D1926');
    const fg = pick('foreground', '#E7E7E7');
    const keys = Object.keys(COLOR_NOTES);

    const yaml = [
        `# themes/${slug}.yml`,
        '---',
        `name: '${name}'`,
        ...keys.map((key) => `${key}: '${pick(key, '#000000')}'  # ${COLOR_NOTES[key]}`),
        `background: '${bg}'`,
        `foreground: '${fg}'`,
        `cursor: '${pick('cursor', fg)}'`,
    ];

    const install = [
        '#!/usr/bin/env bash',
        '# paint the terminal, one color at a time',
        'export TERMINAL="alacritty"',
        `export THEME="${name}"`,
        'bash -c "$(wget -qO- https://git.io/vQgMr)"',
        '',
        'for i in {0..15}; do',
        '  printf "\\e[48;5;%sm  \\e[0m" "$i"',
        'done',
    ];

    const apply = [
        'apply_theme() {',
        '  local profile="$1"',
        ...keys.slice(0, 8).map((key, i) => `  printf "\\e]4;%d;%s\\a" ${i} "${pick(key, '#000000')}"`),
        `  gogh::set_bg "${bg}"`,
        `  gogh::set_fg "${fg}"`,
        '  return 0',
        '}',
    ];

    const script = [
        `const theme = await gogh.load('${slug}');`,
        'const night = paint({ swirl: true, stars: 11 });',
        'theme.colors.forEach((c, i) => night.stroke(c, i));',
        '// a nod to the painter',
        `if (term.supports(256)) apply_theme "${slug}"`,
    ];

    const bits = [
        `# ${bg} = ${toBinary(bg)}`,
        `# ${fg} = ${toBinary(fg)}`,
        `# ${pick('color_12', '#F1C40F')} = ${toBinary(pick('color_12', '#F1C40F'))}`,
    ];

    return [...yaml, '', '', ...install, '', '', ...apply, '', ...bits, '', '', ...script, '', ''];
}

// Splits a line into [text, color] runs with a tiny shell/yaml highlighter.
function tokenize(line) {
    const runs = [];
    const push = (value, color) => {
        if (value) runs.push([value, color]);
    };
    const hexAt = (i) => /^#[0-9a-fA-F]{6}(?![0-9a-zA-Z])/.exec(line.slice(i));

    let i = 0;
    let quote = null;
    let buffer = '';
    const flushString = () => {
        push(buffer, colors.string);
        buffer = '';
    };

    while (i < line.length) {
        const ch = line[i];
        const hex = hexAt(i);

        if (quote) {
            if (hex) {
                flushString();
                push(hex[0], hex[0]);
                i += 7;
                continue;
            }
            buffer += ch;
            i += 1;
            if (ch === quote) {
                flushString();
                quote = null;
            }
            continue;
        }

        if (hex) {
            push(hex[0], hex[0]);
            i += 7;
        } else if (ch === '#' || line.startsWith('//', i)) {
            push(line.slice(i), colors.dim);
            break;
        } else if (ch === '"' || ch === "'") {
            quote = ch;
            buffer = ch;
            i += 1;
        } else if (ch === '$') {
            const match = /^\$(\{[^}]*\}|\(|[A-Za-z_0-9@]+)/.exec(line.slice(i));
            const value = match ? match[0] : '$';
            push(value, colors.variable);
            i += value.length;
        } else if (/[A-Za-z_]/.test(ch)) {
            const word = /^[A-Za-z_][A-Za-z_0-9:.-]*/.exec(line.slice(i))[0];
            const next = line.slice(i + word.length);
            let color = colors.text;
            if (KEYWORDS.has(word)) color = colors.keyword;
            else if (/^:\s/.test(next) || next === ':') color = colors.key;
            else if (/^\s*\(/.test(next)) color = colors.call;
            push(word, color);
            i += word.length;
        } else if (/[0-9]/.test(ch)) {
            const number = /^[0-9.]+/.exec(line.slice(i))[0];
            push(number, colors.number);
            i += number.length;
        } else {
            push(ch, /\s/.test(ch) ? colors.text : colors.punct);
            i += 1;
        }
    }
    if (quote) {
        flushString();
    }
    return runs;
}

/* ------------------------------------------------------------------ grid */

const bit = () => (Math.random() < 0.5 ? '0' : '1');

function buildGrid() {
    const size = width < 700 ? 11 : 13;
    textCtx.font = `500 ${size}px ${CODE_FONT}`;
    const charW = textCtx.measureText('0').width || size * 0.6;
    const lineH = Math.round(size * 1.6);
    const cols = Math.ceil(width / charW) + 1;
    const rows = Math.ceil(height / lineH) + 1;
    const cells = new Array(cols * rows);

    // Bytes of binary everywhere...
    for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
            const isGap = (c + r * 3) % 9 === 8;
            cells[r * cols + c] = { ch: isGap ? ' ' : bit(), color: colors.bit, bit: !isGap, hot: false };
        }
    }

    // ...and columns of code written over it, each starting somewhere else.
    const code = buildCode();
    const colW = Math.min(48, Math.max(30, Math.floor(cols * 0.42)));
    const gutter = 5;
    const count = Math.max(1, Math.floor((cols + gutter) / (colW + gutter)));
    const left = Math.max(1, Math.floor((cols - (count * colW + (count - 1) * gutter)) / 2));
    for (let k = 0; k < count; k += 1) {
        const x0 = left + k * (colW + gutter);
        const start = Math.floor(Math.random() * code.length);
        const offset = Math.floor(Math.random() * 4);
        for (let r = offset; r < rows; r += 1) {
            const line = code[(start + r) % code.length];
            if (!line) continue;
            let c = x0;
            const end = Math.min(cols, x0 + colW);
            // A blank cell either side keeps the code apart from the bits.
            if (c - 1 >= 0) Object.assign(cells[r * cols + c - 1], { ch: ' ', bit: false });
            for (const [value, color] of tokenize(line)) {
                for (const ch of value) {
                    if (c >= end) break;
                    cells[r * cols + c] = { ch, color, bit: false, hot: false };
                    c += 1;
                }
            }
            if (c < cols) Object.assign(cells[r * cols + c], { ch: ' ', bit: false });
        }
    }

    grid = { cols, rows, charW, lineH, size, cells };

    // A few bits glow in the theme's bright red, like embers.
    hotCells = [];
    const hotCount = Math.max(4, Math.round(cols * rows * 0.003));
    for (let n = 0; n < hotCount; n += 1) addHot();
}

function addHot() {
    for (let tries = 0; tries < 12; tries += 1) {
        const index = Math.floor(Math.random() * grid.cells.length);
        const cell = grid.cells[index];
        if (cell.bit && !cell.hot) {
            cell.hot = true;
            hotCells.push(index);
            return index;
        }
    }
    return -1;
}

function cellColor(cell) {
    return cell.hot ? colors.hot : cell.color;
}

// The text layer is transparent: the paper and the glow go under it when the
// layers are composited.
function paintText() {
    const { cols, rows, charW, lineH, size, cells } = grid;
    textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    textCtx.clearRect(0, 0, width, height);
    textCtx.font = `500 ${size}px ${CODE_FONT}`;
    textCtx.textBaseline = 'middle';
    textCtx.textAlign = 'left';
    // Runs of same-colored cells go out as one string (the font is monospace).
    for (let r = 0; r < rows; r += 1) {
        const y = r * lineH + lineH / 2;
        let c = 0;
        while (c < cols) {
            const color = cellColor(cells[r * cols + c]);
            let run = '';
            const from = c;
            while (c < cols && cellColor(cells[r * cols + c]) === color) {
                run += cells[r * cols + c].ch;
                c += 1;
            }
            if (run.trim()) {
                textCtx.fillStyle = color;
                textCtx.fillText(run, from * charW, y);
            }
        }
    }
}

function paintCell(index) {
    const { cols, charW, lineH, size, cells } = grid;
    const cell = cells[index];
    const x = (index % cols) * charW;
    const y = Math.floor(index / cols) * lineH;
    textCtx.clearRect(x - 0.5, y, charW + 1, lineH);
    textCtx.font = `500 ${size}px ${CODE_FONT}`;
    textCtx.fillStyle = cellColor(cell);
    textCtx.fillText(cell.ch, x, y + lineH / 2);
}

// Bits keep flipping (only where the ink can show them), and now and then an
// ember dies out while another one lights up.
function flipBits(now, box) {
    if (reduced || !grid || now - lastFlip < 70) return;
    lastFlip = now;
    const { cols, rows, charW, lineH, cells } = grid;
    const c0 = Math.max(0, Math.floor(box.x0 / charW));
    const c1 = Math.min(cols - 1, Math.ceil(box.x1 / charW));
    const r0 = Math.max(0, Math.floor(box.y0 / lineH));
    const r1 = Math.min(rows - 1, Math.ceil(box.y1 / lineH));
    if (c1 < c0 || r1 < r0) return;
    const flips = 24 + Math.round(speed * 4 + hold * 140);
    for (let n = 0; n < flips; n += 1) {
        const index = (r0 + Math.floor(Math.random() * (r1 - r0 + 1))) * cols + c0 + Math.floor(Math.random() * (c1 - c0 + 1));
        const cell = cells[index];
        if (!cell?.bit) continue;
        cell.ch = bit();
        paintCell(index);
    }
    if (now - lastHot > 900 && hotCells.length) {
        lastHot = now;
        const old = hotCells.splice(Math.floor(Math.random() * hotCells.length), 1)[0];
        cells[old].hot = false;
        paintCell(old);
        const fresh = addHot();
        if (fresh >= 0) paintCell(fresh);
    }
}

/* ------------------------------------------------------------------ mask */

// Tileable fractal value noise, for the ink's ragged, living edge.
function buildNoise() {
    noise = new Float32Array(NOISE_SIZE * NOISE_SIZE);
    let amplitude = 1;
    let total = 0;
    for (const cell of [64, 32, 16, 8]) {
        const n = NOISE_SIZE / cell;
        const lattice = Array.from({ length: n * n }, () => Math.random());
        for (let y = 0; y < NOISE_SIZE; y += 1) {
            for (let x = 0; x < NOISE_SIZE; x += 1) {
                const gx = x / cell;
                const gy = y / cell;
                const x0 = Math.floor(gx);
                const y0 = Math.floor(gy);
                const tx = (gx - x0) * (gx - x0) * (3 - 2 * (gx - x0));
                const ty = (gy - y0) * (gy - y0) * (3 - 2 * (gy - y0));
                const at = (i, j) => lattice[((j + n) % n) * n + ((i + n) % n)];
                const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
                const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
                noise[y * NOISE_SIZE + x] += (top + (bottom - top) * ty) * amplitude;
            }
        }
        total += amplitude;
        amplitude *= 0.5;
    }
    for (let i = 0; i < noise.length; i += 1) noise[i] /= total;

    // Metaball falloff over 2r: (1 - t^2)^2, reaching EDGE at about r.
    falloff = Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        return [t, Math.round(255 * (1 - t * t) * (1 - t * t))];
    });
}

function sizeMask() {
    const mw = Math.ceil(width / MASK_SCALE);
    const mh = Math.ceil(height / MASK_SCALE);
    for (const c of [field, ink, rim]) {
        c.width = mw;
        c.height = mh;
    }
}

function drawBlob(x, y, r) {
    if (r < 1) return;
    const cx = x / MASK_SCALE;
    const cy = y / MASK_SCALE;
    const reach = (r * 2) / MASK_SCALE;
    const gradient = fieldCtx.createRadialGradient(cx, cy, 0, cx, cy, reach);
    for (const [t, v] of falloff) gradient.addColorStop(t, `rgb(${v}, ${v}, ${v})`);
    fieldCtx.fillStyle = gradient;
    fieldCtx.beginPath();
    fieldCtx.arc(cx, cy, reach, 0, Math.PI * 2);
    fieldCtx.fill();
}

// Sums the blobs, wobbles the field with noise and cuts it at EDGE into the
// ink (alpha) and its rim (a thin band just outside the edge).
function paintMask(box, now) {
    const mw = field.width;
    const mh = field.height;
    const x0 = Math.max(0, Math.floor(box.x0 / MASK_SCALE));
    const y0 = Math.max(0, Math.floor(box.y0 / MASK_SCALE));
    const x1 = Math.min(mw, Math.ceil(box.x1 / MASK_SCALE));
    const y1 = Math.min(mh, Math.ceil(box.y1 / MASK_SCALE));
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return null;

    fieldCtx.globalCompositeOperation = 'source-over';
    fieldCtx.fillStyle = '#000';
    fieldCtx.fillRect(x0, y0, w, h);
    fieldCtx.globalCompositeOperation = 'lighter';
    drawBlob(head.x, head.y, head.r);
    for (const lobe of lobes) drawBlob(lobe.x, lobe.y, lobe.r);
    for (const drop of trail) drawBlob(drop.x, drop.y, drop.r);
    for (const pulse of pulses) drawBlob(pulse.x, pulse.y, pulse.r);

    const source = fieldCtx.getImageData(x0, y0, w, h).data;
    const inkData = inkCtx.createImageData(w, h);
    const rimData = rimCtx.createImageData(w, h);
    const out = inkData.data;
    const edge = rimData.data;
    const [rr, rg, rb] = hexToRgb(colors.rim);
    // The rim burns brighter while the ink is being held open.
    const rimAlpha = 110 + hold * 120;
    const t = reduced ? 0 : now * 0.012;
    const ox = Math.floor(t);
    const oy = Math.floor(t * 0.6);
    const wobble = 0.3 + Math.min(speed * 0.015, 0.15) + boost * 0.15 + hold * 0.1;
    // Domain warp: each pixel reads the field from a noisy offset, which
    // bends the edge into lobes and inlets instead of round arcs.
    const warp = 70 + Math.min(speed * 3, 50) + boost * 50 + hold * 40;
    const M = NOISE_SIZE - 1;

    for (let y = 0; y < h; y += 1) {
        const ny = ((y + y0 + oy) & (NOISE_SIZE - 1)) * NOISE_SIZE;
        const my = (((y + y0) * 2 - ox) & (NOISE_SIZE - 1)) * NOISE_SIZE;
        const wy0 = ((((y + y0) >> 1) + oy) & M) * NOISE_SIZE;
        const wy1 = ((((y + y0) >> 1) + 131 - ox) & M) * NOISE_SIZE;
        for (let x = 0; x < w; x += 1) {
            const i = (y * w + x) * 4;
            // Deep inside the ink the warp can't reach the edge: solid.
            if (source[i] > 235) {
                out[i] = 255;
                out[i + 1] = 255;
                out[i + 2] = 255;
                out[i + 3] = 255;
                continue;
            }
            const dx = (noise[wy0 + ((((x + x0) >> 1) + ox) & M)] - 0.5) * warp;
            const dy = (noise[wy1 + ((((x + x0) >> 1) + 71 + oy) & M)] - 0.5) * warp;
            const sx = Math.min(w - 1, Math.max(0, Math.round(x + dx)));
            const sy = Math.min(h - 1, Math.max(0, Math.round(y + dy)));
            const base = source[(sy * w + sx) * 4] / 255;
            if (base < 0.02) continue;
            const n = noise[ny + ((x + x0 + ox) & (NOISE_SIZE - 1))] * 0.7
                + noise[my + (((x + x0) * 2 + oy) & (NOISE_SIZE - 1))] * 0.3;
            const v = base + (n - 0.5) * wobble;

            const a = Math.min(1, Math.max(0, (v - EDGE) / EDGE_SOFT + 0.5));
            out[i] = 255;
            out[i + 1] = 255;
            out[i + 2] = 255;
            out[i + 3] = a * 255;

            // A bump that peaks a little outside the edge.
            const d = (EDGE - v) / RIM_BAND;
            if (d > -0.6 && d < 1) {
                const glow = d < 0 ? 1 + d / 0.6 : 1 - d;
                edge[i] = rr;
                edge[i + 1] = rg;
                edge[i + 2] = rb;
                edge[i + 3] = glow * glow * rimAlpha;
            }
        }
    }
    inkCtx.putImageData(inkData, x0, y0);
    rimCtx.putImageData(rimData, x0, y0);
    return { x0, y0, w, h };
}

/* ------------------------------------------------------------------ loop */

function blobBox() {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const include = (x, y, r) => {
        if (r < 1) return;
        const reach = r * 2;
        x0 = Math.min(x0, x - reach);
        y0 = Math.min(y0, y - reach);
        x1 = Math.max(x1, x + reach);
        y1 = Math.max(y1, y + reach);
    };
    include(head.x, head.y, head.r);
    lobes.forEach((lobe) => include(lobe.x, lobe.y, lobe.r));
    trail.forEach((drop) => include(drop.x, drop.y, drop.r));
    pulses.forEach((pulse) => include(pulse.x, pulse.y, pulse.r));
    return x1 > x0 ? { x0, y0, x1, y1 } : null;
}

const ease = (k, dt) => 1 - Math.pow(1 - k, dt);

function step(now) {
    const elapsed = Math.min(64, now - (lastTime || now));
    const dt = elapsed / 16.667 || 1;
    lastTime = now;

    // The ink grows while the pointer is over the hero and fades out when it
    // leaves or rests for a while.
    const still = pressing ? 0 : Math.min(1, Math.max(0, (now - pointer.lastMove - 4000) / 3000));
    let target = pointer.inside ? radius * (1 - still) : 0;
    let covered = false;

    // Holding the press grows the ink past the farthest corner; letting go
    // lets the paint flow back in.
    hold = pressing ? Math.min(1, hold + elapsed / HOLD_TIME) : Math.max(0, hold - elapsed / HOLD_RELEASE);
    if (hold === 1 && !revealed) {
        revealed = true;
        boost = 1;
    } else if (hold === 0) {
        revealed = false;
    }
    if (hold > 0) {
        const corner = Math.hypot(Math.max(head.x, width - head.x), Math.max(head.y, height - head.y));
        const full = (corner + 160) / 0.8;
        // Eased in: it creeps at first, then floods the screen.
        target = Math.max(target, radius + (full - radius) * hold * hold);
        covered = hold === 1 && head.r > target * 0.97;
    }
    const follow = reduced ? 1 : ease(0.2, dt);
    const px = head.x;
    const py = head.y;
    head.x += (pointer.x - head.x) * follow;
    head.y += (pointer.y - head.y) * follow;
    head.r += (target - head.r) * ease(hold > 0 ? 0.25 : pointer.inside ? 0.09 : 0.12, dt);
    speed += (Math.hypot(head.x - px, head.y - py) / dt - speed) * ease(0.12, dt);
    boost *= Math.pow(0.94, dt);

    const breath = reduced ? 1 : 1 + 0.045 * Math.sin(now * 0.0014);
    const headR = head.r * breath * 0.78;
    const clock = reduced ? 0 : now;
    for (const lobe of lobes) {
        const angle = lobe.angle + clock * lobe.spin;
        const reach = head.r * lobe.dist * (1 + 0.3 * Math.sin(clock * lobe.pulse + lobe.phase));
        const k = reduced ? 1 : ease(0.22, dt);
        lobe.x += (head.x + Math.cos(angle) * reach - lobe.x) * k;
        lobe.y += (head.y + Math.sin(angle) * reach - lobe.y) * k;
        lobe.r = head.r * lobe.size * (1 + 0.22 * Math.sin(clock * lobe.pulse * 1.3 + lobe.phase * 2));
    }
    let lead = head;
    for (const drop of trail) {
        const k = reduced ? 1 : ease(drop.k, dt);
        drop.x += (lead.x - drop.x) * k;
        drop.y += (lead.y - drop.y) * k;
        drop.r = head.r * drop.f;
        lead = drop;
    }
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        pulse.t += elapsed / 1100;
        if (pulse.t >= 1) {
            pulses.splice(i, 1);
            continue;
        }
        const grow = 1 - Math.pow(1 - pulse.t, 3);
        pulse.r = radius * (0.3 + 1.2 * grow) * (1 - Math.pow(pulse.t, 3));
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    const saved = head.r;
    head.r = headR;
    const box = blobBox();
    if (covered) {
        // Fully open: no edge on screen, so skip the mask altogether.
        flipBits(now, { x0: 0, y0: 0, x1: width, y1: height });
        ctx.fillStyle = colors.paper;
        ctx.fillRect(0, 0, width, height);
        paintGlow();
        ctx.drawImage(text, 0, 0, width * dpr, height * dpr, 0, 0, width, height);
    } else if (box) {
        const area = paintMask(box, now);
        flipBits(now, box);
        if (area) {
            const sx = area.x0 * MASK_SCALE;
            const sy = area.y0 * MASK_SCALE;
            const sw = area.w * MASK_SCALE;
            const sh = area.h * MASK_SCALE;
            ctx.imageSmoothingEnabled = true;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(ink, area.x0, area.y0, area.w, area.h, sx, sy, sw, sh);
            // Inside the ink: paper, then the logo glow, then the code.
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = colors.paper;
            ctx.fillRect(sx, sy, sw, sh);
            ctx.globalCompositeOperation = 'source-atop';
            paintGlow();
            ctx.drawImage(text, sx * dpr, sy * dpr, sw * dpr, sh * dpr, sx, sy, sw, sh);
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(rim, area.x0, area.y0, area.w, area.h, sx, sy, sw, sh);
        }
    }
    head.r = saved;

    // Nothing left to show: sleep until the pointer comes back.
    const idle = target === 0 && hold === 0 && head.r < 0.5 && !pulses.length;
    if (idle) {
        head.r = 0;
        trail.forEach((drop) => {
            drop.r = 0;
        });
        lobes.forEach((lobe) => {
            lobe.r = 0;
        });
    }
    return !idle;
}

function loop(now) {
    if (!running) return;
    if (!step(now)) {
        running = false;
        lastTime = 0;
        return;
    }
    frame = requestAnimationFrame(loop);
}

function play() {
    if (running || !ctx || !onScreen || document.hidden) return;
    running = true;
    frame = requestAnimationFrame(loop);
}

function pause() {
    running = false;
    lastTime = 0;
    cancelAnimationFrame(frame);
}

/* ---------------------------------------------------------------- events */

function local(event) {
    const rect = canvas.value.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function onPointerMove(event) {
    const { x, y } = local(event);
    if (!pointer.inside && head.r < 1) {
        // Start the ink (and its trail) right under the pointer.
        head.x = x;
        head.y = y;
        trail.forEach((drop) => Object.assign(drop, { x, y }));
        shapeLobes(x, y);
    }
    pointer = { x, y, inside: true, lastMove: performance.now() };
    play();
}

// A new, random set of lobes each time the ink appears.
function shapeLobes(x, y) {
    lobes.forEach((lobe, i) => Object.assign(lobe, {
        x,
        y,
        angle: (i / lobes.length) * Math.PI * 2 + Math.random() * 0.9,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.00015 + Math.random() * 0.00035),
        dist: 0.45 + Math.random() * 0.4,
        size: 0.32 + Math.random() * 0.3,
        pulse: 0.0006 + Math.random() * 0.0012,
        phase: Math.random() * Math.PI * 2,
    }));
}

function release() {
    // Count the press as movement, so the ink doesn't vanish right after.
    if (pressing) pointer.lastMove = performance.now();
    pressing = false;
    if (host) host.style.userSelect = '';
}

function onPointerLeave() {
    pointer.inside = false;
    release();
}

function onPointerUp(event) {
    release();
    if (event.pointerType !== 'mouse') {
        pointer.inside = false;
    }
}

// A press on the open canvas (not on a link or button) splashes the ink, and
// holding it spreads the ink over the whole hero.
function onPointerDown(event) {
    onPointerMove(event);
    if (event.button !== 0 || event.target.closest?.('a, button, input, textarea, [role="button"], [role="tab"]')) return;
    const { x, y } = local(event);
    pulses.push({ x, y, t: 0, r: 0 });
    boost = 1;
    pressing = true;
    // No text selection (or long-press menu) while the ink is held.
    if (host) host.style.userSelect = 'none';
}

function onContextMenu(event) {
    if (pressing) event.preventDefault();
}

function onVisibilityChange() {
    if (document.hidden) {
        release();
        pause();
    }
}

/* ------------------------------------------------------------------ glow */

// The logo's color bar as a soft rectangle a bit larger than "Gogh",
// pre-blurred once per size so each frame only has to stamp it.
let glow = null;
let glowKey = '';

function glowBox() {
    const anchor = props.glowAnchor;
    if (!anchor?.getBoundingClientRect || !canvas.value) return null;
    const word = anchor.getBoundingClientRect();
    if (!word.width) return null;
    const host = canvas.value.getBoundingClientRect();
    const em = parseFloat(getComputedStyle(anchor).fontSize) || word.height;
    const w = word.width + em * 0.7;
    const h = em * 0.8;
    return {
        x: word.left - host.left + (word.width - w) / 2,
        y: word.top - host.top + (word.height - h) / 2,
        w,
        h,
        blur: em * 0.05,
    };
}

function buildGlow(box) {
    const key = `${Math.round(box.w)}x${Math.round(box.h)}@${dpr}:${props.glowColors.join()}`;
    if (glow && glowKey === key) return;
    glowKey = key;
    const pad = Math.ceil(box.blur * 3);
    glow = glow || document.createElement('canvas');
    glow.width = Math.ceil((box.w + pad * 2) * dpr);
    glow.height = Math.ceil((box.h + pad * 2) * dpr);
    glow.pad = pad;
    const g = glow.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, glow.width, glow.height);
    if ('filter' in g) g.filter = `blur(${box.blur}px) saturate(1.2)`;
    const cols = 8;
    const cellW = box.w / cols;
    const cellH = box.h / 2;
    props.glowColors.slice(0, 16).forEach((color, index) => {
        g.fillStyle = color;
        // Overlap by a hair so the blur leaves no seams between cells.
        g.fillRect(pad + (index % cols) * cellW - 0.5, pad + Math.floor(index / cols) * cellH - 0.5, cellW + 1, cellH + 1);
    });
}

// Stamps the glow where "Gogh" is right now (it drifts as the hero scrolls).
function paintGlow() {
    if (!props.glowColors.length) return;
    const box = glowBox();
    if (!box) return;
    buildGlow(box);
    ctx.globalAlpha = GLOW_ALPHA;
    ctx.drawImage(glow, 0, 0, glow.width, glow.height, box.x - glow.pad, box.y - glow.pad, glow.width / dpr, glow.height / dpr);
    ctx.globalAlpha = 1;
}

/* ---------------------------------------------------------------- layout */

function rebuild() {
    if (!textCtx || !width) return;
    buildColors();
    buildGrid();
    paintText();
}

function resize() {
    const rect = canvas.value.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.value.width = Math.round(width * dpr);
    canvas.value.height = Math.round(height * dpr);
    text.width = Math.round(width * dpr);
    text.height = Math.round(height * dpr);
    radius = Math.max(90, Math.min(220, Math.min(width, height) * 0.2));
    sizeMask();
    rebuild();
}

watch(() => props.theme, rebuild);

onMounted(() => {
    ctx = canvas.value.getContext('2d');
    text = document.createElement('canvas');
    textCtx = text.getContext('2d');
    field = document.createElement('canvas');
    fieldCtx = field.getContext('2d', { willReadFrequently: true });
    ink = document.createElement('canvas');
    inkCtx = ink.getContext('2d');
    rim = document.createElement('canvas');
    rimCtx = rim.getContext('2d');
    reduced = prefersReducedMotion();
    buildNoise();
    shapeLobes(0, 0);
    resize();
    // The wall is measured in Roboto Mono: redo it once the font is in.
    document.fonts?.load(`500 13px ${CODE_FONT}`).then(rebuild).catch(() => {});

    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas.value);
    visibilityObserver = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && pointer.inside) play();
        else if (!onScreen) pause();
    });
    visibilityObserver.observe(canvas.value);

    host = canvas.value.parentElement;
    host?.addEventListener('pointermove', onPointerMove, { passive: true });
    host?.addEventListener('pointerdown', onPointerDown, { passive: true });
    host?.addEventListener('pointerup', onPointerUp, { passive: true });
    host?.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('blur', release);
    host?.addEventListener('pointerleave', onPointerLeave, { passive: true });
    host?.addEventListener('pointercancel', onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
    pause();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    host?.removeEventListener('pointermove', onPointerMove);
    host?.removeEventListener('pointerdown', onPointerDown);
    host?.removeEventListener('pointerup', onPointerUp);
    host?.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('blur', release);
    host?.removeEventListener('pointerleave', onPointerLeave);
    host?.removeEventListener('pointercancel', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style lang="scss" scoped>
.code-reveal {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
