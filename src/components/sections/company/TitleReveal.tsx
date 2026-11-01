"use client";
import { useMemo, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  text: string;
  className?: string;
  /** ScrollTrigger start for the one-shot play (Sharplink TextReveal: "top 80%") */
  start?: string;
  /** scrub between these positions instead of playing once (statements) */
  scrub?: { start: string; end: string };
  /** letters start at this opacity (Sharplink `initialOpacity`, 0.2 on statements) */
  initial?: number;
  /** "reading": letters switch on one after another in reading order (their ScrollTextReveal) instead of at random */
  order?: "random" | "reading";
};

/**
 * Sharplink `TextReveal`, scroll-triggered: every letter fades 0 → 1 in 0.3s power2.out from a random offset in
 * [0, 0.7s], played once when the block reaches "top 80%" (or scrubbed). Uses the global `.char-reveal .ch`
 * rule so letters are hidden before hydration.
 */
export default function TitleReveal({ as: Tag = "h2", text, className, start = "top 80%", scrub, initial = 0, order = "random" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const words = useMemo(() => text.split(" "), [text]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const chars = [...el.querySelectorAll<HTMLElement>(".ch")];
      if (prefersReducedMotion()) {
        gsap.set(chars, { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ paused: true });
      if (order === "reading") tl.to(chars, { opacity: 1, duration: 0.005, stagger: { each: 1 / chars.length }, ease: "none" });
      else chars.forEach((c) => tl.to(c, { opacity: 1, duration: 0.3, ease: "power2.out" }, Math.random() * 0.7));
      if (scrub) ScrollTrigger.create({ trigger: el, start: scrub.start, end: scrub.end, scrub: true, animation: tl });
      else ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tl.play() });
    },
    { scope: ref, dependencies: [text, order] },
  );

  return (
    <Tag ref={ref} className={cn("char-reveal", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block whitespace-nowrap" aria-hidden>
          {[...w].map((c, j) => (
            <span key={j} className="ch inline-block" style={initial ? { opacity: initial } : undefined}>
              {c}
            </span>
          ))}
          {i < words.length - 1 && (
            <span className="ch inline-block" style={initial ? { opacity: initial } : undefined}>
              &nbsp;
            </span>
          )}
        </span>
      ))}
    </Tag>
  );
}
