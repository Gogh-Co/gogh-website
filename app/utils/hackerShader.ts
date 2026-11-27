import chroma from 'chroma-js';
import { safeHex } from './themeColors';
import type { SessionLine, SessionState } from './terminalSession';
import { cursorCell } from './hackerSession';

// Paints a session screen through a post-processing shader, the way Ghostty's
// custom-shader and Kitty's cursor-trail options do on a real terminal: the
// text is drawn on a 2D canvas, uploaded as a texture, and a fragment shader
// adds the CRT curve, bloom, scanlines, chromatic aberration, glitch bursts,
// a red alert pulse and a cursor that smears to where it lands. Time comes
// from the session clock, so a paused loop holds still and an export renders
// exactly what the page shows. Browser-only.

const MONO = '"Roboto Mono", "DejaVu Sans Mono", monospace';

export interface HackerLayout {
    // Canvas size in device pixels.
    width: number;
    height: number;
    // Where the 88 x 24 grid sits on it, and one cell's size.
    gridX: number;
    gridY: number;
    cellW: number;
    cellH: number;
    fontPx: number;
    // Device pixels per CSS pixel, so effects keep their size on any screen.
    dpr: number;
}

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
uniform float uGlitch;
uniform float uAlert;
uniform float uSince;
uniform float uDpr;
uniform float uMotion;
uniform vec4 uCursor;
uniform vec4 uPrev;
uniform vec3 uCursorColor;
uniform vec3 uAlertColor;
uniform vec3 uBg;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Barrel distortion of a CRT tube.
vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(7.5, 6.0);
    uv = uv + uv * offset * offset;
    return uv * 0.5 + 0.5;
}

float segmentDistance(vec2 p, vec2 a, vec2 b, out float h) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.001), 0.0, 1.0);
    return length(pa - ba * h);
}

float boxDistance(vec2 p, vec2 center, vec2 halfSize) {
    vec2 d = abs(p - center) - halfSize;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
    vec2 uv = curve(vUv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(uBg * 0.2, 1.0);
        return;
    }
    float t = uTime;

    // Glitch: horizontal bands jump sideways; a rare ambient one even when idle.
    float ambient = uMotion * step(0.993, hash(vec2(floor(t * 7.0), 3.7))) * 0.55;
    float g = max(uGlitch, ambient);
    float tick = floor(t * 30.0);
    float band = floor(uv.y * 30.0);
    float shift = (hash(vec2(band, tick)) - 0.5) * 0.09 * g * step(0.6, hash(vec2(band * 1.7, tick + 3.0)));
    vec2 suv = vec2(uv.x + shift, uv.y);

    // Chromatic aberration, wider while glitching.
    float ca = (0.7 + g * 7.0) * uDpr / uRes.x;
    vec3 col = vec3(
        texture2D(uTex, suv + vec2(ca, 0.0)).r,
        texture2D(uTex, suv).g,
        texture2D(uTex, suv - vec2(ca, 0.0)).b
    );

    // Bloom: a golden-angle spiral of taps, keeping what is brighter than the background.
    vec3 bloom = vec3(0.0);
    vec2 px = 1.0 / uRes;
    for (int i = 0; i < 20; i++) {
        float fi = float(i);
        float angle = fi * 2.39996;
        float radius = sqrt(fi + 0.5) / 4.5 * 8.0 * uDpr;
        vec3 tap = texture2D(uTex, suv + vec2(cos(angle), sin(angle)) * radius * px).rgb;
        bloom += max(tap - uBg, 0.0);
    }
    col += bloom / 20.0 * 1.15;

    // Cursor trail (Ghostty cursor_smear style): the tail chases the head
    // from where the cursor was, a ripple marks long jumps.
    vec2 p = vec2(suv.x, 1.0 - suv.y) * uRes;
    vec2 head = uCursor.xy + uCursor.zw * 0.5;
    vec2 from = uPrev.xy + uPrev.zw * 0.5;
    float progress = clamp(uSince / 0.34, 0.0, 1.0);
    float ease = 1.0 - pow(1.0 - progress, 3.0);
    vec2 tail = mix(from, head, ease);
    float jump = length(head - from);
    float h;
    float d = segmentDistance(p, head, tail, h);
    float width = mix(uCursor.w * 0.5, uCursor.w * 0.1, h);
    float live = step(uCursor.z * 1.5, jump) * (1.0 - progress) * step(0.5, uCursor.z);
    float body = 1.0 - smoothstep(width - uDpr, width + uDpr, d);
    col = mix(col, uCursorColor, body * live * 0.85);
    col += uCursorColor * exp(-max(d - width, 0.0) / (7.0 * uDpr)) * live * 0.35;
    float ring = abs(length(p - head) - ease * uCursor.w * 3.2);
    col += uCursorColor * (1.0 - smoothstep(0.0, 2.0 * uDpr, ring)) * (1.0 - progress) * step(uCursor.z * 4.0, jump) * 0.6;
    float halo = boxDistance(p, head, uCursor.zw * 0.5);
    col += uCursorColor * exp(-max(halo, 0.0) / (5.0 * uDpr)) * 0.14 * step(0.5, uCursor.z);

    // Scanlines every 3 CSS pixels, a faint aperture grille, a rolling refresh band.
    float scan = 0.5 + 0.5 * sin(p.y * 3.14159 / (1.5 * uDpr));
    col *= 1.0 - 0.18 * scan;
    float column = mod(floor(gl_FragCoord.x / max(1.0, floor(uDpr))), 3.0);
    col *= vec3(0.94) + 0.09 * vec3(column < 0.5 ? 1.0 : 0.0, column > 0.5 && column < 1.5 ? 1.0 : 0.0, column > 1.5 ? 1.0 : 0.0);
    float roll = fract(t * 0.09);
    col += exp(-pow((roll - (1.0 - uv.y)) * 10.0, 2.0)) * 0.035 * uMotion;

    // Flicker and grain.
    col *= 1.0 + uMotion * 0.018 * sin(t * 113.0);
    col += uMotion * (hash(gl_FragCoord.xy + fract(t * 7.13) * 100.0) - 0.5) * 0.05;

    // Vignette, and the red alert that pulses in from the edges.
    vec2 edge = uv * (1.0 - uv.yx);
    float vignette = pow(clamp(edge.x * edge.y * 16.0, 0.0, 1.0), 0.24);
    col *= vignette;
    float pulse = 0.55 + 0.45 * sin(t * 7.5);
    col += uAlertColor * uAlert * pulse * (1.0 - vignette * 0.85) * 0.7;
    col = mix(col, col * vec3(1.15, 0.82, 0.82), uAlert * 0.3);

    gl_FragColor = vec4(col, 1.0);
}`;

const rgb = (hex: string): [number, number, number] => {
    const [r, g, b] = chroma(hex).rgb();
    return [r / 255, g / 255, b / 255];
};

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('WebGL shader could not be created.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader failed to compile: ${log}`);
    }
    return shader;
}

