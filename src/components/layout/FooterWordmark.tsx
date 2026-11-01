"use client";
import { useEffect, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  GLSL3,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  RawShaderMaterial,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/*
 * Port of Sharplink's footer wordmark (their ThreeLogoCanvas + SiteFooter, read from the Nuxt bundle). Their TSL node
 * graph is rewritten as one GLSL fragment shader on a plain WebGLRenderer. Colours go through the same pipeline as
 * theirs (measured on sharplink.com): `fog` is an sRGB colour, `dark`/`light` are raw values taken as linear, and the
 * result is premultiplied in linear space and then sRGB-encoded.
 */

/** Their packed_texture.png: 2864 × 504; the word's ink spans x 48…2808, its ascender tops sit at y ≈ 72. */
const TEX_W = 2864;
const TEX_H = 504;
/**
 * How far above the baseline the texture is cut. Theirs is ~73px (their word is ~73px taller than the texture), which
 * on "Linsetech" removes the capital L's whole foot (~62px) and reads "Iinsetech"; even a half cut leaves the foot in
 * the shader's bottom fade. Uncut, the L reads and still dissolves at the bottom; the word sits ~36px higher than theirs.
 */
const BASELINE_CUT = 0;
const INK_LEFT = 48;
const INK_RIGHT = 2808;
const INK_TOP = 72;
/** Archivo 500 with -0.038em tracking reproduces their stems (72px), x-height (y 211) and letter gaps at this width. */
const TRACK_EM = -0.038;
/** Their green channel: dashes ~4px long and ~3px wide, every ~11.8px along the outline. */
const DOT_WIDTH = 3;
const DOT_LENGTH = 4;
const DOT_GAP = 7.8;

const MOBILE_MAX = 800; // their runtimeConfig breakpoints.mobile
const GRID = { desktop: [0.25, 0.15], mobile: [0.3, 0.2] } as const;
const LENS = { desktop: 0.2, mobile: 0.35 } as const;
const HALF = { desktop: 35, mobile: 17.5 } as const;
const SWEEP_SPEED = 0.5;
const SWEEP_Y = 0.15;
const GRID_REFRESH_MS = 200;

export type WordmarkColors = { fog: string; dark: string; light: string };
/**
 * Sharplink's fog #002e60, dark #09101a and light #dbeafd re-hued like the footer gradient (web/tools/bg/recolor.py:
 * OKLCH, same lightness and chroma, hue 262° → 151°, spread .35), applied to the colour each one is displayed as.
 */
export const WORDMARK_GREEN: WordmarkColors = { fog: "#013a14", dark: "#0a120a", light: "#dceedd" };

const VERT = /* glsl */ `
in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
precision highp int;
uniform sampler2D uTex;
uniform vec2 uRes;      // canvas size in CSS px
uniform vec2 uTexSize;
uniform vec2 uLens;     // lens centre, canvas uv
uniform float uRadius;  // lens radius, in canvas widths
uniform float uHalf;    // vertex square half size, CSS px
uniform vec2 uV0;       // vertices: x in canvas heights, y in canvas uv
uniform vec2 uV1;
uniform vec2 uV2;
uniform vec3 uFog;      // linear
uniform vec3 uDark;     // raw
uniform vec3 uLight;    // raw
uniform vec2 uDirs[6];  // hashBlur directions: cos/sin(degrees(i / 6 * 360)) (three r179)
in vec2 vUv;
out vec4 outColor;

const float PI = 3.141592653589793;

// three's TSL rand()
float rand(vec2 co) {
  return fract(sin(mod(dot(co, vec2(12.9898, 78.233)), PI)) * 43758.5453);
}
// WGSL smoothstep (defined for reversed edges)
float sstep(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
// three's hashBlur with 6 taps
vec4 hashBlur(vec2 uv, float amount) {
  vec4 acc = vec4(0.0);
  for (int i = 0; i < 6; i++) {
    vec2 q = uDirs[i] * (rand(vec2(float(i), uv.x + uv.y)) + amount);
    acc += texture(uTex, uv + q * amount);
  }
  return acc / 6.0;
}
vec2 segment(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a, ap = p - a;
  float t = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
  return vec2(length(ap - ab * t), t);
}
float boxLine(vec2 p, vec2 c, vec2 h, float lw, float px) {
  vec2 d = abs(p - c);
  float sd = length(max(d - h, 0.0)) + min(max(d.x - h.x, d.y - h.y), 0.0);
  return sstep(lw + px, lw, abs(sd));
}
float dashLine(vec2 s, float len, float lw, float px) {
  return sstep(lw + px, lw, s.x) * step(0.5, fract(s.y * len * 100.0));
}
vec3 encodeSRGB(vec3 c) {
  return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  float fit = aspect / (uTexSize.x / uTexSize.y);
  vec2 tuv = vec2(uv.x, uv.y / fit);
  bool inside = tuv.x >= 0.0 && tuv.x <= 1.0 && tuv.y >= 0.0 && tuv.y <= 1.0;
  vec2 safeUv = clamp(tuv, 0.0, 1.0);

  float blur = clamp(1.0 - tuv.y * 3.5, 0.0, 1.0) * 0.008;
  vec4 solid = vec4(vec3(1.0), hashBlur(safeUv, blur).r);
  vec4 dotted = vec4(vec3(1.0), hashBlur(safeUv, blur * 0.1).g);

  float dist = length((uv - uLens) / vec2(1.0, aspect));
  float lens = 1.0 - pow(sstep(0.0, uRadius, dist), 3.0);
  vec4 glyph = mix(solid, dotted, lens);
  float alpha = inside ? glyph.a : 0.0;
  vec4 word = vec4(mix(uDark, uLight, sstep(0.0, 1.0, tuv.y)) * glyph.a, alpha);

  vec2 p = vec2(uv.x * aspect, uv.y);
  float px = 1.0 / uRes.y;
  float lw = px * 0.2;
  float lines = max(max(
    dashLine(segment(p, uV0, uV1), length(uV1 - uV0), lw, px),
    dashLine(segment(p, uV1, uV2), length(uV2 - uV1), lw, px)),
    dashLine(segment(p, uV2, uV0), length(uV0 - uV2), lw, px)) * 0.4 * (1.0 - uv.y);
  vec2 halfSize = vec2(uHalf / uRes.y);
  float boxes = max(max(boxLine(p, uV0, halfSize, lw, px), boxLine(p, uV1, halfSize, lw, px)), boxLine(p, uV2, halfSize, lw, px)) * 0.4 * (1.0 - uv.y);
  float overlay = max(lines, boxes);

  vec4 composed = vec4(vec3(overlay) + word.rgb * (1.0 - overlay), overlay + word.a * (1.0 - overlay));
  vec4 color = clamp(mix(vec4(uFog, 0.8), composed, pow(tuv.y, 0.7)), 0.0, 1.0);
  outColor = vec4(encodeSRGB(color.rgb * color.a), color.a);
}`;

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const fract = (v: number) => v - Math.floor(v);

/**
 * Their packed texture, drawn at runtime: red = the solid word, green = its dotted outline, on opaque black. The ink is
 * placed like theirs (first/last half-covered columns at 48/2808, top row at 72) and the texture ends `cut` px above the
 * baseline (theirs: ~73px, which makes it 504px tall).
 */
export function packWord(word: string, family: string, cut = BASELINE_CUT) {
  const chars = Array.from(word);
  const scratch = document.createElement("canvas");
  const sctx = scratch.getContext("2d", { willReadFrequently: true })!;
  // glyph by glyph (ctx.letterSpacing is missing in older Safari); prefix widths keep the kerning
  const advances = (size: number) => {
    sctx.font = `500 ${size}px ${family}`;
    return chars.map((_, i) => sctx.measureText(chars.slice(0, i).join("")).width + i * TRACK_EM * size);
  };
  // the ink box, scanned from pixels (WebKit's measureText has no horizontal ink metrics); x from the pen, y from the baseline
  const ink = (size: number) => {
    const xs = advances(size);
    const pad = Math.ceil(size * 0.25);
    const w = Math.ceil(xs[xs.length - 1] + size * 1.5 + pad * 2);
    const h = Math.ceil(size * 1.5);
    scratch.width = w;
    scratch.height = h;
    sctx.font = `500 ${size}px ${family}`;
    sctx.fillStyle = "#fff";
    chars.forEach((ch, i) => sctx.fillText(ch, pad + xs[i], size));
    const d = sctx.getImageData(0, 0, w, h).data;
    let left = w;
    let right = -1;
    let top = h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (d[(y * w + x) * 4 + 3] > 127) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
        }
    return { xs, left: left - pad, right: right - pad, top: top - size };
  };
  const probe = ink(300);
  let size = (300 * (INK_RIGHT - INK_LEFT)) / (probe.right - probe.left);
  const box = ink(size);
  const k = (INK_RIGHT - INK_LEFT) / (box.right - box.left);
  size *= k;
  const xs = box.xs.map((x) => x * k);
  const dx = INK_LEFT - box.left * k;
  const baseline = INK_TOP - box.top * k;
  scratch.width = scratch.height = 1;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = Math.max(1, Math.round(baseline - cut));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `500 ${size}px ${family}`;
  // additive so the two channels never erase each other
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#f00";
  chars.forEach((ch, i) => ctx.fillText(ch, xs[i] + dx, baseline));
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = DOT_WIDTH;
  ctx.lineCap = "butt";
  ctx.setLineDash([DOT_LENGTH, DOT_GAP]);
  chars.forEach((ch, i) => ctx.strokeText(ch, xs[i] + dx, baseline));
  return canvas;
}

