"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { scrollToTarget } from "@/lib/lenis";
import DashedLine from "@/components/ui/DashedLine";
import DateBadge from "@/components/sections/news/DateBadge";
import NewsCover from "@/components/sections/news/NewsCover";
import Pagination from "@/components/sections/news/Pagination";
import ReadMore from "@/components/sections/news/ReadMore";
import Select from "@/components/sections/news/Select";
import { cn } from "@/lib/cn";
import s from "@/components/sections/news/news-classes";
import type { PostCategory } from "@/content/news";

export type ListItem = { slug: string; title: string; category: PostCategory; year: string; date: string; catLabel: string; tag: string };

const PAGE = 6;

/**
 * Sharplink "All blogs" (section.news-news): heading left, filters right (search box, then category + year
 * dropdowns), rows of date badge · title + read-more · 182px thumbnail separated by dashed rules, then the pager
 * (prev · numbered squares · next) with "Showing x–y of n items". Filtering and paging are client-side. Like theirs:
 * the search applies 300ms after the last keystroke, and any filter or page change goes back to page one / to the
 * list (`lenis.scrollTo(section, { offset: -100 })`, the instance's lerp). Rows never animate in.
 */
export default function NewsList({ items, title }: { items: ListItem[]; title: string }) {
  const t = useTranslations("newsPage");
  const root = useRef<HTMLElement>(null);
  const [cat, setCat] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [needle, setNeedle] = useState("");

  // their refDebounced(search, 300)
  useEffect(() => {
    const id = window.setTimeout(() => setNeedle(q.trim().toLowerCase()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const cats = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b.localeCompare(a)), [items]);
  const list = useMemo(
    () => items.filter((i) => (!cat || i.category === cat) && (!year || i.year === year) && (!needle || `${i.title} ${i.catLabel}`.toLowerCase().includes(needle))),
    [items, cat, year, needle],
  );
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE, current * PAGE);
  const from = list.length ? (current - 1) * PAGE + 1 : 0;
  const to = (current - 1) * PAGE + shown.length;

  const toList = () => {
    if (root.current) scrollToTarget(root.current, -100, null);
  };
  const goTo = (p: number) => {
    setPage(p);
    toList();
  };

  return (
    <section ref={root} data-theme="dark" className="relative z-[2] bg-black pb-[clamp(80px,9vw,160px)] text-off-white">
      <div className="news-head flex flex-col gap-6 px-[clamp(16px,2.5vw,40px)] pb-14 pt-[clamp(96px,10vw,180px)] md:flex-row md:items-center md:justify-between">
        <h2 className="text-[clamp(26px,2.2vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]">{title}</h2>
        <div className="flex flex-wrap gap-3">
          <label className={cn(s.surface, "relative grow md:grow-0")}>
            <span className="sr-only">{t("filters.searchArticles")}</span>
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
                toList();
              }}
              placeholder={t("filters.search")}
              className={cn(s.control, s.search, "w-full md:w-[212px]")}
            />
          </label>
          <Select
            label={t("filters.category")}
            value={cat}
            onChange={(v) => {
              setCat(v);
              setPage(1);
              toList();
            }}
            options={[{ value: "", label: t("filters.allCategories") }, ...cats.map((c) => ({ value: c, label: t(`categories.${c}`) }))]}
          />
          <Select
            label={t("filters.year")}
            value={year}
            onChange={(v) => {
              setYear(v);
              setPage(1);
              toList();
            }}
            options={[{ value: "", label: t("filters.allYears") }, ...years.map((y) => ({ value: y, label: y }))]}
          />
        </div>
      </div>

      <ul className="news-rows relative">
        {shown.map((p) => (
          <li key={p.slug} className="news-row relative">
            <DashedLine theme="dark" className="top-0" />
            <Link href={`/news/${p.slug}` as never} className={cn(s.row, "group flex flex-col gap-4 px-[clamp(16px,2.5vw,40px)] py-5 md:flex-row md:gap-5")}>
              <div className="flex shrink-0 items-center gap-3 md:w-[152px] md:flex-col md:items-start">
                <DateBadge>{p.date}</DateBadge>
                <span className="font-narrow text-[12px] font-medium uppercase tracking-[0.08em] text-off-white/45">{p.catLabel}</span>
              </div>
              <div className="min-w-0 md:max-w-[775px] md:flex-1">
                <h3 className="line-clamp-2 text-[clamp(17px,1.25vw,19px)] font-medium leading-[1.35]">{p.title}</h3>
                <ReadMore label={t("readMore")} className="mt-4" />
              </div>
              <div className="hidden w-[182px] shrink-0 md:ml-auto md:block">
                <NewsCover title={p.title} category={p.category} tag={p.tag} ratio="182 / 102" pins={false} />
              </div>
            </Link>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="relative px-[clamp(16px,2.5vw,40px)] py-10">
            <DashedLine theme="dark" className="top-0" />
            <p className="text-off-white/60">{t("empty")}</p>
            <button
              type="button"
              className={cn(s.surface, s.pagerBtn, "mt-5")}
              onClick={() => {
                setCat("");
                setYear("");
                setQ("");
                setNeedle("");
                setPage(1);
              }}
            >
              {t("reset")}
            </button>
          </li>
        )}
        <DashedLine theme="dark" className="bottom-0" />
      </ul>

      <Pagination className="px-[clamp(16px,2.5vw,40px)] pt-14" page={current} pages={pages} onPage={goTo} total={list.length} from={from} to={to} />
    </section>
  );
}
