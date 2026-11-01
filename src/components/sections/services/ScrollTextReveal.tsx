"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  paragraphs: string[];
  className?: string;
  /** opacity the letters start from (Sharplink `initialOpacity`, .4) */
  initialOpacity?: number;
  start?: string;
  end?: string;
};

/**
 * Sharplink `ScrollTextReveal`: every letter starts at 40 % and the letters switch on one after another in reading
 * order (`stagger.each = 1/n`, 0.005s each, linear), the timeline scrubbed from "top 50%" to "bottom 50%".
 * Letters are rendered on the server so nothing reflows when the script splits them.
 */
export default function ScrollTextReveal({ paragraphs, className, initialOpacity = 0.4, start = "top 50%", end = "bottom 50%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const letters = [...el.querySelectorAll<HTMLElement>(".l")];
      if (prefersReducedMotion()) {
        gsap.set(letters, { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(letters, { opacity: initialOpacity }, { opacity: 1, duration: 0.005, stagger: { each: 1 / letters.length }, ease: "none" });
      const st = ScrollTrigger.create({ animation: tl, trigger: el, start, end, scrub: true });
      return () => st.kill();
    },
    { scope: ref, dependencies: [paragraphs.join("|"), initialOpacity, start, end] },
  );

  return (
    <div ref={ref} className={cn("scroll-text-reveal", className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? "mt-[1lh]" : undefined}>
          <span className="sr-only">{p}</span>
          {p.split(/\s+/).map((w, j, arr) => (
            <span key={j} aria-hidden>
              <span className="inline-block whitespace-nowrap">
                {[...w].map((c, k) => (
                  <span key={k} className="l inline-block" style={{ opacity: initialOpacity }}>
                    {c}
                  </span>
                ))}
              </span>
              {j < arr.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
