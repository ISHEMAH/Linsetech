"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Pauses the render loop while the canvas is away from the screen, and nudges a resize after mount when needed:
 * under some device emulations the ResizeObserver never fires its first measurement, which leaves the canvas at its
 * default 300×150.
 *
 * The loop runs from `margin` beyond the viewport, so a scene has drawn its current frame before it scrolls in
 * (starting it on entry showed the bare canvas background for a frame or two: the black flash between Work and
 * Process in Safari). The nudge is a window resize, which makes ScrollTrigger refresh the whole page: only sent when
 * the canvas really kept its default size, never for a canvas mounting mid-scroll.
 */
export function useCanvasVisible(margin = "50% 0px"): [RefObject<HTMLDivElement | null>, boolean] {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    const id = window.setTimeout(() => {
      const canvas = el.querySelector("canvas");
      if (canvas && canvas.width === 300 && canvas.height === 150 && el.clientWidth > 0 && el.clientWidth !== 300) window.dispatchEvent(new Event("resize"));
    }, 350);
    return () => {
      io.disconnect();
      window.clearTimeout(id);
    };
  }, [margin]);
  return [wrap, visible];
}
