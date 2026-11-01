"use client";
/**
 * Puture's "space" (their SpaceScene) ported to R3F in the Linsetech green palette.
 *
 * One parameter set drives everything: the camera (target, azimuth, elevation, distance, pan), the grid sheet
 * (position, tilt, wave, curl, flow), the sky bands, the dust and the twelve icon tiles (which blend between
 * formations: orbit ring, drift, settled on the grid, board, stream, rise, conveyor row, hidden "exhibit").
 * A scroll timeline samples the parameters per frame: each mark is held, then the values tween over the last
 * 2.2 screens before the next mark (`TWEEN_SCREENS`). The live values damp toward the sampled ones, and while
 * a mark is held the camera slowly orbits and dollies in (`wobble`), alternating direction per mark.
 */
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import Env from "./Env";

/* ------------------------------------------------------------------------------------------------ parameters */

export type SpaceParams = {
  tgtX: number; tgtY: number; tgtZ: number; azim: number; elev: number; dist: number; roll: number; fov: number; pan: number; panY: number;
  light: number; sky: number;
  gX: number; gY: number; gZ: number; pitch: number; yaw: number; spin: number; curl: number; wave: number; flow: number; grid: number; extent: number;
  dust: number; rush: number;
  ring: number; ringY: number; ringTilt: number; ringDepth: number; ringScale: number; ringFace: number; ringFront: number; ringPace: number;
  orbit: number; drift: number; settle: number; board: number; stream: number; rise: number; row: number; exhibit: number; raised: number;
};

export const DEFAULTS: SpaceParams = {
  tgtX: 0, tgtY: 1.5, tgtZ: -3, azim: 0, elev: 6, dist: 12, roll: 0, fov: 40, pan: 0, panY: 0,
  light: 0, sky: 0,
  gX: 0, gY: -1, gZ: -6, pitch: 0, yaw: 0, spin: 0, curl: 0, wave: 0.6, flow: 0, grid: 1, extent: 1,
  dust: 0.3, rush: 0,
  ring: 3.4, ringY: 0, ringTilt: 22, ringDepth: 0.62, ringScale: 1, ringFace: 0, ringFront: 0, ringPace: 0.07,
  orbit: 0, drift: 0, settle: 0, board: 0, stream: 0, rise: 0, row: 0, exhibit: 0, raised: 0,
};
const KEYS = Object.keys(DEFAULTS) as (keyof SpaceParams)[];
export const MODES = ["orbit", "drift", "settle", "board", "stream", "rise", "row", "exhibit"] as const;
export type Mode = (typeof MODES)[number];

const P = (o: Partial<SpaceParams>): SpaceParams => ({ ...DEFAULTS, ...o });

/** Puture's camera/grid presets (names kept so the timelines read like theirs). */
export const PRESETS = {
  halo: P({ tgtX: 0, tgtY: 1.6, tgtZ: 0, azim: 6, elev: 4, dist: 11, roll: -2, fov: 42, sky: -0.6, gX: 0, gY: 1.6, gZ: -7, pitch: 90, spin: 18, wave: 1.1, flow: 2, grid: 0, dust: 1, orbit: 1, ring: 4.4, ringTilt: 84, ringFace: 1 }),
  plan: P({ tgtX: 0, tgtY: -2, tgtZ: -2, azim: 12, elev: 58, dist: 14, sky: -1.6, gX: 0, gY: -2, gZ: -2, wave: 0.4, settle: 1 }),
  white: P({ tgtX: 0, tgtY: -0.5, tgtZ: -3, azim: -16, elev: 26, dist: 14, light: 1, sky: -1.6, gX: 0, gY: -1.5, gZ: -3, wave: 0.5, dust: 0.15, settle: 1 }),
  valley: P({ tgtX: 1.5, tgtY: 1.4, tgtZ: -8, azim: 10, elev: 5, dist: 10, fov: 42, pan: 0.3, light: 1, sky: -1.6, gX: 0, gY: -1.4, gZ: -8, curl: 0.24, wave: 0.7, flow: 5, dust: 0.15, drift: 1 }),
  board: P({ tgtX: 1.5, tgtY: 2.15, tgtZ: -7, azim: 8, elev: 7, dist: 12.5, pan: 0.32, light: 1, sky: -1.6, gX: 1.5, gY: 1.4, gZ: -7, pitch: 90, yaw: -20, wave: 0.35, dust: 0.15, board: 1 }),
  ship: P({ tgtX: 0, tgtY: 1, tgtZ: -30, azim: 4, elev: 2, dist: 30, fov: 44, pan: 0.22, sky: 0.2, gX: 0, gY: -2, gZ: -10, wave: 0.4, grid: 0, dust: 1, rush: 1, stream: 1 }),
  launch: P({ tgtX: 0, tgtY: 2.5, tgtZ: -10, azim: 6, elev: 12, dist: 15, fov: 42, sky: -0.3, gX: 0, gY: -2, gZ: -10, wave: 0.6, flow: 3, dust: 0.5, rise: 1 }),
  conveyor: P({ tgtX: 0, tgtY: 1.2, tgtZ: -6, azim: 48, elev: 20, dist: 12.5, sky: -0.8, gX: 0, gY: -1, gZ: -7, pitch: 58, yaw: 32, wave: 0.4, flow: 3, row: 1 }),
};
export type PresetName = keyof typeof PRESETS;

/** Portrait-viewport adjustments per preset (the target moves up, nothing is panned sideways). */
const MOBILE: Record<PresetName, Partial<SpaceParams>> = {
  halo: { pan: 0, panY: 0.55, roll: 0, ring: 2.4, ringTilt: 18, ringY: 0.4 },
  plan: { pan: 0 },
  white: { pan: 0, panY: -0.3 },
  valley: { pan: 0, panY: 0.5 },
  board: { pan: 0, panY: 0.55, dist: 14 },
  ship: { pan: 0, panY: 0.45 },
  launch: { pan: 0, panY: 0.5 },
  conveyor: { pan: 0, panY: 0.7, azim: -28, elev: 30, dist: 15 },
};

/** A full parameter frame: preset + overrides, plus the mobile overrides when building the portrait timeline. */
export function frame(name: PresetName, over: Partial<SpaceParams> = {}, mobile: Partial<SpaceParams> | false = false): SpaceParams {
  return { ...PRESETS[name], ...over, ...(mobile ? { ...MOBILE[name], ...mobile } : {}) };
}

