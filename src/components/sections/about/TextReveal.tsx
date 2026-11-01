"use client";
import { useMemo, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  text: string;
  className?: string;
  /**
   * "enter": Sharplink `TextReveal` played once when the block reaches "top 80%" — every letter fades 0 → 1 in .3 s
   * (power2.out) from a random point inside the first .7 s (section headings, the quote).
   * "scrub": their people blurb — letters sit at `dim` opacity and light up in reading order, each over 0.05 of a
   * timeline whose starts spread over 0.9 (`stagger: { amount: 0.9 }`, so ~8 letters are lighting at any moment),
   * scrubbed between `start` and `end` (theirs: "top 60%" → "top 25%" of the black block, see `triggerClosest`).
   */
  mode?: "enter" | "scrub";
  dim?: number;
  start?: string;
  end?: string;
  /** scrub against the closest ancestor matching this selector instead of the text itself */
  triggerClosest?: string;
};

export default function TextReveal({ as: Tag = "p", text, className, mode = "enter", dim = 0.4, start, end, triggerClosest }: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = useMemo(() => text.split(" "), [text]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const chars = [...el.querySelectorAll<HTMLElement>(".tr-ch")];
      if (prefersReducedMotion()) {
        gsap.set(chars, { opacity: 1 });
        return;
      }
      if (mode === "scrub") {
        const tl = gsap.timeline({ paused: true });
        tl.to(chars, { opacity: 1, duration: 0.05, stagger: { amount: 0.9 }, ease: "none" });
        const trigger = (triggerClosest && el.closest<HTMLElement>(triggerClosest)) || el;
        ScrollTrigger.create({ trigger, start: start ?? "top 60%", end: end ?? "top 25%", scrub: true, animation: tl });
        return;
      }
      const tl = gsap.timeline({ paused: true });
      chars.forEach((c) => tl.to(c, { opacity: 1, duration: 0.3, ease: "power2.out" }, Math.random() * 0.7));
      ScrollTrigger.create({ trigger: el, start: start ?? "top 80%", once: true, onEnter: () => tl.play() });
    },
    { scope: ref, dependencies: [text, mode, triggerClosest] },
  );

  return (
    <Tag ref={ref} className={cn(className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c, j) => (
              <span key={j} className="tr-ch inline-block" style={{ opacity: mode === "scrub" ? dim : 0 }}>
                {c}
              </span>
            ))}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
