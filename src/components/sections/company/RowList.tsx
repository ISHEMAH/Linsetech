"use client";
import { useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { scrollToTarget } from "@/lib/lenis";
import { Arrow } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Act, UiIcon, type Action } from "./actions";
import { Download } from "./icons";
import "./company.css";

export type Row = {
  id: string;
  chip: string;
  title: string;
  meta?: string;
  /** missing = static row (placeholder file) */
  action?: Action;
  /** narrow tag after the title, e.g. "Coming soon" */
  tag?: string;
};

type Props = {
  rows: Row[];
  /** "date" = 100px chip (press releases), "doc" = 42px type chip (documents) */
  chip?: "date" | "doc";
  icon?: "arrow" | "download";
  /** rows per page; Next / Last appear when there are more (b2i pager) */
  pageSize?: number;
  pager?: { first: string; prev: string; next: string; last: string };
  /** accessible name for the action of a row (prefix) */
  actionLabel?: string;
  empty?: ReactNode;
};

/**
 * Sharplink press-release list (b2i PressItem38): dashed separator on top of each row, 28/25px padding, a bordered
 * chip, the 16px/500 headline (max 676px) and a 34px glass icon box pushed right; 56px gaps on desktop, chip + icon
 * on one line and the headline under them on mobile. Our rows are links: the row tints (card-hover) and the icon
 * plays the ui-button hover. Pager = their b2iNav: glass 34px tabs, only the usable ones shown.
 */
export default function RowList({ rows, chip = "date", icon = "arrow", pageSize = 6, pager, actionLabel, empty }: Props) {
  const tn = useTranslations("nav");
  const [page, setPage] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * pageSize, cur * pageSize + pageSize);

  const goto = (p: number) => {
    setPage(p);
    const el = list.current;
    if (el && el.getBoundingClientRect().top < 120) scrollToTarget(el, -150);
  };

  const ic = icon === "download" ? <Download /> : <Arrow />;
  // one chip width per list so every headline starts on the same line (Sharplink's date chips are a fixed 100px)
  const chipW = Math.max(chip === "date" ? 100 : 42, Math.ceil(Math.max(0, ...rows.map((r) => r.chip.length)) * 8.2 + 18));

  return (
    <div ref={list}>
      {visible.length === 0 && empty}
      <ul key={cur}>
        {visible.map((r) => {
          const inner = (
            <>
              <span className={cn("co-chip", chip === "date" ? "co-chip--date" : "co-chip--doc", "max-[799px]:mr-auto")} style={{ width: chipW }}>
                {r.chip}
              </span>
              <span className="order-1 w-full self-center min-[800px]:order-none min-[800px]:mr-auto min-[800px]:w-auto min-[800px]:max-w-[676px] min-[800px]:pb-[3px]">
                <span className="block text-[16px] font-medium leading-[1.35]">
                  {r.title}
                  {r.tag && <span className="eyebrow ml-3 whitespace-nowrap align-[1px] text-[var(--c-sub)]">· {r.tag}</span>}
                </span>
                {r.meta && <span className="eyebrow mt-1.5 block text-[var(--c-sub)]">{r.meta}</span>}
              </span>
              {r.action ? (
                <UiIcon icon={ic} />
              ) : (
                <span className={"co-icon-box"} aria-disabled="true" title={r.tag}>
                  {ic}
                </span>
              )}
            </>
          );
          const box = "flex w-full flex-wrap items-center gap-4 pb-[25px] pt-[28px] min-[800px]:flex-nowrap min-[800px]:gap-14";
          return (
            <li key={r.id} className={cn("relative", "co-dash")}>
              {r.action ? (
                <Act action={r.action} label={actionLabel ? `${actionLabel}: ${r.title}` : undefined} className={cn(box, "card-hover -mx-3 w-[calc(100%+24px)] px-3")}>
                  {inner}
                </Act>
              ) : (
                <div className={box}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      {pages > 1 && pager && (
        <nav className="mt-[28px] flex items-center gap-1" aria-label={tn("pagination")}>
          {cur > 0 && (
            <>
              <PagerTab onClick={() => goto(0)}>{pager.first}</PagerTab>
              <PagerTab onClick={() => goto(cur - 1)}>{pager.prev}</PagerTab>
            </>
          )}
          {cur < pages - 1 && (
            <>
              <PagerTab onClick={() => goto(cur + 1)}>{pager.next}</PagerTab>
              <PagerTab onClick={() => goto(pages - 1)}>{pager.last}</PagerTab>
            </>
          )}
          <span className="eyebrow ml-3 text-[var(--c-sub)]">
            {cur + 1} / {pages}
          </span>
        </nav>
      )}
    </div>
  );
}

function PagerTab({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("co-glass", "co-glass-btn", "eyebrow flex h-[34px] items-center px-4 text-[var(--c-fg)]")}>
      {children}
    </button>
  );
}
