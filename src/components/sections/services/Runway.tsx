import type { ReactNode } from "react";
import SplitReveal from "@/components/motion/SplitReveal";
import DashedLine from "@/components/ui/DashedLine";
import SectionClip from "./SectionClip";
import { BODY, GRID, MARGIN_X, PinLine, TITLE } from "./Lines";
import { cn } from "@/lib/cn";
import type { Clip } from "@/content/clips";

type Props = { id?: string; title: string; tagline: string; clip: Clip; values: { eyebrow: string; value: string }[]; action?: ReactNode };

/**
 * Sharplink `EthereumOpRunway` ("Stablecoins: Early Scale, Massive Runway"): transparent light section (z above the dark
 * framework that follows: its head gradient rises behind this section's bottom, which is how their values end up on
 * blue — ours on green), pinned rule, 68px title + tagline in columns 1–8, the coins clip (plays once) in columns 7–12
 * bleeding into the right margin and sitting on the row's bottom edge, then the three values: eyebrow pill with a 4px
 * dot and an 88px figure, spread across the width.
 */
export default function Runway({ id, title, tagline, clip, values, action }: Props) {
  return (
    <section id={id} className="relative z-[3] pt-[132px] min-[800px]:pt-[160px]">
      <div data-theme="light" className={cn(GRID, "relative text-ink")}>
        <PinLine place="top" />
        <div className="col-span-4 pt-[28px] min-[800px]:col-span-8 min-[800px]:col-start-1 min-[800px]:row-start-1 min-[800px]:mb-[280px]">
          <SplitReveal as="h2" className={cn(TITLE, "min-[800px]:max-w-[877px]")}>
            {title}
          </SplitReveal>
          <p className={cn("mt-6", BODY)}>{tagline}</p>
          {action && <div className="mt-8">{action}</div>}
        </div>
        <div className="col-span-4 self-end pt-14 min-[800px]:col-span-6 min-[800px]:col-start-7 min-[800px]:row-start-1 min-[800px]:pt-[28px] min-[800px]:max-[1199px]:col-span-8 min-[800px]:max-[1199px]:col-start-5">
          <div className="aspect-[886/473] w-[calc(100%+16px)] min-[800px]:w-[calc(100%+clamp(16px,2.5vw,40px))]">
            <SectionClip {...clip} loop={false} />
          </div>
        </div>
        <DashedLine theme="dark" className="bottom-0 hidden min-[800px]:block" />
      </div>
      <div data-theme="dark" className="relative text-off-white min-[800px]:pt-5">
        <div className={cn(MARGIN_X, "flex flex-col gap-y-6 pt-6 min-[800px]:flex-row min-[800px]:justify-between min-[800px]:pt-0")}>
          {values.map((v) => (
            <div key={v.eyebrow} className="relative flex flex-col items-start gap-4">
              <DashedLine theme="dark" className="-top-3 min-[800px]:hidden" />
              <span className="flex h-[30px] items-center gap-3 bg-[rgba(238,238,240,0.04)] px-3 text-[16px] font-medium leading-[1.35]">
                <span className="block h-1 w-1 rounded-full bg-off-white" aria-hidden />
                {v.eyebrow}
              </span>
              <SplitReveal as="p" className="text-[44px] leading-[1.23] tracking-[-0.44px] min-[800px]:text-[clamp(56px,6.1vw,88px)] min-[800px]:leading-[0.96] min-[800px]:tracking-[-0.03em]">
                {v.value}
              </SplitReveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
