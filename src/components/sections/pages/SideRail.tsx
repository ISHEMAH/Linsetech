"use client";
import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/lenis";
import { cn } from "@/lib/cn";

/** Sharplink Investors pattern: sticky in-page nav on the left; the active section highlights. */
export default function SideRail({ items }: { items: { id: string; label: string }[] }) {
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
    <nav className="sticky top-28 hidden self-start lg:block" aria-label="Sections">
      <ul className="space-y-1 border-l border-ink/10">
        {items.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => scrollToTarget(`#${it.id}`, -100)}
              className={cn(
                "-ml-px block border-l-2 py-1.5 pl-4 text-left text-sm transition-colors",
                active === it.id ? "border-green-500 text-ink" : "border-transparent text-ink/50 hover:text-ink",
              )}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
