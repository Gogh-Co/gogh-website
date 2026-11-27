import { mixColors, safeHex } from './themeColors';
import { themeSlug } from './themeSlug';
import {
    SESSION_COLS,
    SESSION_ROWS,
    buildTerminalSession,
    cursorVisible,
    renderTerminalSession,
    sessionFrames,
    type SessionFrame,
    type SessionSegment,
} from './terminalSession';
import { buildHackerSession } from './hackerSession';
import { HackerScreen, sessionEffects } from './hackerShader';

// Turns the theme page's live terminal session into a file: each distinct
// screen of the loop is drawn on a canvas (the same window the page shows,
// painted with the theme) and encoded in the browser, as a GIF with gifenc or
// as an MP4 (WebM where MP4 can't be encoded) with mediabunny. The encoders
// load only when a download starts. Browser-only.

const MONO = '"Roboto Mono", "DejaVu Sans Mono", monospace';
const SANS = 'Roboto, "Helvetica Neue", Arial, sans-serif';
const SITE_LABEL = 'gogh.website';

export interface SessionExportOptions {
    onProgress?: (fraction: number) => void;
    signal?: AbortSignal;
}

export interface SessionExportResult {
    blob: Blob;
    filename: string;
}

interface Layout {
    scale: number;
    fontSize: number;
    cellW: number;
    cellH: number;
    padX: number;
    padY: number;
    bar: number;
    width: number;
    height: number;
}

interface Colors {
    bg: string;
    fg: string;
    bar: string;
    barLine: string;
    border: string;
    slot: (key?: string) => string;
}

const even = (value: number) => Math.ceil(value / 2) * 2;

function themeColors(theme: Record<string, any>): Colors {
    const bg = safeHex(theme?.background) || '#0a0f14';
    const fg = safeHex(theme?.foreground) || '#f4efe6';
    const cursor = safeHex(theme?.cursor) || fg;
    const slots: Record<string, string> = { bg, fg, cursor };
    for (let index = 1; index <= 16; index++) {
        const key = String(index).padStart(2, '0');
        slots[key] = safeHex(theme?.[`color_${key}`]) || fg;
    }
    const bar = mixColors(bg, fg, 0.12);
    return {
        bg,
        fg,
        bar,
        barLine: mixColors(bar, fg, 0.1),
        border: mixColors(bg, fg, 0.16),
        slot: (key) => (key && slots[key]) || fg,
    };
}

function createLayout(ctx: CanvasRenderingContext2D, scale: number): Layout {
    const fontSize = 14 * scale;
    ctx.font = `400 ${fontSize}px ${MONO}`;
    const cellW = ctx.measureText('0'.repeat(SESSION_COLS)).width / SESSION_COLS;
    const cellH = Math.round(fontSize * 1.5);
    const padX = Math.round(26 * scale);
    const padY = Math.round(22 * scale);
    const bar = Math.round(40 * scale);
    return {
        scale,
        fontSize,
        cellW,
        cellH,
        padX,
        padY,
        bar,
        width: even(cellW * SESSION_COLS + padX * 2),
        height: even(bar + padY * 2 + cellH * SESSION_ROWS),
    };
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let cut = text;
    while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
    return `${cut}…`;
}

// The window chrome mirrors TerminalFrame: tinted bar, square buttons in the
// theme's red / yellow / green, centered title; plus the site on the right.
function drawChrome(ctx: CanvasRenderingContext2D, layout: Layout, colors: Colors, title: string) {
    const { width, height, bar, scale } = layout;
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = colors.bar;
    ctx.fillRect(0, 0, width, bar);
    ctx.fillStyle = colors.barLine;
    ctx.fillRect(0, bar - scale, width, scale);

    const size = 11 * scale;
    ['02', '04', '03'].forEach((slot, index) => {
        ctx.fillStyle = colors.slot(slot);
        ctx.fillRect(16 * scale + index * (size + 7 * scale), (bar - size) / 2, size, size);
    });

    ctx.textBaseline = 'middle';
    ctx.font = `400 ${12 * scale}px ${SANS}`;
    ctx.fillStyle = colors.fg;
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText(fitText(ctx, title, width - 280 * scale), width / 2, bar / 2);
    ctx.globalAlpha = 0.45;
    ctx.textAlign = 'right';
    ctx.fillText(SITE_LABEL, width - 16 * scale, bar / 2);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = scale;
    ctx.strokeRect(scale / 2, scale / 2, width - scale, height - scale);
}

