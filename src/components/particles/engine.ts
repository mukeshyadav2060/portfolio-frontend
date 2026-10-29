/**
 * A dependency-free WebGL particle field (~4 KB gzipped).
 *
 * Every particle carries three positions: in the owner's initials (hero), in a starfield (the scroll
 * between sections) and on a ring (contact). The vertex shader blends between them from
 * two uniforms the page drives with scroll position, so the CPU only updates uniforms.
 */

export type FieldState = {
  /** 0 → initials, 1 → starfield */
  scatter: number;
  /** 0 → current, 1 → ring */
  ring: number;
  scrollY: number;
};

const VERT = /* glsl */ `
attribute vec3 aShape;
attribute vec3 aStar;
attribute vec3 aRing;
attribute vec4 aRand;

uniform float uTime;
uniform float uScatter;
uniform float uRing;
uniform float uAspect;
uniform float uPixel;
uniform float uScale;
uniform float uScroll;
uniform float uPointer;
uniform vec2 uMouse;
uniform vec2 uOffset;
uniform float uDim;

varying float vAlpha;
varying float vTone;
varying float vStar;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

void main() {
  float t = uTime;

  // Initials: a wave ripples through the letters, every particle drifts on its own
  // orbit, and the whole sculpture sways without ever turning its back.
  vec3 s = aShape;
  s.z += sin(s.x * 2.6 - t * 1.6) * 0.09 + sin(s.y * 3.4 + t * 1.1) * 0.05;
  s += vec3(sin(t * 1.3 + aRand.x * 6.283), cos(t * 1.1 + aRand.y * 6.283), sin(t * 0.9 + aRand.z * 6.283)) * 0.012;
  s = rotY(sin(t * 0.35) * 0.32) * rotX(sin(t * 0.27) * 0.1 - 0.06) * s;
  float facing = s.z * 2.5;
  s = s * uScale + vec3(uOffset, 0.);

  // Starfield: drifts upward with scroll at per-star speed (parallax).
  vec3 st = aStar;
  st.y = mod(st.y + uScroll * 0.00045 * (0.35 + aRand.y) + 2.6, 5.2) - 2.6;
  st.x += sin(t * 0.15 + aRand.z * 6.283) * 0.04;

  // Ring: tilted torus, spinning.
  vec3 r = rotX(1.15) * rotY(t * 0.18) * aRing;
  r = r * uScale + vec3(uOffset, 0.);

  vec3 p = mix(s, st, uScatter);
  p = mix(p, r, uRing);

  // Perspective projection with the camera 3.2 units back.
  float z = p.z + 3.2;
  float persp = 2.6 / max(z, 0.4);
  vec2 ndc = vec2(p.x * persp / uAspect, p.y * persp);

  // Pointer pushes nearby particles outward.
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  float push = smoothstep(0.32, 0.0, dist) * uPointer;
  ndc += (d / max(dist, 0.0001)) * push * vec2(0.1 / uAspect, 0.1);

  gl_Position = vec4(ndc, 0., 1.);

  float twinkle = mix(1.0, 0.55 + 0.6 * sin(t * 1.7 + aRand.x * 40.0), uScatter * (1.0 - uRing));
  gl_PointSize = (2.2 + aRand.w * 3.2) * persp * uPixel * twinkle;

  float shapeAlpha = mix(1.0, 0.3, smoothstep(-1.0, 1.0, facing));
  vAlpha = mix(shapeAlpha, 0.35 + 0.65 * aRand.z, uScatter);
  vAlpha = mix(vAlpha, 0.9, uRing) * (0.75 + push);
  vTone = clamp(aRand.y * 0.6 + 0.2 + aShape.y * 0.45, 0., 1.);
  vStar = uScatter * (1.0 - uRing);
  // The initials and ring are dimmed where they sit behind text; the starfield never is.
  vAlpha *= mix(uDim, 1.0, vStar);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uAccent;
uniform vec3 uCool;
uniform float uFade;
varying float vAlpha;
varying float vTone;
varying float vStar;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a *= a * 1.6;
  vec3 col = mix(uCool, uAccent, vTone);
  col = mix(col, vec3(0.86, 0.89, 0.95), vStar * 0.75);
  gl_FragColor = vec4(col, a * vAlpha * uFade);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x00f0ff;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader error");
  return sh;
}

/**
 * Samples `count` points from `text` drawn on an off-screen canvas in `font`, centred and
 * normalised to roughly 2 units wide, with depth so the letters read as a volume.
 * Falls back to a sphere if nothing could be drawn.
 */
function sampleText(text: string, font: string, count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const W = 640;
  const H = 360;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const filled: number[] = [];
  if (ctx) {
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 300px ${font}`;
    const measured = ctx.measureText(text).width;
    if (measured > W * 0.92) ctx.font = `800 ${Math.floor((300 * W * 0.92) / measured)}px ${font}`;
    ctx.fillText(text, W / 2, H / 2 + 10);
    const data = ctx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) filled.push(x, y);
  }
  if (filled.length < 200) {
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      out.set([Math.cos(th) * r, u, Math.sin(th) * r], i * 3);
    }
    return out;
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < filled.length; i += 2) {
    minX = Math.min(minX, filled[i]); maxX = Math.max(maxX, filled[i]);
    minY = Math.min(minY, filled[i + 1]); maxY = Math.max(maxY, filled[i + 1]);
  }
  const scale = 2 / Math.max(maxX - minX, (maxY - minY) * 1.6);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const pts = filled.length / 2;
  for (let i = 0; i < count; i++) {
    const k = ((Math.random() * pts) | 0) * 2;
    out.set(
      [(filled[k] - cx + Math.random() * 2) * scale, -(filled[k + 1] - cy + Math.random() * 2) * scale, (Math.random() - 0.5) * 0.32],
      i * 3,
    );
  }
  return out;
}

