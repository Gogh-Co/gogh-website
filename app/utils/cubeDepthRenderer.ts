// A shallow image-based scene. The original illustration is the only color
// texture: no relighting, generated replacement, or color-space conversion.
// The three visible cube faces have continuous depth planes; the grayscale
// column and floor sit farther back. Small camera translations reveal relief.

export interface CubeDepthRenderer {
    resize(width: number, height: number): void;
    setPose(x: number, y: number, scroll: number): void;
    setVisible(visible: boolean): void;
    dispose(): void;
}

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
    v_uv = vec2(a_position.x * .5 + .5, .5 - a_position.y * .5);
    gl_Position = vec4(a_position, 0., 1.);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_camera;
varying vec2 v_uv;

float edge(vec2 p, vec2 a, vec2 b) {
    vec2 d = b - a;
    return (d.x * (p.y - a.y) - d.y * (p.x - a.x)) / length(d);
}

float depthAt(vec2 p) {
    // Outline in the source image's UV coordinates, including a soft margin
    // for the loose pencil strokes outside the painted silhouette.
    vec2 a = vec2(.440, .058);
    vec2 b = vec2(.218, .202);
    vec2 c = vec2(.414, .394);
    vec2 d = vec2(.624, .238);
    vec2 e = vec2(.194, .600);
    vec2 f = vec2(.386, .794);
    vec2 g = vec2(.592, .600);
    float outline = min(min(edge(p,b,a), edge(p,a,d)),
        min(min(edge(p,d,g), edge(p,g,f)), min(edge(p,f,e), edge(p,e,b))));
    float cubeMask = smoothstep(-.014, .014, outline);

    // Depth is continuous along the shared edges of the three painted faces.
    float frontEdge = c.x + (p.y - c.y) * (f.x - c.x) / (f.y - c.y);
    float topEdge = p.x < c.x
        ? b.y + (p.x - b.x) * (c.y - b.y) / (c.x - b.x)
        : c.y + (p.x - c.x) * (d.y - c.y) / (d.x - c.x);
    vec3 plane = p.y < topEdge ? vec3(-.1355014, 2.2216576, .1807645)
        : p.x < frontEdge ? vec3(2.0932009, -.0534759, .1544843)
        : vec3(-2.2664256, -.3586498, 2.0796082);
    float cube = cubeMask * clamp(dot(vec3(p, 1.), plane), .15, 1.);

    float column = smoothstep(.743, .755, p.x) * (1. - smoothstep(.791, .805, p.x))
        * smoothstep(.040, .065, p.y) * (1. - smoothstep(.817, .844, p.y));
    float floorDepth = .08 * smoothstep(.73, .85, p.y) * (1. - smoothstep(.94, 1., p.y));
    return max(cube, max(column * .43, floorDepth));
}

void main() {
    // Inverse projection keeps every output pixel covered. Multiple short
    // steps avoid the torn edges of a forward-warped depth mesh.
    vec2 uv = v_uv;
    for (int i = 0; i < 3; i++) {
        uv = v_uv - u_camera * depthAt(uv);
    }
    gl_FragColor = vec4(texture2D(u_image, clamp(uv, .001, .999)).rgb, 1.);
}`;

function shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
    const result = gl.createShader(type);
    if (!result) throw new Error('Shader unavailable');
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
        gl.deleteShader(result);
        throw new Error('Depth shader unavailable');
    }
    return result;
}

export async function createCubeDepthRenderer(
    canvas: HTMLCanvasElement,
    source: string,
    signal: AbortSignal,
): Promise<CubeDepthRenderer | null> {
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let vertices: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let frame = 0;
    let disposed = false;
    let visible = false;
    let lastTime = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    function dispose() {
        disposed = true;
        cancelAnimationFrame(frame);
        frame = 0;
        if (!gl) return;
        gl.useProgram(null);
        if (texture) gl.deleteTexture(texture);
        if (vertices) gl.deleteBuffer(vertices);
        if (program) gl.deleteProgram(program);
        if (vertex) gl.deleteShader(vertex);
        if (fragment) gl.deleteShader(fragment);
    }

    try {
        const image = new Image();
        image.decoding = 'async';
        image.src = source;
        await image.decode();
        if (signal.aborted) return null;

        gl = canvas.getContext('webgl', {
            alpha: false, antialias: false, depth: false, stencil: false,
            premultipliedAlpha: false, powerPreference: 'low-power',
        });
        if (!gl) return null;

        vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
        fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        program = gl.createProgram();
        vertices = gl.createBuffer();
        texture = gl.createTexture();
        if (!program || !vertices || !texture) throw new Error('Depth resources unavailable');
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Depth program unavailable');
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        vertex = fragment = null;
        gl.useProgram(program);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
        const camera = gl.getUniformLocation(program, 'u_camera');
        const context = gl;

        function draw() {
            if (disposed || context.isContextLost()) return;
            context.uniform2f(camera, x * .018, y * .024);
            context.drawArrays(context.TRIANGLES, 0, 6);
        }

        function animate(time: number) {
            frame = 0;
            if (disposed || !visible) return;
            const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 1 / 60;
            lastTime = time;
            const ease = 1 - Math.exp(-dt * 9);
            x += (targetX - x) * ease;
            y += (targetY - y) * ease;
            const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < .0002;
            if (settled) { x = targetX; y = targetY; }
            draw();
            if (!settled) frame = requestAnimationFrame(animate);
        }

        function wake() {
            if (!frame && visible && !disposed) {
                lastTime = 0;
                frame = requestAnimationFrame(animate);
            }
        }

        return {
            resize(width, height) {
                if (disposed || width <= 0 || height <= 0) return;
                // Keep the native source resolution, including on 1x displays.
                // This avoids resampling the pencil lines twice and caps the
                // surface at the original 1672px instead of upscaling it.
                const w = image.naturalWidth;
                const h = Math.round(w * height / width);
                if (canvas.width !== w || canvas.height !== h) {
                    canvas.width = w;
                    canvas.height = h;
                    context.viewport(0, 0, w, h);
                }
                draw();
            },
            setPose(pointerX, pointerY, scroll) {
                targetX = Math.max(-1.15, Math.min(1.15, pointerX + scroll * .16));
                targetY = Math.max(-1.15, Math.min(1.15, pointerY + scroll * .22));
                wake();
            },
            setVisible(value) {
                visible = value;
                if (visible) wake();
                else { cancelAnimationFrame(frame); frame = 0; }
            },
            dispose,
        };
    } catch {
        // The existing <img> remains the complete, accessible fallback.
        dispose();
        return null;
    }
}
