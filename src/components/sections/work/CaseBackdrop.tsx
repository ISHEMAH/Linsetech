"use client";
/**
 * Puture's `.case-backdrop` (their ShotCanvas + press chunks): the home space in a fixed, non-pinned canvas behind a
 * case study. One of three frames is picked by what sits at mid-screen:
 *  - "ring" while the hero is there: Puture's "horizon" (a far grid wall tilted 82°, a loose ring of tiles to the right);
 *  - "away" for the long body: the same camera, the tiles retired into the grid (all formations off, exhibit 1);
 *  - "foot" once the closing (contact) section reaches mid-screen: horizon panned to .74 with a big front ring of
 *    tiles (ring 4.4 at y .9, tilt 6, scale 1.6, pace .14).
 * A change tweens from wherever the scene is to the new frame in 2.6 s (smoothstep), on the clock, never through a
 * frame in between; the camera sways on the clock too (Puture's ShotCanvas sway). Our night/green palette.
 */
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { cn } from "@/lib/cn";
import { useContextRecovery } from "@/components/three/useContextRecovery";
import CanvasBoundary from "@/components/three/CanvasBoundary";
import { CANVAS_CAMERA, DEFAULTS, Space, SpaceBackdrop, frame, type Sample, type Sampler, type SpaceParams } from "@/components/three/WorkSpace";

const HORIZON: Partial<SpaceParams> = {
  light: 0, roll: 0, grid: 1, ringFace: 0, ringY: 0,
  tgtX: 2.6, tgtY: 1.8, tgtZ: -4, azim: -6, elev: 3, dist: 12, fov: 44, pan: 0.4, sky: -0.85,
  gX: 3, gY: 0.5, gZ: -12, pitch: 82, yaw: 14, spin: -10, wave: 1, flow: 2, dust: 0.6,
  orbit: 1, ring: 3.9, ringTilt: 30, ringDepth: 1, ringScale: 0.68, ringPace: 0.07,
};
/** portrait: the target drops, the ring comes to the front (Puture's horizon mobile overrides; ringY back to 0 over the halo preset's) */
const HORIZON_MOBILE: Partial<SpaceParams> = { pan: 0, panY: -0.4, ring: 5.8, ringY: 0, ringTilt: 6, ringScale: 1.4, ringFront: 1 };
/** Puture's `Xt`: every formation off, the tiles sink into the grid */
const RETIRE: Partial<SpaceParams> = { orbit: 0, drift: 0, settle: 0, board: 0, stream: 0, rise: 0, row: 0, exhibit: 1, raised: 0 };
/** Puture's `en` (the contact frame) */
const FOOT: Partial<SpaceParams> = { pan: 0.74, panY: 0.25, ring: 4.4, ringY: 0.9, ringTilt: 6, ringScale: 1.6, ringFront: 1, ringPace: 0.14, sky: 0.35 };
const FOOT_MOBILE: Partial<SpaceParams> = { ...HORIZON_MOBILE, ringY: 0.9, ringPace: 0.14, panY: -0.43, ringScale: 1.6, sky: -0.45 };

type FrameKey = "ring" | "away" | "foot";

function frames(mobile: boolean): Record<FrameKey, SpaceParams> {
  const m = mobile ? HORIZON_MOBILE : false;
  return {
    ring: frame("halo", HORIZON, m),
    away: frame("halo", { ...HORIZON, ...RETIRE }, m),
    foot: frame("halo", { ...HORIZON, ...FOOT }, mobile ? FOOT_MOBILE : false),
  };
}

const TWEEN = 2.6;
const KEYS = Object.keys(DEFAULTS) as (keyof SpaceParams)[];
const smooth = (e: number) => e * e * (3 - 2 * e);

