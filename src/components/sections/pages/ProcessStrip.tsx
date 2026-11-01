import type { ReactNode } from "react";
import SplitReveal from "@/components/motion/SplitReveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import SectionClip from "@/components/sections/services/SectionClip";
import { BODY, GRID, MARGIN_X, PinLine, TITLE } from "@/components/sections/services/Lines";
import { cn } from "@/lib/cn";
import type { Clip } from "@/content/clips";

type Props = { title: string; blurb: string; body: string; steps: { title: string; text: string }[]; clip: Clip; action: ReactNode };

/**
 * Our process in the treatment of Sharplink's `EthereumOpFramework` (the dark close of /ethereum-opportunity):
 * - head with the flipped DarkGradient `calc(100% + 250px)` (mobile `calc(120% + 450px)`, scale 1 → 1.9) rising out of
 *   the light section above, pinned rule, 68px title;
 * - content on black: blurb in columns 1–4, body in 6–12;
 * - role block on black: pinned rule and the looping chrome mark (280px, 164px on mobile);
 * - role text over a top DarkGradient (200 %, z 1): each step's name at full white with its sentence at 40 % (44px / 1.23,
 *   24px on mobile), one line apart, then a secondary button.
 */
export default function ProcessStrip({ title, blurb, body, steps, clip, action }: Props) {
  return (
    <section data-theme="dark" className="relative z-[2] text-off-white">
      <div className="relative pt-[108px] min-[800px]:pb-[140px] min-[800px]:pt-[150px]">
        <DarkGradient position="bottom" height="calc(100% + 250px)" initialScale={1} speed={0.9} className="hidden min-[800px]:block" />
        <DarkGradient position="bottom" height="calc(120% + 450px)" initialScale={1} speed={0.9} className="min-[800px]:hidden" />
        <div className={cn(GRID, "relative z-[1]")}>
          <PinLine theme="dark" place="top" />
          <div className="col-span-4 pt-[28px] min-[800px]:col-span-12">
            <SplitReveal as="h2" className={cn(TITLE, "max-w-[620px]")}>
              {title}
            </SplitReveal>
          </div>
        </div>
      </div>
      <div className="relative bg-black pb-[108px] min-[800px]:pb-16">
        <div className={cn(GRID, "gap-y-0")}>
          <p className={cn("col-span-4 mt-6 max-w-[445px] min-[800px]:mt-0", BODY)}>{blurb}</p>
          <p className={cn("col-span-4 mt-14 max-w-[680px] min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:mt-0", BODY)}>{body}</p>
        </div>
      </div>
      <div className="relative bg-black">
        <div className={cn(MARGIN_X, "relative")}>
          <PinLine theme="dark" />
          <div className="mt-[28px] aspect-square w-[164px] min-[800px]:w-[280px]">
            <SectionClip {...clip} />
          </div>
        </div>
      </div>
      <div className="relative -mt-px pb-[120px] pt-[23px] min-[800px]:pb-[150px]">
        <DarkGradient position="top" height="200%" style={{ zIndex: 1 }} />
        <div className={cn(MARGIN_X, "relative z-[2] flex flex-col items-start gap-y-[1lh] text-[24px] font-medium leading-[1.4] tracking-[-0.24px] min-[800px]:text-[44px] min-[800px]:font-normal min-[800px]:leading-[1.23] min-[800px]:tracking-[-0.44px]")}>
          {steps.map((s) => (
            <div key={s.title} className="min-[800px]:pr-[10%]">
              <h3 className="max-w-[1122px]">{s.title}</h3>
              <p className="max-w-[1122px] opacity-40">{s.text}</p>
            </div>
          ))}
          <div className="mt-2">{action}</div>
        </div>
      </div>
    </section>
  );
}