type MountOptions = {
  word: string;
  colors: WordmarkColors;
  /** the element listening to the pointer (Sharplink: the whole <footer>) */
  pointerArea: HTMLElement;
  labels: (HTMLElement | null)[];
  reduced: boolean;
  /** a ready-made packed texture (R = word, G = dotted outline) instead of drawing `word` */
  source?: HTMLCanvasElement | HTMLImageElement;
};

/** Creates the canvas inside `host` and runs it; returns a disposer. */
export function mountWordmark(host: HTMLElement, opts: MountOptions) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none";
  host.prepend(canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
  } catch {
    return drawFallback(canvas, host, opts);
  }
  renderer.setClearColor(0x000000, 0);

  const [fr, fg, fb] = rgb(opts.colors.fog).map(toLinear);
  const uniforms = {
    uTex: { value: null as CanvasTexture | null },
    uRes: { value: new Vector2(1, 1) },
    uTexSize: { value: new Vector2(TEX_W, TEX_H) },
    uLens: { value: new Vector2(-1, -1) },
    uRadius: { value: LENS.desktop as number },
    uHalf: { value: HALF.desktop as number },
    uV0: { value: new Vector2(0.5, 0.1) },
    uV1: { value: new Vector2(0.5, 0.1) },
    uV2: { value: new Vector2(0.5, 0.1) },
    uFog: { value: new Vector3(fr, fg, fb) },
    uDark: { value: new Vector3(...rgb(opts.colors.dark)) },
    uLight: { value: new Vector3(...rgb(opts.colors.light)) },
    uDirs: {
      value: Array.from({ length: 6 }, (_, i) => {
        const a = ((i / 6) * 360 * 180) / Math.PI;
        return new Vector2(Math.cos(a), Math.sin(a));
      }),
    },
  };
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new RawShaderMaterial({ glslVersion: GLSL3, vertexShader: VERT, fragmentShader: FRAG, uniforms, blending: NoBlending, depthTest: false, depthWrite: false });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // pointer target, lerped lens, the three nearest-cell vertices and their wobbled positions
  const res = uniforms.uRes.value;
  const target = new Vector2(-1, -1);
  const lens = uniforms.uLens.value;
  const cells = [new Vector2(-0.5, 0.1), new Vector2(-0.5, 0.1), new Vector2(-0.5, 0.1)];
  const verts = [uniforms.uV0.value, uniforms.uV1.value, uniforms.uV2.value];
  let mobile = window.innerWidth < MOBILE_MAX;
  let lastGrid = 0;
  let ready = false;
  let inView = false;
  let running = false;
  let disposed = false;

  const applyMode = () => {
    uniforms.uRadius.value = mobile ? LENS.mobile : LENS.desktop;
    uniforms.uHalf.value = mobile ? HALF.mobile : HALF.desktop;
    if (mobile) target.set(-0.2, SWEEP_Y);
  };
  applyMode();

  // the 2nd–4th nearest cell centres around a point (x in canvas heights)
  const nearest = (x: number, y: number, cw: number, ch: number) => {
    const ix = Math.floor(x / cw);
    const iy = Math.floor(y / ch);
    const list: { x: number; y: number; d: number }[] = [];
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const cx = (ix + i + 0.5) * cw;
        const cy = (iy + j + 0.5) * ch;
        list.push({ x: cx, y: cy, d: Math.hypot(cx - x, cy - y) });
      }
    list.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 3; k++) cells[k].set(list[k + 1].x, list[k + 1].y);
  };

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    const x = target.x * (res.x / res.y || 1);
    if (!mobile && x >= 0 && target.y >= 0) nearest(x, target.y, GRID.desktop[0], GRID.desktop[1]);
  };

  const render = () => {
    if (ready && !disposed) renderer.render(scene, camera);
  };

  const frame = (seconds: number, deltaMs: number) => {
    const time = seconds * 1000;
    const dt = Math.min(deltaMs, 100);
    const aspect = res.x / res.y || 1;
    if (mobile) {
      target.x += dt * 0.001 * SWEEP_SPEED;
      if (target.x > 1.5) {
        target.x = -0.5;
        lens.x = -0.5;
      }
      target.y = SWEEP_Y;
      if (time - lastGrid > GRID_REFRESH_MS) {
        lastGrid = time;
        nearest(target.x * aspect, target.y, GRID.mobile[0], GRID.mobile[1]);
      }
    }
    lens.lerp(target, Math.min(1, dt * 0.001 * 7));
    const [cw, ch] = mobile ? GRID.mobile : GRID.desktop;
    const phase = time * 0.0013;
    for (let k = 0; k < 3; k++) {
      const c = cells[k];
      const ix = Math.round(c.x / cw - 0.5);
      const iy = Math.round(c.y / ch - 0.5);
      const h1 = fract(Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453);
      const h2 = fract(Math.sin(ix * 269.5 + iy * 183.3) * 43758.5453);
      verts[k].set(c.x + 0.08 * cw * Math.sin(phase + h1 * 6.2831), c.y + 0.04 * ch * Math.sin(phase * 1.3 + h2 * 6.2831));
    }
    const half = uniforms.uHalf.value;
    for (let k = 0; k < 3; k++) {
      const el = opts.labels[k];
      if (!el) continue;
      const x = verts[k].x / aspect;
      const y = verts[k].y;
      const lx = Math.round(Math.min(100, Math.max(0, x * 100)));
      const ly = Math.round(Math.min(100, Math.max(0, y * 100)));
      el.style.transform = `translate(${x * res.x - half}px, ${(1 - y) * res.y - half}px)`;
      el.style.opacity = String(ly <= 30 ? 0.6 : ly >= 80 ? 0 : Math.max(0, 0.6 * (1 - (ly - 30) / 30)));
      const text = `${lx}, ${ly}`;
      if (el.textContent !== text) el.textContent = text;
    }
    render();
  };

  const sync = () => {
    const should = ready && inView && !opts.reduced && !disposed;
    if (should && !running) gsap.ticker.add(frame);
    if (!should && running) gsap.ticker.remove(frame);
    running = should;
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h, false);
    res.set(w, h);
    const m = window.innerWidth < MOBILE_MAX;
    if (m !== mobile) {
      mobile = m;
      applyMode();
    }
    if (!running) render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  });
  io.observe(host);
  if (!opts.reduced) opts.pointerArea.addEventListener("pointermove", onPointer);
  for (const el of opts.labels) if (el) el.style.opacity = "0";

  const build = async () => {
    let source = opts.source;
    if (!source) {
      const family = getComputedStyle(host).fontFamily;
      try {
        await document.fonts.load(`500 100px ${family}`, opts.word);
        await document.fonts.ready;
      } catch {
        /* draw with whatever face is available */
      }
      source = packWord(opts.word, family);
    }
    if (disposed) return;
    const texture = new CanvasTexture(source as HTMLCanvasElement);
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    uniforms.uTex.value = texture;
    uniforms.uTexSize.value.set(source.width, source.height);
    ready = true;
    resize();
    render();
    sync();
  };
  build();

  return () => {
    disposed = true;
    sync();
    ro.disconnect();
    io.disconnect();
    opts.pointerArea.removeEventListener("pointermove", onPointer);
    uniforms.uTex.value?.dispose();
    material.dispose();
    geometry.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}

