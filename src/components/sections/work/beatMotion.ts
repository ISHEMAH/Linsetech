"use client";
/**
 * Motion shared by the pinned Work and Process chapters (Puture's ContactDialog chunk, measured):
 *  - `useBeatChars`: every `[data-chars]` inside a `[data-in]` beat is split into lines/words/chars; the letters rise
 *    from yPercent 100, blur(6px) and opacity 0 in 1.4s power3.out, .022s apart, when the beat turns `.is-in`, and
 *    the same tween reverses when it leaves (each line is a soft-masked "emerge line").
 *  - `useMediaQuery`: a matchMedia subscription (false on the server).
 */
import { useEffect, useSyncExternalStore, type RefObject } from "react";
import { gsap, SplitText, prefersReducedMotion } from "@/lib/gsap";
import styles from "./case.module.css";

export function useBeatChars(ref: RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const watchers = new Map<Element, MutationObserver>();
    const splits: SplitText[] = [];
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
            const tween = gsap.from(self.chars, { yPercent: 100, opacity: 0, filter: "blur(6px)", duration: 1.4, ease: "power3.out", stagger: 0.022, paused: true });
            watchers.get(el)?.disconnect();
            const sync = () => {
              if (beat.classList.contains("is-in")) tween.play();
              else tween.reverse();
            };
            const mo = new MutationObserver(sync);
            mo.observe(beat, { attributes: true, attributeFilter: ["class"] });
            watchers.set(el, mo);
            sync();
            return tween;
          },
        }),
      );
    });
    return () => {
      watchers.forEach((mo) => mo.disconnect());
      splits.forEach((s) => s.revert());
    };
  }, [ref, key]);
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
