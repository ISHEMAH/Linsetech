import type { ReactNode } from "react";
import DarkGradient from "@/components/backdrop/DarkGradient";
import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";
import TitleReveal from "./TitleReveal";
import "./company.css";

/**
 * Which Sharplink investors widget this section takes the place of (their CSS, measured):
 * - "press": press releases — `DarkGradient position="bottom" height="100%"` (the light page above → arc → green → black
 *   at the section bottom), dark-theme type, padding-bottom 140px;
 * - "black": governance — solid black, padding-top 28px (no own gradient: it is entered through the press edge and left
 *   through the documents edge);
 * - "documents": additional documents — `DarkGradient position="top" height="130%"` (black → green → arc spilling into
 *   the light section below), dark-theme type, padding 56px 0 140px;
 * - "light": SEC filings / coverage — transparent over the fixed light backdrop, padding-bottom 140px;
 * - "last": contacts — transparent, the footer's gradient rises out of it.
 */
type Kind = "press" | "black" | "documents" | "light" | "last";

type Props = {
  id: string;
  kind: Kind;
  title: string;
  children: ReactNode;
  className?: string;
  /**
   * "small": Sharplink's "Additional documents" heading — a plain 24px title under a dashed rule (desktop only), no
   * pin, no letter reveal, 28px above the list.
   */
  heading?: "large" | "small";
};

const PAD: Record<Kind, string> = {
  press: "pb-[140px]",
  black: "pt-[28px] pb-[112px]",
  documents: "pt-[56px] pb-[140px]",
  light: "pb-[112px] min-[800px]:pb-[140px]",
  last: "pb-[56px]",
};

/**
 * One widget of the investors list: columns 4–12 (full width on mobile) with the vertical dashed rule 28px to the
 * left, a heading = dashed rule + 6px brand pin, 68px title (44px mobile) revealed letter by letter, 84px (56px) under it.
 * Stacking (brief): every section `relative z-[2]`; inside, the gradient is z 0 and the content `relative z-[1]`.
 */
export default function RailSection({ id, kind, title, children, className, heading = "large" }: Props) {
  const dark = kind === "press" || kind === "black" || kind === "documents";
  const tone = dark ? "dark" : "light";
  return (
    <section id={id} data-theme={tone} className={cn("relative z-[2]", dark ? "co-dark" : "co-light", kind === "black" && "bg-black", className)}>
      {kind === "press" && <DarkGradient position="bottom" height="100%" />}
      {kind === "documents" && <DarkGradient position="top" height="130%" />}
      <div className="relative z-[1] grid grid-cols-12 gap-x-4 px-[clamp(16px,2.5vw,40px)] min-[800px]:gap-x-[28px]">
        <div className={cn("relative col-span-12 min-[800px]:col-span-9 min-[800px]:col-start-4", PAD[kind])}>
          <DashedLine direction="vertical" theme={tone} className="-left-[28px] hidden min-[800px]:block" />
          {heading === "small" ? (
            <div className="relative pb-7 min-[800px]:py-7">
              <DashedLine theme={tone} className="top-0 hidden min-[800px]:block" />
              <h2 className="text-[24px] font-medium leading-[1.4] tracking-[-0.24px]">{title}</h2>
            </div>
          ) : (
            <div className="relative mb-[56px] pt-6 min-[800px]:mb-[84px] min-[800px]:pt-[28px]">
              <DashedLine theme={tone} className="top-0" />
              <span className="absolute left-0 top-0 z-[1] h-[6px] w-[6px] bg-[var(--brand)]" aria-hidden />
              <TitleReveal text={title} className="max-w-[12em] text-[44px] font-normal leading-[1.23] tracking-[-0.01em] min-[800px]:text-[clamp(44px,4.72vw,68px)] min-[800px]:leading-[1.06] min-[800px]:tracking-[-0.02em]" />
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