/** No WebGL: the solid word with the shader's static gradient, drawn once in 2D. */
function drawFallback(canvas: HTMLCanvasElement, host: HTMLElement, opts: MountOptions) {
  let disposed = false;
  const paint = async () => {
    const family = getComputedStyle(host).fontFamily;
    await document.fonts?.ready;
    if (disposed) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx || !w || !h) return;
    const packed = opts.source ?? packWord(opts.word, family);
    const th = (w / packed.width) * packed.height;
    const mask = document.createElement("canvas");
    mask.width = packed.width;
    mask.height = packed.height;
    const m = mask.getContext("2d")!;
    m.drawImage(packed, 0, 0);
    const img = m.getImageData(0, 0, mask.width, mask.height);
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i + 3] = img.data[i];
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    }
    m.putImageData(img, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.drawImage(mask, 0, h - th, w, th);
    ctx.globalCompositeOperation = "source-in";
    const g = ctx.createLinearGradient(0, h - th, 0, h);
    g.addColorStop(0, opts.colors.light);
    g.addColorStop(1, opts.colors.fog);
    ctx.fillStyle = g;
    ctx.fillRect(0, h - th, w, th);
  };
  paint();
  return () => {
    disposed = true;
    canvas.remove();
  };
}

/**
 * The footer wordmark (Sharplink .wordmark-placeholder): full width, 1440/269, with the canvas 200px taller and
 * anchored at the bottom. A lens following the pointer over the whole footer swaps the solid word for its dotted outline,
 * with three blueprint vertices (squares, dashed edges, live "x, y" labels) on the nearest grid cells; phones sweep the
 * lens by themselves. The block rises 200px → 0 over the last screen (scrub .8, linear), like theirs. Its parent is the
 * scroll trigger (their .wordmark-wrapper).
 */
