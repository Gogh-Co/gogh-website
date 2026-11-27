// gifenc ships without types; this covers the part the session export uses.
declare module 'gifenc' {
    export type Palette = number[][];

    export interface WriteFrameOptions {
        palette?: Palette;
        delay?: number;
        transparent?: boolean;
        transparentIndex?: number;
        dispose?: number;
        repeat?: number;
        colorDepth?: number;
        first?: boolean;
    }

    export interface Encoder {
        writeFrame(index: Uint8Array, width: number, height: number, options?: WriteFrameOptions): void;
        finish(): void;
        bytes(): Uint8Array;
    }

    export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): Encoder;
    export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, options?: Record<string, unknown>): Palette;
    export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: string): Uint8Array;
}
