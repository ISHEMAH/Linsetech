import type { ReactNode } from "react";
import SplitReveal from "@/components/motion/SplitReveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import LineArt from "@/components/sections/services/LineArt";
import { BODY, GRID, PinLine, TITLE } from "@/components/sections/services/Lines";
import { cn } from "@/lib/cn";

export type ModelCard = { title: string; text: string; art: string; includes?: string[] };

type Props = { id?: string; title: string; blurb: string; cards: ModelCard[]; action?: ReactNode };

/**
 * Engagement models in the treatment of Sharplink's `EthereumOpCommodity` ("Ether is a Trust Commodity"):
 * - head on black (150px top / 140px bottom padding): pinned rule, 68px title;
 * - content over a top DarkGradient `calc(100% + 500px)` (black → green → arc spilling 500px into the light section
 *   below; mobile: black for 90 %, then a 20 % gradient): blurb in columns 1–4, a 2×2 grid of line-drawing cards in
 *   columns 6–12 (thumb 384:192 on a 4 % surface with the drawing at 168px, 19px title, 14px body at 60 %).
 */
export default function EngagementModels({ id, title, blurb, cards, action }: Props) {
  return (
    <section id={id} data-theme="dark" className="relative z-[2] text-off-white">
      <div className="relative bg-black pb-0 pt-[108px] min-[800px]:pb-[140px] min-[800px]:pt-[150px]">
        <div className={cn(GRID, "relative")}>
          <PinLine theme="dark" place="top" />
          <div className="col-span-4 pt-[28px] min-[800px]:col-span-12">
            <SplitReveal as="h2" className={cn(TITLE, "max-w-[620px]")}>
              {title}
            </SplitReveal>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[90%] bg-black min-[800px]:hidden" aria-hidden />
        <DarkGradient position="top" height="calc(100% + 500px)" className="hidden min-[800px]:block" />
        <DarkGradient position="top" height="20%" className="min-[800px]:hidden" style={{ top: "90%" }} />
        <div className={cn(GRID, "relative z-[1] gap-y-0")}>
          <div className="col-span-4 order-first mt-6 min-[800px]:order-none min-[800px]:mt-0">
            <p className={cn("max-w-[445px]", BODY)}>{blurb}</p>
            {action && <div className="mt-8">{action}</div>}
          </div>
          <ul className="col-span-4 mt-14 grid grid-cols-1 gap-11 min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:mt-0 min-[800px]:grid-cols-2 min-[800px]:gap-[28px]">
            {cards.map((c) => (
              <li key={c.title} className="line-card group flex h-full flex-col gap-4">
                <figure className="flex aspect-[384/192] items-center justify-center bg-[rgba(238,238,240,0.04)]">
                  <LineArt name={c.art} className="w-[168px] text-off-white/45" />
                </figure>
                <h3 className="text-[19px] font-medium leading-[1.35]">{c.title}</h3>
                <p className="text-[14px] font-medium leading-[1.35] text-off-white/60">{c.text}</p>
                {c.includes && (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {c.includes.map((x) => (
                      <li key={x} className="flex items-center gap-2 font-narrow text-[12px] uppercase tracking-[0.08em] text-off-white/70">
                        <span className="h-1 w-1 shrink-0 bg-green-400" aria-hidden />
                        {x}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
