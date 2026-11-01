"use client";
import DarkGradient from "@/components/backdrop/DarkGradient";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { scrollToTarget } from "@/lib/lenis";
import { Arrow } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";
import CharRevealInView from "./CharRevealInView";
import DateBadge from "./DateBadge";
import { Download } from "./Icons";
import Pagination from "./Pagination";
import Select from "./Select";
import s from "./news-classes";

export type PressItem = { slug: string; title: string; year: string; date: string; pdf?: string };

const PAGE = 4;

/**
 * Sharplink "Press Releases" (investors-press-releases on /news): a dark section whose glow rises from the bottom;
 * the list sits in columns 4–12 behind a vertical dashed rule, the 68px heading reveals letter by letter, search +
 * year filter top-right, rows = 100px date badge · 56px gap · headline · 34px icon box, and the pager shows only
 * the moves that are possible (First / Previous / Next / Last).
 */
export default function PressList({ items, title }: { items: PressItem[]; title: string }) {
  const t = useTranslations("newsPage");
  const root = useRef<HTMLElement>(null);
  const [q, setQ] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);

  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b.localeCompare(a)), [items]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => (!year || i.year === year) && (!needle || i.title.toLowerCase().includes(needle)));
  }, [items, q, year]);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PAGE, current * PAGE);

  const goTo = (p: number) => {
    setPage(p);
    const head = root.current?.querySelector<HTMLElement>(".press-head");
    if (head && head.getBoundingClientRect().top < 0) scrollToTarget(head, -110, 1.4);
  };

  return (
    <section ref={root} id="press-releases" data-theme="dark" className="relative z-[2] text-off-white">
      {/* Sharplink .investors-press-releases .gradient on /news: black → green → arc into the light page, which the footer's
          own gradient then takes back to black. Their section is taller (six rows + 150px before the footer), so ours is
          sized to land its arc at the same place: just above the footer, giving their light band before the footer. */}
      <DarkGradient position="top" height="150%" />

      <div className="relative z-[1] grid grid-cols-1 gap-x-7 px-[clamp(16px,2.5vw,40px)] pb-[clamp(120px,14vw,260px)] pt-[clamp(40px,9vw,160px)] lg:grid-cols-12">
        <div className="press-inner relative lg:col-span-9 lg:col-start-4">
          <div className="pointer-events-none absolute -left-7 -top-40 bottom-[-120px] hidden w-px lg:block" aria-hidden>
            <DashedLine theme="dark" direction="vertical" />
          </div>
          {/* heading with the brand pin on its dashed top rule (Sharplink section-heading has-pin) */}
          <div className="press-head relative pt-7">
            <DashedLine theme="dark" className="top-0" />
            <span className="absolute left-0 top-0 h-[6px] w-[6px] -translate-y-1/2 bg-green-400" aria-hidden />
            <div className="flex flex-col gap-8 lg:block">
              <CharRevealInView text={title} className="h1-sm lg:mb-[84px] lg:max-w-[50%]" />
              <div className={cn(s.surface, "flex flex-wrap gap-3 lg:absolute lg:right-0 lg:top-7")}>
                <label className="relative">
                  <span className="sr-only">{t("filters.searchLabel")}</span>
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder={t("filters.search")}
                    className={cn(s.control, s.search, "w-[212px]")}
                  />
                </label>
                <Select
                  label={t("filters.year")}
                  value={year}
                  onChange={(v) => {
                    setYear(v);
                    setPage(1);
                  }}
                  options={[{ value: "", label: t("filters.selectYear") }, ...years.map((y) => ({ value: y, label: y }))]}
                />
              </div>
            </div>
          </div>

          <ul className="press-rows relative mt-12 lg:mt-0">
            {shown.map((p) => (
              <li key={p.slug} className="press-row relative">
                <DashedLine theme="dark" className="top-0" />
                <div className={cn(s.surface, "flex flex-col gap-4 pb-[25px] pt-7 md:flex-row md:items-start md:gap-14")}>
                  <DateBadge className="md:w-[100px]">{p.date}</DateBadge>
                  <Link href={`/news/${p.slug}` as never} className="link max-w-[676px] self-center text-[16px] font-medium leading-[1.35] md:mr-auto">
                    {p.title}
                  </Link>
                  <div className="flex gap-[2px] md:ml-auto">
                    {p.pdf && (
                      <a href={p.pdf} target="_blank" rel="noreferrer" aria-label={`${t("download")}: ${p.title}`} className={s.iconBox}>
                        <Download />
                      </a>
                    )}
                    <Link href={`/news/${p.slug}` as never} aria-label={`${t("open")}: ${p.title}`} className={s.iconBox}>
                      <Arrow />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
            {shown.length === 0 && (
              <li className="relative py-10">
                <DashedLine theme="dark" className="top-0" />
                <p className="text-off-white/60">{t("empty")}</p>
              </li>
            )}
          </ul>
          <Pagination mode="nav" className="mt-7" page={current} pages={pages} onPage={goTo} />
        </div>
      </div>
    </section>
  );
}