const UNIFORMS = ['uTex', 'uRes', 'uTime', 'uGlitch', 'uAlert', 'uSince', 'uDpr', 'uMotion', 'uCursor', 'uPrev', 'uCursorColor', 'uAlertColor', 'uBg'] as const;
type Uniform = typeof UNIFORMS[number];

export function canUseHackerShader(): boolean {
    if (typeof document === 'undefined') return false;
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        return !!gl;
    } catch {
        return false;
    }
}

export interface HackerEffects {
    glitch: number;
    alert: boolean;
}

export function sessionEffects(state: SessionState): HackerEffects {
    return { glitch: state.glitch ?? 0, alert: !!state.alert };
}

export class HackerScreen {
    readonly canvas: HTMLCanvasElement;
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private texture: WebGLTexture;
    private text: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private uniforms = {} as Record<Uniform, WebGLUniformLocation | null>;
    private layout: HackerLayout | null = null;
    private colors: { bg: string; fg: string; cursor: string; slots: Record<string, string> };
    private signature = '';
    private dirty = true;
    private cursor: [number, number, number, number] = [0, 0, 0, 0];
    private prev: [number, number, number, number] = [0, 0, 0, 0];
    private cursorKey = '';
    private movedAt = -1;
    private pendingMove = false;
    private glitchCount = 0;
    private glitchAt = -10_000;
    private alertLevel = 0;
    private lastTime = -1;
    motion = true;

