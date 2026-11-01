"use client";
import { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { TileChipState } from "@/components/three/WorkSpace";
import { CHAPTER_INDEX, processPacing, type Beat } from "@/components/sections/WorkPacing";
import { ChapterLabel, REVEAL } from "@/components/sections/work/chapterParts";
import TileChip from "@/components/sections/work/TileChip";
import TypeLines from "@/components/sections/work/TypeLines";
import { useBeatChars, useMediaQuery } from "@/components/sections/work/beatMotion";

const ProcessScene = dynamic(() => import("@/components/three/ProcessScene"), { ssr: false });

const STEPS = ["discover", "design", "build", "run"] as const;

/** Puture's route rail: nodes zig-zag across a 1000×220 box, joined by eased curves. */
const ROUTE_W = 1000;
const ROUTE_H = 220;
function routeNodes(n: number) {
  return Array.from({ length: n }, (_, i) => ({ x: 80 + (i * 840) / Math.max(1, n - 1), y: i % 2 === 0 ? 150 : 70 }));
}
function routePath(nodes: { x: number; y: number }[]) {
  return nodes.reduce((d, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const q = nodes[i - 1];
    const a = (p.x - q.x) / 2;
    return `${d} C${q.x + a} ${q.y} ${p.x - a} ${p.y} ${p.x} ${p.y}`;
  }, "");
}

/** Where `s` (screens) sits between two fractions of a beat, 0–1 (Puture's `range: [at(i, a), at(i, b)]`). */
const span = (b: Beat, from: number, to: number, s: number) => {
  const len = b.out - b.in;
  return Math.min(1, Math.max(0, (s - (b.in + from * len)) / Math.max(1e-6, (to - from) * len)));
};

/**
 * ScrollTrigger's `scrub: .5` for a value driven by hand: each new target is chased in .5s (power3), as GSAP does.
 * The first call (or `jump`) lands immediately.
 */
function scrubbed(apply: (v: number) => void) {
  const proxy = { v: 0 };
  let target = Number.NaN;
  let tween: gsap.core.Tween | null = null;
  return (v: number, jump = false) => {
    if (jump || Number.isNaN(target)) {
      tween?.kill();
      target = proxy.v = v;
      apply(v);
      return;
    }
    if (Math.abs(v - target) < 1e-5) return;
    target = v;
    tween?.kill();
    tween = gsap.to(proxy, { v, duration: 0.5, ease: "power3", onUpdate: () => apply(proxy.v) });
  };
}

/**
 * Puture's Process chapter (03 PROCESS on theirs), pinned: the title with its intro and the route rail drawing itself
 * in, ~2.3 screens of camera travel with no copy, one card per step (held, one screen of travel between) with its log
 * typing in while the tiles re-form behind it, ~2.3 screens of travel again, and the closing statement framed like a
 * selection that scales from 10 % to 100 % over 5–55 % of its beat (scrub .5), then holds.
 */
export default function Process() {
  const t = useTranslations("process");
  const tw = useTranslations("work");
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const screens = useRef(0);
  const pacing = useMemo(() => processPacing(STEPS.length, true), []);
  const nodes = useMemo(() => routeNodes(STEPS.length), []);
  const path = useMemo(() => routePath(nodes), [nodes]);
  const chip = useMemo<TileChipState>(() => ({ index: -1, x: 0, y: 0, show: 0 }), []);
  const tiles = useMemo(() => (tw.has("tiles") ? (tw.raw("tiles") as string[]) : []), [tw]);
  const logs = useMemo(() => STEPS.map((s) => (t.has(`steps.${s}.log`) ? (t.raw(`steps.${s}.log`) as string[]) : [])), [t]);
  // Puture breaks the statement at its "\n"; at ≤900px it is one word per line
  const narrow = useMediaQuery("(max-width: 900px)");
  const outro = t("outro");
  const lines = useMemo(() => (narrow ? outro.split(/\s+/) : outro.split("\n")).map((l) => l.trim()).filter(Boolean), [narrow, outro]);
  const title = t("title");

  useBeatChars(root, title);

  useGSAP(
    () => {
      const el = root.current!;
      const beats = el.querySelectorAll<HTMLElement>("[data-in]");

      // route rail: the line draws over 10–75 % of the title beat (scrub .5), nodes and labels switch on as it passes
      const line = el.querySelector<SVGPathElement>(".route-line")!;
      const head = el.querySelector<SVGRectElement>(".route-head")!;
      const routeNodesEls = el.querySelectorAll<SVGRectElement>(".route-node");
      const routeSteps = el.querySelectorAll<HTMLElement>(".route-step");
      const length = line.getTotalLength();
      const stops = nodes.map((n) => {
        let best = 0;
        let min = Infinity;
        for (let i = 0; i <= 200; i++) {
          const pt = line.getPointAtLength((i / 200) * length);
          const d = Math.hypot(pt.x - n.x, pt.y - n.y);
          if (d < min) {
            min = d;
            best = i / 200;
          }
        }
        return best;
      });
      const route = scrubbed((p) => {
        line.style.strokeDasharray = `${length}`;
        line.style.strokeDashoffset = `${length * (1 - p)}`;
        const pt = line.getPointAtLength(p * length);
        head.setAttribute("x", String(pt.x - 5));
        head.setAttribute("y", String(pt.y - 5));
        stops.forEach((s, i) => {
          const on = p >= s - 0.001;
          routeNodesEls[i]?.classList.toggle("is-on", on);
          routeSteps[i]?.classList.toggle("is-on", on);
        });
      });

      // statement: the selection frame scales from 10 % to 100 % while its lines fade in, then a short hold
      const statement = el.querySelector<HTMLElement>(".statement")!;
      const readout = statement.querySelector<HTMLElement>(".statement-readout")!;
      const z = { v: 0.1 };
      const setZ = () => {
        statement.style.setProperty("--z", z.v.toFixed(4));
        readout.textContent = `${Math.round(z.v * 100)}%`;
      };
      setZ();
      const tl = gsap.timeline({ paused: true });
      tl.to(z, { v: 1, duration: 1, ease: "power2.inOut", onUpdate: setZ });
      tl.fromTo(statement.querySelectorAll(".statement-line"), { opacity: 0 }, { opacity: 1, duration: 0.18, stagger: 0.1, ease: "none" }, 0);
      tl.to({}, { duration: 0.15 });
      const zoom = scrubbed((p) => tl.progress(p));

      const apply = (progress: number, jump = false) => {
        const s = progress * pacing.total;
        screens.current = s;
        beats.forEach((b) => {
          const from = Number(b.dataset.in);
          const to = Number(b.dataset.out);
          b.classList.toggle("is-in", s >= from && s < to);
          b.classList.toggle("is-past", s >= to);
        });
        route(span(pacing.title, 0.1, 0.75, s), jump);
        zoom(span(pacing.statement, 0.05, 0.55, s), jump);
      };
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress, true),
      });
      apply(trigger.progress, true);

      // Hand-off: while the frame slides in over the Work floor (which ends on this chapter's opening frame),
      // keep the canvas aligned with the viewport so the reveal is pixel-identical rather than a wipe.
      if (stage.current) {
        const frame = stage.current.parentElement!;
        const align = () => {
          const top = frame.getBoundingClientRect().top;
          stage.current!.style.transform = top > 0 ? `translate3d(0, ${(-top).toFixed(1)}px, 0)` : "";
        };
        ScrollTrigger.create({ trigger: el, start: "top bottom", end: "top top", onUpdate: align, onRefresh: align, onLeave: align, onEnterBack: align });
        align();
      }
    },
    { scope: root, dependencies: [pacing, nodes, lines] },
  );

  return (
    <section ref={root} id="process" data-theme="dark" data-chapter="process" className="relative bg-[#020a07] text-off-white" style={{ height: `${(pacing.total + 1) * 100}svh` }}>
      <div className="sticky top-0 h-svh overflow-hidden">
        <div ref={stage} className="absolute inset-0 will-change-transform">
          <ProcessScene pacing={pacing} screensRef={screens} chip={chip} className="absolute inset-0" />
        </div>

        {/* title + intro + route */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            data-in={pacing.title.in}
            data-out={pacing.title.out}
            className={cn(
              REVEAL,
              "px-page relative isolate mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[26px] text-center before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(58%_42%,rgba(1,8,4,.62),rgba(1,8,4,0)_72%)] max-[900px]:before:bg-[radial-gradient(90%_40%,rgba(1,8,4,.7),rgba(1,8,4,0)_75%)]",
            )}
          >
            <ChapterLabel index={CHAPTER_INDEX.process} dark>
              {t("eyebrow")}
            </ChapterLabel>
            <h2 data-chars="" className="max-w-[11em] text-[clamp(52px,7.6vw,128px)] font-normal leading-[0.95] tracking-[-0.045em] [text-shadow:0_1px_14px_rgba(0,0,0,.65)]">
              {title}
            </h2>
            {t.has("intro") && (
              <p className="relative isolate max-w-[34em] text-[18px] text-[#d9dce1] [text-shadow:0_1px_14px_rgba(0,0,0,.65)] before:pointer-events-none before:absolute before:-inset-x-24 before:-bottom-10 before:-top-[18px] before:-z-10 before:bg-[radial-gradient(closest-side,rgba(2,10,7,.72),rgba(2,10,7,.5)_55%,rgba(2,10,7,0))] max-[900px]:text-base max-[900px]:before:-inset-x-12">
                {t("intro")}
              </p>
            )}
            <div className="relative my-12 aspect-[1000/220] w-[min(920px,100%)] max-[900px]:hidden">
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${ROUTE_W} ${ROUTE_H}`} aria-hidden>
                <path className="fill-none stroke-white/[.22] [stroke-dasharray:3_6] [stroke-width:1.5] [vector-effect:non-scaling-stroke]" d={path} />
                <path className="route-line fill-none stroke-green-400 [stroke-width:2.5] [vector-effect:non-scaling-stroke]" d={path} />
                {nodes.map((n, i) => (
                  <rect key={i} className="route-node fill-[#020a07] stroke-white/40 transition-[fill,stroke] duration-300 [stroke-width:1.5] [vector-effect:non-scaling-stroke] [&.is-on]:fill-green-400 [&.is-on]:stroke-green-400" x={n.x - 7} y={n.y - 7} width={14} height={14} />
                ))}
                <rect className="route-head fill-white" width={10} height={10} x={nodes[0].x - 5} y={nodes[0].y - 5} />
              </svg>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={cn("route-step absolute grid justify-items-start gap-1.5 opacity-35 transition-opacity duration-[400ms] [&.is-on]:opacity-100", i === STEPS.length - 1 && "w-max justify-items-end")}
                  style={{ left: `${(nodes[i].x / ROUTE_W) * 100}%`, top: `${(nodes[i].y / ROUTE_H) * 100}%`, transform: i === STEPS.length - 1 ? "translate(calc(-100% + 12px), 22px)" : "translate(-12px, 22px)" }}
                >
                  <ChapterLabel index={String(i + 1).padStart(2, "0")} dark>
                    {t(`steps.${s}.title`)}
                  </ChapterLabel>
                  {t.has(`steps.${s}.line`) && <span className="whitespace-nowrap bg-[#020a07]/80 px-[5px] pb-[2px] pt-[3px] font-mono text-[11px] font-medium uppercase leading-none tracking-[0.08em] text-[#d9dce1]">{t(`steps.${s}.line`)}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* one card per step, left, vertically centred (upper-middle on phones) */}
        {STEPS.map((s, i) => {
          const dark = i >= 2;
          return (
            <div key={s} className="pointer-events-none absolute inset-0 flex items-center max-[900px]:pb-[4vh] max-[900px]:pt-[22vh]">
              <div className="px-page mx-auto w-full max-w-[1440px]">
                <article
                  data-in={pacing.steps[i].in}
                  data-out={pacing.steps[i].out}
                  className={cn(
                    REVEAL,
                    "grid w-[min(460px,100%)] gap-[18px] p-[22px] backdrop-blur-[12px] md:ml-[max(0px,calc(6vw-clamp(1rem,4vw,4rem)))] max-[900px]:gap-[14px] max-[900px]:p-[18px]",
                    dark ? "bg-[#020a07]/[.84] text-off-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]" : "bg-white/90 text-ink shadow-[inset_0_0_0_1px_#d9dce1]",
                  )}
                >
                  <ChapterLabel index={String(i + 1).padStart(2, "0")} dark={dark}>
                    {t(`steps.${s}.title`)}
                  </ChapterLabel>
                  <h3 className="text-[clamp(36px,4vw,60px)] font-normal leading-none tracking-[-0.04em] max-[900px]:text-[34px]">{t.has(`steps.${s}.line`) ? t(`steps.${s}.line`) : t(`steps.${s}.title`)}</h3>
                  <p className={cn("text-base max-[900px]:text-[15px]", dark ? "text-[#b6bac2]" : "text-[#5e646e]")}>{t(`steps.${s}.blurb`)}</p>
                  {logs[i].length > 0 && <TypeLines lines={logs[i]} dark={dark} className={cn("border-t pt-[14px]", dark ? "border-white/[.12]" : "border-black/[.08]")} />}
                  <ol className="mt-1.5 flex gap-1" aria-label={`${i + 1} / ${STEPS.length}`}>
                    {STEPS.map((k, j) => (
                      <li key={k} className={cn("h-1 w-9", j <= i ? "bg-green-500" : dark ? "bg-[#23272f]" : "bg-[#b6bac2]")} />
                    ))}
                  </ol>
                </article>
              </div>
            </div>
          );
        })}

        {/* closing statement */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div data-in={pacing.statement.in} data-out={pacing.statement.out} className={cn(REVEAL, "px-page grid w-full place-items-center")}>
            <div className="statement grid w-full place-items-center [text-shadow:0_1px_14px_rgba(0,0,0,.65)]" style={{ "--z": 0.1 } as React.CSSProperties}>
              <div className="relative pb-[.18em] pl-[.22em] pr-[.22em] pt-[.12em] max-[900px]:pr-[14px]" style={{ transform: "scale(var(--z))", boxShadow: "0 0 0 calc(1px / var(--z)) #22c55e" }}>
                <span className="statement-readout absolute bottom-full left-0 bg-green-500 font-narrow font-medium uppercase leading-none tracking-[0.08em] text-white" style={{ marginBottom: "calc(10px / var(--z))", padding: "calc(4px / var(--z)) calc(6px / var(--z))", fontSize: "calc(11px / var(--z))" }} aria-hidden>
                  10%
                </span>
                {(["top-0 left-0", "top-0 left-full", "top-full left-0", "top-full left-full"] as const).map((pos) => (
                  <span key={pos} className={cn("absolute -translate-x-1/2 -translate-y-1/2 bg-white", pos)} style={{ width: "calc(9px / var(--z))", height: "calc(9px / var(--z))", boxShadow: "0 0 0 calc(1.5px / var(--z)) #22c55e" }} aria-hidden />
                ))}
                <p className="grid justify-items-center whitespace-nowrap text-[clamp(34px,9vw,136px)] font-normal leading-[0.98] tracking-[-0.05em] max-[900px]:text-[min(14vw,11vh)] max-[900px]:leading-[1.02]">
                  <span className="sr-only">{outro.replace(/\s+/g, " ")}</span>
                  {lines.map((l, i) => (
                    <span key={`${i}-${l}`} className="statement-line" aria-hidden>
                      {l}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {tiles.length > 0 && <TileChip state={chip} names={tiles} />}
      </div>
    </section>
  );
}
