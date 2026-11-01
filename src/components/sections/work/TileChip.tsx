"use client";
import { useEffect, useRef } from "react";
import type { TileChipState } from "@/components/three/WorkSpace";
import { ChapterLabel } from "./chapterParts";

/**
 * Puture's `.chip-label` (their SpaceStage chunk): while an icon tile is under the pointer, a fixed "NN | Name" label
 * rides at the tile's screen position +26 / −44 px and fades with the hover (the scene damps `show` at rate 10).
 * The scene writes `state` every frame; mount this outside any transformed ancestor so `fixed` means the viewport.
 */
export default function TileChip({ state, names }: { state: TileChipState; names: string[] }) {
  const el = useRef<HTMLDivElement>(null);
  const index = useRef<HTMLSpanElement>(null);
  const name = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    let opacity = "";
    let transform = "";
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const node = el.current;
      if (!node || !names.length) return;
      if (state.index >= 0 && state.index !== last) {
        last = state.index;
        const n = last % names.length;
        if (index.current) index.current.textContent = String(n + 1).padStart(2, "0");
        if (name.current) name.current.textContent = names[n];
      }
      // the scene stopped writing (its canvas scrolled off and paused): drop the chip rather than leave it floating
      if (state.at !== undefined && performance.now() - state.at > 250) state.show = 0;
      const o = state.show.toFixed(3);
      if (o !== opacity) node.style.opacity = opacity = o;
      if (o === "0.000") return;
      const t = `translate3d(${(state.x + 26).toFixed(1)}px, ${(state.y - 44).toFixed(1)}px, 0)`;
      if (t !== transform) node.style.transform = transform = t;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, names]);

  return (
    <div ref={el} className="pointer-events-none fixed left-0 top-0 z-30 opacity-0 will-change-transform max-md:hidden" aria-hidden>
      <ChapterLabel index={<span ref={index}>01</span>} dark>
        <span ref={name}>{names[0]}</span>
      </ChapterLabel>
    </div>
  );
}
