"use client";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Pauses the render loop while the canvas is off-screen, and nudges a resize after mount:
 * under some device emulations the ResizeObserver never fires its first measurement,
 * which leaves the canvas at its default 300×150.
 */
export function useCanvasVisible(): [RefObject<HTMLDivElement | null>, boolean] {
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const id = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 350);
    return () => {
      io.disconnect();
      window.clearTimeout(id);
    };
  }, []);
  return [wrap, visible];
}
