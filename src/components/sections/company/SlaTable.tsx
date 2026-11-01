import { cn } from "@/lib/cn";
import "./company.css";

type Row = { id: string; chip: string; level: string; example: string; response: string; resolution: string };
type Cols = { priority: string; example: string; response: string; resolution: string };

/**
 * SLA in Sharplink's documents style: title row in narrow uppercase (their b2iSECTitleRow, subtle, 16px below),
 * data rows with the dashed top rule and 28px padding, the priority as a bordered type chip.
 */
export default function SlaTable({ cols, rows, note }: { cols: Cols; rows: Row[]; note?: string }) {
  const grid = "min-[800px]:grid min-[800px]:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] min-[800px]:gap-x-[28px]";
  return (
    <div role="table" aria-label={cols.priority}>
      <div role="row" className={cn("eyebrow hidden pb-4 text-[var(--c-sub)]", grid)}>
        <span role="columnheader">{cols.priority}</span>
        <span role="columnheader">{cols.example}</span>
        <span role="columnheader">{cols.response}</span>
        <span role="columnheader">{cols.resolution}</span>
      </div>
      <div role="rowgroup">
        {rows.map((r) => (
          <div key={r.id} role="row" className={cn("relative grid grid-cols-2 gap-x-4 gap-y-3 py-7 min-[800px]:items-center", "co-dash", grid)}>
            <span role="cell" className="col-span-2 flex items-center gap-4 min-[800px]:col-span-1">
              <span className={cn("co-chip", "co-chip--doc")}>{r.chip}</span>
              <span className="text-[16px] font-medium leading-[1.35]">{r.level}</span>
            </span>
            <span role="cell" className="col-span-2 text-[16px] font-medium leading-[1.35] text-[var(--c-sub)] min-[800px]:col-span-1">
              {r.example}
            </span>
            <span role="cell" className="text-[16px] font-medium leading-[1.35]">
              <span className="eyebrow mb-1 block text-[var(--c-sub)] min-[800px]:hidden">{cols.response}</span>
              {r.response}
            </span>
            <span role="cell" className="text-[16px] font-medium leading-[1.35]">
              <span className="eyebrow mb-1 block text-[var(--c-sub)] min-[800px]:hidden">{cols.resolution}</span>
              {r.resolution}
            </span>
          </div>
        ))}
      </div>
      {note && <p className={cn("eyebrow relative pt-7 text-[var(--c-sub)]", "co-dash")}>{note}</p>}
    </div>
  );
}
