import { cn } from "@/lib/cn";
import MarkIllo from "./MarkIllo";
import { DiagArrow } from "./icons";
import "./company.css";

/** A presentation card (Sharplink card-investor-presentation) for a file that does not exist yet: static, icon greyed. */
export default function ToolCard({ eyebrow, tag, title }: { eyebrow: string; tag: string; title: string }) {
  return (
    <div className={cn("flex w-full max-w-[563px] items-center overflow-hidden", "co-glass")} aria-label={`${title} — ${tag}`}>
      <MarkIllo className="-mb-[26px] w-[88px] shrink-0 self-end text-off-white/80 min-[800px]:w-[120px]" />
      <div className="flex grow flex-col gap-3 py-4 pr-4 min-[800px]:gap-4 min-[800px]:py-5 min-[800px]:pr-5">
        <div className="eyebrow flex items-center justify-between gap-3 text-[var(--c-sub)]">
          <span>{eyebrow}</span>
          <span className="text-[var(--brand)]">{tag}</span>
        </div>
        <div className="flex items-end justify-between gap-4 text-[16px] font-medium leading-[1.35]">
          <span className="max-w-[240px] text-balance">{title}</span>
          <span className={"co-icon-box"} aria-disabled="true">
            <DiagArrow />
          </span>
        </div>
      </div>
    </div>
  );
}
