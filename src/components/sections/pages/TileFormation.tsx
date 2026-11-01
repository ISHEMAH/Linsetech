"use client";
import { useMemo, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { Service } from "@/content/services";

const N = 30;

/** Puture-style tile set that gathers into a symbol for each service chapter. */
export function formationFor(kind: Service["formation"], i: number): [number, number, number] {
  const a = (i / N) * Math.PI * 2;
  switch (kind) {
    case "ring":
      return [0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4, (a * 180) / Math.PI];
    case "grid":
      return [0.14 + (i % 6) * 0.145, 0.2 + Math.floor(i / 6) * 0.145, 0];
    case "stack":
      return [0.5 + ((i % 3) - 1) * 0.16, 0.12 + Math.floor(i / 3) * 0.08, 0];
    case "wave":
      return [0.06 + i * 0.03, 0.5 + Math.sin(i * 0.6) * 0.28, Math.cos(i * 0.6) * 25];
    case "cube": {
      const layer = i % 3;
      const k = Math.floor(i / 3);
      return [0.3 + (k % 5) * 0.1 + layer * 0.05, 0.3 + Math.floor(k / 5) * 0.1 + layer * 0.05, 0];
    }
    default:
      return [0.05 + (i % 10) * 0.1, 0.35 + Math.floor(i / 10) * 0.15, 0];
  }
}

export default function TileFormation({ kind, dark = false, className }: { kind: Service["formation"]; dark?: boolean; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const tiles = useMemo(() => Array.from({ length: N }, (_, i) => i), []);
  useGSAP(
    () => {
      const el = root.current!;
      const t = el.querySelectorAll<HTMLElement>(".tile");
      t.forEach((tile, i) => {
        const [x, y, r] = formationFor(kind, i);
        gsap.fromTo(
          tile,
          { left: `${50 + (Math.random() - 0.5) * 90}%`, top: `${50 + (Math.random() - 0.5) * 90}%`, rotate: (Math.random() - 0.5) * 90, opacity: 0 },
          { left: `${x * 100}%`, top: `${y * 100}%`, rotate: r, opacity: 1, duration: prefersReducedMotion() ? 0 : 1.4, ease: "expo.out", delay: (i % 10) * 0.03, scrollTrigger: { trigger: el, start: "top 75%", once: true } },
        );
      });
    },
    { scope: root, dependencies: [kind] },
  );
  return (
    <div ref={root} className={cn("relative aspect-square w-full", className)} aria-hidden>
      {tiles.map((i) => (
        <span
          key={i}
          className={cn(
            "tile absolute h-[9%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-[18%] border",
            dark ? "border-green-200/40 bg-green-300/25 shadow-[inset_0_0_12px_rgba(134,239,172,.25)]" : "border-green-500/30 bg-green-200/60 shadow-[inset_0_0_10px_rgba(255,255,255,.8)]",
            i % 4 === 0 && (dark ? "bg-green-400/70" : "bg-green-400/80"),
          )}
          style={{ left: "50%", top: "50%" }}
        />
      ))}
    </div>
  );
}
