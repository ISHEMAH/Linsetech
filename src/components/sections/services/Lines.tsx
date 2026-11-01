import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

/**
 * Sharplink `.line.top` + `has-pin`: the dotted section rule with the 6px brand square at its left end. `place` "top" /
 * "bottom" pins it absolutely across its positioned parent (out of the grid flow); "flow" keeps it in the flow.
 */
export function PinLine({ theme = "light", className, pin = true, place = "flow" }: { theme?: Theme; className?: string; pin?: boolean; place?: "flow" | "top" | "bottom" }) {
  return (
    <div className={cn("pointer-events-none h-px", place === "flow" ? "relative" : "absolute inset-x-0", place === "top" && "top-0", place === "bottom" && "bottom-0", className)} aria-hidden>
      <DashedLine theme={theme} className="top-0" />
      {pin && <span className="absolute left-0 top-0 block h-[6px] w-[6px] bg-green-400" />}
    </div>
  );
}

/**
 * Sharplink `TopSpacer`: the 160px band (132px on mobile) above a section, where the gutters of the three-column desktop
 * grid are drawn as dotted verticals; the pinned rule closes it (on desktop Sharplink draws it as the next block's top line).
 */
export function TopSpacer({ theme = "light", className }: { theme?: Theme; className?: string }) {
  return (
    <div className={cn("relative mx-[clamp(16px,2.5vw,40px)] h-[132px] min-[800px]:h-[160px]", className)} aria-hidden>
      <div className="absolute inset-0 hidden grid-cols-3 gap-[28px] min-[800px]:grid">
        <div className="relative">
          <DashedLine theme={theme} direction="vertical" className="right-0" />
        </div>
        <div className="relative">
          <DashedLine theme={theme} direction="vertical" className="left-0" />
          <DashedLine theme={theme} direction="vertical" className="right-0" />
        </div>
        <div className="relative">
          <DashedLine theme={theme} direction="vertical" className="left-0" />
        </div>
      </div>
      <PinLine theme={theme} place="bottom" />
    </div>
  );
}

/** Sharplink's layout grid: 4 columns / 16px gutters on mobile, 12 columns / 28px gutters from 800px, inside the margins. */
export const GRID = "mx-[clamp(16px,2.5vw,40px)] grid grid-cols-4 gap-x-4 min-[800px]:grid-cols-12 min-[800px]:gap-x-[28px]";
export const MARGIN_X = "mx-[clamp(16px,2.5vw,40px)]";
/** Section title (their `.heading .title`): 32px/1.16 medium on mobile, 68px/1.06 from 800px. */
export const TITLE = "text-[32px] font-medium leading-[1.16] tracking-[-0.32px] min-[800px]:text-[68px] min-[800px]:font-normal min-[800px]:leading-[1.06] min-[800px]:tracking-[-1.36px]";
/** Blurb / body copy (their `.blurb`, `.body`): 16px/1.35 medium, 19px from 800px. */
export const BODY = "text-[16px] font-medium leading-[1.35] min-[800px]:text-[19px]";
