"use client";
import { useId } from "react";
import { LOGO_PATHS } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const BRAND = "#22c55e";
/** the mark is drawn in its 640 × 552 box at 96px wide: Sharplink's stroke widths (px at 86 × 90) scaled to that box */
const K = 640 / 96;

/**
 * Sharplink LogoAnimation (banner), ported from their four chevrons to the two strokes of the LS mark. Scrubbed 0 → 1:
 * the outlines fade to .2 (0–.02); gradient strokes draw along each stroke from its start point (.02–.32, .035 apart)
 * while two "riders" (a gradient dash, the accents' continuation) run along them; then per stroke (.03 apart) the
 * coloured stroke slides off (.22–.52), a #EEE fill fades in (.24–.58) and a thin white outline draws (.26–.62). The
 * whole mark scales .96 → 1 and untilts (rotateX 2.5° / rotateY −1.5° → 0) over 0–.7, with a brightness pulse to 1.12
 * around .42. Every segment uses their expo in-out. The home banner scrubs it by scroll; the loading screen drives it
 * with the load progress.
 */
export function logoTimeline(svg: SVGSVGElement, ids: { rg: string[]; ag: string[] }) {
  const shapes = [...svg.querySelectorAll<SVGGElement>(".ls-shape")].map((g) => ({
    base: g.querySelector<SVGPathElement>(".base")!,
    blue: g.querySelector<SVGPathElement>(".blue")!,
    filled: g.querySelector<SVGPathElement>(".filled")!,
    white: g.querySelector<SVGPathElement>(".white")!,
  }));
  const riders = [...svg.querySelectorAll<SVGPathElement>(".rider")];
  const accents = [...svg.querySelectorAll<SVGPathElement>(".accent")];
  const lens = shapes.map((s) => s.blue.getTotalLength());
  const rlens = riders.map((r) => r.getTotalLength());
  // their constants: rider 0 starts .123 along its path and runs forward, rider 1 starts .673 and runs back
  const F = 0.123;
  const D = 0.673;
  const START = [F, D];
  const DIR = [1, -1];
  const DRAW = [0, 1]; // order of the coloured strokes (.035 apart)
  const SETTLE = [0, 1]; // order of retract / fill / white (.03 apart)
  const SEG = rlens.map((l) => l * 0.12); // rider dash = accent length (12 % of the outline, as theirs)

  const expo = (t: number) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 10 * t - 5) / 2 : (2 - Math.pow(2, -10 * t + 5)) / 2);
  const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const n = (t: number, a: number, b: number, from = 0, to = 1) => from + (to - from) * expo(clamp((t - a) / (b - a)));
  const cache = new WeakMap<Element, Record<string, string>>();
  const attr = (el: Element, k: string, v: string | number) => {
    let o = cache.get(el);
    if (!o) cache.set(el, (o = {}));
    const s = String(v);
    if (o[k] !== s) {
      o[k] = s;
      el.setAttribute(k, s);
    }
  };
  // a dash of `o` × length starting at `s` × length, growing forward (dir 1) or backward (dir −1)
  const grow = (el: SVGPathElement, len: number, s: number, o: number, dir: number) => {
    if (o <= 0.001) {
      attr(el, "stroke-dasharray", `0 ${len}`);
      attr(el, "stroke-dashoffset", 0);
      return;
    }
    if (o >= 0.999) {
      attr(el, "stroke-dasharray", `${len} 0`);
      attr(el, "stroke-dashoffset", 0);
      return;
    }
    const r = o * len;
    const v = s * len;
    attr(el, "stroke-dasharray", `${r} ${len - r}`);
    attr(el, "stroke-dashoffset", -(dir === 1 ? v : v - r));
  };
  // a dash of length `seg` centred at fraction `c`
  const dash = (el: SVGPathElement, len: number, seg: number, c: number) => {
    attr(el, "stroke-dasharray", `${seg} ${len - seg}`);
    attr(el, "stroke-dashoffset", -(c * len - seg / 2));
  };
  const SAMPLES = 80;
  const samples = riders.map((r, i) => Array.from({ length: SAMPLES + 1 }, (_, k) => r.getPointAtLength((k / SAMPLES) * rlens[i])));
  const at = (pts: DOMPoint[], f: number) => {
    const s = clamp(f) * SAMPLES;
    const a = Math.floor(s);
    const b = Math.min(a + 1, SAMPLES);
    const r = s - a;
    return { x: pts[a].x + (pts[b].x - pts[a].x) * r, y: pts[a].y + (pts[b].y - pts[a].y) * r };
  };
  // the rider's gradient follows its dash (opaque at the trailing end, as theirs)
  const follow = (i: number, c: number) => {
    const g = svg.ownerDocument.getElementById(ids.rg[i]);
    if (!g) return;
    const half = (SEG[i] / rlens[i]) * 0.5;
    const a = at(samples[i], Math.max(0, c - half));
    const b = at(samples[i], Math.min(1, c + half));
    g.setAttribute("x1", String(a.x));
    g.setAttribute("y1", String(a.y));
    g.setAttribute("x2", String(b.x));
    g.setAttribute("y2", String(b.y));
  };
  // the accents are the riders' first position: a straight stroke over the same stretch of outline, sliding in along it
  const slide = accents.map((a, i) => {
    const half = (SEG[i] / rlens[i]) * 0.5;
    const p = at(samples[i], START[i] - half);
    const q = at(samples[i], START[i] + half);
    a.setAttribute("d", `M${p.x} ${p.y} L${q.x} ${q.y}`);
    const g = svg.ownerDocument.getElementById(ids.ag[i]);
    g?.setAttribute("x1", String(p.x));
    g?.setAttribute("y1", String(p.y));
    g?.setAttribute("x2", String(q.x));
    g?.setAttribute("y2", String(q.y));
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const back = 38; // ≈ their 5–6 units at 86px
    const dir = DIR[i];
    return { x: (-(q.x - p.x) / len) * back * dir, y: (-(q.y - p.y) / len) * back * dir };
  });

  const apply = (t: number) => {
    shapes.forEach((s, G) => {
      const g = n(t, G * 0.006, 0.02 + G * 0.006, 0, 0.2);
      if (t < 0.22) attr(s.base, "stroke", `rgba(243,243,243,${g})`);
    });
    const shown = Math.min(n(t, 0.005, 0.025), 1 - n(t, 0.01, 0.1));
    const r = 1 - n(t, 0.005, 0.03);
    accents.forEach((a, i) => {
      a.style.opacity = String(clamp(shown));
      a.style.transform = `translate(${slide[i].x * r}px, ${slide[i].y * r}px)`;
    });
    const fadeIn = n(t, 0.01, 0.08);
    const run = n(t, 0.02, 0.3);
    const fadeOut = 1 - n(t, 0.26, 0.42);
    const c0 = F + run * (1 - F);
    const c1 = D - run * D;
    [c0, c1].forEach((c, i) => {
      if (!riders[i]) return;
      riders[i].style.opacity = String(clamp(fadeIn * fadeOut));
      dash(riders[i], rlens[i], SEG[i], c);
      follow(i, c);
    });
    DRAW.forEach((L, G) => {
      const o = n(t, 0.02 + G * 0.035, 0.32 + G * 0.035);
      const z = 0.22 + SETTLE.indexOf(L) * 0.03;
      if (t <= z + 0.05) grow(shapes[L].blue, lens[L], START[L], o, DIR[L]);
    });
    SETTLE.forEach((L, G) => {
      const s = shapes[L];
      const len = lens[L];
      const m = G * 0.03;
      const u = n(t, 0.22 + m, 0.52 + m);
      if (u > 0) {
        attr(s.blue, "stroke-dasharray", len);
        attr(s.blue, "stroke-dashoffset", -len * u);
      }
      s.filled.style.opacity = String(clamp(n(t, 0.24 + m, 0.58 + m)));
      const w = n(t, 0.26 + m, 0.62 + m);
      attr(s.white, "stroke-dasharray", len);
      attr(s.white, "stroke-dashoffset", len * (1 - clamp(w)));
      if (t >= 0.22) attr(s.base, "stroke", `rgba(243,243,243,${n(t, 0.22 + m, 0.45 + m, 0.2, 0)})`);
    });
    const scale = 0.96 + 0.04 * n(t, 0, 0.62);
    const tilt = 1 - n(t, 0, 0.7);
    svg.style.transform = `scale(${scale}) rotateX(${2.5 * tilt}deg) rotateY(${-1.5 * tilt}deg)`;
    const glow = 1 + Math.min(n(t, 0.28, 0.42), 1 - n(t, 0.42, 0.58)) * 0.12;
    svg.style.filter = glow > 1.001 ? `brightness(${glow.toFixed(3)})` : "";
  };
  apply(0);
  return apply;
}

