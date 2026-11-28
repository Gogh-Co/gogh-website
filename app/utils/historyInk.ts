// Pigment and light drawn over the existing artwork, never over its copy.
// One small canvas is allocated on demand and removed when the scene rests.
const COLORS = ['#ed675e', '#f4b64d', '#e6d663', '#73d18c', '#4bcac8', '#548ee6', '#a17ee0', '#e07fb6'];
export interface HistoryInk {
    energize(time: number): void;
    paint(x: number, y: number, intensity: number, time: number): boolean;
    dispose(): void;
}

export function createHistoryInk(surface: HTMLElement, chapter: string): HistoryInk | null {
    if (chapter === 'cube') return null; // Its existing texture has its own depth renderer.
    const canvas = document.createElement('canvas');
    canvas.className = 'h-hover-ink';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    surface.append(canvas);
    let lastInput = 0;
    let width = 0;
    let height = 0;
    const image = surface.querySelector<HTMLImageElement>('img.h-chapter__image');
    const seed = (n: number) => (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
    const noise = (n: number) => Math.abs(seed(n));

    function fit() {
        const w = surface.clientWidth;
        const h = surface.clientHeight;
        if (w === width && h === height) return;
        width = w; height = h;
        const ratio = Math.min(devicePixelRatio || 1, 1.5, 1600 / Math.max(1, w));
        canvas.width = Math.round(w * ratio);
        canvas.height = Math.round(h * ratio);
        ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function line(color: string, alpha: number, thickness: number, points: number[]) {
        ctx!.strokeStyle = color;
        ctx!.globalAlpha = alpha;
        ctx!.lineWidth = thickness;
        ctx!.beginPath();
        ctx!.moveTo(points[0]!, points[1]!);
        ctx!.bezierCurveTo(points[2]!, points[3]!, points[4]!, points[5]!, points[6]!, points[7]!);
        ctx!.stroke();
    }

    function reveal(x: number, y: number, intensity: number) {
        if (!image?.complete || !image.naturalWidth || !['paper', 'themes', 'science'].includes(chapter)) return;
        const style = getComputedStyle(image);
        const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
        const translation = style.translate.split(' ').map(parseFloat);
        const origin = style.transformOrigin.split(' ').map(parseFloat);
        const zoom = 1 + intensity * (chapter === 'science' ? .5 : .28);
        const w = image.clientWidth;
        const h = image.clientHeight;
        const ratio = (style.objectFit === 'cover' ? Math.max : Math.min)(w / image.naturalWidth, h / image.naturalHeight);
        const dw = image.naturalWidth * ratio;
        const dh = image.naturalHeight * ratio;
        ctx!.save();
        ctx!.globalAlpha = intensity * .96;
        ctx!.translate(x, y); ctx!.scale(zoom, zoom); ctx!.translate(-x, -y);
        ctx!.translate(image.offsetLeft + (translation[0] || 0), image.offsetTop + (translation[1] || 0));
        ctx!.translate(origin[0] || 0, origin[1] || 0);
        ctx!.rotate((parseFloat(style.rotate) || 0) * Math.PI / 180);
        const scale = parseFloat(style.scale) || 1;
        ctx!.scale(scale, scale);
        ctx!.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
        ctx!.translate(-(origin[0] || 0), -(origin[1] || 0));
        ctx!.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx!.restore();
        ctx!.globalCompositeOperation = 'destination-in';
        const aperture = ctx!.createRadialGradient(x, y, 30, x, y, 210);
        aperture.addColorStop(0, '#000'); aperture.addColorStop(.5, '#000e'); aperture.addColorStop(1, '#0000');
        ctx!.fillStyle = aperture; ctx!.fillRect(0, 0, width, height);
        ctx!.globalCompositeOperation = 'source-over';
    }

    return {
        energize(time) { lastInput = time; },
        paint(nx, ny, intensity, time) {
            fit();
            if (!width || !height) return false;
            const x = (nx + 1) * width * .5;
            const y = (ny + 1) * height * .5;
            const t = Math.min(time, lastInput + 1100) * .001;
            ctx.clearRect(0, 0, width, height);
            reveal(x, y, intensity);
            ctx.save();
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'screen';

            // Broad colored light makes the smaller, dry strokes feel embedded.
            const color = chapter === 'paper' ? '#e9b96c' : chapter === 'glass' ? '#33ff66'
                : chapter === 'etiquette' ? '#e6e4dd' : chapter === 'escape' ? '#efc856' : '#4ecfc5';
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 250);
            glow.addColorStop(0, color + '50'); glow.addColorStop(.4, color + '18'); glow.addColorStop(1, color + '00');
            ctx.globalAlpha = intensity;
            ctx.fillStyle = glow; ctx.fillRect(x - 250, y - 250, 500, 500);

            if (chapter === 'glass') {
                // A curved CRT scan, with phosphor afterglow on either side.
                for (let i = -12; i <= 12; i++) {
                    const yy = y + i * 5;
                    line('#58ff81', intensity * (1 - Math.abs(i) / 13) * .22, i === 0 ? 2 : .65,
                        [x - 310, yy + 24, x - 130, yy - 5, x + 130, yy - 5, x + 310, yy + 24]);
                }
            } else if (chapter === 'truecolor' || chapter === 'eight' || chapter === 'sixteen') {
                // A fan of brush-like spectral ribbons, bending with the mouse.
                const full = chapter === 'truecolor';
                const count = chapter === 'sixteen' ? 16 : 8;
                for (let i = 0; i < count; i++) {
                    const spread = (i - (count - 1) / 2) * (full ? 21 : 11);
                    const wave = Math.sin(t * 1.8 + i * .3) * 24;
                    const points = [x - 330, y + spread + 90, x - 100, y + spread - 120 + wave,
                        x + 80, y + spread + 140 - wave, x + 330, y + spread - 80];
                    line(COLORS[i % 8]!, intensity * (full ? .22 : .18), full ? 14 : 7, points);
                    line(COLORS[i % 8]!, intensity * .62, .8, points);
                }
            } else if (chapter === 'escape' || chapter === 'today' || chapter === 'themes') {
                // Signal paths, with small moving packets rather than UI badges.
                const warm = chapter === 'escape';
                for (let i = 0; i < 6; i++) {
                    const offset = (i - 2.5) * 19;
                    const color = warm ? ['#eac35c', '#e88452', '#f0dfab'][i % 3]!
                        : ['#55d6ca', '#7eadef', '#bf8fe4'][i % 3]!;
                    const points = [x - 260, y + offset + 80, x - 30, y + offset + 80,
                        x + 30, y + offset - 80, x + 260, y + offset - 80];
                    line(color, intensity * .16, 5, points);
                    ctx.setLineDash([3 + i * 2, 18 + i * 3]);
                    ctx.lineDashOffset = -t * (28 + i * 7);
                    line(color, intensity * .68, 1.2, points);
                    ctx.setLineDash([]);
                }
            } else if (chapter === 'science') {
                // RGB subpixels refract into a locally curved interference field.
                for (let i = -14; i <= 14; i++) {
                    for (let c = 0; c < 3; c++) {
                        const xx = x + i * 13 + c * 3;
                        const bow = Math.sin(i * .2 + t) * 42;
                        line(['#ff6565', '#6eed93', '#66b4ff'][c]!, intensity * (1 - Math.abs(i) / 16) * .54, 1,
                            [xx - 28, y - 230, xx + bow, y - 70, xx - bow, y + 70, xx + 28, y + 230]);
                    }
                }
            } else {
                // Dry pencil marks pick up light on paper and in the quiet era.
                for (let i = 0; i < 48; i++) {
                    const angle = noise(i + 1) * Math.PI * 2;
                    const radius = 35 + noise(i + 49) * 190;
                    const xx = x + Math.cos(angle) * radius;
                    const yy = y + Math.sin(angle) * radius * .65;
                    const length = 8 + noise(i + 90) * 38;
                    line(color, intensity * .5 * (1 - radius / 260), .6,
                        [xx, yy, xx + length * .3, yy - 6, xx + length * .7, yy - 12, xx + length, yy - 18]);
                }
            }

            // Fine pigment flecks: always restrained to the drawing's lit area.
            if (chapter !== 'etiquette') {
                for (let i = 0; i < 28; i++) {
                    const phase = (t * .11 + noise(i + 200)) % 1;
                    const angle = noise(i + 300) * Math.PI * 2;
                    const radius = phase * 220;
                    ctx.globalAlpha = intensity * Math.sin(phase * Math.PI) * .6;
                    ctx.fillStyle = chapter === 'paper' || chapter === 'glass' ? color : COLORS[i % 8]!;
                    ctx.fillRect(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * .62,
                        i % 4 === 0 ? 3 : 1, 1);
                }
            }
            ctx.restore();

            // Feather every mark into the source illustration; no hard lens edge.
            ctx.globalCompositeOperation = 'destination-in';
            const feather = ctx.createRadialGradient(x, y, 60, x, y, 350);
            feather.addColorStop(0, '#000'); feather.addColorStop(.6, '#000b'); feather.addColorStop(1, '#0000');
            ctx.fillStyle = feather; ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';
            return intensity > .01 && time < lastInput + 1100;
        },
        dispose() { canvas.remove(); canvas.width = canvas.height = 0; },
    };
}
