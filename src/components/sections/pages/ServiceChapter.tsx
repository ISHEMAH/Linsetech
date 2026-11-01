import type { ReactNode } from "react";
import SplitReveal from "@/components/motion/SplitReveal";
import SectionClip from "@/components/sections/services/SectionClip";
import ScrollTextReveal from "@/components/sections/services/ScrollTextReveal";
import { BODY, GRID, PinLine, TITLE, TopSpacer } from "@/components/sections/services/Lines";
import { QuoteGlyph } from "@/components/sections/about/AboutQuote";
import PortraitTile from "@/components/sections/about/PortraitTile";
import { cn } from "@/lib/cn";
import type { Clip } from "@/content/clips";

export type ChapterQuote = { text: string; name: string; role: string; portraitLabel: string };

type Props = {
  id?: string;
  /** "breakthrough" opens with the top spacer; "supercycle" with 108/160px of padding (their two light chapters) */
  variant: "breakthrough" | "supercycle";
  title: string;
  blurb: string;
  body: string[];
  clip: Clip;
  /** under the body copy (a link to the service) */
  action?: ReactNode;
  /** Sharplink's supercycle quote block, under the body */
  quote?: ChapterQuote;
  /** stacking order: above the dark section whose gradient spills into this one (Sharplink: z 2 / z 1 over z auto) */
  z?: 2 | 3;
};

/**
 * Sharplink's light chapters ("The Ethereum Breakthrough", "The Ethereum Supercycle"): transparent over the fixed light
 * backdrop, pinned rule, 68px title in columns 1–4 and the chrome clip (max 356px) in columns 6–12 on the same row, then
 * the short blurb in columns 1–4 and the long body (max 680px) in columns 6–12; 68px between the rows.
 * With `quote` (their `.quote-wrapper`, 80px under the body, 56px on phones): a dashed rule, a 207px pinned portrait in
 * the first five columns, then in columns 6–12 the outlined quote mark (116px, 74px on phones beside the portrait),
 * the quote (24px, 19px on phones) whose letters light in reading order from 40 % while it crosses the middle of the
 * window (ScrollTextReveal), the name 84px below (56px) and the role.
 */
export default function ServiceChapter({ id, variant, title, blurb, body, clip, action, quote, z = 3 }: Props) {
  return (
    <section id={id} data-theme="light" className={cn("relative text-ink", z === 3 ? "z-[3]" : "z-[2]", variant === "supercycle" && "pt-[108px] min-[800px]:pt-[160px]")}>
      {variant === "breakthrough" && <TopSpacer />}
      <div className={cn(GRID, "relative gap-y-0 min-[800px]:gap-y-[68px]")}>
        {variant === "supercycle" && <PinLine place="top" />}
        <div className="col-span-4 pt-[28px]">
          <SplitReveal as="h2" className={TITLE}>
            {title}
          </SplitReveal>
        </div>
        <div className="col-span-4 pt-14 min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:pt-[28px]">
          <div className="aspect-square w-full max-w-[356px]">
            <SectionClip {...clip} />
          </div>
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
          {action && <div className="mt-8">{action}</div>}
        </div>
      </div>
      {quote && <ChapterQuoteBlock quote={quote} />}
    </section>
  );
}

/** The quote block (see ServiceChapter). */
export function ChapterQuoteBlock({ quote }: { quote: ChapterQuote }) {
  return (
    <figure className={cn(GRID, "relative mt-14 pt-4 min-[800px]:mt-20 min-[800px]:pt-[28px]")}>
      <PinLine place="top" pin={false} />
      <div className="col-span-2 min-[800px]:col-span-5">
        <PortraitTile index={2} label={quote.portraitLabel} className="w-[207px] max-w-full" />
      </div>
      {/* phones: the quote's children join the grid (mark beside the portrait, then full-width rows) */}
      <div className="contents min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:flex min-[800px]:max-w-[680px] min-[800px]:flex-col">
        <QuoteGlyph className="col-span-2 ml-auto h-auto w-[74px] text-ink/30 min-[800px]:ml-0 min-[800px]:w-[116px]" />
        <blockquote className="col-span-4 mt-6 text-[19px] font-medium leading-[1.35] min-[800px]:mt-7 min-[800px]:text-[24px] min-[800px]:leading-[1.4] min-[800px]:tracking-[-0.24px]">
          <ScrollTextReveal paragraphs={[quote.text]} />
        </blockquote>
        <figcaption className="col-span-4 mt-14 min-[800px]:mt-[84px]">
          <span className="block text-[19px] font-medium leading-[1.35]">{quote.name}</span>
          <span className="eyebrow mt-1 block text-[var(--black-subtle)]">{quote.role}</span>
        </figcaption>
      </div>
    </figure>
  );
}
