"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * A dark plate over a light section's background that fades out as the section scrolls in, so a dark section
 * above hands over to a light one without a hard cut (same scrubbed dark → light turn as Sharplink's opportunity
 * statement). Place it first inside a `relative` section; give the content `relative` so it sits above.
 */
export default function TurnLight({ from = "#020a07", start = "top bottom", end = "top 20%" }: { from?: string; start?: string; end?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current!;
      gsap.fromTo(el, { opacity: 1 }, { opacity: 0, ease: "none", scrollTrigger: { trigger: el.parentElement!, start, end, scrub: true } });
    },
    { scope: ref },
  );
  return <div ref={ref} className="pointer-events-none absolute inset-0" style={{ background: from }} aria-hidden />;
}
