import { cn } from "@/lib/cn";
import { Download } from "./icons";
import "./company.css";

type Item = {
  id: string;
  chip: string;
  title: string;
  text?: string;
  /** a document row (Sharplink card-document): the download icon box at the end; no `href` = not published yet */
  file?: { href?: string; label: string; soon?: string };
};

/**
 * Sharplink "Additional documents" (card-document in a 2-column documents-list): dashed top rule, 28px padding,
 * a 42px type chip, the 16px/500 title (28px gaps) and, for files, the 34px download box (on phones the chip and the
 * box share the first line and the title wraps under them). Also used for numbered steps, with a line of text under
 * the title.
 */
export default function DocList({ items, cols = 2 }: { items: Item[]; cols?: 2 | 3 }) {
  // one chip width per list so every title starts on the same line (Sharplink's chips all read "PDF", 42px)
  const chipW = Math.max(42, Math.ceil(Math.max(0, ...items.map((i) => i.chip.length)) * 8.2 + 18));
  return (
    <ul className={cn("grid grid-cols-1 gap-x-[28px]", cols === 2 ? "min-[800px]:grid-cols-2" : "min-[800px]:grid-cols-3")}>
      {items.map((it) =>
        it.file ? (
          <li key={it.id} className={cn("relative flex flex-wrap items-center gap-7 py-7 min-[800px]:flex-nowrap", "co-dash")}>
            <span className={cn("co-chip", "co-chip--doc")} style={{ width: chipW }}>
              {it.chip}
            </span>
            <p className="order-1 w-full text-[16px] font-medium leading-[1.35] min-[800px]:order-none min-[800px]:w-auto">{it.title}</p>
            {it.file.href ? (
              <a href={it.file.href} className={cn("co-icon-box", "co-glass-btn ml-auto min-[800px]:ml-0")} aria-label={`${it.file.label}: ${it.title}`}>
                <Download />
              </a>
            ) : (
              <span className={cn("co-icon-box", "ml-auto min-[800px]:ml-0")} aria-disabled="true" title={it.file.soon}>
                <Download />
                <span className="sr-only">{`${it.file.label}: ${it.file.soon ?? ""}`}</span>
              </span>
            )}
          </li>
        ) : (
          <li key={it.id} className={cn("relative flex items-start gap-7 py-7", "co-dash")}>
            <span className={cn("co-chip", "co-chip--doc")}>{it.chip}</span>
            <div className="pt-[4px]">
              <p className="text-[16px] font-medium leading-[1.35]">{it.title}</p>
              {it.text && <p className="mt-2 max-w-[42ch] text-[15px] font-medium leading-[1.4] text-[var(--c-sub)]">{it.text}</p>}
            </div>
          </li>
        ),
      )}
    </ul>
  );
}
