"use client";
import { useRef, type ElementType, type ReactNode, type RefObject } from "react";
import { gsap, SplitText, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

/** Handle of a manual reveal (Sharplink TextReveal's exposed play / reverse). */
export type RevealControl = { play: () => void; reverse: () => void };

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** unit that fades in: chars (Sharplink's TextReveal letters), words or lines */
  type?: "words" | "lines" | "chars";
  delay?: number;
  start?: string;
  /** fixed stagger between units instead of Sharplink's random offsets */
  stagger?: number;
  /**
   * opt-in: no scroll trigger of its own (Sharplink `auto-trigger: false`); the caller plays and reverses the reveal
   * through `controlRef`, e.g. from a callback inside a pinned timeline
   */
  manual?: boolean;
  controlRef?: RefObject<RevealControl | null>;
};

/**
 * Sharplink `TextReveal`: the block stays invisible until it enters the viewport (`top 80%`); then every letter
 * fades in (`opacity → 1`, 0.3s power2.out) at a random offset inside a 0.7s window, so the headline "develops"
 * rather than slides. No line masks, no movement — exactly their `.text-reveal .word > .letter` choreography.
 */
export default function SplitReveal({ as: Tag = "h2", children, className, type = "chars", delay = 0, start = "top 80%", stagger, manual = false, controlRef }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1 });
        if (controlRef) controlRef.current = { play: () => gsap.set(el, { opacity: 1 }), reverse: () => {} };
        return;
      }
      const split = SplitText.create(el, {
        type: type === "lines" ? "lines" : "chars,words",
        linesClass: "line",
        wordsClass: "word",
        charsClass: "letter",
        autoSplit: type === "lines",
        onSplit: (self) => {
          const units = type === "lines" ? self.lines : type === "words" ? self.words : self.chars;
          gsap.set(units, { opacity: 0 });
          const tl = gsap.timeline({ paused: true, delay });
          units.forEach((u, i) => tl.to(u, { opacity: 1, duration: 0.3, ease: "power2.out" }, stagger != null ? i * stagger : Math.random() * 0.7));
          if (manual) {
            // their play(): the block jumps to opacity 1 and the letters develop; reverse() runs the letters back
            if (controlRef)
              controlRef.current = {
                play: () => {
                  gsap.to(el, { opacity: 1, duration: 0 });
                  tl.play();
                },
                reverse: () => {
                  tl.reverse();
                },
              };
            return tl;
          }
          ScrollTrigger.create({
            trigger: el,
            start,
            once: true,
            onEnter: () => {
              gsap.set(el, { opacity: 1 });
              tl.play();
            },
          });
          return tl;
        },
      });
      return () => {
        if (controlRef) controlRef.current = null;
        split.revert();
      };
    },
    { scope: ref, dependencies: [type, delay, start, stagger, manual] },
  );

  return (
    <Tag ref={ref} className={cn("text-reveal", className)}>
      {children}
    </Tag>
  );
}
