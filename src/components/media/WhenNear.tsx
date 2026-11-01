"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { whenNear } from "@/lib/near";

/**
 * Renders its children only once this box comes within `margin` of the viewport, so a heavy scene far down the page
 * (three.js, its HDR, a dynamic chunk) is not built on arrival. The box keeps the layout; give it the classes the
 * child used to position itself, and let the child fill it.
 * `idle` (ms): mount anyway that long after arrival, at the browser's next idle moment — the scene is built (and its
 * shaders compiled) once the page has settled rather than while the visitor scrolls into it.
 */
export default function WhenNear({ children, margin, idle, className }: { children: ReactNode; margin?: string; idle?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const stop = whenNear(el, () => setNear(true), margin);
    if (idle === undefined) return stop;
    let idleId = 0;
    const timer = window.setTimeout(() => {
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => setNear(true), { timeout: 2000 });
      else setNear(true);
    }, idle);
    return () => {
      stop();
      window.clearTimeout(timer);
      if (idleId) window.cancelIdleCallback(idleId);
    };
  }, [near, margin, idle]);
  return (
    <div ref={ref} className={className}>
      {near ? children : null}
    </div>
  );
}
