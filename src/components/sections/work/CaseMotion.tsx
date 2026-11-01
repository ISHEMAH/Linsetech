"use client";
import { useRef, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import styles from "./case.module.css";

/**
 * Puture's scroll reveals for a case page (their ContactDialog chunk, measured):
 *  - `[data-chars]`: split into lines/words/chars; each line is a soft-masked "emerge line" and the letters rise
 *    from yPercent 100, blur(6px) and opacity 0 in 1.4s power3.out, 0.022s apart, when the heading crosses 88 %.
 *  - `[data-fade]`: from y 40 / opacity 0 in 1.1s expo.out when the element crosses 90 %.
 * Both reverse when scrolled back above their start (toggleActions "play none none reverse").
 */
export default function CaseMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      if (prefersReducedMotion()) return;
      el.querySelectorAll<HTMLElement>("[data-chars]").forEach((h) => {
        const intro = h.dataset.chars === "intro";
        SplitText.create(h, {
          type: "lines,words,chars",
          linesClass: styles.emergeLine,
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 100,
              opacity: 0,
              filter: "blur(6px)",
              duration: 1.4,
              ease: "power3.out",
              stagger: 0.022,
              ...(intro ? { delay: 0.15 } : { scrollTrigger: { trigger: h, start: "top 88%", toggleActions: "play none none reverse" } }),
            }),
        });
      });
      el.querySelectorAll<HTMLElement>("[data-fade]").forEach((f) => {
        gsap.from(f, { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: f, start: "top 90%", toggleActions: "play none none reverse" } });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
