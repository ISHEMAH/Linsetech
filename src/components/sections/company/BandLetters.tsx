"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/**
 * Sharplink InvestorsNasdaq: only the letters of the quote symbol ("Nasdaq CM:SBET") and of the price ("6.74") move in
 * that block — they start hidden and, once the block reaches "top 80%", each fades in over 1s (power2.out) after its
 * own random delay of up to 0.7s. Every other cell is static. The trigger is the closest `[data-band-trigger]`.
 */
export default function BandLetters({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const letters = [...el.querySelectorAll<HTMLElement>(".bl")];
      if (prefersReducedMotion()) {
        gsap.set(letters, { opacity: 1 });
        return;
      }
      ScrollTrigger.create({
        trigger: el.closest<HTMLElement>("[data-band-trigger]") ?? el,
        start: "top 80%",
        once: true,
        onEnter: () => letters.forEach((l) => gsap.to(l, { opacity: 1, duration: 1, delay: Math.random() * 0.7, ease: "power2.out" })),
      });
    },
    { scope: ref, dependencies: [text] },
  );

  const words = text.split(" ");
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={i} aria-hidden>
          <span className="inline-block whitespace-nowrap">
            {[...w].map((c, j) => (
              <span key={j} className="bl inline-block" style={{ opacity: 0 }}>
                {c}
              </span>
            ))}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
