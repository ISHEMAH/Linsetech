/**
 * Puture's "pixel wave" route transition (their navigation chunk, measured): a full-screen canvas of 12 px cells.
 * Each cell's start is its distance from the click point (85 %) plus noise (15 %), spread over 0.5 s; a cell then
 * grows from 35 % to 100 % of its size in 0.34 s (cubic out) while it flashes the accent at a third of its run.
 * Leaving: the wave covers the page from the click point, then the route changes. Arriving: the page mounts under
 * the cover; once its fonts are in (at most 200 ms) and two frames have painted, the wave clears from the centre.
 * Puture's arrival is a full page load, which keeps the screen dark for ~.9 s; ours is a client route change, so the
 * cover is held for at least HOLD after it closed (and until the shared curtain behind it has gone).
 * In-page jumps (an anchor on the same page) cover → jump → clear with the same cells, from the click point.
 * Colours are ours: night #020a07, accent #22c55e.
 */
import { getLenis } from "@/lib/lenis";
import { ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

const CELL = 12;
const SPREAD = 0.5;
const RUN = 0.34;
const NIGHT = [2, 10, 7];
const ACCENT = [34, 197, 94];
/** the dark hold between "covered" and "start clearing" on a route change (Puture's recorded hold is ~.9 s) */
const HOLD = 800;
/** never wait longer than this for the arriving page to settle */
const SETTLE_MAX = 1600;
const WATCHDOG = 8000;

type Grid = { w: number; h: number; cols: number; order: Float32Array };
type Layer = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; w: number; h: number };
type Pending = Layer & { href: string; watchdog: number; covered: number };

let pending: Pending | null = null;
let busy = false;

const easeOut = (e: number) => 1 - (1 - e) ** 3;
const clamp01 = (e: number) => Math.min(1, Math.max(0, e));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, Math.max(0, ms)));

function grid(w: number, h: number, from: { x: number; y: number }): Grid {
  const cols = Math.ceil(w / CELL);
  const rows = Math.ceil(h / CELL);
  const ox = from.x / CELL;
  const oy = from.y / CELL;
  const far = Math.hypot(Math.max(ox, cols - ox), Math.max(oy, rows - oy));
  const order = new Float32Array(cols * rows);
  for (let i = 0; i < order.length; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    order[i] = Math.min(1, 0.85 * (Math.hypot(x + 0.5 - ox, y + 0.5 - oy) / far) + 0.15 * Math.random());
  }
  return { w, h, cols, order };
}

/** One frame; returns true while some cell is still moving. */
function draw(ctx: CanvasRenderingContext2D, g: Grid, t: number, cover: boolean) {
  ctx.clearRect(0, 0, g.w, g.h);
  let moving = false;
  for (let i = 0; i < g.order.length; i++) {
    const c = clamp01((t - g.order[i] * SPREAD) / RUN);
    if (c < 1) moving = true;
    const l = cover ? easeOut(c) : 1 - easeOut(c);
    if (l <= 0.01) continue;
    const flash = c > 0 && c < 1 ? Math.max(0, 1 - Math.abs(c - 0.3) / 0.3) * 0.55 : 0;
    const r = NIGHT[0] + (ACCENT[0] - NIGHT[0]) * flash;
    const gg = NIGHT[1] + (ACCENT[1] - NIGHT[1]) * flash;
    const b = NIGHT[2] + (ACCENT[2] - NIGHT[2]) * flash;
    const s = CELL * (0.35 + 0.65 * l);
    const x = (i % g.cols) * CELL + (CELL - s) / 2;
    const y = Math.floor(i / g.cols) * CELL + (CELL - s) / 2;
    ctx.fillStyle = `rgba(${r | 0}, ${gg | 0}, ${b | 0}, ${Math.min(1, l * 1.15).toFixed(3)})`;
    ctx.fillRect(x, y, s + 0.5, s + 0.5);
  }
  return moving;
}

