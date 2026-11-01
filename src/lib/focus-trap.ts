/**
 * Focus helpers for the drawers (contact drawer, careers role drawer), after the BioDrawer approach: a window keydown
 * handler keeps Tab / Shift+Tab inside the panel, and focus goes back to the element that opened it.
 */

const CANDIDATES = 'a[href], button, input, select, textarea, summary, [contenteditable="true"], [tabindex]';

/** Elements Tab can reach inside `root`, in DOM order. */
export function tabbables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(CANDIDATES)].filter(
    (el) =>
      el.tabIndex >= 0 &&
      !el.matches(":disabled") &&
      !(el instanceof HTMLInputElement && el.type === "hidden") &&
      !el.closest("[inert]") &&
      el.getClientRects().length > 0 &&
      getComputedStyle(el).visibility !== "hidden",
  );
}

/** Call from a keydown listener while the drawer is open: wraps Tab at both ends and pulls stray focus back in. */
export function trapTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== "Tab") return;
  const items = tabbables(root);
  const active = document.activeElement;
  if (!items.length) {
    e.preventDefault();
    root.focus({ preventScroll: true });
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const outside = !active || !root.contains(active);
  if (e.shiftKey && (outside || active === first || active === root)) {
    e.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!e.shiftKey && (outside || active === last)) {
    e.preventDefault();
    first.focus({ preventScroll: true });
  }
}

/** Give focus back to the opener if it is still on the page (a closed menu item or a removed node is skipped). */
export function restoreFocus(el: Element | null | undefined) {
  if (!(el instanceof HTMLElement) || !el.isConnected || el === document.body) return;
  el.focus({ preventScroll: true });
}