/** Puture's `L`: the dark variant of the light presets. */
export const DARK: Partial<SpaceParams> = { light: 0, sky: -1.15, dust: 0.6 };
/** The frame two chapters meet on: the Work floor ends on it and the Process chapter opens on it. */
export const handoffFrame = (mobile: boolean) => frame("white", DARK, mobile ? {} : false);

/** Wall clock and window pointer shared by every canvas, so two chapters render the same frame where they meet. */
const now = () => performance.now() / 1000;
/**
 * Puture's pointer state (their `pointer` chunk): position, whether a fine pointer has moved at all, and whether it is
 * "open" — over the scene rather than over text, links or cards. Hover raycasts (exhibits, tiles, grid focus) only run
 * while it is open, so a pointer resting on copy does not light up what lies behind it.
 */
const POINTER = { x: 0, y: 0, clientX: 0, clientY: 0, fine: true, open: false, moved: false };
const POINTER_BLOCK = "a, button, input, select, textarea, label, p, h1, h2, h3, li, dt, dd, article, [data-pointer-block]";
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") {
        POINTER.fine = false;
        POINTER.open = false;
        return;
      }
      POINTER.x = (e.clientX / window.innerWidth) * 2 - 1;
      POINTER.y = -(e.clientY / window.innerHeight) * 2 + 1;
      POINTER.clientX = e.clientX;
      POINTER.clientY = e.clientY;
      POINTER.fine = e.pointerType === "mouse" || e.pointerType === "pen";
      POINTER.moved = true;
      POINTER.open = !(e.target instanceof Element && e.target.closest(POINTER_BLOCK));
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    POINTER.open = false;
  });
}

/** Forget the pointer until it moves again: the state outlives client-side navigation, so coming Back to a chapter
 *  hovered whatever lay under the old position (with the pointer off the page, on the browser's Back button). */
export function forgetPointer() {
  POINTER.moved = false;
  POINTER.open = false;
}

/** The shared pointer in `el`'s normalized device coordinates, or false when no fine pointer is resting over the scene there. */
export function canvasPointer(el: HTMLElement, out: THREE.Vector2) {
  if (!POINTER.moved || !POINTER.fine || !POINTER.open) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  out.set(((POINTER.clientX - r.left) / r.width) * 2 - 1, -((POINTER.clientY - r.top) / r.height) * 2 + 1);
  if (Math.abs(out.x) > 1 || Math.abs(out.y) > 1) return false;
  // the canvas must be what the pointer is actually over: a canvas clipped by its sticky frame, or covered by a later
  // section, still reports the same rect (text and panels above it with pointer events don't count either, as on Puture)
  const top = document.elementFromPoint(POINTER.clientX, POINTER.clientY);
  return top === el;
}

/* -------------------------------------------------------------------------------------------------- timeline */

/** A camera move takes the last 2.2 screens before its mark; the mark is held for the rest of its span. */
export const TWEEN_SCREENS = 2.2;
const tweenEase = (e: number) => e * 0.7 + e * e * (3 - 2 * e) * 0.3;
const clamp01 = (e: number) => Math.min(1, Math.max(0, e));
const smooth = (e: number) => e * e * (3 - 2 * e);
const step = (a: number, b: number, x: number) => smooth(clamp01((x - a) / (b - a)));
const hash = (e: number) => {
  const t = Math.sin(e * 127.1 + 311.7) * 43758.5453;
  return t - Math.floor(t);
};
const damp = THREE.MathUtils.damp;
const DEG = Math.PI / 180;

export type Mark = { at: number; frame: SpaceParams };
export type Sample = { from: SpaceParams; to: SpaceParams; t: number; drift: number; dir: number; way: number };
/** Anything that fills the parameters for a scroll position: a scroll timeline, or a time-driven tween (case pages). */
export type Sampler = { sample(screens: number, out: SpaceParams, info: Sample): void };

export class SpaceTimeline implements Sampler {
  private marks: { top: number; frame: SpaceParams; dir: number }[];

  constructor(marks: Mark[]) {
    const sorted = [...marks].sort((a, b) => a.at - b.at);
    let acc: SpaceParams = { ...DEFAULTS };
    this.marks = [];
    for (const m of sorted) {
      const prev = this.marks[this.marks.length - 1];
      const turn = prev ? (m.frame.azim ?? acc.azim) - acc.azim : 0;
      // the held-camera orbit alternates direction from mark to mark unless the azimuth itself swings
      const dir = Math.abs(turn) > 1 ? Math.sign(turn) : prev ? -prev.dir : 1;
      acc = { ...acc, ...m.frame };
      this.marks.push({ top: m.at, frame: acc, dir });
    }
    if (!this.marks.length) this.marks.push({ top: 0, frame: { ...DEFAULTS }, dir: 1 });
  }

  /** screens = scroll position in viewport heights; fills `out` and `info`. */
  sample(screens: number, out: SpaceParams, info: Sample) {
    const n = this.marks;
    const first = n[0];
    const last = n[n.length - 1];
    const hold = (m: (typeof n)[number], drift: number) => {
      info.from = m.frame; info.to = m.frame; info.t = 0; info.drift = drift; info.dir = m.dir; info.way = 0;
      Object.assign(out, m.frame);
    };
    if (screens <= first.top) return hold(first, 0);
    if (screens >= last.top) return hold(last, 0);
    let f = 0;
    while (f < n.length - 2 && n[f + 1].top <= screens) f++;
    const p = n[f];
    const m = n[f + 1];
    const h = Math.min(m.top - p.top, TWEEN_SCREENS);
    const g = m.top - h;
    const u = clamp01((screens - g) / Math.max(1e-6, h));
    const v = tweenEase(u);
    for (const k of KEYS) out[k] = p.frame[k] + (m.frame[k] - p.frame[k]) * v;
    info.from = p.frame; info.to = m.frame; info.t = u;
    info.drift = (Math.min(screens, g) - p.top) * (1 - v);
    info.dir = p.dir;
    info.way = clamp01((screens - p.top) / Math.max(1e-6, m.top - p.top));
  }
}

export type Wobble = { azim: number; elev: number; dolly: number; rise: number };

