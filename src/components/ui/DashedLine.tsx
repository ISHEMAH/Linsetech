"use client";
import { useId, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  direction?: "horizontal" | "vertical";
  /** dark = off-white dashes (on dark sections), light = black dashes */
  theme?: "dark" | "light";
  className?: string;
  /** fade the line in along its length (Sharplink pre-footer lines) */
  fade?: boolean;
  /**
   * Fade the line in when its parent enters the viewport. Sharplink's lines never "draw": they fade with their
   * section (`autoAlpha 0 → 1`, linear) — e.g. `.home-productivity .line` in the pinned timeline.
   */
  reveal?: boolean;
};

/** Sharplink's svg-dashed-line: 2px dashes with a 4px period, absolutely positioned by the caller. */
export default function DashedLine({ direction = "horizontal", theme = "light", className, fade = false, reveal = false }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const horizontal = direction === "horizontal";
  const color = theme === "dark" ? "var(--stroke-off-white-subtle)" : "var(--stroke-black-subtle)";

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !reveal || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top 85%", once: true } },
      );
    },
    { scope: ref, dependencies: [reveal] },
  );

  return (
    <svg
      ref={ref}
      className={cn("pointer-events-none absolute block", horizontal ? "left-0 h-px w-full" : "top-0 h-full w-px", className)}
      width={horizontal ? "100%" : 1}
      height={horizontal ? 1 : "100%"}
      preserveAspectRatio="none"
      aria-hidden
      style={{ color, shapeRendering: "geometricPrecision" }}
    >
      <defs>
        <pattern id={`p${id}`} x="0" y="0" width={horizontal ? 4 : 1} height={horizontal ? 1 : 4} patternUnits="userSpaceOnUse">
          {horizontal ? <rect x="0" y="0" width="2" height="1" fill="currentColor" /> : <rect x="0" y="0" width="1" height="2" fill="currentColor" />}
        </pattern>
        {fade && (
          <linearGradient id={`g${id}`} x1="0%" y1="0%" x2={horizontal ? "100%" : "0%"} y2={horizontal ? "0%" : "100%"}>
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
        )}
        {fade && (
          <mask id={`m${id}`}>
            <rect width="100%" height="100%" fill={`url(#g${id})`} />
          </mask>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#p${id})`} mask={fade ? `url(#m${id})` : undefined} />
    </svg>
  );
}
