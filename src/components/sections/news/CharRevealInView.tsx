"use client";
import { useMemo, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/**
 * Sharplink TextReveal for headings below the fold (e.g. "Press Releases"): letters stay at opacity 0 until the
 * heading enters the viewport, then each fades in over 0.3s at a random offset inside 0.7s (once).
 */
export default function CharRevealInView({ as: Tag = "h2", text, className, start = "top 85%" }: { as?: ElementType; text: string; className?: string; start?: string }) {
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
      chars.forEach((c) => tl.to(c, { opacity: 1, duration: 0.3, ease: "power2.out" }, Math.random() * 0.7));
      ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tl.play() });
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