function buildGeometry(count: number, text: string, font: string) {
  const shape = sampleText(text, font, count);
  const star = new Float32Array(count * 3);
  const ring = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    star.set([(Math.random() - 0.5) * 7.5, (Math.random() - 0.5) * 5.2, -2.6 + Math.random() * 3.4], i * 3);

    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI * 2;
    const R = 1.15;
    const tube = 0.05 + Math.random() * 0.1;
    ring.set([(R + tube * Math.cos(b)) * Math.cos(a), tube * Math.sin(b), (R + tube * Math.cos(b)) * Math.sin(a)], i * 3);

    rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
  }
  return { shape, star, ring, rand };
}

/**
 * Creates its own canvas inside `host`: a context that has been lost cannot be revived, and
 * getContext() on the same element returns the dead one, so every start gets a fresh element.
 */
export function startField(
  host: HTMLElement,
  opts: { accent: string; text: string; font: string; reduced: boolean; read: () => FieldState },
) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) return () => {};
  host.appendChild(canvas);

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link error");
  gl.useProgram(program);

  const small = innerWidth < 768;
  const count = small ? 5000 : (navigator.hardwareConcurrency ?? 4) >= 8 ? 16000 : 11000;
  const geo = buildGeometry(count, opts.text, opts.font);

  const attr = (name: string, data: Float32Array, size: number) => {
    const loc = gl.getAttribLocation(program, name);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr("aShape", geo.shape, 3);
  attr("aStar", geo.star, 3);
  attr("aRing", geo.ring, 3);
  attr("aRand", geo.rand, 4);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const U = {
    time: u("uTime"),
    scatter: u("uScatter"),
    ring: u("uRing"),
    aspect: u("uAspect"),
    pixel: u("uPixel"),
    scale: u("uScale"),
    scroll: u("uScroll"),
    pointer: u("uPointer"),
    mouse: u("uMouse"),
    offset: u("uOffset"),
    accent: u("uAccent"),
    cool: u("uCool"),
    fade: u("uFade"),
    dim: u("uDim"),
  };
  gl.uniform3fv(U.accent, hexToRgb(opts.accent));
  gl.uniform3fv(U.cool, [0, 0.639, 1.0]);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let aspect = 1;
  let maxDpr = small ? 1.5 : 1.75;
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    const w = host.clientWidth || innerWidth;
    const h = host.clientHeight || innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / h;
    gl.uniform1f(U.aspect, aspect);
    gl.uniform1f(U.pixel, dpr);
    // Desktop: the initials sit in the right half beside the headline. Phone: lower,
    // behind the text, scaled to the screen width.
    const wide = w >= 1024;
    // The shape is 2 units wide; scale so it spans ~31% of the screen (85% on phones).
    gl.uniform2fv(U.offset, wide ? [(0.56 * aspect) / 0.81, 0.06] : [0, -0.58]);
    gl.uniform1f(U.scale, wide ? (0.62 * aspect) / (2 * 0.81) : Math.min(0.62, (1.7 * aspect) / (2 * 0.81)));
    // On phones the initials and the contact ring overlap the copy, so they stay a backdrop.
    gl.uniform1f(U.dim, wide ? 1 : 0.32);
  };
  resize();

  // Pointer, smoothed.
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  const onPointer = (e: PointerEvent) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
    mouse.energy = 1;
  };
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("resize", resize, { passive: true });

  let raf = 0;
  let last = performance.now();
  let time = 0;
  let fade = 0;
  let running = true;

  // Adaptive quality: if the device cannot hold ~40fps over the first frames, draw half the
  // particles at a lower pixel ratio and render every other frame.
  let drawCount = small ? Math.round(count * 0.7) : count;
  let sampled = 0;
  let sampleTime = 0;
  let skip = small ? 1 : 0;
  let tick = 0;

  const frame = (now: number) => {
    if (running && !opts.reduced) raf = requestAnimationFrame(frame);
    const interval = now - last;
    if (skip && tick++ % (skip + 1) !== 0) return;
    const dt = Math.min(interval / 1000, 0.066);
    last = now;
    if (sampled < 45 && interval > 0 && interval < 500) {
      sampleTime += interval;
      if (++sampled === 45 && sampleTime / 45 > 25 * (skip + 1)) {
        drawCount = Math.round(count * 0.5);
        skip = 1;
        maxDpr = 1;
        resize();
      }
    }
    if (!opts.reduced) time += dt;
    fade = Math.min(1, fade + dt * 1.2);
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    mouse.energy *= 0.985;

    const s = opts.read();
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.scatter, s.scatter);
    gl.uniform1f(U.ring, s.ring);
    gl.uniform1f(U.scroll, s.scrollY);
    gl.uniform1f(U.pointer, opts.reduced ? 0 : mouse.energy);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.fade, opts.reduced ? 1 : fade);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, drawCount);
  };
  raf = requestAnimationFrame(frame);

  // Reduced motion: no loop, redraw only when scroll changes the scene.
  const redraw = () => {
    if (opts.reduced) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  };
  if (opts.reduced) addEventListener("scroll", redraw, { passive: true });

  const onVisibility = () => {
    running = !document.hidden;
    if (running && !opts.reduced) {
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onPointer);
    removeEventListener("resize", resize);
    removeEventListener("scroll", redraw);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
}
