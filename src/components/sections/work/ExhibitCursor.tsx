"use client";
import { useEffect, useRef } from "react";
import { Arrow } from "@/components/ui/Button";
import { scrambleLabel } from "./decode";

/** The hovered exhibit as the floor sees it every frame: index (−1 = none) and the hover amount (0–1, linear .6s in / .45s out). */
export type ExhibitHover = { index: number; amount: number };

/**
 * Puture's `.exhibit-cursor` (their ContactDialog chunk): a "View project →" button at pointer +18/+18 that catches up
 * with a .22 lerp per frame, its opacity following the hover amount, and its label re-decoding (.6s, speed .9) each time
 * a new exhibit is hovered. The floor raycasts every frame and writes `hover`; the click itself is the panel's (it
 * leaves through the pixel wave). WorkChapter mounts one; a standalone mount without `hover` renders nothing.
 */
export default function ExhibitCursor({ label, hover }: { label: string; hover?: ExhibitHover }) {
  const el = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!hover) return;
    const pointer = { x: 0, y: 0 };
    const pos = { x: 0, y: 0, amount: 0 };
    let last = -1;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const node = el.current;
      if (!node) return;
      const a = hover.amount;
      if (a > 0 || pos.amount > 0) {
        if (pos.amount === 0) {
          pos.x = pointer.x;
          pos.y = pointer.y;
        }
        pos.x += (pointer.x - pos.x) * 0.22;
        pos.y += (pointer.y - pos.y) * 0.22;
        node.style.opacity = a.toFixed(3);
        node.style.visibility = a > 0.01 ? "visible" : "hidden";
        node.style.transform = `translate3d(${(pos.x + 18).toFixed(1)}px, ${(pos.y + 18).toFixed(1)}px, 0)`;
      }
      pos.amount = a;
      if (hover.index !== last) {
        if (hover.index >= 0) scrambleLabel(text.current, label);
        last = hover.index;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [hover, label]);

  if (!hover) return null;
  return (
    <span
      ref={el}
      className="ui-btn ui-btn--primary has-icon pointer-events-none z-[70] max-md:hidden"
      // .ui-btn (unlayered) sets position: relative, which would beat a layered `fixed` utility
      style={{ position: "fixed", left: 0, top: 0, opacity: 0, visibility: "hidden", willChange: "transform" }}
      aria-hidden
    >
      <span className="ui-btn__content">
        <span ref={text}>{label}</span>
      </span>
      <span className="ui-btn__icon">
        <span>
          <Arrow />
        </span>
      </span>
    </span>
  );
}
