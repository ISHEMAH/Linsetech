"use client";
import { cn } from "@/lib/cn";
import { Chevron } from "./Icons";
import s from "./news-classes";

/** Sharplink filter select: narrow uppercase on a 34px surface, a 2px gap, then the 32px chevron box. */
export default function Select({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <label className={cn(s.surface, s.selectWrap, className)}>
      <span className="sr-only">{label}</span>
      <select className={cn(s.control, s.select)} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className={s.chevron} aria-hidden>
        <Chevron />
      </span>
    </label>
  );
}