/** Puture's case-page sway (ShotCanvas): on the clock, not the page; dolly and rise halved in portrait. */
export function timeSway(t: number, mobile: boolean, out: Wobble) {
  const x = mobile ? 0.5 : 1;
  out.azim = Math.sin(t * 0.21) * 9;
  out.elev = Math.sin(t * 0.16 + 1) * 2.5;
  out.dolly = 1 + Math.sin(t * 0.19) * 0.05 * x;
  out.rise = Math.sin(t * 0.13) * 0.3 * x;
  return out;
}

/** The slow orbit + dolly-in while a mark is held, with a gentle sway tied to the page position. */
export function wobble(screens: number, drift: number, dir: number, mobile: boolean, out: Wobble) {
  const i = Math.min(drift, 7);
  const a = mobile ? 0.55 : 1;
  const o = mobile ? 1.6 : 1;
  out.azim = (i * dir * 3.2 + Math.sin(screens * 1.05) * 7 + Math.sin(screens * 0.43 + 1) * 5) * a;
  out.elev = (i * 0.5 + Math.sin(screens * 0.74 + 2) * 3) * o;
  out.dolly = (1 - i * 0.022) * (1 + Math.sin(screens * 0.84 + 0.5) * 0.06);
  out.rise = Math.sin(screens * 0.66) * 0.35 * o;
  return out;
}

/* ------------------------------------------------------------------------------------------------- live state */

export const CELL = 36 / 24; // grid cell in world units (36-unit sheet, 24 cells)
const TILE_LIFT = 0.15; // a tile lying on the grid: half its thickness plus a hair

export type SpaceState = {
  p: SpaceParams; // damped live values
  tgt: SpaceParams; // sampled this frame
  info: Sample;
  wob: Wobble;
  grid: THREE.Object3D; // the grid sheet's frame (position + tilt)
  travel: number; // grid flow along its z, in world units (wraps at 18)
  velocity: number; // scroll speed in screens/s, damped
  screens: number;
  snap: boolean;
  mobile: boolean;
  elapsed: number;
  pointer: THREE.Vector2; // damped pointer, -1..1
  last: THREE.Vector2; // pointer seen last frame
  energy: number; // recent pointer movement
  focus: { x: number; y: number; amp: number }; // grid cell under the pointer (cell units)
  spot: { index: number; amount: number; x: number; z: number; half: number }; // hovered exhibit's foot on the grid
  ringAngle: number;
  ringPace: number;
};

function createState(): SpaceState {
  return {
    p: { ...DEFAULTS }, tgt: { ...DEFAULTS }, info: { from: DEFAULTS, to: DEFAULTS, t: 0, drift: 0, dir: 1, way: 0 },
    wob: { azim: 0, elev: 0, dolly: 1, rise: 0 },
    grid: new THREE.Object3D(), travel: 0, velocity: 0, screens: 0, snap: true, mobile: false, elapsed: 0,
    pointer: new THREE.Vector2(), last: new THREE.Vector2(), energy: 0, focus: { x: 0.5, y: 0.5, amp: 0 }, spot: { index: -1, amount: 0, x: 0, z: 0, half: 0 },
    ringAngle: 0, ringPace: 0,
  };
}

const Ctx = createContext<SpaceState | null>(null);
export function useSpace() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSpace() needs a <Space> ancestor");
  return s;
}

/** A point on the (waving, curling) grid sheet, in world space. x/z are grid-local, lift is height above it. */
export function gridPoint(st: SpaceState, x: number, z: number, lift: number, out: THREE.Vector3) {
  const p = st.p;
  const h = Math.sin(st.elapsed * 0.9 + x * 0.22 + z * 0.18) * 0.45 * p.wave + lift;
  const o = (p.curl * Math.PI * 2) / 36;
  if (Math.abs(o) < 1e-4) out.set(x, h, z);
  else {
    const n = x * o;
    out.set(Math.sin(n) / o - Math.sin(n) * h, (1 - Math.cos(n)) / o + Math.cos(n) * h, z);
  }
  return out.applyMatrix4(st.grid.matrixWorld);
}

const _target = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisX = new THREE.Vector3(1, 0, 0);
const _qYaw = new THREE.Quaternion();
const _qPitch = new THREE.Quaternion();
const _qSpin = new THREE.Quaternion();
const _ray = new THREE.Raycaster();
const _plane = new THREE.Plane();
const _normal = new THREE.Vector3();
const _hit = new THREE.Vector3();

type SpaceProps = {
  timeline: Sampler;
  mobileTimeline?: Sampler;
  screensRef: RefObject<number>;
  /** "scroll": the held-mark orbit + sway tied to the page (chapters); "time": Puture's clock sway (case pages) */
  sway?: "scroll" | "time";
  children: ReactNode;
};

const _focusNdc = new THREE.Vector2();

