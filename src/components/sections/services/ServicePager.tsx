import { Link } from "@/i18n/navigation";
import DashedLine from "@/components/ui/DashedLine";
import { Arrow } from "@/components/ui/Button";
import { MARGIN_X } from "./Lines";
import { cn } from "@/lib/cn";

type Item = { slug: string; title: string; headline: string; index: number };

function Box({ flip }: { flip?: boolean }) {
  return (
    <span className="ui-btn ui-btn--secondary has-icon allow-parent-hover" aria-hidden>
      <span className="ui-btn__icon">
        <span>
          <Arrow className={flip ? "rotate-180" : undefined} />
        </span>
        <span>
          <Arrow className={flip ? "rotate-180" : undefined} />
        </span>
      </span>
    </span>
  );
}

/** Previous / next service, two halves split by dotted rules; the whole half is the link (card-hover tint). */
export default function ServicePager({ prev, next, labels, total }: { prev: Item; next: Item; labels: { previous: string; next: string; nav: string }; total: number }) {
  const cell = "card-hover group relative flex min-h-[220px] flex-col justify-between gap-10 px-0 py-8 min-[800px]:min-h-[280px] min-[800px]:px-8 min-[800px]:py-10";
  const num = (i: number) => `${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return (
    <nav data-theme="light" aria-label={labels.nav} className="relative z-[2] pb-[96px] text-ink min-[800px]:pb-[150px]">
      <div className={cn(MARGIN_X, "relative grid min-[800px]:grid-cols-2")}>
        <DashedLine className="top-0" />
        <DashedLine className="bottom-0" />
        <DashedLine direction="vertical" className="left-1/2 hidden min-[800px]:block" />
        <Link href={`/services/${prev.slug}` as never} className={cell} rel="prev">
          <span className="flex items-center justify-between gap-4">
            <span className="eyebrow sq text-ink/60">{labels.previous}</span>
            <span className="font-narrow text-[13px] tracking-[0.08em] text-ink/50">{num(prev.index)}</span>
          </span>
          <span className="flex items-end justify-between gap-6">
            <span>
              <span className="block text-[32px] leading-[1.1] tracking-[-0.02em] min-[800px]:text-[clamp(36px,3vw,52px)]">{prev.title}</span>
              <span className="mt-3 block text-[15px] font-medium text-ink/60">{prev.headline}</span>
            </span>
            <Box flip />
          </span>
        </Link>
        <div className="relative min-[800px]:hidden">
          <DashedLine className="top-0" />
        </div>
        <Link href={`/services/${next.slug}` as never} className={cell} rel="next">
          <span className="flex items-center justify-between gap-4">
            <span className="eyebrow sq text-ink/60">{labels.next}</span>
            <span className="font-narrow text-[13px] tracking-[0.08em] text-ink/50">{num(next.index)}</span>
          </span>
          <span className="flex items-end justify-between gap-6">
            <span>
              <span className="block text-[32px] leading-[1.1] tracking-[-0.02em] min-[800px]:text-[clamp(36px,3vw,52px)]">{next.title}</span>
              <span className="mt-3 block text-[15px] font-medium text-ink/60">{next.headline}</span>
            </span>
            <Box />
          </span>
        </Link>
      </div>
    </nav>
  );
}
