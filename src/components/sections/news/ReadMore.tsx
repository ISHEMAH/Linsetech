"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Arrow } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import s from "./news-classes";

/**
 * Sharplink `ui-button secondary hide-text has-icon`: a lone arrow box whose label ("Read more") drops in from below
 * while the box slides right by the label's width when the button or its parent link is hovered. The label width is
 * measured like Sharplink's `--content-width` (re-measured when the webfont swaps in).
 */
export default function ReadMore({ label, icon, className }: { label: string; icon?: ReactNode; className?: string }) {
  const content = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState(0);

  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    const measure = () => setW(el.offsetWidth);
    measure();
    document.fonts?.ready.then(measure);
  }, [label]);

  const ic = icon ?? <Arrow />;
  return (
    <span className={cn(s.surface, s.readMore, "w-fit", className)} style={{ "--rm-w": `${w}px` } as CSSProperties} aria-hidden>
      <span ref={content} className={s.rmContent}>
        <span>{label}</span>
        <span>{label}</span>
      </span>
      <span className={s.rmIcon}>
        <span>{ic}</span>
        <span>{ic}</span>
      </span>
    </span>
  );
}
