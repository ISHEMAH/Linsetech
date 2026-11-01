"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { whenNear } from "@/lib/near";

/**
 * Renders its children only once this box comes within `margin` of the viewport, so a heavy scene far down the page
 * (three.js, its HDR, a dynamic chunk) is not built on arrival. The box keeps the layout; give it the classes the
 * child used to position itself, and let the child fill it.
 */
export default function WhenNear({ children, margin, className }: { children: ReactNode; margin?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    return whenNear(el, () => setNear(true), margin);
  }, [near, margin]);
  return (
    <div ref={ref} className={className}>
      {near ? children : null}
    </div>
  );
}