function drawSegment(ctx: CanvasRenderingContext2D, layout: Layout, colors: Colors, part: SessionSegment, x: number, y: number, cursorOn: boolean) {
    const { cellW, cellH, fontSize } = layout;
    let { c, bg } = part;
    let cursor = part.cur;
    // A blinked-off cursor leaves the cell as plain text.
    if (cursor && !cursorOn) {
        if (cursor === 'block') {
            c = undefined;
            bg = undefined;
        }
        cursor = undefined;
    }

    const length = part.t.length;
    if (bg) {
        ctx.fillStyle = colors.slot(bg);
        ctx.fillRect(Math.floor(x), y, Math.ceil(x + length * cellW) - Math.floor(x), cellH);
    }
    if (cursor === 'bar') {
        ctx.fillStyle = colors.slot('cursor');
        ctx.fillRect(Math.floor(x), y, Math.max(1, Math.round(fontSize * 0.14)), cellH);
    }
    if (part.t.trim()) {
        ctx.font = `${part.i ? 'italic ' : ''}${part.b ? 700 : 400} ${fontSize}px ${MONO}`;
        ctx.fillStyle = colors.slot(c);
        ctx.fillText(part.t, x, y + cellH / 2);
    }
}

function drawFrame(ctx: CanvasRenderingContext2D, layout: Layout, colors: Colors, frame: SessionFrame) {
    drawChrome(ctx, layout, colors, frame.title);
    ctx.textBaseline = 'middle';
    frame.rows.forEach((row, rowIndex) => {
        const y = layout.bar + layout.padY + rowIndex * layout.cellH;
        let column = 0;
        for (const part of row) {
            drawSegment(ctx, layout, colors, part, layout.padX + column * layout.cellW, y, frame.cursorOn);
            column += part.t.length;
        }
    });
}

async function loadFonts() {
    if (!document.fonts?.load) return;
    await Promise.all([
        `400 14px ${MONO}`,
        `700 14px ${MONO}`,
        `italic 400 14px ${MONO}`,
        `400 12px ${SANS}`,
    ].map((font) => document.fonts.load(font).catch(() => [])));
}

