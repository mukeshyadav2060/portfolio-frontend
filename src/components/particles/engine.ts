/**
 * A dependency-free WebGL particle field (~4 KB gzipped).
 *
 * Every particle carries three positions: on an impossible triangle (hero), in a starfield
 * (the scroll between sections) and on a ring (contact). The vertex shader blends between
 * them from two uniforms the page drives with scroll position, so the CPU only updates uniforms.
 *
 * The triangle is a real object: three square beams at right angles. Seen exactly along
 * (1, 1, 1) its two loose ends line up and it closes into a Penrose triangle, and light
 * streams along it in a loop that looks endless from that one angle. The pointer tilts it
 * and gives the trick away; at rest it settles back.
 */

export type FieldState = {
  /** 0 → triangle, 1 → starfield */
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
// x brightness, y position along the light loop (−1 for the triangle's surface, −2 for
// surface hidden in the impossible view), z tone.
attribute vec3 aMeta;

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
uniform vec2 uTilt;
// Corners of the light loop, in the same frame as aShape.
uniform vec3 uPath0;
uniform vec3 uPath1;
uniform vec3 uPath2;
uniform vec3 uPath3;

varying float vAlpha;
varying float vTone;
varying float vStar;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

vec3 loopAt(float u) {
  float k = u * 3.0;
  if (k < 1.0) return mix(uPath0, uPath1, k);
  if (k < 2.0) return mix(uPath1, uPath2, k - 1.0);
  return mix(uPath2, uPath3, k - 2.0);
}

void main() {
  float t = uTime;

  // Triangle surface, or light travelling the loop (aShape is then a small offset).
  float u = fract(aMeta.y + t * 0.045);
  vec3 s = aMeta.y < 0.0 ? aShape : loopAt(u) + aShape;
  // A slow turn about the line of sight keeps the illusion intact from every angle.
  float spin = t * 0.1;
  float cs = cos(spin), sn = sin(spin);
  s.xy = vec2(cs * s.x - sn * s.y, sn * s.x + cs * s.y);
  // A barely-there nod around the impossible view; the pointer tilts it further.
  vec2 tilt = vec2(sin(t * 0.4) * 0.025, sin(t * 0.31) * 0.02) + uTilt;
  s = rotY(tilt.x) * rotX(tilt.y) * s;
  // How far the pointer has given the trick away: parts hidden in the impossible view fade
  // in, and the light fades at the loop's seam rather than jumping across the gap.
  float reveal = smoothstep(0.02, 0.15, length(uTilt));
  float seam = smoothstep(0.0, 0.06, u) * (1.0 - smoothstep(0.94, 1.0, u));
  float show = aMeta.y < -1.5 ? reveal : aMeta.y < 0.0 ? 1.0 : mix(1.0, seam, reveal);
  // Orthographic: any perspective would open the gap that the illusion hides.
  s.z = 0.0;
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
  float push = smoothstep(0.32, 0.0, dist) * uPointer * 0.5;
  ndc += (d / max(dist, 0.0001)) * push * vec2(0.1 / uAspect, 0.1);

  gl_Position = vec4(ndc, 0., 1.);

  float twinkle = mix(1.0, 0.55 + 0.6 * sin(t * 1.7 + aRand.x * 40.0), uScatter * (1.0 - uRing));
  float fine = mix(aMeta.y < 0.0 ? 0.8 : 1.15, 1.0, uScatter);
  gl_PointSize = (2.2 + aRand.w * 3.2) * persp * uPixel * twinkle * fine;

  vAlpha = mix(aMeta.x * show, 0.35 + 0.65 * aRand.z, uScatter);
  vAlpha = mix(vAlpha, 0.9, uRing) * (0.75 + push);
  vTone = aMeta.z;
  vStar = uScatter * (1.0 - uRing);
  // The triangle and ring are dimmed where they sit behind text; the starfield never is.
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

type Vec3 = [number, number, number];

/** Beam length and thickness of the triangle, in its own units. */
const L = 4;
const W = 1;

/**
 * World → screen for the impossible view: looking along (1, 1, 1), turned so the triangle
 * stands on its base. z grows away from the viewer.
 */
function view([x, y, z]: Vec3): Vec3 {
  const sx = (-x + z) / Math.SQRT2;
  const sy = (-x + 2 * y - z) / Math.sqrt(6);
  return [-sy, sx, -(x + y + z) / Math.sqrt(3)];
}

/**
 * Samples the visible faces and edges of the three beams as seen from the impossible view,
 * keeping only points nothing nearer hides (a small z-buffer), so the joints overlap the way
 * the classic drawing does. Also returns the light loop's corners in the same frame.
 */
function sampleTriangle(surface: number, flow: number) {
  // Beams along x, then y, then z, each as [min, max] corners.
  const boxes: [Vec3, Vec3][] = [
    [[0, 0, 0], [L + W, W, W]],
    [[L, 0, 0], [L + W, L + W, W]],
    [[L, L, 0], [L + W, L + W, L + W]],
  ];
  // Faces turned towards the viewer (+x, +y, +z) as [axis, brightness, tone]: the +y face reads
  // as the lit top of each beam, the other two as its sides in light and shade.
  const shading: [number, number][] = [[0.6, 0.5], [1.0, 0.9], [0.3, 0.1]];
  const faces: { lo: Vec3; hi: Vec3; axis: number; area: number }[] = [];
  const edges: { a: Vec3; b: Vec3; length: number }[] = [];
  for (const [lo, hi] of boxes) {
    for (let axis = 0; axis < 3; axis++) {
      const [e1, e2] = [0, 1, 2].filter((a) => a !== axis);
      faces.push({ lo, hi, axis, area: (hi[e1] - lo[e1]) * (hi[e2] - lo[e2]) });
      // The face's four borders become bright edge lines.
      for (const [run, fix] of [[e1, e2], [e2, e1]]) {
        for (const at of [lo[fix], hi[fix]]) {
          const a: Vec3 = [...lo];
          a[axis] = hi[axis];
          a[fix] = at;
          const b: Vec3 = [...a];
          b[run] = hi[run];
          edges.push({ a, b, length: hi[run] - lo[run] });
        }
      }
    }
  }
  // Area- and length-weighted picks, so long beams are as dense as short end caps.
  const pick = <T,>(items: T[], weight: (t: T) => number) => {
    const sum = items.reduce((s, t) => s + weight(t), 0);
    return () => {
      let r = Math.random() * sum;
      for (const t of items) if ((r -= weight(t)) <= 0) return t;
      return items[items.length - 1];
    };
  };
  const face = pick(faces, (f) => f.area);
  const edge = pick(edges, (e) => e.length);
  const cand: { p: Vec3; shade: number; tone: number }[] = [];
  for (let n = 0; n < surface * 2.4; n++) {
    if (Math.random() < 0.28) {
      const { a, b } = edge();
      const u = Math.random();
      cand.push({ p: view([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]), shade: 1.1, tone: 0.95 });
    } else {
      const { lo, hi, axis } = face();
      const p: Vec3 = [lo[0] + Math.random() * (hi[0] - lo[0]), lo[1] + Math.random() * (hi[1] - lo[1]), lo[2] + Math.random() * (hi[2] - lo[2])];
      p[axis] = hi[axis];
      const [shade, tone] = shading[axis];
      cand.push({ p: view(p), shade, tone });
    }
  }

  // Hidden-surface removal on a grid: keep points within a hair of the nearest depth.
  const cell = W / 14;
  const nearest = new Map<number, number>();
  const key = (p: Vec3) => Math.round(p[0] / cell) * 100003 + Math.round(p[1] / cell);
  for (const c of cand) nearest.set(key(c.p), Math.min(nearest.get(key(c.p)) ?? Infinity, c.p[2]));
  const shown = (c: (typeof cand)[number]) => c.p[2] <= nearest.get(key(c.p))! + W * 0.06;
  const kept = cand.filter(shown);
  const hidden = cand.filter((c) => !shown(c));

  // Centre in all three axes (so a tilt pivots in place) and scale to ~1.75 units tall.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const { p } of kept) {
    minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
    minZ = Math.min(minZ, p[2]); maxZ = Math.max(maxZ, p[2]);
  }
  const k = 1.75 / (maxY - minY);
  const [cx, cy, cz] = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
  const fit = ([x, y, z]: Vec3): Vec3 => [(x - cx) * k, (y - cy) * k, (z - cz) * k];

  const shape = new Float32Array((surface + flow) * 3);
  const meta = new Float32Array((surface + flow) * 3);
  // Light first, so it survives the adaptive-quality cut (which drops from the end): packets
  // of particles with bright heads and fading tails, spread evenly round the loop.
  const packets = 9;
  for (let i = 0; i < flow; i++) {
    const tail = Math.pow(Math.random(), 1.6);
    shape.set([(Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, 0], i * 3);
    meta.set([1.25 * (1 - tail) + 0.1, ((i % packets) / packets - tail * 0.04 + 1) % 1, 1], i * 3);
  }
  // Most points draw the impossible view; the rest fill in what it hides, shown only when the
  // pointer tilts the triangle so the beams never have holes.
  for (let i = 0; i < surface; i++) {
    const back = hidden.length > 0 && Math.random() < 0.22;
    const list = back ? hidden : kept;
    const c = list[(Math.random() * list.length) | 0];
    shape.set(fit(c.p), (flow + i) * 3);
    meta.set([c.shade, back ? -2 : -1, c.tone], (flow + i) * 3);
  }

  // The loop runs near each beam's front ridge; its last corner sits exactly behind its first
  // along the line of sight, which is what makes it look endless.
  const o = W * 0.45;
  const corners: Vec3[] = [
    [W / 2 + o, W / 2 + o, W / 2 + o],
    [L + W / 2 + o, W / 2 + o, W / 2 + o],
    [L + W / 2 + o, L + W / 2 + o, W / 2 + o],
    [L + W / 2 + o, L + W / 2 + o, L + W / 2 + o],
  ];
  return { shape, meta, path: corners.map((p) => fit(view(p))) };
}

function buildGeometry(count: number) {
  const flow = Math.round(count * 0.07);
  const { shape, meta, path } = sampleTriangle(count - flow, flow);
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
  return { shape, meta, path, star, ring, rand };
}

/**
 * Creates its own canvas inside `host`: a context that has been lost cannot be revived, and
 * getContext() on the same element returns the dead one, so every start gets a fresh element.
 */
export function startField(
  host: HTMLElement,
  opts: { accent: string; reduced: boolean; read: () => FieldState },
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
  const geo = buildGeometry(count);

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
  attr("aMeta", geo.meta, 3);

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
    tilt: u("uTilt"),
  };
  gl.uniform3fv(U.accent, hexToRgb(opts.accent));
  gl.uniform3fv(U.cool, [0, 0.639, 1.0]);
  geo.path.forEach((p, i) => gl.uniform3fv(u(`uPath${i}`), p));
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let aspect = 1;
  const view = { ox: 0, oy: 0 };
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
    // Desktop: the triangle sits in the right half beside the headline. Phone: lower,
    // behind the text, scaled to the screen width.
    const wide = w >= 1024;
    // The shape is 2 units wide; scale so it spans ~31% of the screen (85% on phones).
    [view.ox, view.oy] = wide ? [(0.56 * aspect) / 0.81, 0.06] : [0, -0.58];
    gl.uniform2f(U.offset, view.ox, view.oy);
    gl.uniform1f(U.scale, wide ? (0.62 * aspect) / (2 * 0.81) : Math.min(0.62, (1.7 * aspect) / (2 * 0.81)));
    // On phones the triangle and the contact ring overlap the copy, so they stay a backdrop.
    gl.uniform1f(U.dim, wide ? 1 : 0.32);
  };
  resize();

  // Pointer, smoothed. Its offset from the triangle tilts it, revealing the trick.
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  const tilt = { x: 0, y: 0 };
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
    // Lean with the pointer while it is active, then settle back into the impossible view.
    const cx = (view.ox * 0.81) / aspect;
    const cy = view.oy * 0.81;
    const tx = opts.reduced ? 0 : Math.max(-1, Math.min(1, (mouse.x - cx) * 1.5)) * 0.35 * mouse.energy;
    const ty = opts.reduced ? 0 : Math.max(-1, Math.min(1, (mouse.y - cy) * 1.5)) * -0.28 * mouse.energy;
    tilt.x += (tx - tilt.x) * 0.06;
    tilt.y += (ty - tilt.y) * 0.06;

    const s = opts.read();
    gl.uniform1f(U.time, time);
    gl.uniform1f(U.scatter, s.scatter);
    gl.uniform1f(U.ring, s.ring);
    gl.uniform1f(U.scroll, s.scrollY);
    gl.uniform1f(U.pointer, opts.reduced ? 0 : mouse.energy);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform2f(U.tilt, tilt.x, tilt.y);
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
