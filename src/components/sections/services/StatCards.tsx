import SplitReveal from "@/components/motion/SplitReveal";
import DashedLine from "@/components/ui/DashedLine";
import { MARGIN_X } from "./Lines";
import { cn } from "@/lib/cn";

export type StatCard = { eyebrow: string; headline: string; tagline?: string; body?: string };

const Pin = ({ className }: { className: string }) => <span className={cn("absolute z-[1] block h-[6px] w-[6px] bg-green-400", className)} aria-hidden />;

function UpArrow() {
  return (
    <svg className="h-[15px] w-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

/**
 * Sharplink's transformation stats: three `card-stat`s (424:320 on a 4 % surface; eyebrow, 44px figure, green tagline
 * with the rising arrow, body at the bottom) framed by dotted rules — outer verticals on the margins, inner verticals
 * 28px in, rules above and below — with brand pins on the frame's corners. Dark theme; the parent paints the black.
 */
export default function StatCards({ cards, className }: { cards: StatCard[]; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <DashedLine theme="dark" className="top-0" />
      <div className={cn(MARGIN_X, "relative py-[25px] min-[800px]:px-[28px] min-[800px]:py-0")}>
        <Pin className="left-0 top-0" />
        <Pin className="right-0 top-0" />
        <DashedLine theme="dark" direction="vertical" className="left-0" />
        <DashedLine theme="dark" direction="vertical" className="right-0" />
        <ul className="relative grid grid-cols-4 gap-x-4 gap-y-6 min-[800px]:grid-cols-12 min-[800px]:gap-x-[28px]">
          <DashedLine theme="dark" direction="vertical" className="left-0 hidden min-[800px]:block" />
          <DashedLine theme="dark" direction="vertical" className="right-0 hidden min-[800px]:block" />
          {cards.map((c) => (
            <li key={c.eyebrow} className="col-span-4">
              <div className="flex aspect-[343/270] flex-col bg-[rgba(238,238,240,0.04)] p-4 min-[800px]:aspect-[424/320] min-[800px]:p-5">
                <p className="text-[14px] font-medium leading-[1.35] min-[800px]:text-[16px]">{c.eyebrow}</p>
                <SplitReveal as="p" className="mt-4 text-[32px] font-medium leading-[1.16] tracking-[-0.32px] min-[800px]:text-[44px] min-[800px]:font-normal min-[800px]:leading-[1.23] min-[800px]:tracking-[-0.44px]">
                  {c.headline}
                </SplitReveal>
                {c.tagline && (
                  <p className="mb-10 mt-2 flex items-center gap-2 text-[16px] font-medium leading-[1.35] text-green-300">
                    <UpArrow />
                    {c.tagline}
                  </p>
                )}
                {c.body && <p className="mt-auto max-w-[360px] text-[14px] font-medium leading-[1.35] text-off-white/60 min-[800px]:text-[16px]">{c.body}</p>}
              </div>
            </li>
          ))}
        </ul>
        <Pin className="bottom-0 left-0" />
        <Pin className="bottom-0 right-0" />
      </div>
      <DashedLine theme="dark" className="bottom-0" />
    </div>
  );
}
