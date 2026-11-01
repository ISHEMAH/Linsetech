"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import { Chevron } from "@/components/sections/company/icons";
import { cn } from "@/lib/cn";
import type { PostCategory } from "@/content/news";
import DateBadge from "./DateBadge";
import NewsCover from "./NewsCover";
import ReadMore from "./ReadMore";

export type RelatedItem = { slug: string; title: string; date: string; category: PostCategory; tag: string };

type Labels = { title: string; readMore: string; prev: string; next: string };

/** Sharplink CardArticle: pinned 768/432 thumb, date badge, title (16px, 24px from 800px, 3 lines), hide-text "Read more". */
function Card({ item, readMore, className }: { item: RelatedItem; readMore: string; className?: string }) {
  return (
    <Link href={`/news/${item.slug}` as never} className={cn("group flex flex-col gap-5 min-[800px]:gap-4", className)}>
      <NewsCover title={item.title} category={item.category} tag={item.tag} />
      <DateBadge theme="light">{item.date}</DateBadge>
      <h3 className="line-clamp-3 text-[16px] font-medium leading-[1.35] min-[800px]:text-[24px] min-[800px]:leading-[1.4] min-[800px]:tracking-[-0.24px]">{item.title}</h3>
      <ReadMore label={readMore} />
    </Link>
  );
}

/**
 * Sharplink's related articles under a blog post (`.related-articles` + BlogLatestArticles):
 * - 160px under the article (150px on phones): a pinned dashed rule across three columns, the 52px title (32px) in the
 *   first, paired dashed verticals on both sides of each gutter;
 * - desktop: the three cards side by side, 52px under the heading, the same verticals running down;
 * - phones: a swipe carousel (cards 90 % wide, 20px apart, snapping to the start) with previous / next secondary icon
 *   buttons at its top right, each disabled at its end.
 */
export default function RelatedArticles({ items, labels }: { items: RelatedItem[]; labels: Labels }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: items.length > 1 });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const step = (d: number) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    el.scrollBy({ left: d * (card.offsetWidth + 20), behavior: "smooth" });
  };

  if (!items.length) return null;
  const cols = [0, 1, 2];
  return (
    <section className="mt-[150px] min-[800px]:mt-[160px]" data-print-hide>
      {/* heading row */}
      <div className="relative grid grid-cols-1 gap-x-7 min-[800px]:grid-cols-3">
        <DashedLine className="top-0" />
        <span className="absolute left-0 top-0 z-[1] h-[6px] w-[6px] bg-green-400" aria-hidden />
        {cols.map((c) => (
          <div key={c} className={cn("relative pt-7", c > 0 && "hidden min-[800px]:block")}>
            {c === 0 && <h2 className="text-[32px] font-medium leading-[1.16] tracking-[-0.32px] min-[800px]:text-[52px] min-[800px]:font-normal min-[800px]:leading-[1.04] min-[800px]:tracking-[-1.3px]">{labels.title}</h2>}
            {c < 2 && <DashedLine direction="vertical" className="right-0 hidden min-[800px]:block" />}
            {c > 0 && <DashedLine direction="vertical" className="left-0" />}
          </div>
        ))}
      </div>

      {/* desktop: three columns */}
      <ul className="hidden grid-cols-3 gap-x-7 min-[800px]:grid">
        {cols.map((c) => (
          <li key={c} className="relative pt-[52px]">
            {items[c] && <Card item={items[c]} readMore={labels.readMore} />}
            {c < 2 && <DashedLine direction="vertical" className="right-0" />}
            {c > 0 && <DashedLine direction="vertical" className="left-0" />}
          </li>
        ))}
      </ul>

      {/* phones: carousel */}
      <div className="relative pt-[44px] min-[800px]:hidden">
        {items.length > 1 && (
          <div className="absolute right-0 top-0 flex -translate-y-full gap-1">
            <Button variant="secondary" icon={<Chevron dir="left" />} aria-label={labels.prev} disabled={!edge.prev} onClick={() => step(-1)} />
            <Button variant="secondary" icon={<Chevron dir="right" />} aria-label={labels.next} disabled={!edge.next} onClick={() => step(1)} />
          </div>
        )}
        <ul
          ref={track}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 [scroll-padding-inline:16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => (
            <li key={it.slug} className="w-[90%] shrink-0 snap-start">
              <Card item={it} readMore={labels.readMore} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
