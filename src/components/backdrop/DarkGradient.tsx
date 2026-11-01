"use client";
import { useRef, type CSSProperties } from "react";
import { ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Props = {
  /** "top": black at the element's top → green → transparent arc at its bottom (dark section fading into the light page
   *  below). "bottom": the same image flipped (light page → arc → green → black at the element's bottom). */
  position?: "top" | "bottom";
  /** CSS height of the element (Sharplink sets it per section: "120%", "130%", "calc(100% + 500px)", "1000px" …) */
  height?: string;
  /** height below 800px when Sharplink sets a different one (defaults to `height`) */
  heightMobile?: string;
  parallax?: boolean;
  speed?: number;
  initialScale?: number;
  triggerStart?: string;
  triggerEnd?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Port of Sharplink's SiteGradientBgDark: their gradient-dark-transparent.png (recoloured to green, public/bg/gradient-dark.webp)
 * stretched over `width: calc(100% + 200px)` × `height`, absolutely positioned at the top (or, flipped, at the bottom) of
 * its section, and scaled on scroll: top variant scaleY 1.3 → 0.5 from "top top" to "bottom top", bottom variant
 * 1.3 → 2.1 from "top bottom" to "bottom center" (same trigger expressions, including their precedence quirk).
 * The parent must be `position: relative`; content that must sit above it needs `relative z-[1]` or higher.
 */
export default function DarkGradient({ position = "top", height = "100%", heightMobile, parallax = true, speed = 0.8, initialScale = 1.3, triggerStart, triggerEnd, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current!;
      el.style.setProperty("--ps", String(initialScale));
      if (!parallax || prefersReducedMotion()) return;
      const start = triggerStart || position === "top" ? "top top" : "top bottom";
      const end = triggerEnd || position === "top" ? "bottom top" : "bottom center";
      const st = ScrollTrigger.create({
        trigger: el,
        start,
        end,
        refreshPriority: -1,
        onUpdate: (s) => {
          const v = position === "top" ? initialScale - s.progress * speed : initialScale + s.progress * speed;
          el.style.setProperty("--ps", String(v));
        },
      });
      return () => st.kill();
    },
    { scope: ref },
  );

  const top = position === "top";
  // the image is 200px wider than the section (its arc ends off-screen); clip that sideways overhang here so the page
  // never gets wider than the window, while the vertical spill into the neighbouring section stays visible
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-x-clip">
    <div
      ref={ref}
      aria-hidden
      data-dg={position}
      className={cn("pointer-events-none absolute left-1/2 z-0 overflow-hidden [--dgh:var(--dgh-m)] min-[800px]:[--dgh:var(--dgh-d)]", className)}
      style={{
        ["--dgh-d" as string]: height,
        ["--dgh-m" as string]: heightMobile ?? height,
        width: "calc(100% + 200px)",
        height: "var(--dgh)",
        top: top ? -1 : "auto",
        bottom: top ? "auto" : -1,
        transform: top ? "translate(-50%) scaleY(var(--ps, 1.3))" : "translate(-50%) rotate(180deg) scaleY(var(--ps, 1.3)) translateY(100%)",
        transformOrigin: top ? "top center" : "bottom center",
        willChange: "transform",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bg/gradient-dark.webp" alt="" draggable={false} className="block h-full w-full" style={{ objectFit: "fill" }} />
    </div>
    </div>
  );
}
