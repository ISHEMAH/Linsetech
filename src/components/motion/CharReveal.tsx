"use client";
import { useMemo, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  as?: ElementType;
  text: string;
  className?: string;
  /** play once after this delay (seconds) … */
  delay?: number;
  /** … or scrub between these ScrollTrigger positions on the element */
  scrub?: { start: string; end: string };
  /** total length of the reveal; Sharplink's is 1s (0.7s of random offsets + 0.3s per letter) */
  duration?: number;
};

/**
 * Sharplink `TextReveal` on a plain string: each letter fades to full opacity in 0.3s (power2.out) starting at a
 * random point inside the first `duration - 0.3` seconds. Letters start from whatever opacity the CSS gives `.ch`
 * (0 by default, e.g. 0.2 for the statement that scrubs), like their `initialOpacity` prop.
 */
export default function CharReveal({ as: Tag = "h1", text, className, delay = 0.3, scrub, duration = 1 }: Props) {
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
      const window = Math.max(0, duration - 0.3);
      const tl = gsap.timeline({ paused: true, delay: scrub ? 0 : delay });
      chars.forEach((c) => tl.to(c, { opacity: 1, duration: 0.3, ease: "power2.out" }, Math.random() * window));
      if (scrub) ScrollTrigger.create({ trigger: el, start: scrub.start, end: scrub.end, scrub: true, animation: tl });
      else tl.play();
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref} className={cn("char-reveal", className)} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block whitespace-nowrap" aria-hidden>
          {[...w].map((c, j) => (
            <span key={j} className="ch inline-block">
              {c}
            </span>
          ))}
          {i < words.length - 1 && <span className="ch inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
