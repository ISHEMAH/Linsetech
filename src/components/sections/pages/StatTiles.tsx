import { cn } from "@/lib/cn";

type Stat = { value: string; label: string };

/**
 * `tiles` (default, unchanged for existing callers): small stat cards in a 3-column grid.
 * `facts`: Puture's `.facts` list on dark — one stat per row, a rule above, the figure large
 * (clamp(40px, 4.6vw, 72px), −0.045em) and its label under it at 80 %.
 */
export default function StatTiles({ stats, dark = false, className, variant = "tiles" }: { stats: Stat[]; dark?: boolean; className?: string; variant?: "tiles" | "facts" }) {
  if (variant === "facts") {
    return (
      <dl className={cn("m-0 grid grid-cols-1 gap-3", className)}>
        {stats.map((s) => (
          <div key={s.label} className={cn("grid content-start gap-2.5 border-t pt-4", dark ? "border-off-white/80" : "border-ink/80")}>
            <dt className="text-[clamp(40px,4.6vw,72px)] font-normal leading-[0.95] tracking-[-0.045em]">{s.value}</dt>
            <dd className="m-0 text-[15px] opacity-80">{s.label}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {stats.map((s) => (
        <div key={s.label} className={cn("rounded-2xl p-5", dark ? "border border-white/10 bg-white/5" : "border border-green-900/10 bg-white/70")}>
          <p className={cn("text-3xl font-medium tracking-[-0.03em] md:text-4xl", dark ? "text-green-300" : "text-green-600")}>{s.value}</p>
          <p className={cn("mt-1 text-xs", dark ? "text-white/55" : "text-ink/55")}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}
