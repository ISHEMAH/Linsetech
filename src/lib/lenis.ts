import type Lenis from "lenis";

let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

/**
 * Smooth-scroll so `target` lands `offset` px from the top of the window (negative = below the top).
 * - `duration` (seconds) runs Lenis' default expo-out easing over that time (Sharplink's anchor links: 2.2s); `null`
 *   uses the instance's own lerp instead, like their `lenis.scrollTo(target)` calls without options;
 * - the target is resolved to a number here: Lenis 1.3 subtracts the element's `scroll-margin-top` when it is given an
 *   element, which would move the landing point;
 * - `hash` adds `#id` to the URL without a navigation (their `history.pushState(null, "", "#id")`).
 */
export const scrollToTarget = (target: string | HTMLElement | number, offset = -80, duration: number | null = 1.4, hash?: string) => {
  const el = typeof target === "number" ? null : typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (typeof target !== "number" && !el) return;
  const y = Math.max(0, (el ? el.getBoundingClientRect().top + window.scrollY : (target as number)) + offset);
  const l = getLenis();
  if (l) l.scrollTo(y, duration == null ? {} : { duration });
  else window.scrollTo({ top: y, behavior: "smooth" });
  if (hash) window.history.pushState(null, "", hash.startsWith("#") ? hash : `#${hash}`);
};
