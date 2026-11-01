"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { setLenis, getLenis as getLenisInstance } from "@/lib/lenis";
import { usePathname } from "@/i18n/navigation";

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // reduced motion: the wheel scrolls natively (Lenis stays for its scrollTo and the scroll events)
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: !prefersReducedMotion(), syncTouch: false });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // New page: start at the top and let ScrollTrigger re-measure once the DOM settled.
  // (PageTransition does the same under its curtain; this is the fallback when there is none.)
  // A shared link with an anchor (/careers#open-roles) lands on that section instead, 150px below the top like the
  // section pickers (the Work archive then re-lands under its own pixel wave a moment later).
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) window.scrollTo(0, 0);
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      if (!hash) return;
      let target: HTMLElement | null = null;
      try {
        target = document.querySelector<HTMLElement>(decodeURIComponent(hash));
      } catch {
        target = null;
      }
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 150;
      const lenis = getLenisInstance();
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
    }, 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
