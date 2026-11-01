"use client";
import PageHero from "@/components/sections/PageHero";
import { Button } from "@/components/ui/Button";
import { scrollToTarget } from "@/lib/lenis";
import { slClip } from "@/content/clips";

export function ArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className ?? "h-[14px] w-[14px]"} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" strokeLinecap="square" />
    </svg>
  );
}

/**
 * /services hero = Sharplink `EthereumOpHero`: PageHero variant "opportunity" with the pick-and-place machine clip
 * (sl_press), their about overlay, a 130 % dark gradient, the title and one primary button with a down arrow that
 * scrolls to the statement below (their "Explore our vision").
 */
export default function ServicesHero({ title, cta, target }: { title: string; cta: string; target: string }) {
  return (
    <PageHero variant="opportunity" clip={slClip("sl_press")} overlay="about" gradientHeight="130%" title={title}>
      {/* Sharplink: lenis.scrollTo("#hero-body") with no options — the instance's lerp, no fixed duration */}
      <Button variant="primary" icon={<ArrowDown />} onClick={() => scrollToTarget(`#${target}`, 0, null)}>
        {cta}
      </Button>
    </PageHero>
  );
}