export default function FooterWordmark({ word, colors = WORDMARK_GREEN }: { word: string; colors?: WordmarkColors }) {
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = root.current;
    const host = layer.current;
    if (!el || !host) return;
    const reduced = prefersReducedMotion();
    const destroy = mountWordmark(host, { word, colors, labels: labels.current, reduced, pointerArea: el.closest("footer") ?? el });
    let tl: gsap.core.Timeline | undefined;
    let st: ScrollTrigger | undefined;
    if (!reduced) {
      // Sharplink: timeline.set(y: 200).to(y: 0) scrubbed from the wrapper's "top bottom" to "bottom bottom"
      tl = gsap.timeline({ paused: true }).set(host, { y: 200 }).to(host, { y: 0, ease: "none", duration: 0.5 });
      st = ScrollTrigger.create({ animation: tl, trigger: el.parentElement ?? el, start: "top bottom", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true });
    }
    return () => {
      st?.kill();
      tl?.kill();
      gsap.set(host, { clearProps: "transform" });
      destroy();
    };
  }, [word, colors]);

  return (
    <div ref={root} aria-hidden className="relative z-[5] aspect-[1440/269]">
      {/* the canvas box: 200px taller than the placeholder, bottom-anchored; clipped at the footer's bottom edge so the
          rise never adds scrollable overflow below the page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[calc(100%+200px)] overflow-hidden">
        <div ref={layer} className="absolute inset-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(n) => {
                labels.current[i] = n;
              }}
              className="pointer-events-none absolute left-0 top-0 flex h-[35px] w-[35px] items-end whitespace-nowrap px-[3px] py-px font-narrow text-[9px] font-normal uppercase leading-[1.4] tracking-[1.04px] text-white opacity-0 will-change-[transform,opacity] min-[800px]:h-[70px] min-[800px]:w-[70px] min-[800px]:px-[5px] min-[800px]:py-[2px] min-[800px]:text-[12px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
