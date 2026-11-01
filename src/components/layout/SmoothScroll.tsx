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

  // gsap.matchMedia rebuilds the pinned sections when the window crosses 768px (a phone or tablet turning, a window
  // narrowed past it) and the page landed back at the top. Keep track of where the reader is (the section under the
  // middle of the screen and how far into it) and land there again once ScrollTrigger has re-measured.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    let anchor: { el: HTMLElement; f: number } | null = null;
    let frozen = false;
    let last = 0;
    let safety = 0;
    // a pinned section is measured through its spacer, which carries the pin's scroll length
    const box = (el: HTMLElement) => (el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el);
    const measure = () => {
      const now = performance.now();
      if (frozen || now - last < 200) return;
      last = now;
      const mid = window.innerHeight / 2;
      for (const child of document.querySelectorAll<HTMLElement>("main > *")) {
        const section = child.classList.contains("pin-spacer") ? (child.firstElementChild as HTMLElement | null) : child;
        if (!section) continue;
        const r = box(section).getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) {
          anchor = { el: section, f: (mid - r.top) / Math.max(1, r.height) };
          return;
        }
      }
    };
    const restore = () => {
      ScrollTrigger.removeEventListener("refresh", restore);
      window.clearTimeout(safety);
      frozen = false;
      const a = anchor;
      if (!a || !a.el.isConnected) return;
      const r = box(a.el).getBoundingClientRect();
      const y = Math.max(0, window.scrollY + r.top + a.f * r.height - window.innerHeight / 2);
      const lenis = getLenisInstance();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };
    const onChange = () => {
      frozen = true;
      ScrollTrigger.addEventListener("refresh", restore);
      window.clearTimeout(safety);
      safety = window.setTimeout(restore, 1500);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("scroll", measure);
      mq.removeEventListener("change", onChange);
      ScrollTrigger.removeEventListener("refresh", restore);
      window.clearTimeout(safety);
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