    constructor(canvas: HTMLCanvasElement, theme: Record<string, any>, { preserve = false } = {}) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: preserve, premultipliedAlpha: false });
        if (!gl) throw new Error('WebGL is not available.');
        this.gl = gl;

        const program = gl.createProgram();
        if (!program) throw new Error('WebGL program could not be created.');
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Shader failed to link: ${gl.getProgramInfoLog(program)}`);
        }
        this.program = program;
        gl.useProgram(program);

        // One triangle that covers the whole canvas.
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'aPos');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        for (const name of UNIFORMS) {
            this.uniforms[name] = gl.getUniformLocation(program, name);
        }

        const texture = gl.createTexture();
        if (!texture) throw new Error('WebGL texture could not be created.');
        this.texture = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.text = document.createElement('canvas');
        const ctx = this.text.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D is not available.');
        this.ctx = ctx;

        const bg = safeHex(theme?.background) || '#0a0f14';
        const fg = safeHex(theme?.foreground) || '#f4efe6';
        const cursor = safeHex(theme?.cursor) || fg;
        const slots: Record<string, string> = { bg, fg, cursor };
        for (let index = 1; index <= 16; index++) {
            const key = String(index).padStart(2, '0');
            slots[key] = safeHex(theme?.[`color_${key}`]) || fg;
        }
        this.colors = { bg, fg, cursor, slots };
        gl.uniform1i(this.uniforms.uTex, 0);
        gl.uniform3fv(this.uniforms.uBg, rgb(bg));
        gl.uniform3fv(this.uniforms.uCursorColor, rgb(cursor));
        gl.uniform3fv(this.uniforms.uAlertColor, rgb(slots['10'] || '#ff3355'));
    }

    setLayout(layout: HackerLayout) {
        const same = this.layout && Object.keys(layout).every((key) => this.layout?.[key as keyof HackerLayout] === layout[key as keyof HackerLayout]);
        if (same) return;
        this.layout = layout;
        this.canvas.width = layout.width;
        this.canvas.height = layout.height;
        this.text.width = layout.width;
        this.text.height = layout.height;
        this.gl.viewport(0, 0, layout.width, layout.height);
        this.signature = '';
        this.cursorKey = '';
        this.dirty = true;
    }

    // Draws the screen's text when it changed; the shader runs on every render.
    setRows(rows: SessionLine[], cursorOn: boolean) {
        const layout = this.layout;
        if (!layout) return;
        const signature = `${cursorOn}\n${JSON.stringify(rows)}`;
        if (signature !== this.signature) {
            this.signature = signature;
            this.drawText(rows, cursorOn, layout);
            this.dirty = true;
        }

        const cell = cursorCell(rows);
        const key = cell ? `${cell.col},${cell.row}` : '';
        if (key !== this.cursorKey) {
            const rect: [number, number, number, number] = cell
                ? [layout.gridX + cell.col * layout.cellW, layout.gridY + cell.row * layout.cellH, layout.cellW, layout.cellH]
                : [0, 0, 0, 0];
            // The trail starts where the cursor was; a cursor that just
            // appeared has nowhere to come from.
            this.prev = this.cursorKey && cell ? this.cursor : rect;
            this.cursor = rect;
            this.cursorKey = key;
            this.pendingMove = true;
        }
    }

    private drawText(rows: SessionLine[], cursorOn: boolean, layout: HackerLayout) {
        const { ctx } = this;
        const { slots } = this.colors;
        const slot = (key?: string) => (key && slots[key]) || this.colors.fg;
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, layout.width, layout.height);
        ctx.textBaseline = 'middle';
        rows.forEach((row, rowIndex) => {
            const y = layout.gridY + rowIndex * layout.cellH;
            let column = 0;
            for (const part of row) {
                const x = layout.gridX + column * layout.cellW;
                let { c, bg } = part;
                let cursor = part.cur;
                if (cursor && !cursorOn) {
                    if (cursor === 'block') {
                        c = undefined;
                        bg = undefined;
                    }
                    cursor = undefined;
                }
                if (bg) {
                    ctx.fillStyle = slot(bg);
                    ctx.fillRect(Math.floor(x), y, Math.ceil(x + part.t.length * layout.cellW) - Math.floor(x), layout.cellH);
                }
                if (cursor === 'bar') {
                    ctx.fillStyle = slot('cursor');
                    ctx.fillRect(Math.floor(x), y, Math.max(1, Math.round(layout.fontPx * 0.14)), layout.cellH);
                }
                if (part.t.trim()) {
                    ctx.font = `${part.i ? 'italic ' : ''}${part.b ? 700 : 400} ${layout.fontPx}px ${MONO}`;
                    ctx.fillStyle = slot(c);
                    ctx.fillText(part.t, x, y + layout.cellH / 2);
                }
                column += part.t.length;
            }
        });
    }

    // `ms` is the session clock; effects are timed from it.
    render(ms: number, effects: HackerEffects) {
        const layout = this.layout;
        if (!layout) return;
        const { gl, uniforms } = this;

        // The loop started over: forget what happened "later".
        if (ms < this.lastTime) {
            this.movedAt = Math.min(this.movedAt, ms);
            this.glitchAt = Math.min(this.glitchAt, ms - 10_000);
        }
        const delta = this.lastTime < 0 || ms < this.lastTime ? 0 : ms - this.lastTime;
        this.lastTime = ms;

        if (this.pendingMove) {
            this.movedAt = ms;
            this.pendingMove = false;
        }
        if (effects.glitch !== this.glitchCount) {
            if (effects.glitch > this.glitchCount) this.glitchAt = ms;
            this.glitchCount = effects.glitch;
        }
        const target = effects.alert ? 1 : 0;
        this.alertLevel = delta ? this.alertLevel + (target - this.alertLevel) * Math.min(1, delta / 250) : target;
        const sinceGlitch = (ms - this.glitchAt) / 1000;
        const glitch = this.motion && sinceGlitch < 0.85 ? (1 - sinceGlitch / 0.85) ** 2 : 0;

        if (this.dirty) {
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.text);
            this.dirty = false;
        }
        gl.useProgram(this.program);
        gl.uniform2f(uniforms.uRes, layout.width, layout.height);
        gl.uniform1f(uniforms.uTime, ms / 1000);
        gl.uniform1f(uniforms.uGlitch, glitch);
        gl.uniform1f(uniforms.uAlert, this.alertLevel);
        gl.uniform1f(uniforms.uSince, this.motion ? Math.max(0, (ms - this.movedAt) / 1000) : 10);
        gl.uniform1f(uniforms.uDpr, layout.dpr);
        gl.uniform1f(uniforms.uMotion, this.motion ? 1 : 0);
        gl.uniform4fv(uniforms.uCursor, this.cursor);
        gl.uniform4fv(uniforms.uPrev, this.prev);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    destroy() {
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
}
