"use client";
import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/lenis";
import { cn } from "@/lib/cn";

/**
 * Sharplink investors rail: stacked 34 px chips (2 px apart) stuck 123 px from the top of the window in columns 1–3;
 * the chip of the section crossing the window's 45 % line is solid off-white with the 6 px brand square, the others
 * are glass (surface-lighter, blur 20). Clicking glides to the section (Lenis, 1.4 s).
 */
export default function AboutRail({ items, label }: { items: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const triggers = items.map((it) =>
      ScrollTrigger.create({
        trigger: `#${it.id}`,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => self.isActive && setActive(it.id),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-[123px] flex flex-col items-start gap-[2px]">
      {items.map((it) => {
        const on = active === it.id;
        return (
          <a
            key={it.id}
            href={`#${it.id}`}
            aria-current={on ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget(`#${it.id}`, -110);
            }}
            className={cn(
              "eyebrow flex h-[34px] items-center gap-2 px-4 backdrop-blur-[20px] transition-colors duration-[250ms] ease-[cubic-bezier(0.455,0.03,0.515,0.955)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-green-400",
              on ? "bg-off-white text-ink" : "bg-[rgba(238,238,240,0.1)] text-off-white hover:bg-[rgba(238,238,240,0.18)]",
            )}
          >
            {on && <span className="block h-[6px] w-[6px] bg-green-400" aria-hidden />}
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
