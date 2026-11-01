import type { ReactNode } from "react";
import DarkGradient from "@/components/backdrop/DarkGradient";

/**
 * Sharplink's `.hero-wrapper` around InvestorsHero: on mobile only (< 800px) it carries a second top DarkGradient,
 * 160vh tall (`.hero-wrapper .gradient { height: 160vh }`, `.mobile-only`), so the cards that drop under the copy
 * (35vh lower) still sit on the dark → green part instead of the light arc. Desktop: just the hero.
 */
export default function HeroWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-[2]">
      <DarkGradient position="top" height="160vh" className="min-[800px]:hidden" />
      {children}
    </div>
  );
}
