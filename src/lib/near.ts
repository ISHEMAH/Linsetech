/**
 * Calls `cb` once `el` comes within `margin` of the viewport, then stops watching. The clip components attach their
 * file this late so a page does not download every clip on arrival (preload="auto" on all of them weighed ~16 MB on
 * the home page before any scrolling). Returns a disposer.
 */
export function whenNear(el: Element, cb: () => void, margin = "100% 0px") {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  return () => io.disconnect();
}
