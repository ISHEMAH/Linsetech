"use client";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

/**
 * Sharplink BlogLatestArticles on phones: a swipe carousel (cards 90 % wide, 20px apart, snapping to the start, the next
 * card peeking in) with previous / next secondary icon buttons above its top-right corner, each disabled at its end.
 */
export default function NewsSlider({ children, prev, next }: { children: ReactNode; prev: string; next: string }) {
  const track = useRef<HTMLUListElement>(null);
  const count = Children.count(children);
  const [edge, setEdge] = useState({ prev: false, next: count > 1 });

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

  return (
    <div className="relative pt-14 min-[800px]:hidden">
      {count > 1 && (
        <div className="absolute right-0 top-0 flex -translate-y-full gap-1">
          <Button variant="secondary" icon={<Chevron dir="left" />} aria-label={prev} disabled={!edge.prev} onClick={() => step(-1)} />
          <Button variant="secondary" icon={<Chevron dir="right" />} aria-label={next} disabled={!edge.next} onClick={() => step(1)} />
        </div>
      )}
      <ul ref={track} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 [scroll-padding-inline:16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-lenis-prevent-touch>
        {Children.map(children, (c) => (
          <li className="w-[90%] shrink-0 snap-start">{c}</li>
        ))}
      </ul>
    </div>
  );
}
