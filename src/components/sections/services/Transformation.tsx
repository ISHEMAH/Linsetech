"use client";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import SplitReveal from "@/components/motion/SplitReveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import DashedLine from "@/components/ui/DashedLine";
import { Arrow } from "@/components/ui/Button";
import LineArt from "./LineArt";
import StatCards, { type StatCard } from "./StatCards";
import { BODY, GRID, PinLine, TITLE } from "./Lines";
import { cn } from "@/lib/cn";

export type TransformationRow = { title: string; text: string[]; art: string; href?: string; cta?: string };

type Props = {
  id?: string;
  title: string;
  blurb: string;
  body: string[];
  rows: TransformationRow[];
  stats: StatCard[];
  /**
   * Leave the dark block through a top DarkGradient behind the stats (Sharplink's commodity-content edge,
   * `calc(100% + 500px)`), for a page whose next section is light. Without it the stats sit on plain black.
   */
  exit?: boolean;
};

/** One row's title, split into letters server-side so the play / reverse of their opacity never reflows. */
function Letters({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      {text.split(/\s+/).map((w, i, arr) => (
        <span key={i} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c, j) => (
              <span key={j} className="t-letter inline-block" style={{ opacity: 0.4 }}>
                {c}
              </span>
            ))}
          </span>
          {i < arr.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/**
 * Sharplink `EthereumOpTransformation`:
 * - head (150px / 140px padding) with the flipped DarkGradient (bottom, 100%, scale 1 → 1.9): light page → arc → green →
 *   black, pinned rule, 68px title, blurb in columns 1–4, body in columns 6–12;
 * - numbered rows on black (`transofmration-item`): number chip + 32px title in columns 1–5, text in 6–9, the dotted
 *   drawing on a 4 % card in 10–12; each row sits at 40 % and lights up (0.6s power2.out) while it crosses the middle of
 *   the screen, its title letters going .4 → 1 in random order, and dims again when it leaves;
 * - the stat cards on black.
 */
export default function Transformation({ id, title, blurb, body, rows, stats, exit = false }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const items = [...el.querySelectorAll<HTMLElement>(".t-row")];
      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1 });
        gsap.set(el.querySelectorAll(".t-letter"), { opacity: 1 });
        return;
      }
      const triggers = items.map((item) => {
        const tl = gsap.timeline({ paused: true });
        item.querySelectorAll(".t-letter").forEach((l) => tl.to(l, { opacity: 1, duration: 0.3, ease: "power2.out" }, Math.random() * 0.7));
        const on = () => {
          gsap.to(item, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: true });
          tl.play();
        };
        const off = () => {
          gsap.to(item, { opacity: 0.4, duration: 0.6, ease: "power2.out", overwrite: true });
          tl.reverse();
        };
        return ScrollTrigger.create({ trigger: item, start: "top 50%", end: "bottom 50%", onEnter: on, onEnterBack: on, onLeave: off, onLeaveBack: off });
      });
      return () => triggers.forEach((t) => t.kill());
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} data-theme="dark" className="relative z-[2] text-off-white">
      <div className="relative pb-[44px] pt-[108px] min-[800px]:pb-[140px] min-[800px]:pt-[150px]">
        <DarkGradient position="bottom" height="100%" initialScale={1} speed={0.9} />
        <div className={cn(GRID, "relative z-[1] gap-y-0 min-[800px]:gap-y-[140px]")}>
          <PinLine theme="dark" place="top" />
          <div className="col-span-4 pt-[28px] min-[800px]:col-span-12">
            <SplitReveal as="h2" className={cn(TITLE, "max-w-[620px]")}>
              {title}
            </SplitReveal>
          </div>
          <div className={cn("col-span-4 mt-6 max-w-[445px] min-[800px]:mt-0", BODY)}>
            <p>{blurb}</p>
          </div>
          <div className={cn("col-span-4 mt-14 max-w-[680px] min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:mt-0", BODY)}>
            {body.map((p, i) => (
              <p key={i} className={i > 0 ? "mt-[1lh]" : undefined}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="relative bg-black pb-16 min-[800px]:pb-20">
        <ul className="flex flex-col">
          {rows.map((r, i) => {
            const inner = (
              <div className={cn(GRID, "relative gap-y-0 pt-4 min-[800px]:pt-[28px]")}>
                <DashedLine theme="dark" className="top-0 max-[799px]:-left-4 max-[799px]:w-[calc(100%+32px)]" />
                <div className="order-first col-span-4 flex flex-col gap-4 min-[800px]:order-none min-[800px]:col-span-5 min-[800px]:flex-row">
                  <span className="mt-[6px] flex h-[22px] items-center gap-[7px] self-start bg-[rgba(238,238,240,0.04)] px-1 font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[1.04px]">
                    <span className="block h-1 w-1 bg-off-white" aria-hidden />
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-[24px] font-medium leading-[1.4] tracking-[-0.24px] min-[800px]:max-w-[300px] min-[800px]:text-[32px] min-[800px]:leading-[1.16] min-[800px]:tracking-[-0.32px]">
                    <Letters text={r.title} />
                  </h3>
                </div>
                <div className="col-span-4 mt-4 text-[14px] font-medium leading-[1.35] text-off-white/60 min-[800px]:mt-0 min-[800px]:pr-10 min-[800px]:text-[16px]">
                  {r.text.map((p, k) => (
                    <p key={k} className={k > 0 ? "mt-[1lh]" : undefined}>
                      {p}
                    </p>
                  ))}
                  {r.href && r.cta && (
                    <p className="mt-[1lh] text-off-white">
                      <span className="link">{r.cta}</span>
                    </p>
                  )}
                </div>
                <figure className="relative order-first col-span-4 mt-6 flex aspect-[345/248] w-full items-center justify-center bg-[rgba(238,238,240,0.04)] min-[800px]:order-none min-[800px]:col-span-3 min-[800px]:mt-0 min-[800px]:aspect-[285/324] min-[800px]:max-h-[285px]">
                  <span className="absolute left-0 top-0 z-[1] block h-[6px] w-[6px] bg-green-400" aria-hidden />
                  <LineArt name={r.art} className="w-[min(80%,200px)] text-off-white/50" />
                  {r.href && (
                    <span className="absolute bottom-0 right-0" aria-hidden>
                      <span className="ui-btn ui-btn--secondary has-icon allow-parent-hover">
                        <span className="ui-btn__icon">
                          <span>
                            <Arrow />
                          </span>
                          <span>
                            <Arrow />
                          </span>
                        </span>
                      </span>
                    </span>
                  )}
                </figure>
              </div>
            );
            return (
              <li key={r.title} className="t-row line-card pb-11 min-[800px]:pb-20" style={{ opacity: 0.4 }}>
                {r.href ? (
                  <Link href={r.href as never} className="group block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {exit ? (
        <div className="relative">
          {/* Sharplink's commodity-content edge: black at the top, green, then the arc into the light page below
              (desktop: calc(100% + 500px) from the top; mobile: black for 90 %, then a 20 % gradient) */}
          <div className="absolute inset-x-0 top-0 h-[90%] bg-black min-[800px]:hidden" aria-hidden />
          <DarkGradient position="top" height="calc(100% + 500px)" className="hidden min-[800px]:block" />
          <DarkGradient position="top" height="20%" className="min-[800px]:hidden" style={{ top: "90%" }} />
          <div className="relative z-[1] pb-16 min-[800px]:pb-20">
            <StatCards cards={stats} />
          </div>
        </div>
      ) : (
        <StatCards cards={stats} className="bg-black" />
      )}
    </section>
  );
}
