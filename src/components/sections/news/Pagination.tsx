"use client";
import { useTranslations } from "next-intl";
import { Arrow } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ArrowLeft } from "./Icons";
import s from "./news-classes";

type Props = {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  /** "numbers" = Sharplink .article-pagination (prev · squares · next + "Showing …");
   *  "nav" = their press list (b2iNav): only the active First / Previous / Next / Last buttons */
  mode?: "numbers" | "nav";
  total?: number;
  from?: number;
  to?: number;
  className?: string;
};

export default function Pagination({ page, pages, onPage, mode = "numbers", total = 0, from = 0, to = 0, className }: Props) {
  const t = useTranslations("newsPage.pagination");

  if (mode === "nav") {
    if (pages <= 1) return null;
    const btns: { key: string; label: string; to: number }[] = [];
    if (page > 1) btns.push({ key: "first", label: t("first"), to: 1 }, { key: "previous", label: t("previous"), to: page - 1 });
    if (page < pages) btns.push({ key: "next", label: t("next"), to: page + 1 }, { key: "last", label: t("last"), to: pages });
    return (
      <nav aria-label={t("label")} className={cn(s.surface, "flex flex-wrap items-center gap-1", className)}>
        {btns.map((b) => (
          <button key={b.key} type="button" className={s.pagerBtn} onClick={() => onPage(b.to)}>
            {b.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label={t("label")} className={cn(s.surface, "flex flex-wrap items-center gap-4", className)}>
      <div className="flex items-center gap-[2px]">
        {page > 1 && (
          <button type="button" className={s.pagerBtn} onClick={() => onPage(page - 1)}>
            <ArrowLeft />
            {t("prev")}
          </button>
        )}
        {Array.from({ length: Math.max(1, pages) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={cn(s.pagerBtn, s.square)}
            aria-current={n === page ? "page" : undefined}
            aria-label={t("page", { n })}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        {page < pages && (
          <button type="button" className={s.pagerBtn} onClick={() => onPage(page + 1)}>
            {t("next")}
            <Arrow className="h-3 w-3" />
          </button>
        )}
      </div>
      <p className="ml-auto font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-[var(--fg-subtle)]" aria-live="polite">
        {total === 0 ? "" : from === to ? t("showingOne", { from, total }) : t("showing", { from, to, total })}
      </p>
    </nav>
  );
}