/** Samples the timeline, damps the live parameters, moves the grid frame and places the camera (before everything else renders). */
export function Space({ timeline, mobileTimeline, screensRef, sway: swayMode = "scroll", children }: SpaceProps) {
  const st = useMemo(() => createState(), []);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;

  useEffect(() => {
    st.snap = true;
  }, [st, timeline, mobileTimeline]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const { size, gl } = state;
    const screens = screensRef.current ?? 0;
    st.elapsed = now();
    st.mobile = size.height > size.width * 1.15;
    (st.mobile && mobileTimeline ? mobileTimeline : timeline).sample(screens, st.tgt, st.info);

    if (st.snap) {
      Object.assign(st.p, st.tgt);
      st.screens = screens;
      st.velocity = 0;
    } else for (const k of KEYS) st.p[k] = damp(st.p[k], st.tgt[k], 3.2, dt);
    const raw = dt > 0 ? (screens - st.screens) / dt : 0;
    st.velocity = damp(st.velocity, THREE.MathUtils.clamp(raw, -4, 4), 6, dt);
    st.screens = screens;

    // grid frame + flow
    const p = st.p;
    st.grid.position.set(p.gX, p.gY, p.gZ);
    _qYaw.setFromAxisAngle(_axisY, p.yaw * DEG);
    _qPitch.setFromAxisAngle(_axisX, p.pitch * DEG);
    _qSpin.setFromAxisAngle(_axisY, p.spin * DEG);
    st.grid.quaternion.copy(_qYaw).multiply(_qPitch).multiply(_qSpin);
    st.grid.updateMatrixWorld(true);
    const anchored = Math.min(1, p.settle + p.board + p.exhibit);
    let travel = st.travel + (p.flow * 0.36 + st.velocity * 4.5 * (1 - anchored)) * dt;
    if (p.flow < 0.5 && Math.abs(st.velocity) < 0.05) travel = damp(travel, Math.round(travel / 3) * 3, 3, dt);
    st.travel = ((travel % 18) + 18) % 18;

    // pointer: parallax + grid focus
    st.energy = Math.min(1.5, st.energy * Math.exp(-dt * 0.8) + Math.hypot(POINTER.x - st.last.x, POINTER.y - st.last.y) * 4);
    st.last.set(POINTER.x, POINTER.y);
    st.pointer.x = damp(st.pointer.x, THREE.MathUtils.clamp(POINTER.x, -1, 1), 2, dt);
    st.pointer.y = damp(st.pointer.y, THREE.MathUtils.clamp(POINTER.y, -1, 1), 2, dt);

    // camera (Puture's Ly): orbit around the target, then pan via film offset / view offset
    if (swayMode === "time") timeSway(st.elapsed, st.mobile, st.wob);
    else wobble(window.scrollY / Math.max(1, size.height), st.info.drift, st.info.dir, st.mobile, st.wob);
    const w = st.wob;
    const t = st.elapsed;
    const portrait = Math.max(0, (1.2 * size.height) / Math.max(size.width, 1) - 1);
    // narrow landscape windows (≈1000×900): back off a little so the copy column clears the panel
    const narrow = THREE.MathUtils.clamp((1.5 - size.width / Math.max(size.height, 1)) / 0.4, 0, 1) * (1 - Math.min(1, portrait * 4));
    const sway = 1 + p.light * 1.6;
    const az = (p.azim + w.azim + st.pointer.x * 2.5 + Math.sin(t * 0.17) * sway * 1.4) * DEG;
    const el = Math.min(89, p.elev + w.elev + st.pointer.y * 1.5 + Math.sin(t * 0.23) * sway * 0.8) * DEG;
    const d = p.dist * w.dolly * (1 + portrait * 0.12 + narrow * 0.4) + Math.cos(t * 0.13) * sway * 0.2;
    _target.set(p.tgtX, p.tgtY + w.rise, p.tgtZ);
    camera.position.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)).multiplyScalar(d).add(_target);
    camera.lookAt(_target);
    camera.rotateZ(p.roll * DEG);
    const extra = Math.min(Math.abs(st.velocity), 3) * 0.8; // the view widens a little while scrolling fast
    const fov = (2 * Math.atan(Math.tan(((p.fov + extra) * DEG) / 2) * (1 + portrait * 0.35))) / DEG;
    const filmOffset = -(p.pan * Math.max(0, 1 - portrait)) * Math.tan((fov * DEG) / 2) * camera.aspect * camera.getFilmWidth();
    const offY = (p.panY * size.height) / 2;
    const view = camera.view?.enabled ? camera.view : null;
    const curY = view ? view.offsetY : 0;
    if ((view && (view.fullWidth !== size.width || view.fullHeight !== size.height)) || Math.abs(camera.fov - fov) > 0.01 || Math.abs(camera.filmOffset - filmOffset) > 0.001 || Math.abs(curY - offY) > 0.5) {
      camera.fov = fov;
      camera.filmOffset = filmOffset;
      if (Math.abs(offY) > 0.5) camera.setViewOffset(size.width, size.height, 0, offY, size.width, size.height);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();

    // the grid cell under the pointer lights up briefly while the pointer moves (only over the scene, not over copy)
    const over = canvasPointer(gl.domElement, _focusNdc);
    _ray.setFromCamera(_focusNdc, camera);
    _normal.set(0, 1, 0).applyQuaternion(st.grid.quaternion);
    _plane.setFromNormalAndCoplanarPoint(_normal, st.grid.position);
    const on = over && _ray.ray.intersectPlane(_plane, _hit) !== null;
    if (on) {
      st.grid.worldToLocal(_hit);
      const cx = Math.floor(_hit.x / CELL) + 0.5;
      const cy = Math.floor(-_hit.z / CELL + st.travel / CELL) + 0.5;
      const jump = Math.abs(cx - st.focus.x) > 3 || Math.abs(cy - st.focus.y) > 3;
      st.focus.x = jump ? cx : damp(st.focus.x, cx, 16, dt);
      st.focus.y = jump ? cy : damp(st.focus.y, cy, 16, dt);
    }
    st.focus.amp = damp(st.focus.amp, on && st.energy > 0.05 && st.spot.index < 0 ? p.grid : 0, 6, dt);
    st.snap = false;
  }, -1);

  return <Ctx.Provider value={st}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------------------------------------------ sky */

