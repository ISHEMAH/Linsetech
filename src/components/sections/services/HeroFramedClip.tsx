"use client";
import SectionClip from "./SectionClip";
import type { Clip } from "@/content/clips";

/**
 * A section-sized chrome clip (sphere, watch, coins, the machine assembly) shown in a hero: PageHero's `visual` layer is
 * fixed and full-window, and a square or portrait clip stretched to cover it would blow the object up and crop it, so it
 * is framed instead — columns 7–12 at full height on desktop, the bottom 60 % of the window on mobile — and contained.
 */
export default function HeroFramedClip({ clip }: { clip: Clip & { loop?: boolean } }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[58lvh] min-[800px]:inset-y-0 min-[800px]:left-auto min-[800px]:right-[3%] min-[800px]:h-full min-[800px]:w-[min(50vw,980px)]">
      <SectionClip {...clip} fit="contain" />
    </div>
  );
}