function setup(theme: Record<string, any>, themeName: string, scale: number, sampleMs: number) {
    const session = buildTerminalSession(theme, themeName);
    const frames = sessionFrames(session, sampleMs);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D is not available.');
    const layout = createLayout(ctx, scale);
    canvas.width = layout.width;
    canvas.height = layout.height;
    const colors = themeColors(theme);
    const slug = themeSlug(themeName) || 'theme';
    return { session, frames, canvas, ctx, layout, colors, slug };
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

function throwIfAborted(signal?: AbortSignal) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

// GIF: one global palette learned from the busiest screens (vim, fastfetch,
// htop), and every frame after the first only stores the pixels that changed;
// the rest are transparent over the previous frame, which keeps the file small.
export async function exportSessionGif(theme: Record<string, any>, themeName: string, options: SessionExportOptions = {}): Promise<SessionExportResult> {
    const { signal, onProgress } = options;
    await loadFonts();
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    throwIfAborted(signal);

    const { session, frames, ctx, layout, colors, slug } = setup(theme, themeName, 1, 20);
    const { width, height } = layout;

    const pick = (test: (frame: SessionFrame) => boolean) => frames.find(test) || frames[0];
    const posterTime = session.times[session.posterIndex] ?? 0;
    const samples = [
        pick((frame) => frame.title.endsWith('VIM')),
        pick((frame) => frame.start >= posterTime),
        pick((frame) => frame.title.endsWith('htop')),
    ];
    const sample = new Uint8ClampedArray(width * height * 4 * samples.length);
    samples.forEach((frame, index) => {
        drawFrame(ctx, layout, colors, frame);
        sample.set(ctx.getImageData(0, 0, width, height).data, index * width * height * 4);
    });
    const base = quantize(sample, 255);
    const palette = [...base, [255, 0, 255]];
    const transparentIndex = palette.length - 1;

    const gif = GIFEncoder();
    let previous: Uint8Array | null = null;
    for (let index = 0; index < frames.length; index++) {
        throwIfAborted(signal);
        const frame = frames[index];
        drawFrame(ctx, layout, colors, frame);
        const pixels = applyPalette(ctx.getImageData(0, 0, width, height).data, base);
        let data = pixels;
        if (previous) {
            data = new Uint8Array(pixels);
            for (let pixel = 0; pixel < data.length; pixel++) {
                if (pixels[pixel] === previous[pixel]) data[pixel] = transparentIndex;
            }
        }
        gif.writeFrame(data, width, height, {
            palette: index === 0 ? palette : undefined,
            delay: Math.max(20, Math.round(frame.duration / 10) * 10),
            transparent: index > 0,
            transparentIndex,
            dispose: 1,
        });
        previous = pixels;

        if (index % 4 === 0) {
            onProgress?.(index / frames.length);
            await nextTick();
        }
    }
    gif.finish();
    onProgress?.(1);
    return { blob: new Blob([gif.bytes()], { type: 'image/gif' }), filename: `gogh-${slug}-session.gif` };
}

export function canExportSessionVideo(): boolean {
    return typeof window !== 'undefined' && 'VideoEncoder' in window;
}

// Video: drawn at twice the size so text stays sharp, one encoded frame per
// distinct screen (variable frame rate), MP4 with H.264 where the browser can,
// WebM otherwise.
export async function exportSessionVideo(theme: Record<string, any>, themeName: string, options: SessionExportOptions = {}): Promise<SessionExportResult> {
    const { signal, onProgress } = options;
    await loadFonts();
    const {
        Output,
        Mp4OutputFormat,
        WebMOutputFormat,
        BufferTarget,
        CanvasSource,
        QUALITY_HIGH,
        getFirstEncodableVideoCodec,
    } = await import('mediabunny');
    throwIfAborted(signal);

    const { frames, canvas, ctx, layout, colors, slug } = setup(theme, themeName, 2, 1000 / 30);
    const { output, source, extension } = await openVideo(canvas, { Output, Mp4OutputFormat, WebMOutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH, getFirstEncodableVideoCodec });

    try {
        for (let index = 0; index < frames.length; index++) {
            throwIfAborted(signal);
            const frame = frames[index];
            drawFrame(ctx, layout, colors, frame);
            await source.add(frame.start / 1000, frame.duration / 1000);
            if (index % 4 === 0) {
                onProgress?.(index / frames.length);
                await nextTick();
            }
        }
        await output.finalize();
    } catch (error) {
        await output.cancel().catch(() => {});
        throw error;
    }

    onProgress?.(1);
    return videoResult(output, extension, `gogh-${slug}-session`);
}

type Mediabunny = typeof import('mediabunny');

// MP4 with H.264 where the browser can encode it, WebM otherwise.
async function openVideo(canvas: HTMLCanvasElement, mb: Pick<Mediabunny, 'Output' | 'Mp4OutputFormat' | 'WebMOutputFormat' | 'BufferTarget' | 'CanvasSource' | 'QUALITY_HIGH' | 'getFirstEncodableVideoCodec'>) {
    const size = { width: canvas.width, height: canvas.height };
    let format: InstanceType<Mediabunny['Mp4OutputFormat']> | InstanceType<Mediabunny['WebMOutputFormat']> = new mb.Mp4OutputFormat({ fastStart: 'in-memory' });
    let extension = 'mp4';
    let codec = await mb.getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), size);
    if (!codec) {
        format = new mb.WebMOutputFormat();
        extension = 'webm';
        codec = await mb.getFirstEncodableVideoCodec(format.getSupportedVideoCodecs(), size);
    }
    if (!codec) throw new Error('This browser cannot encode video.');

    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const source = new mb.CanvasSource(canvas, { codec, bitrate: mb.QUALITY_HIGH });
    output.addVideoTrack(source);
    await output.start();
    return { output, source, extension };
}