const SKY_VERT = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uLight;
  uniform float uPhase;
  uniform vec3 uFirst;
  uniform vec3 uSecond;
  uniform vec3 uThird;
  uniform vec3 uFirstLight;
  uniform vec3 uSecondLight;
  uniform vec3 uThirdLight;
  uniform vec3 uVia;
  varying vec3 vPosition;

  float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);
    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);
    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);
    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));
    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    return o4.y * d.y + o4.x * (1.0 - d.y);
  }
  mat2 rotate2D(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  void main() {
    vec3 p = vPosition * 0.03;
    float n = noise(p + uTime);
    vec2 uv = rotate2D(n) * p.xy * 0.05;
    // Between the dark and the white space the sky passes through a saturated accent instead of a flat grey
    // (Puture mixes in its #2F74FF; our night band colour is too dark for that, so the middle has its own green, mixed
    // in harder than Puture's .5 because a green over the grey midpoint reads muddier than their blue). The accent is
    // a deep green: a bright one flooded the whole screen in one flat colour, grid lines gone, and read as a flash.
    float l = smoothstep(0.15, 0.85, uLight);
    float via = sin(3.14159 * l) * 0.75;
    vec3 first = mix(mix(uFirst, uFirstLight, l), uVia, via);
    vec3 second = mix(uSecond, uSecondLight, l);
    vec3 third = mix(mix(uThird, uThirdLight, l), uVia, via);
    // One noise-twisted wave sets the bands: night for most of it, then the accent, then a soft light edge.
    float s = 0.5 + 0.5 * sin(uv.x * 25.0 + uPhase);
    vec3 col = mix(third, first, smoothstep(0.42, 0.78, s));
    col = mix(col, second, smoothstep(0.8, 0.99, s));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// R3F copies a `uniforms` prop into the material, so the shader materials are built here and mutated directly.
export function Sky() {
  const st = useSpace();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: {
          uTime: { value: 0 }, uLight: { value: 0 }, uPhase: { value: 0 },
          uFirst: { value: new THREE.Color("#15803d") }, uSecond: { value: new THREE.Color("#cdefd9") }, uThird: { value: new THREE.Color("#020a07") },
          uFirstLight: { value: new THREE.Color("#cdefd9") }, uSecondLight: { value: new THREE.Color("#fbfdf9") }, uThirdLight: { value: new THREE.Color("#e4efe7") },
          uVia: { value: new THREE.Color("#148a45") },
        },
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const geometry = useMemo(() => new THREE.SphereGeometry(64, 64, 32), []);
  useFrame(({ camera }) => {
    const u = material.uniforms;
    u.uTime.value = st.elapsed * 0.04;
    u.uLight.value = st.p.light;
    u.uPhase.value = st.p.sky;
    mesh.current?.position.copy(camera.position);
  });
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={-10} />;
}

/* --------------------------------------------------------------------------------------------------- lights */

export function SpaceLights({ env = 1 }: { env?: number }) {
  return (
    <>
      <Env intensity={env} green={0.5} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 6]} intensity={1.05} />
      <directionalLight position={[-6, 2, -2]} intensity={0.35} color="#9ff0c2" />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------------ grid */

const GRID_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uWave;
  uniform float uCurl;
  uniform float uSize;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float h = sin(uTime * 0.9 + p.x * 0.22 + p.z * 0.18) * 0.45 * uWave;
    vec3 q = vec3(p.x, h, p.z);
    float k = uCurl * 6.2831853 / uSize;
    if (abs(k) > 1e-4) {
      float a = p.x * k;
      q = vec3(sin(a) / k - sin(a) * h, (1.0 - cos(a)) / k + cos(a) * h, p.z);
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(q, 1.0);
  }
`;
const GRID_FRAG = /* glsl */ `
  uniform vec3 uLineDark;
  uniform vec3 uLineLight;
  uniform float uLight;
  uniform float uOpacity;
  uniform float uFlow;
  uniform float uCells;
  uniform float uCurl;
  uniform float uExtent;
  uniform vec2 uFocus;
  uniform float uFocusAmp;
  uniform vec3 uAccent;
  uniform vec2 uSpot;
  uniform float uSpotHalf;
  uniform float uSpotAmp;
  uniform float uTime;
  varying vec2 vUv;

  float sdPlus(vec2 p, float size, float thickness) {
    vec2 d = abs(p) - vec2(size, thickness);
    float h = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    d = abs(p) - vec2(thickness, size);
    float v = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    return min(h, v);
  }
  float grid(vec2 g) {
    vec2 f = fract(g);
    vec2 w = max(abs(dFdx(g)), abs(dFdy(g))) * 1.1;
    vec2 lines = abs(f - 0.5);
    vec2 aa = smoothstep(0.5 - w, 0.5 - w * 0.5, lines);
    return max(aa.x, aa.y);
  }

  void main() {
    vec2 g = (vUv - 0.5) * uCells;
    g.y += uFlow;
    float lineMask = grid(g);
    vec2 cell = floor(g / 2.0 + 0.5) * 2.0;
    float plus = 1.0 - smoothstep(0.0, max(fwidth(g.x), 0.01) * 1.2, sdPlus(g - cell, 0.2, 0.02));

    // Round fade on a full sheet; a curled sheet fades mostly at its ends.
    vec2 d = (vUv - 0.5) * 2.0;
    d.x *= 1.0 - clamp(uCurl, 0.0, 1.0) * 0.92;
    vec2 d4 = d * d * d * d;
    float r = mix(length(d), pow(d4.x + d4.y, 0.25), 1.0 - uExtent);
    float inner = uExtent * (0.3 + (1.0 - uExtent) * 0.7);
    float fade = 1.0 - smoothstep(inner, uExtent, r);

    vec3 color = mix(uLineDark, uLineLight, uLight);
    float lineAlpha = mix(0.4, 0.2, uLight);
    float plusAlpha = mix(0.9, 0.62, uLight);
    float a = max(lineMask * lineAlpha, plus * plusAlpha);

    // Pointer focus: the lines around the pointer take the accent before fading back.
    float near = (1.0 - smoothstep(0.7, 3.0, length(g - uFocus))) * uFocusAmp;
    color = mix(color, uAccent, near);
    a = max(a, lineMask * near * 0.7);

    // A hovered exhibit: the accent runs out along the lines from its foot, and a soft signal keeps travelling.
    if (uSpotAmp > 0.001) {
      vec2 q = (vUv - 0.5) * uCells - uSpot;
      float dist = length(vec2(max(abs(q.x) - uSpotHalf, 0.0), q.y));
      float reach = uSpotAmp * 4.5;
      float lit = (1.0 - smoothstep(reach - 2.2, reach, dist)) * uSpotAmp;
      float signal = exp(-pow((dist - mod(uTime * 1.6, 6.0)) * 1.8, 2.0)) * smoothstep(0.7, 1.0, uSpotAmp);
      float on = max(lit, signal * 0.8);
      color = mix(color, uAccent, on);
      a = max(a, max(lineMask, plus) * on * 0.9);
    }
    gl_FragColor = vec4(color, a * fade * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function GridSheet() {
  const st = useSpace();
  const mesh = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(36, 36, 144, 144);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
        uniforms: {
          uTime: { value: 0 }, uWave: { value: 0 }, uCurl: { value: 0 }, uSize: { value: 36 }, uCells: { value: 24 }, uExtent: { value: 1 },
          uFocus: { value: new THREE.Vector2() }, uFocusAmp: { value: 0 }, uAccent: { value: new THREE.Color("#22c55e") },
          uSpot: { value: new THREE.Vector2() }, uSpotHalf: { value: 0 }, uSpotAmp: { value: 0 }, uFlow: { value: 0 }, uLight: { value: 0 }, uOpacity: { value: 1 },
          uLineDark: { value: new THREE.Color("#86efac") }, uLineLight: { value: new THREE.Color("#0f5132") },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const p = st.p;
    const uniforms = material.uniforms;
    m.position.copy(st.grid.position);
    m.quaternion.copy(st.grid.quaternion);
    uniforms.uTime.value = st.elapsed;
    uniforms.uWave.value = p.wave;
    uniforms.uCurl.value = p.curl;
    uniforms.uExtent.value = p.extent;
    uniforms.uFocus.value.set(st.focus.x, st.focus.y);
    uniforms.uFocusAmp.value = st.focus.amp;
    uniforms.uSpot.value.set(st.spot.x / CELL, -st.spot.z / CELL);
    uniforms.uSpotHalf.value = st.spot.half / CELL;
    uniforms.uSpotAmp.value = st.spot.amount * p.grid;
    uniforms.uLight.value = p.light;
    uniforms.uFlow.value = st.travel / CELL;
    uniforms.uOpacity.value = p.grid;
    m.visible = p.grid > 0.005;
  });
  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------------------------------------------ dust */

const DUST_COUNT = 1800;
const DUST_BOX = new THREE.Vector3(26, 15, 26);
const DUST_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uProj;
  uniform float uSize;
  uniform float uTravel;
  uniform vec3 uCenter;
  uniform vec3 uBox;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += uTime * (0.04 + aSeed * 0.06);
    p.x += sin(uTime * 0.1 + aSeed * 30.0) * 0.5;
    p.z += uTravel;
    // Wrap into a box around the camera so the field never runs out, fading near the box walls.
    vec3 d = mod(p - uCenter + uBox, 2.0 * uBox) - uBox;
    vec4 mv = modelViewMatrix * vec4(uCenter + d, 1.0);
    float depth = max(-mv.z, 0.5);
    vec3 e = abs(d) / uBox;
    float edge = 1.0 - smoothstep(0.6, 1.0, max(e.x, max(e.y, e.z)));
    vAlpha = edge * (0.35 + aSeed * 0.65);
    gl_PointSize = uSize * uProj / depth;
    gl_Position = projectionMatrix * mv;
  }
`;
const DUST_FRAG = /* glsl */ `
  uniform vec3 uDark;
  uniform vec3 uLight;
  uniform float uLightMix;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.25, 0.5, d)) * vAlpha * uOpacity;
    gl_FragColor = vec4(mix(uDark, uLight, uLightMix), a);
    #include <colorspace_fragment>
  }
