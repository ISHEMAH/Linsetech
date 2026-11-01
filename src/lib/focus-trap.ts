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

/**
 * Call from a keydown listener while the drawer is open: Tab and Shift+Tab move through the panel's own list, wrapping at
 * both ends. The panel steps itself rather than leaving it to the browser: Safari (by default) skips buttons and links,
 * so from the last field it left the panel for a step before coming back.
 */
export function trapTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== "Tab") return;
  e.preventDefault();
  const items = tabbables(root);
  if (!items.length) {
    root.focus({ preventScroll: true });
    return;
  }
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next = i < 0 ? (e.shiftKey ? items.length - 1 : 0) : (i + (e.shiftKey ? items.length - 1 : 1)) % items.length;
  items[next].focus({ preventScroll: true });
}

// Safari does not focus a button when it is clicked, so there the element that opened a panel is not
// document.activeElement (it is <body>): remember the last control pressed instead
let pressed: HTMLElement | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => (pressed = e.target instanceof Element ? e.target.closest<HTMLElement>("button, a[href], [role='button']") : null), { capture: true, passive: true });
}

/** The control that is opening a panel: the focused element, or (Safari) the one just pressed. */
export function currentOpener(): HTMLElement | null {
  const a = document.activeElement;
  if (a instanceof HTMLElement && a !== document.body) return a;
  return pressed?.isConnected ? pressed : null;
}

/** Give focus back to the opener if it is still on the page (a closed menu item or a removed node is skipped). */
export function restoreFocus(el: Element | null | undefined) {
  if (!(el instanceof HTMLElement) || !el.isConnected || el === document.body) return;
  el.focus({ preventScroll: true });
}