/** Puture's ShotCanvas tween: from the live frame to the target in 2.6 s, smoothstep; the tiles stagger on its progress. */
class FrameTween implements Sampler {
  from: SpaceParams;
  to: SpaceParams;
  live: SpaceParams;
  t = 1;
  constructor(start: SpaceParams) {
    this.from = { ...start };
    this.to = start;
    this.live = { ...start };
  }
  target(f: SpaceParams) {
    if (f === this.to) return;
    this.from = { ...this.live };
    this.to = f;
    this.t = 0;
  }
  advance(dt: number) {
    this.t = Math.min(1, this.t + dt / TWEEN);
    const e = smooth(this.t);
    for (const k of KEYS) this.live[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
  }
  sample(_screens: number, out: SpaceParams, info: Sample) {
    Object.assign(out, this.live);
    info.from = this.from;
    info.to = this.to;
    info.t = this.t;
    info.drift = 0;
    info.dir = 1;
    info.way = 0;
  }
}

type Side = { tween: FrameTween; frames: Record<FrameKey, SpaceParams> };

/** Advances both tweens toward the frame picked by scroll, before the Space samples; `atFootRef` once "foot" has mostly arrived. */
function Driver({ targetRef, desktop, mobile, atFootRef }: { targetRef: RefObject<FrameKey>; desktop: Side; mobile: Side; atFootRef: RefObject<boolean> }) {
  useFrame(({ size }, delta) => {
    const key = targetRef.current ?? "ring";
    const dt = Math.min(delta, 0.05);
    desktop.tween.target(desktop.frames[key]);
    mobile.tween.target(mobile.frames[key]);
    desktop.tween.advance(dt);
    mobile.tween.advance(dt);
    const side = size.height > size.width * 1.15 ? mobile : desktop;
    atFootRef.current = side.tween.to === side.frames.foot && smooth(side.tween.t) > 0.6;
  }, -2);
  return null;
}

/** The case tint (page.tsx TINT): alpha by distance above its bottom edge, in vh. */
const TINT_STOPS: [number, number][] = [[90, 0.84], [76, 0.78], [60, 0.64], [44, 0.45], [28, 0.26], [13, 0.1], [0, 0]];
function tintAt(y: number) {
  const r = document.querySelector("[data-case-tint]")?.getBoundingClientRect();
  if (!r || y < r.top || y > r.bottom) return 0;
  const d = (r.bottom - y) / (window.innerHeight / 100);
  if (d >= TINT_STOPS[0][0]) return TINT_STOPS[0][1];
  for (let i = 1; i < TINT_STOPS.length; i++) {
    const [v0, a0] = TINT_STOPS[i - 1];
    const [v1, a1] = TINT_STOPS[i];
    if (d >= v1) return a1 + ((a0 - a1) * (d - v1)) / (v0 - v1);
  }
  return 0;
}
const linear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const NIGHT_LUM = 0.0025;
/** the logo box on the header line (Nav samples behind the logo at 40px) */
const PROBE = { x: 16, y: 18, w: 104, h: 30 };

/**
 * Renders the frame itself (priority 1) so it can read back the pixels behind the header logo, a few times a second
 * while the "foot" frame is up. Its glow and band drift with the sky, so the header theme follows what is actually
 * there: html[data-scene-top="light"] (the case page's themed markers only show then) once the space, seen through
 * what is left of the tint, is bright enough for ink type, back to "dark" below that (with some hysteresis), and a
 * "headertheme" event each time.
 */
function HeaderProbe({ atFootRef }: { atFootRef: RefObject<boolean> }) {
  const buf = useRef<Uint8Array>(new Uint8Array(0));
  const state = useRef({ last: 0, light: false });
  useFrame(({ gl, scene, camera, size }) => {
    gl.render(scene, camera);
    const s = state.current;
    const now = performance.now();
    let light = s.light;
    if (!atFootRef.current) light = false;
    else if (now - s.last > 250) {
      s.last = now;
      const ctx = gl.getContext();
      const dpr = gl.getPixelRatio();
      const w = Math.round(PROBE.w * dpr);
      const h = Math.round(PROBE.h * dpr);
      if (buf.current.length < w * h * 4) buf.current = new Uint8Array(w * h * 4);
      const px = buf.current;
      ctx.readPixels(Math.round(PROBE.x * dpr), Math.round((size.height - PROBE.y - PROBE.h) * dpr), w, h, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
      // a sparse 1-in-3 grid over the logo box is plenty
      let sum = 0;
      let n = 0;
      for (let row = 0; row < h; row += 3)
        for (let col = 0; col < w; col += 3) {
          const i = (row * w + col) * 4;
          sum += 0.2126 * linear(px[i]) + 0.7152 * linear(px[i + 1]) + 0.0722 * linear(px[i + 2]);
          n++;
        }
      const a = tintAt(PROBE.y + PROBE.h / 2);
      const lum = (n ? sum / n : 0) * (1 - a) + NIGHT_LUM * a;
      // ink beats white type above ~0.2 (Nav uses the same threshold for its gradients)
      if (lum > 0.24) light = true;
      else if (lum < 0.17) light = false;
    }
    if (light !== s.light || document.documentElement.dataset.sceneTop === undefined) {
      s.light = light;
      document.documentElement.dataset.sceneTop = light ? "light" : "dark";
      window.dispatchEvent(new Event("headertheme"));
    }
  }, 1);
  return null;
}

export default function CaseBackdrop({ hero = ".case-hero", foot = "[data-case-foot]" }: { hero?: string; foot?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const target = useRef<FrameKey>("ring");
  const atFoot = useRef(false);
  const screens = useRef(0);
  const [running, setRunning] = useState(true);
  const [ready, setReady] = useState(false);
  const [generation, watchContext] = useContextRecovery();
  const desktop = useMemo(() => {
    const f = frames(false);
    return { frames: f, tween: new FrameTween(f.ring) };
  }, []);
  const mobile = useMemo(() => {
    const f = frames(true);
    return { frames: f, tween: new FrameTween(f.ring) };
  }, []);

  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const h = document.querySelector(hero)?.getBoundingClientRect();
      const f = document.querySelector(foot)?.getBoundingClientRect();
      target.current = h && h.top <= mid && h.bottom >= mid ? "ring" : f && f.top <= mid ? "foot" : "away";
      // stop rendering once the page (and its clip) has scrolled away, or the tab is hidden
      const box = wrap.current?.parentElement?.getBoundingClientRect();
      setRunning(!document.hidden && (!box || box.bottom > 0));
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(pick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
      delete document.documentElement.dataset.sceneTop;
    };
  }, [hero, foot]);

  return (
    <div ref={wrap} className="pointer-events-none fixed inset-0 z-0 bg-[#020a07]" aria-hidden>
      <CanvasBoundary>
        <Canvas
          key={generation}
          dpr={[1, 1.5]}
          flat
          frameloop={running ? "always" : "never"}
          camera={CANVAS_CAMERA}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ background: "#020a07" }}
          className={cn("transition-opacity duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none", ready ? "opacity-100" : "opacity-0")}
          onCreated={(state) => {
            watchContext(state);
            // the error check reads each program's compile log at once, forcing a blocking compile (60–100 ms frames)
            state.gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
            requestAnimationFrame(() => setReady(true));
          }}
        >
          <Driver targetRef={target} desktop={desktop} mobile={mobile} atFootRef={atFoot} />
          <HeaderProbe atFootRef={atFoot} />
          <Space timeline={desktop.tween} mobileTimeline={mobile.tween} screensRef={screens} sway="time">
            <SpaceBackdrop env={1.2} />
          </Space>
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