`;

export function Dust() {
  const st = useSpace();
  const travel = useRef(0);
  const geometry = useMemo(() => {
    const pos = new Float32Array(DUST_COUNT * 3);
    const seed = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      const t = 17 + i * 4;
      pos[i * 3] = (hash(t) * 2 - 1) * DUST_BOX.x;
      pos[i * 3 + 1] = (hash(t + 1) * 2 - 1) * DUST_BOX.y;
      pos[i * 3 + 2] = (hash(t + 2) * 2 - 1) * DUST_BOX.z;
      seed[i] = hash(t + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: {
          uTime: { value: 0 }, uProj: { value: 1 }, uSize: { value: 0.07 }, uTravel: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uBox: { value: DUST_BOX },
          uDark: { value: new THREE.Color("#cdefd9") }, uLight: { value: new THREE.Color("#22c55e") }, uLightMix: { value: 0 }, uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  useFrame(({ camera, size, gl }, delta) => {
    const dt = Math.min(delta, 0.05);
    travel.current += st.p.rush * 2.2 * dt;
    const cam = camera as THREE.PerspectiveCamera;
    const uniforms = material.uniforms;
    uniforms.uTime.value = st.elapsed;
    uniforms.uProj.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan((cam.fov * Math.PI) / 360));
    // the scroll part of the drift is tied to the page position, so two canvases agree where they meet
    uniforms.uTravel.value = travel.current + (6.5 * window.scrollY) / Math.max(1, size.height);
    uniforms.uCenter.value.copy(camera.position);
    uniforms.uLightMix.value = st.p.light;
    uniforms.uOpacity.value = st.p.dust * (1 - st.p.light * 0.45);
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ----------------------------------------------------------------------------------------------------- tiles */

/** Twelve line icons (24-unit box), stroked white on the tile face. */
const ICONS = [
  "M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 9v9M4 7.5l8 4.5 8-4.5",
  "m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14",
  "m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5",
  "M4 20V10M10 20V4M16 20v-7M22 20H2",
  "M2 9c6-5 14-5 20 0M5.5 13c4-3 9-3 13 0M9 17c2-1.5 4-1.5 6 0M12 20h.01",
  "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z",
  "M4 5h16v11H9l-5 4V5Z",
  "M4 4h16v16H4V4Zm0 8h16M12 4v16",
  "M3 5h18v5H3V5Zm0 9h18v5H3v-5ZM7 7.5h.01M7 16.5h.01",
  "M6 11h12v9H6v-9Zm3 0V7a3 3 0 0 1 6 0v4",
  "M6 18 18 6M8 6h10v10",
];
const TILE_COUNT = ICONS.length;
/** Where the tiles settle on the grid, in cells. */
const SETTLE: [number, number][] = [[-4, -3], [-1, -4], [2, -3], [4, -1], [-3, 0], [0, -1], [3, 2], [-5, 2], [1, 2], [-2, 4], [4, 4], [-1, 1]];

function faceTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 256, 256, 0);
  g.addColorStop(0, "#0b3d2e");
  g.addColorStop(0.5, "#22c55e");
  g.addColorStop(0.85, "#b9f5cf");
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function iconTexture(path: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.scale(256 / 24, 256 / 24);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(path));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

type Placement = { p: THREE.Vector3; q: THREE.Quaternion; scale: number; show: number };
const _pl: Placement = { p: new THREE.Vector3(), q: new THREE.Quaternion(), scale: 1, show: 1 };
const _lb = new THREE.Vector3();
const _ub = new THREE.Vector3();
const _ob = new THREE.Quaternion();
const _sb = new THREE.Quaternion();
const _db = new THREE.Object3D();
const _fb = new THREE.Vector3(); // orbit look target (camera, lowered)
const _eu = new THREE.Euler();
const _vb = new THREE.Vector3(); // view direction from the parameters
const _yb = new THREE.Vector3(); // nominal camera position from the parameters
const _bb = new THREE.Vector3();
const _xb = new THREE.Vector3();
const _flat = new THREE.Quaternion().setFromAxisAngle(_axisX, -Math.PI / 2);
const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _hop = new THREE.Quaternion();
const _toCam = new THREE.Vector3();

function viewBasis(p: SpaceParams) {
  const az = p.azim * DEG;
  const el = p.elev * DEG;
  _vb.set(-Math.cos(el) * Math.sin(az), -Math.sin(el), -Math.cos(el) * Math.cos(az));
  _yb.set(p.tgtX, p.tgtY, p.tgtZ).addScaledVector(_vb, -p.dist);
}

function onGrid(st: SpaceState, x: number, z: number, out: Placement) {
  gridPoint(st, x, z, TILE_LIFT, out.p);
  out.q.copy(st.grid.quaternion).multiply(_flat);
}

/** Where tile n sits in a given formation (Puture's Db). */
function place(st: SpaceState, mode: Mode, n: number, out: Placement) {
  const p = st.p;
  const t = st.elapsed;
  const r = (k: number) => hash(n * 11 + k);
  out.scale = 1;
  out.show = 1;
  _lb.set(p.tgtX, p.tgtY, p.tgtZ);
  switch (mode) {
    case "exhibit": {
      const [x, z] = SETTLE[n % SETTLE.length];
      onGrid(st, (x + 0.5) * CELL, (z + 0.5) * CELL, out);
      out.show = 0;
      break;
    }
    case "orbit": {
      _lb.y += p.ringY;
      const a = (n / TILE_COUNT) * Math.PI * 2 + st.ringAngle;
      _ob.setFromAxisAngle(_axisX, p.ringTilt * DEG);
      _ub.set(Math.cos(a) * p.ring, Math.sin(t * 0.7 + n * 1.3) * 0.2, Math.sin(a) * p.ring * p.ringDepth);
      out.p.copy(_ub.applyQuaternion(_ob)).add(_lb);
      _db.position.copy(out.p);
      _db.lookAt(_fb);
      _sb.copy(_db.quaternion);
      _db.lookAt(_lb);
      _db.rotateY(Math.PI);
      out.q.copy(_db.quaternion).slerp(_sb, p.ringFace);
      const edge = step(0, 0.08, p.ringFace) * step(0, 0.08, 1 - p.ringFace);
      const front = p.ringFront * step(-0.35, 0.1, -Math.sin(a));
      out.scale = p.ringScale * (1 - edge * step(0.9, 1, -Math.sin(a))) * (1 - front);
      break;
    }
    case "drift":
      out.p.set(
        _lb.x + (r(1) - 0.5) * 13 + Math.sin(t * 0.17 + n) * 0.5,
        _lb.y + (r(2) - 0.35) * 5.5 + Math.sin(t * 0.23 + n * 2.1) * 0.35,
        _lb.z + (r(3) - 0.5) * 11 + Math.cos(t * 0.14 + n * 2.7) * 0.5,
      );
      out.q.setFromEuler(_eu.set((r(4) - 0.5) * 0.7 + Math.sin(t * 0.15 + n) * 0.15, (r(5) - 0.5) * 1 + Math.sin(t * 0.12 + n * 1.7) * 0.2, Math.sin(t * 0.13 + n * 1.3) * 0.15));
      out.scale = 0.8 + r(6) * 0.45;
      break;
    case "settle": {
      const [x, z] = SETTLE[n % SETTLE.length];
      onGrid(st, (x + 0.5) * CELL, (z + 0.5) * CELL, out);
      break;
    }
    case "board":
      onGrid(st, ((n % 4) - 1.5) * CELL, (Math.floor(n / 4) - 1.5) * CELL, out);
      break;
    case "stream": {
      const e = ((t * 2.2 + (n / TILE_COUNT) * 30) % 30) / 30;
      const a = 2.2 + r(7) * 1.8;
      const o = n * 2.39996 + t * 0.08;
      viewBasis(p);
      _bb.crossVectors(_vb, _axisY).normalize();
      _xb.crossVectors(_bb, _vb);
      out.p.copy(_yb).addScaledVector(_vb, 3 + e * 30).addScaledVector(_bb, Math.cos(o) * a).addScaledVector(_xb, Math.sin(o) * a);
      _db.position.copy(out.p);
      _db.lookAt(_yb);
      _db.rotateZ(o * 0.3);
      out.q.copy(_db.quaternion);
      out.scale = 1.1;
      out.show = step(0, 0.12, e) * (1 - step(0.75, 1, e));
      break;
    }
    case "rise": {
      const e = ((t * 0.6 + (n / TILE_COUNT) * 13) % 13) / 13;
      const a = n * 2.39996;
      const o = 1.4 + r(8) * 5;
      out.p.set(_lb.x + Math.cos(a) * o, _lb.y - 4.5 + e * 13, _lb.z + Math.sin(a) * o * 0.7);
      viewBasis(p);
      _db.position.copy(out.p);
      _db.lookAt(_yb);
      _db.rotateZ(Math.sin(t * 0.25 + n) * 0.2);
      out.q.copy(_db.quaternion);
      out.show = step(0, 0.15, e) * (1 - step(0.75, 1, e));
      break;
    }
    case "row": {
      const e = n % 2;
      const i = (((Math.floor(n / 2) * 3 + e * CELL + st.travel) % 18) + 18) % 18 - 9 + CELL / 2;
      onGrid(st, e === 0 ? -CELL / 2 : CELL / 2, i, out);
      out.show = 1 - step(6, 9, Math.abs(i));
      break;
    }
  }
}

type TileState = { weights: Record<Mode, number>; scale: number; delay: number; arc: number; started: boolean; hover: number };

/** The hovered tile for the DOM chip (Puture's `Wy`): index, screen position (viewport px) and the damped visibility. */
/** `at`: when the scene last wrote it — a scene that stops rendering (scrolled away) leaves `show` where it was */
export type TileChipState = { index: number; x: number; y: number; show: number; at?: number };

const _tileRay = new THREE.Raycaster();
const _tileNdc = new THREE.Vector2();
const _tileProj = new THREE.Vector3();

/**
 * The twelve icon tiles, blended between formations by the live mode weights. With `chip`, the tile under the pointer
 * is found by a raycast every frame (Puture's `Rb`: the nearest tile grown past 40 %, so a still pointer catches a tile
 * moving under it); it pops toward the camera and the chip state follows it.
 */
export function IconTiles({ chip }: { chip?: TileChipState }) {
  const st = useSpace();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const tiles = useRef<TileState[]>(
    Array.from({ length: TILE_COUNT }, (_, i) => ({
      weights: Object.fromEntries(MODES.map((m) => [m, 0])) as Record<Mode, number>,
      scale: 0,
      delay: 0.5 * (0.75 * (i / (TILE_COUNT - 1)) + 0.25 * hash(i * 5 + 1)),
      arc: 0.25 + hash(i * 5 + 2) * 0.45,
      started: false,
      hover: 0,
    })),
  );
  const hovered = useRef(-1);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 0.24, 4, 0.06), []);
  const iconGeometry = useMemo(() => new THREE.PlaneGeometry(0.58, 0.58), []);
  const materials = useMemo(() => {
    const side = new THREE.MeshPhysicalMaterial({ color: "#16a34a", roughness: 0.3, clearcoat: 0.8, envMapIntensity: 0.9 });
    const face = new THREE.MeshPhysicalMaterial({ map: faceTexture(), roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.06, envMapIntensity: 0.8 });
    return [side, side, side, side, face, side];
  }, []);
  const icons = useMemo(() => ICONS.map(iconTexture), []);

  useFrame(({ camera, gl }, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = st.p;
    const { from, to, t: tt } = st.info;
    const snap = st.snap;
    _fb.copy(camera.position);
    _fb.y -= 5;
    let change = 0;
    for (const m of MODES) change += Math.abs(to[m] - from[m]);
    change = Math.min(1, change / 2);
    st.ringPace = snap ? p.ringPace : damp(st.ringPace, p.ringPace, 1.8, dt);
    st.ringAngle = (st.ringAngle + st.ringPace * dt) % (Math.PI * 2);

    tiles.current.forEach((tile, n) => {
      const g = groups.current[n];
      if (!g) return;
      const i = step(0, 1, (tt - tile.delay) / 0.5);
      _pos.set(0, 0, 0);
      let o = 0;
      let s = 0;
      let c = 0;
      for (const m of MODES) {
        const target = from[m] + (to[m] - from[m]) * i;
        const a = (tile.weights[m] = tile.started && !snap ? damp(tile.weights[m], target, 3.5, dt) : target);
        if (a < 1e-4) continue;
        place(st, m, n, _pl);
        const l = a * Math.max(_pl.show, 0.001);
        _pos.addScaledVector(_pl.p, l);
        if (o === 0) _q.copy(_pl.q);
        else _q.slerp(_pl.q, l / (o + l));
        o += l;
        s += a;
        c += a * _pl.scale * _pl.show;
      }
      tile.started = true;
      if (o > 0) _pos.divideScalar(o);
      // tiles hop up along an arc while they change formation
      const hop = Math.sin(Math.PI * i) * change;
      _pos.y += hop * tile.arc;
      const target = s > 0 ? c / s : 0;
      tile.scale = snap ? target : damp(tile.scale, target, 3, dt);
      tile.hover = damp(tile.hover, n === hovered.current ? 1 : 0, 8, dt);
      _toCam.copy(camera.position).sub(_pos).normalize();
      _pos.addScaledVector(_toCam, tile.hover * 0.6);
      g.position.copy(_pos);
      g.quaternion.copy(_q).multiply(_hop.setFromAxisAngle(_axisX, hop * (n % 2 === 0 ? 0.25 : -0.25)));
      g.scale.setScalar(Math.max(tile.scale * (1 + tile.hover * 0.14), 0.001));
      g.visible = tile.scale > 0.01;
      g.updateMatrixWorld();
    });

    if (!chip) return;
    let hit = -1;
    if (canvasPointer(gl.domElement, _tileNdc)) {
      _tileRay.setFromCamera(_tileNdc, camera);
      let best = Infinity;
      meshes.current.forEach((m, n) => {
        if (!m || tiles.current[n].scale < 0.4) return;
        const h = _tileRay.intersectObject(m, false)[0];
        if (h && h.distance < best) {
          best = h.distance;
          hit = n;
        }
      });
    }
    hovered.current = hit;
    chip.show = damp(chip.show, hit >= 0 ? 1 : 0, 10, dt);
    chip.at = performance.now();
    const g = hit >= 0 ? groups.current[hit] : null;
    if (g) {
      const r = gl.domElement.getBoundingClientRect();
      _tileProj.copy(g.position).project(camera);
      chip.index = hit;
      chip.x = r.left + ((_tileProj.x + 1) / 2) * r.width;
      chip.y = r.top + ((1 - _tileProj.y) / 2) * r.height;
    }
  });

  return (
    <>
      {ICONS.map((_, n) => (
        <group key={n} ref={(el) => void (groups.current[n] = el)}>
          <mesh ref={(el) => void (meshes.current[n] = el)} geometry={geometry} material={materials} />
          <mesh geometry={iconGeometry} position={[0, 0, 0.122]}>
            <meshBasicMaterial map={icons[n]} transparent toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Everything but the chapter-specific props: sky, lights, grid, dust and tiles (`chip`: hover + chip state for the tiles). */
export function SpaceBackdrop({ env, chip }: { env?: number; chip?: TileChipState }) {
  return (
    <>
      <SpaceLights env={env} />
      <Sky />
      <GridSheet />
      <Dust />
      <IconTiles chip={chip} />
    </>
  );
}

/** Canvas defaults shared by the Work and Process scenes. DPR at most 1.5: two full-screen multisampled canvases at 1.75
 *  on a Retina screen (≈2600×1450 each) were a heavy fill for Safari, for little visible gain on grid lines and tiles. */
export const CANVAS_CAMERA = { fov: 40, near: 0.1, far: 160, position: [0, 2.2, 9] as [number, number, number] };
export const CANVAS_DPR: [number, number] = [1, 1.5];
