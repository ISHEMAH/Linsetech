"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { markRevealed } from "@/lib/reveal";
import { LogoOutline, logoTimeline } from "@/components/motion/LogoDraw";
import DashedLine from "@/components/ui/DashedLine";

/** the loader stays up at least this long on the home page / elsewhere (ms): time for the mark to draw and the counter to run */
const MIN_HOME = 1600;
const MIN = 1100;
/** and never longer than this, whatever is still loading */
const MAX = 5000;
/** a repeat full load in the same visit: the finished mark, then the lift */
const AGAIN = 350;
/** scripts arriving this late (ms after arrival) play the short version; the CSS fallback has hidden it after 5.5 s (globals.css) */
const LATE = 2500;
const FALLBACK = 5500;
const KEY = "linse-pre";

let exited = false;

/**
 * The loading screen: the site's night green with its glow and grain, the LS mark drawing itself with the load (the
 * banner's logo animation, driven by progress instead of scroll), a counter and the tagline. It is in the server HTML,
 * so it is the first thing painted; the inline script in layout.tsx marks the visit as fresh or seen before it shows.
 * Progress runs on an eased clock to 92 %, then to 100 once the fonts and the window have loaded and MIN has passed;
 * the panel then lifts (clip-path, expo in-out) while the hero intro starts underneath (lib/reveal.ts). Scrolling is
 * locked meanwhile. Reduced motion: the finished state, then a fade.
 */
export default function Preloader() {
  const t = useTranslations("preloader");
  const pathname = usePathname();
  const home = pathname === "/";
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || exited) return;
    const html = document.documentElement;
    const state = html.dataset.pre; // "fresh" | "seen" (layout.tsx's inline script); unset when it did not run
    const svg = el.querySelector<SVGSVGElement>(".ls-logo");
    const count = el.querySelector<HTMLElement>(".preloader-count");
    const bar = el.querySelector<HTMLElement>(".preloader-bar > span");
    const mark = el.querySelector<HTMLElement>(".preloader-mark");
    const fade = el.querySelectorAll<HTMLElement>(".preloader-fade");
    const apply = svg ? logoTimeline(svg, { rg: (svg.dataset.rg ?? "").split(" "), ag: (svg.dataset.ag ?? "").split(" ") }) : null;
    const timers: number[] = [];
    const after = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));

    const finish = (mode: "instant" | "fade" | "lift") => {
      if (exited) return;
      exited = true;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* private mode: the full loader shows again next time */
      }
      html.dataset.pre = "done";
      getLenis()?.start();
      const hide = () => {
        el.hidden = true;
      };
      if (mode === "instant") {
        markRevealed();
        hide();
        return;
      }
      if (mode === "fade") {
        markRevealed();
        gsap.to(el, { autoAlpha: 0, duration: 0.45, ease: "power2.inOut", onComplete: hide });
        return;
      }
      // the lift: the counter and labels go, the mark drifts ahead, the panel slides up as a curtain (its glow and the
      // progress line sweep the hero at its edge: a clip was invisible, dark over the dark hero), and the page's intro
      // starts under it a third of the way in
      const tl = gsap.timeline({ onComplete: hide });
      tl.add(markRevealed, 0.35)
        .to(fade, { autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0)
        .to(mark, { y: -48, autoAlpha: 0, duration: 0.6, ease: "power3.in" }, 0.05)
        .to(el, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, 0.15);
    };

    // the scripts arrived after the CSS fallback hid the loader (a very slow connection): nothing left to show
    if (!state || performance.now() > FALLBACK) {
      finish("instant");
      return;
    }
    getLenis()?.stop();

    const fontsReady: Promise<unknown> = document.fonts?.ready ?? Promise.resolve();
    const loaded = new Promise<void>((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", () => r(), { once: true })));
    const ready = Promise.all([fontsReady, Promise.race([loaded, after(3500)])]);
    // the mark draws on the clock (over the whole wait), the counter and the line on the eased value
    const setValue = (v: number, drawn = v) => {
      if (count) count.textContent = String(Math.round(v * 100)).padStart(2, "0");
      if (bar) bar.style.transform = `scaleX(${v.toFixed(4)})`;
      apply?.(drawn);
    };

    if (prefersReducedMotion()) {
      // the finished state, briefly (no counter run, and no waiting on a slow load either), then a fade
      setValue(1);
      Promise.race([ready, after(2000)])
        .then(() => after(300))
        .then(() => finish("fade"));
      return () => timers.forEach(window.clearTimeout);
    }
    if (state === "seen" || performance.now() > LATE) {
      setValue(1);
      Promise.race([fontsReady, after(800)])
        .then(() => after(AGAIN))
        .then(() => finish("lift"));
      return () => timers.forEach(window.clearTimeout);
    }

    // fresh: the counter and the mark follow an eased clock to 92 %, and run to 100 once the page is ready and MIN
    // has passed (never later than MAX)
    const t0 = performance.now();
    const min = home ? MIN_HOME : MIN;
    let isReady = false;
    ready.then(() => (isReady = true));
    let value = 0;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - t0;
      const eased = 1 - Math.pow(1 - Math.min(1, elapsed / min), 3);
      const target = (isReady && elapsed >= min) || elapsed > MAX ? 1 : Math.min(0.92, eased);
      value += (target - value) * (target === 1 ? 0.16 : 0.1);
      if (target === 1 && value > 0.995) value = 1;
      setValue(value, value >= 1 ? 1 : Math.min(1, elapsed / min));
      if (value >= 1) {
        finish("lift");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(window.clearTimeout);
    };
  }, [home]);

  return (
    <div ref={root} className="preloader text-off-white" data-preloader="" role="status" aria-label={t("loading")}>
      <div className="preloader-glow" aria-hidden />
      <div className="grain" aria-hidden />
      <DashedLine theme="dark" className="preloader-fade top-[58px] md:top-[72px]" />
      <span className="preloader-fade absolute left-[clamp(16px,2.5vw,40px)] top-[58px] h-[6px] w-[6px] bg-green-400 md:top-[72px]" aria-hidden />
      <p className="preloader-fade eyebrow absolute left-[clamp(16px,2.5vw,40px)] top-[22px] md:top-[28px]">Linse</p>
      <div className="preloader-mark absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <LogoOutline className="w-[88px] md:w-[112px]" />
      </div>
      <div className="preloader-foot absolute inset-x-[clamp(16px,2.5vw,40px)] bottom-[28px] flex items-end justify-between gap-6 md:bottom-[36px]">
        <div className="preloader-fade">
          <span className="preloader-count block text-[clamp(56px,9vw,120px)] font-light leading-[0.9] tracking-[-0.04em] tabular-nums">00</span>
        </div>
        <div className="preloader-fade eyebrow max-w-[18ch] text-right text-off-white/70 md:max-w-none">
          {t("tag")}
          <br />
          <span className="text-green-400">{t("loading")}</span>
        </div>
      </div>
      <div className="preloader-bar absolute inset-x-0 bottom-0 h-px bg-off-white/15" aria-hidden>
        <span />
      </div>
    </div>
  );
}
