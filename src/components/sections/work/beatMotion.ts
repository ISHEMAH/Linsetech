"use client";
/**
 * Motion shared by the pinned Work and Process chapters (Puture's ContactDialog chunk, measured):
 *  - `useBeatChars`: every `[data-chars]` inside a `[data-in]` beat is split into lines/words/chars; the letters rise
 *    from yPercent 100, blur(6px) and opacity 0 in 1.4s power3.out, .022s apart, when the beat turns `.is-in`, and
 *    the same tween reverses when it leaves (each line is a soft-masked "emerge line").
 *  - `useMediaQuery`: a matchMedia subscription (false on the server).
 */
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import styles from "./case.module.css";

export function useBeatChars(ref: RefObject<HTMLElement | null>, key?: unknown) {
  const live = useRef<(() => void) | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const watchers = new Map<Element, MutationObserver>();
    const splits: SplitText[] = [];
    const tweens: gsap.core.Tween[] = [];
    root.querySelectorAll<HTMLElement>("[data-chars]").forEach((el) => {
      const beat = el.closest<HTMLElement>("[data-in]");
      if (!beat) return;
      splits.push(
        SplitText.create(el, {
          type: "lines,words,chars",
          linesClass: styles.emergeLine,
          autoSplit: true,
          aria: el.parentElement?.closest("h1, h2, h3, h4") ? "none" : "auto",
          onSplit: (self) => {
            // the letters wait hidden; the tween (and its blurred layers) is built the first time the beat comes in.
            // A paused from-tween parked on every letter from the start cost WebKit seconds to revert on pages the
            // visitor never scrolled down to (a played tween reverts in no time)
            gsap.set(self.chars, { opacity: 0 });
            let tween: gsap.core.Tween | null = null;
            watchers.get(el)?.disconnect();
            const sync = () => {
              if (beat.classList.contains("is-in")) {
                if (tween) tween.play();
                else {
                  tween = gsap.fromTo(self.chars, { yPercent: 100, opacity: 0, filter: "blur(6px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power3.out", stagger: 0.022 });
                  tweens.push(tween);
                }
              } else tween?.reverse();
            };
            const mo = new MutationObserver(sync);
            mo.observe(beat, { attributes: true, attributeFilter: ["class"] });
            watchers.set(el, mo);
            sync();
          },
        }),
      );
    });
    const teardown = () => {
      if (live.current !== teardown) return;
      live.current = null;
      watchers.forEach((mo) => mo.disconnect());
      tweens.forEach((t) => t.kill());
      splits.forEach((s) => s.revert());
    };
    live.current = teardown;
    return teardown;
  }, [ref, key]);
  // The teardown runs in the layout phase, while the letters are still in the document: a passive cleanup runs after
  // React has detached them, and killing or reverting GSAP tweens on detached letters made WebKit lay the whole page
  // out per letter — seconds of freeze behind the curtain when leaving a chapter page.
  useLayoutEffect(() => () => live.current?.(), [ref, key]);
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", notify);
      return () => m.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