/** The mark as the drawable outline `logoTimeline` animates; `.ls-logo` is the SVG, with its gradient ids in data-rg / data-ag. */
export function LogoOutline({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // gradient endpoints per stroke: brand at the leading end, transparent at the other (theirs: right → left)
  const sg = [
    { x1: 365, y1: 40, x2: 2, y2: 550 },
    { x1: 637, y1: 470, x2: 224, y2: 300 },
  ];
  return (
    <div className={cn("[perspective:800px]", className)} aria-hidden>
      <svg className="ls-logo block h-auto w-full overflow-visible will-change-[transform,filter]" viewBox="0 0 640 552" fill="none" data-rg={`${uid}rg0 ${uid}rg1`} data-ag={`${uid}ag0 ${uid}ag1`}>
        <defs>
          {sg.map((g, i) => (
            <linearGradient key={i} id={`${uid}sg${i}`} gradientUnits="userSpaceOnUse" {...g}>
              <stop stopColor={BRAND} />
              <stop offset="1" stopColor={BRAND} stopOpacity="0" />
            </linearGradient>
          ))}
          {[0, 1].map((i) => (
            <linearGradient key={`rg${i}`} id={`${uid}rg${i}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor={BRAND} />
              <stop offset="1" stopColor={BRAND} stopOpacity="0" />
            </linearGradient>
          ))}
          {[0, 1].map((i) => (
            <linearGradient key={`ag${i}`} id={`${uid}ag${i}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor={BRAND} />
              <stop offset="1" stopColor={BRAND} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {LOGO_PATHS.map((d, i) => (
          <g key={d} className="ls-shape">
            <path className="base" d={d} stroke="rgba(243,243,243,0)" strokeWidth={1 * K} />
            <path className="blue" d={d} stroke={`url(#${uid}sg${i})`} strokeWidth={1.6 * K} strokeDasharray="0 99999" />
            <path className="filled" d={d} fill="#EEEEEE" style={{ opacity: 0 }} />
            <path className="white" d={d} stroke="rgba(255,255,255,0.75)" strokeWidth={0.6 * K} strokeDasharray="99999" strokeDashoffset="99999" />
          </g>
        ))}
        {[0, 1].map((i) => (
          <path key={`a${i}`} className="accent" d="M0 0" stroke={`url(#${uid}ag${i})`} strokeWidth={2 * K} strokeLinecap="butt" style={{ opacity: 0 }} />
        ))}
        {LOGO_PATHS.map((d, i) => (
          <path key={`r${i}`} className="rider" d={d} stroke={`url(#${uid}rg${i})`} strokeWidth={2 * K} style={{ opacity: 0 }} />
        ))}
      </svg>
    </div>
  );
}
