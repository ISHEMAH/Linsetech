"use client";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Screen } from "@/content/work";
import { Device, ScreenImage, type DeviceShape } from "./Device";
import ScreenViewer, { type ViewerLabels } from "./ScreenViewer";

/**
 * Puture's `.screen-grid`: devices in a grid (gap 28px 16px; 2 columns under 900px), each a zoom-in button that
 * lifts 4px with a glow on hover (.4s expo-out) and opens the viewer; "01  caption" under it.
 */
export default function ScreenGrid({ screens, shape, cols = 3, labels, open }: { screens: Screen[]; shape: DeviceShape; cols?: 2 | 3; labels: ViewerLabels; open: string }) {
  const [at, setAt] = useState<number | null>(null);
  return (
    <>
      <ol className={cn("m-0 grid list-none gap-x-4 gap-y-7 p-0 max-[900px]:gap-x-2.5 max-[900px]:gap-y-5", cols === 3 ? "grid-cols-3 max-[900px]:grid-cols-2" : "grid-cols-2 max-[600px]:grid-cols-1")}>
        {screens.map((s, i) => (
          <li key={i} className="grid content-start gap-2.5">
            <button type="button" onClick={() => setAt(i)} aria-label={`${open}: ${s.caption}`} className="group block w-full cursor-zoom-in border-0 bg-transparent p-0">
              <Device shape={shape} className="transition-[translate,box-shadow] duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1 group-hover:shadow-[0_0_0_1px_rgba(255,255,255,.3),0_24px_60px_-24px_rgba(34,197,94,.55)]! group-focus-visible:-translate-y-1">
                <ScreenImage screen={s} shape={shape} index={i} sizes={cols === 3 ? "(min-width:900px) 30vw, 50vw" : "(min-width:600px) 45vw, 100vw"} label={labels.comingSoon} />
              </Device>
            </button>
            <p className="flex gap-2.5 text-sm max-[900px]:gap-1.5 max-[900px]:text-xs">
              <span className="font-narrow text-[11px] uppercase leading-5 tracking-[0.08em] text-off-white/50">{String(i + 1).padStart(2, "0")}</span>
              {s.caption}
            </p>
          </li>
        ))}
      </ol>
      {at !== null && <ScreenViewer screens={screens} shape={shape} start={at} labels={labels} onClose={() => setAt(null)} />}
    </>
  );
}
