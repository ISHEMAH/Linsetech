"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import DashedLine from "@/components/ui/DashedLine";
import TextReveal from "./TextReveal";

export type StoryRow = { id: string; label: string; items: { kicker?: string; text: string }[] };

const M = "px-[clamp(16px,2.5vw,40px)]";
const GRID = "grid grid-cols-1 gap-x-[28px] md:grid-cols-12";
/** the chip's solid fill (Sharplink: `#3d3d3d66` → `var(--black)`; ours green-black) */
const CHIP_ON = "#04150f";

/**
 * Sharplink about-ethereum, measured at 1800 × 1000:
 * - light page behind (their fixed radial `gradient-bg-light`): here a fixed layer clipped to the section;
 * - section heading 160 px below the hero (pin + dashed rule, 68 px title, letters revealed on enter);
 * - rows on the 12-column grid: label chip in columns 1–3, a 24 px paragraph in columns 4–9 (28 px inner padding),
 *   columns 10–12 empty; dashed verticals on both gutters of the text column;
 * - each paragraph is painted with `linear-gradient(ink 50%, ink/30 50%)` clipped to the text, 200 % tall, and its
 *   background-position runs 100 % → 0 % while the paragraph crosses the middle of the window — so every line above
 *   the window's centre line is dark and every line below is dim, with a hard edge sliding down the text;
 * - the chip's fill goes from translucent to solid while the chip itself crosses the centre line (scrubbed, their
 *   `backgroundColor → black` tween from "top center" to "bottom center");
 * - a fixed 2 px progress bar on that same centre line grows left → right over the rows (on a dashed track): one
 *   scrubbed timeline from "top 55%" to "bottom 45%" of the rows — the bar and its track fade in over the first 7 %,
 *   the bar grows linearly over the whole range, and both fade out between 90 % and 97 %.
 * Rows carry `story-row`, not `row`: the global `.row` rule (home Stack) would hold them at 40 % opacity.
 */
export default function StoryLongform({ heading, rows }: { heading: string; rows: StoryRow[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const fills = el.querySelectorAll<HTMLElement>(".fill");
      const chips = el.querySelectorAll<HTMLElement>(".chip");
      const list = el.querySelector<HTMLElement>(".rows")!;
      const progress = el.querySelector<HTMLElement>(".progress")!;
      const bar = el.querySelector<HTMLElement>(".bar")!;
      if (prefersReducedMotion()) {
        gsap.set(fills, { backgroundPosition: "0% 0%" });
        gsap.set(chips, { backgroundColor: CHIP_ON });
        return;
      }
      fills.forEach((f) =>
        gsap.fromTo(f, { backgroundPosition: "0% 100%" }, { backgroundPosition: "0% 0%", ease: "none", scrollTrigger: { trigger: f, start: "top 50%", end: "bottom 50%", scrub: true } }),
      );
      // Sharplink: `to(eyebrow, { backgroundColor: black })` with GSAP's stock power1.out (our global default is expo.out),
      // scrubbed while the chip crosses the centre line
      chips.forEach((c) =>
        gsap.to(c, { backgroundColor: CHIP_ON, ease: "power1.out", scrollTrigger: { trigger: c, start: "top center", end: "bottom center", scrub: true } }),
      );
      const tl = gsap
        .timeline({ paused: true })
        .to(progress, { opacity: 1, duration: 0.07, ease: "none" })
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, 0)
        .to(progress, { opacity: 0, duration: 0.07, ease: "none" }, ">-=0.1");
      ScrollTrigger.create({ animation: tl, trigger: list, start: "top 55%", end: "bottom 45%", scrub: true });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="light" className="relative z-[2] text-ink" style={{ clipPath: "inset(0)" }}>
      {/* transparent: the fixed light backdrop (layout) and the hero's gradient arc show through, as on sharplink.com */}

      {/* progress on the window's centre line (fixed, clipped to the section; Sharplink .progress-wrapper) */}
      <div className="progress pointer-events-none fixed inset-x-0 top-1/2 h-[2px] -translate-y-1/2 opacity-0" aria-hidden>
        <div className="absolute inset-0">
          <DashedLine className="top-1/2" />
        </div>
        <div className="bar absolute inset-0 origin-left bg-green-500" />
      </div>

      <div className={`relative ${M} pt-[clamp(96px,16vh,160px)]`}>
        <div className="relative pb-[clamp(64px,14vh,140px)] pt-[28px]">
          <DashedLine className="top-0" />
          <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-green-400" aria-hidden />
          <TextReveal as="h2" text={heading} className="max-w-[12.6em] text-[clamp(36px,3.8vw,68px)] font-normal leading-[1.06] tracking-[-0.02em]" />
        </div>
      </div>

      <div className="rows relative">
        {/* dashed verticals on the text column's gutters (desktop) */}
        <div className={`pointer-events-none absolute inset-0 hidden ${M} md:block`} aria-hidden>
          <div className={`${GRID} h-full`}>
            <div className="relative col-span-3">
              <DashedLine direction="vertical" className="right-0" />
            </div>
            <div className="relative col-span-6">
              <DashedLine direction="vertical" className="left-0" />
              <DashedLine direction="vertical" className="right-0" />
            </div>
            <div className="relative col-span-3">
              <DashedLine direction="vertical" className="left-0" />
            </div>
          </div>
        </div>

        {rows.map((row, i) => (
          <div key={row.id} className={`story-row relative ${M}`}>
            <div className={`${GRID} ${i === 0 ? "pt-[28px]" : "pt-[clamp(56px,8.4vh,84px)]"}`}>
              <div className="col-span-3 mb-5 md:mb-0">
                <span className="chip eyebrow inline-flex h-[22px] items-center gap-[6px] bg-[rgba(4,21,15,0.3)] px-[6px] text-off-white">
                  <span className="block h-1 w-1 bg-off-white" aria-hidden />
                  {row.label}
                </span>
              </div>
              <div className="md:col-span-6 md:px-[28px]">
                <div className="space-y-[clamp(18px,2.2vh,26px)]">
                  {row.items.map((it, j) => (
                    <div key={j}>
                      {it.kicker && <p className="eyebrow mb-2 text-ink/50">{it.kicker}</p>}
                      <p
                        className="fill text-[clamp(19px,1.6vw,24px)] font-medium leading-[1.4] tracking-[-0.01em] text-transparent"
                        style={{
                          backgroundImage: "linear-gradient(180deg,#04150f 50%,rgba(4,21,15,0.28) 50%)",
                          backgroundSize: "100% 200%",
                          backgroundPosition: "0% 100%",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                        }}
                      >
                        {it.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="h-[160px]" aria-hidden />
      </div>
    </section>
  );
}