function play(ctx: CanvasRenderingContext2D, g: Grid, cover: boolean) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const moving = draw(ctx, g, t, cover);
      if (!moving || t > SPREAD + RUN + 0.1) {
        if (cover) {
          ctx.fillStyle = `rgb(${NIGHT.join(" ")})`;
          ctx.fillRect(0, 0, g.w, g.h);
          // while held, the element itself is night too: a canvas bitmap can be dropped under load (the arriving page
          // spins up its WebGL), and the hold must never flash the page behind it
          ctx.canvas.style.background = `rgb(${NIGHT.join(" ")})`;
        } else ctx.clearRect(0, 0, g.w, g.h);
        resolve();
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function layer(filled: boolean): Layer {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", zIndex: "1000", pointerEvents: "auto" });
  const block = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  canvas.addEventListener("wheel", block, { passive: false });
  canvas.addEventListener("touchmove", block, { passive: false });
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (filled) {
    ctx.fillStyle = `rgb(${NIGHT.join(" ")})`;
    ctx.fillRect(0, 0, w, h);
    canvas.style.background = `rgb(${NIGHT.join(" ")})`;
  }
  document.body.appendChild(canvas);
  return { canvas, ctx, w, h };
}

const center = (l: Layer) => ({ x: l.w / 2, y: l.h / 2 });

/**
 * Jump to an in-page anchor under the cover (Lenis + native), then re-measure the triggers. A pinned chapter (beats in
 * screens on `[data-in]`) is entered a quarter of the way into its first beat, like Puture's `rl`, so its title is
 * already there when the wave clears.
 */
export function jumpTo(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const el = id ? document.getElementById(id) : null;
  let y = el ? el.getBoundingClientRect().top + window.scrollY : 0;
  const beats = el ? [...el.querySelectorAll<HTMLElement>("[data-in]")].filter((b) => Number.isFinite(Number(b.dataset.in))) : [];
  if (beats.length) {
    const first = beats.reduce((a, b) => (Number(b.dataset.in) < Number(a.dataset.in) ? b : a));
    const from = Number(first.dataset.in);
    const to = Number(first.dataset.out ?? from + 1);
    y += (from + (to - from) * 0.25) * window.innerHeight;
  }
  const lenis = getLenis();
  lenis?.start();
  lenis?.scrollTo(y, { immediate: true, force: true });
  window.scrollTo(0, y);
  ScrollTrigger.refresh();
}

async function clear(l: Layer, before?: () => void, g?: Grid) {
  before?.();
  const run = play(l.ctx, g ?? grid(l.w, l.h, center(l)), false);
  // the first uncover frame is drawn before the solid backing goes, so nothing shows through in between
  requestAnimationFrame(() => requestAnimationFrame(() => (l.canvas.style.background = "")));
  await run;
  l.canvas.remove();
}

/** The shared pale curtain (PageTransition) also runs on a route change; clear only once it has faded out behind us. */
function curtainUp() {
  const c = document.getElementById("page-transition");
  return !!c && parseFloat(getComputedStyle(c).opacity) > 0.02;
}

/** Leave for `href`: cover from the click point, then navigate (the arriving page calls `waveArrive`). */
export async function waveTo(href: string, from: { x: number; y: number } | null, navigate: (href: string) => void) {
  if (prefersReducedMotion() || busy) {
    if (!busy) navigate(href);
    return;
  }
  busy = true;
  getLenis()?.stop();
  const l = layer(false);
  await play(l.ctx, grid(l.w, l.h, from ?? center(l)), true);
  const watchdog = window.setTimeout(() => {
    // the route never mounted a wave-aware page: uncover anyway
    if (pending?.canvas !== l.canvas) return;
    pending = null;
    getLenis()?.start();
    clear(l).finally(() => (busy = false));
  }, WATCHDOG);
  pending = { ...l, href, watchdog, covered: performance.now() };
  navigate(href);
}

/**
 * Called by wave-aware pages on mount: once the new page has its fonts (≤200 ms) and two painted frames, and the cover
 * has been held for HOLD, jump to its hash and clear from the centre.
 */
export function waveArrive() {
  const p = pending;
  if (!p) return;
  pending = null;
  window.clearTimeout(p.watchdog);
  const arrived = performance.now();
  Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(200)])
    .then(frame)
    .then(frame)
    .then(() => wait(HOLD - (performance.now() - p.covered)))
    .then(async () => {
      while (curtainUp() && performance.now() - arrived < SETTLE_MAX) await frame();
    })
    .then(() =>
      clear(p, () => {
        if (window.location.hash) jumpTo(window.location.hash);
      }),
    )
    .catch(() => p.canvas.remove())
    .finally(() => {
      busy = false;
    });
}

/** Same page: cover from the click point, run `between` (a jump), clear with the same cells. */
export async function waveJump(between: () => void, from: { x: number; y: number } | null) {
  if (prefersReducedMotion() || busy) {
    if (!busy) between();
    return;
  }
  busy = true;
  getLenis()?.stop();
  const l = layer(false);
  const g = grid(l.w, l.h, from ?? center(l));
  await play(l.ctx, g, true);
  between();
  await frame();
  await clear(l, undefined, g);
  getLenis()?.start();
  busy = false;
}

/** A page opened directly on an anchor (Puture's arrival on `/#work`): start covered, jump after 350 ms, clear. */
export function waveLanding(hash: string) {
  if (pending || busy || !hash) return;
  if (prefersReducedMotion()) {
    window.setTimeout(() => jumpTo(hash), 350);
    return;
  }
  busy = true;
  const l = layer(true);
  window.setTimeout(() => {
    clear(l, () => jumpTo(hash)).finally(() => (busy = false));
  }, 350);
}

export const wavePending = () => pending !== null;