function videoResult(output: { target: { buffer: ArrayBuffer | null } }, extension: string, name: string): SessionExportResult {
    const buffer = output.target.buffer;
    if (!buffer) throw new Error('The video came out empty.');
    return {
        blob: new Blob([buffer], { type: extension === 'mp4' ? 'video/mp4' : 'video/webm' }),
        filename: `${name}.${extension}`,
    };
}

// Hacker mode: its shaders move on every frame (grain, glitches, the cursor
// trail), so the loop is rendered at a constant 30 fps through the same
// WebGL pass the page uses, inside the same window chrome.
export async function exportHackerVideo(theme: Record<string, any>, themeName: string, options: SessionExportOptions = {}): Promise<SessionExportResult> {
    const { signal, onProgress } = options;
    await loadFonts();
    const mb = await import('mediabunny');
    throwIfAborted(signal);

    const session = buildHackerSession(theme, themeName);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available.');
    const layout = createLayout(ctx, 2);
    canvas.width = layout.width;
    canvas.height = layout.height;
    const colors = themeColors(theme);
    const slug = themeSlug(themeName) || 'theme';

    const glCanvas = document.createElement('canvas');
    const screen = new HackerScreen(glCanvas, theme, { preserve: true });
    screen.setLayout({
        width: layout.width,
        height: layout.height - layout.bar,
        gridX: layout.padX,
        gridY: layout.padY,
        cellW: layout.cellW,
        cellH: layout.cellH,
        fontPx: layout.fontSize,
        dpr: layout.scale,
    });

    const { output, source, extension } = await openVideo(canvas, mb);
    const fps = 30;
    const frameMs = 1000 / fps;
    const count = Math.ceil(session.total / frameMs);
    const state = session.initial();
    let stepIndex = 0;
    let keys = state.keys;
    let keyTime = 0;

    try {
        for (let frame = 0; frame < count; frame++) {
            throwIfAborted(signal);
            const time = frame * frameMs;
            while (stepIndex < session.steps.length && session.times[stepIndex] <= time) {
                session.steps[stepIndex].run?.(state);
                stepIndex++;
            }
            if (state.keys !== keys) {
                keys = state.keys;
                keyTime = time;
            }
            screen.setRows(renderTerminalSession(state), cursorVisible(time - keyTime));
            screen.render(time, sessionEffects(state));
            drawChrome(ctx, layout, colors, state.title);
            ctx.drawImage(glCanvas, 0, layout.bar);
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = layout.scale;
            ctx.strokeRect(layout.scale / 2, layout.scale / 2, layout.width - layout.scale, layout.height - layout.scale);
            await source.add(time / 1000, Math.min(frameMs, session.total - time) / 1000);
            if (frame % 6 === 0) {
                onProgress?.(frame / count);
                await nextTick();
            }
        }
        await output.finalize();
    } catch (error) {
        await output.cancel().catch(() => {});
        throw error;
    } finally {
        screen.destroy();
    }

    onProgress?.(1);
    return videoResult(output, extension, `gogh-${slug}-hacker`);
}

export function saveBlob({ blob, filename }: SessionExportResult) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
