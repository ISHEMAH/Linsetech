import ScrollTextReveal from "./ScrollTextReveal";
import { TopSpacer, MARGIN_X } from "./Lines";
import { cn } from "@/lib/cn";

/**
 * Sharplink `SectionsScrollingText`: the transparent light section under the hero (it shows the fixed light backdrop and
 * the tail of the hero's own dark gradient), top spacer with the grid gutters, then large paragraphs (44px / 1.23, max
 * 1122px) whose letters light up one by one in reading order as you scroll. `z` 3 when the next dark block's gradient
 * rises into it (sub-pages), 2 otherwise.
 */
export default function Statement({ id, paragraphs, className, z = 2 }: { id?: string; paragraphs: string[]; className?: string; z?: 2 | 3 }) {
  return (
    <section id={id} data-theme="light" className={cn("relative text-ink", z === 3 ? "z-[3]" : "z-[2]", className)}>
      <TopSpacer />
      <div className={cn(MARGIN_X, "pt-[28px]")}>
        <ScrollTextReveal
          paragraphs={paragraphs}
          className="max-w-[1122px] text-[19px] font-medium leading-[1.35] min-[800px]:text-[44px] min-[800px]:font-normal min-[800px]:leading-[1.23] min-[800px]:tracking-[-0.44px]"
        />
      </div>
    </section>
  );
}
