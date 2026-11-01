"use client";
import { useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LOGO_PATHS } from "@/components/ui/Logo";
import DashedLine from "@/components/ui/DashedLine";
import SplitReveal from "@/components/motion/SplitReveal";
import { useContact } from "@/components/layout/ContactContext";
import { cn } from "@/lib/cn";

const MARGIN_X = "mx-[clamp(16px,2.5vw,40px)]";
const BRAND = "#22c55e";
/** the mark is drawn in its 640 × 552 box at 96px wide: Sharplink's stroke widths (px at 86 × 90) scaled to that box */
const K = 640 / 96;

/**
 * Sharplink LogoAnimation (banner), ported from their four chevrons to the two strokes of the LS mark. Scrubbed 0 → 1:
 * the outlines fade to .2 (0–.02); gradient strokes draw along each stroke from its start point (.02–.32, .035 apart)
 * while two "riders" (a gradient dash, the accents' continuation) run along them; then per stroke (.03 apart) the
 * coloured stroke slides off (.22–.52), a #EEE fill fades in (.24–.58) and a thin white outline draws (.26–.62). The
 * whole mark scales .96 → 1 and untilts (rotateX 2.5° / rotateY −1.5° → 0) over 0–.7, with a brightness pulse to 1.12
 * around .42. Every segment uses their expo in-out.
 */
function logoTimeline(svg: SVGSVGElement, ids: { rg: string[]; ag: string[] }) {
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

function LogoOutline({ className }: { className?: string }) {
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

/**
 * Sharplink HomeBanner, between the Stack and the services: a framed dark block (dashed frame, corner pins, a target
 * pin centred on the machine's column) that scrolls normally over the Stack's still-pinned chrome machine. The
 * machine's outline (stack_wire.png, same camera, same 85vh box in columns 8–12) sits in a viewport-tall layer above the
 * block, pinned from the block's "top bottom" to its "center center" (phones "top 30%") and revealed by a clip that
 * follows the block's rising top edge ("top bottom" → "top top", scrub 0), so the chrome turns into line art under it.
 * The logo draws itself from "top 75%" to "center center"; the title develops letter by letter at "top 80%".
 */
export default function Banner() {
  const t = useTranslations("banner");
  const { open } = useContact();
  const root = useRef<HTMLElement>(null);
  const title = t("title");
  const cut = title.indexOf(",");
  const [lead, rest] = cut > 0 ? [title.slice(0, cut + 1), title.slice(cut + 1).trim()] : [title, ""];

  useGSAP(
    () => {
      const el = root.current!;
      const content = el.querySelector<HTMLElement>(".banner-content")!;
      const outline = el.querySelector<HTMLElement>(".banner-outline")!;
      const svg = el.querySelector<SVGSVGElement>(".ls-logo");
      const reduced = prefersReducedMotion();

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const mobile = !!ctx.conditions?.mobile;
        // Sharplink .outline-image-wrapper: clip rect(100% 100% 100% 0%) → rect(0% …), "top bottom" → "top top"
        const clip = gsap.timeline({ paused: true });
        clip.fromTo(outline, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 });
        ScrollTrigger.create({ animation: clip, trigger: content, start: "top bottom", end: "top top", scrub: 0 });
        ScrollTrigger.create({ trigger: content, start: "top bottom", end: mobile ? "top 30%" : "center center", scrub: 0, pin: outline, pinSpacing: false, anticipatePin: 1 });
        // the logo is desktop-only (Sharplink hides it below 800px)
        if (svg && !mobile) {
          const apply = logoTimeline(svg, { rg: (svg.dataset.rg ?? "").split(" "), ag: (svg.dataset.ag ?? "").split(" ") });
          if (reduced) apply(1);
          else ScrollTrigger.create({ trigger: content, start: "top 75%", end: "center center", scrub: true, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="dark" className="home-banner relative z-[2] bg-black text-off-white">
      <DashedLine theme="dark" className="top-0" />
      <DashedLine theme="dark" className="top-[25px] md:hidden" />
      <div className={cn("relative pb-[14px] md:px-7 md:pb-0", MARGIN_X)}>
        <span className="absolute left-0 top-0 z-[3] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <span className="absolute right-0 top-0 z-[3] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <DashedLine theme="dark" direction="vertical" className="left-0 max-md:!h-[calc(100%+25px)]" />
        <DashedLine theme="dark" direction="vertical" className="left-full max-md:!h-[calc(100%+25px)]" />
        {/* target pin in the machine's column, at the block's centre (where the machine's centre is when its pin ends) */}
        <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-4 gap-x-4 md:grid-cols-12 md:gap-x-[28px]" aria-hidden>
          <div className="col-span-4 flex items-center justify-center md:col-span-5 md:col-start-8">
            <span className="block h-2 w-2 bg-green-400 outline outline-1 outline-offset-8 outline-green-400 md:h-[10px] md:w-[10px] md:outline-offset-[10px]" />
          </div>
        </div>

        <div className="banner-content relative flex max-w-full flex-col items-start overflow-hidden bg-[var(--surface-lighter-subtle)] p-4 md:aspect-[1328/600] md:min-h-[600px] md:justify-between md:px-7 md:pb-[30px] md:pt-7">
          {/* the machine's line art: a viewport-tall layer whose bottom edge is the block's top edge until it pins */}
          <div className="banner-outline pointer-events-none absolute bottom-full left-0 z-0 h-[100lvh] w-full md:-left-7 md:w-[calc(100%+56px)]" style={{ clipPath: "inset(100% 0% 0% 0%)" }} aria-hidden>
            <div className="grid h-full grid-cols-12 items-center gap-x-[28px]">
              <div className="absolute inset-x-0 top-[40svh] h-[60svh] md:relative md:inset-auto md:top-auto md:col-span-5 md:col-start-8 md:h-[85vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/clips/stack_wire.png" alt="" decoding="async" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
              </div>
            </div>
          </div>
          <DashedLine theme="dark" direction="vertical" className="left-0 hidden md:block" />
          <DashedLine theme="dark" direction="vertical" className="right-0 hidden md:block" />

          <LogoOutline className="relative z-[2] hidden w-[96px] md:block" />
          <SplitReveal className="relative z-[2] mt-[448px] max-w-[311px] text-[24px] leading-[1.4] font-medium tracking-[-0.01em] text-balance text-off-white/40 md:my-auto md:max-w-[530px] md:text-[44px] md:leading-[1.23] md:font-normal">
            <span className="text-off-white">{lead}</span> {rest}
          </SplitReveal>
          <div className="relative z-[2] mt-4 flex w-full flex-col gap-1 md:mt-0 md:w-max md:flex-row">
            <ButtonLink href="/services" variant="primary">{t("cta1")}</ButtonLink>
            <Button variant="secondary" arrow={false} onClick={open}>{t("cta2")}</Button>
          </div>
        </div>
      </div>
      {/* bottom corner pins */}
      <div className={cn("relative pb-[14px] md:px-7 md:pb-0", MARGIN_X)} aria-hidden>
        <span className="absolute bottom-0 left-0 z-[3] h-[6px] w-[6px] bg-green-400" />
        <span className="absolute bottom-0 right-0 z-[3] h-[6px] w-[6px] bg-green-400" />
      </div>
      <DashedLine theme="dark" className="bottom-[25px] md:hidden" />
      <DashedLine theme="dark" className="bottom-0" />
    </section>
  );
}
