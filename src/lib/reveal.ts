/**
 * The moment the page is first shown: when the loading screen (Preloader.tsx) starts to lift. The hero intros and the
 * film wait for it on a full load, so they play in front of the visitor rather than behind the loader; on client-side
 * navigations (and on pages without a loader) it has already happened and `onReveal` runs at once.
 */
let revealed = false;
const waiting = new Set<() => void>();

export function markRevealed() {
  if (revealed) return;
  revealed = true;
  for (const cb of waiting) cb();
  waiting.clear();
}

export const isRevealed = () => revealed;

/** Runs `cb` at the reveal (now, if it has happened); returns an unsubscribe. */
export function onReveal(cb: () => void): () => void {
  if (!revealed && typeof document !== "undefined" && !document.querySelector("[data-preloader]")) markRevealed();
  if (revealed) {
    cb();
    return () => {};
  }
  waiting.add(cb);
  return () => {
    waiting.delete(cb);
  };
}
