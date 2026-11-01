"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jumpTo, waveArrive, waveJump, waveLanding, waveTo, wavePending } from "./pixelWave";

const WORK = /^(?:\/(?:fr|rw))?\/work(?:\/|$)/;
const HOME = /^(?:\/(?:fr|rw))?\/?$/;
/** the home chapters the work pages hand over to (Puture's "All work" → /#work, last case → /#process) */
const HOME_HASHES = ["#work", "#process"];

const isTarget = (url: URL) => WORK.test(url.pathname) || (HOME.test(url.pathname) && HOME_HASHES.includes(url.hash));

type Props = {
  /**
   * On mount without a pending wave, a page opened directly on an anchor covers, jumps and clears (Puture's arrival on
   * `/#work`): `true` for any hash, a list to limit it to those hashes, `false` to skip.
   */
  landing?: boolean | string[];
  /**
   * Also take the header's links into the work routes and the home Work/Process chapters (case pages: the header's
   * "Work" leaves through the wave like Puture's "All work"), without the header having to opt in.
   */
  header?: boolean;
};

/**
 * Mounted by the work pages and the home page. Links into the work routes or the home Work/Process chapters, inside
 * `[data-wave-scope]` (or carrying `data-wave`, or in the header when `header` is set), leave through Puture's pixel
 * wave instead of the shared curtain: the click is taken at the window, before the curtain's own document listener
 * and before Next's Link. On mount it clears a wave that brought us here, or lands a direct visit on an anchor.
 */
export default function WaveLinks({ landing = true, header = false }: Props) {
  const router = useRouter();
  const landingKey = landing === true ? "*" : landing === false ? "" : landing.join(" ");

  useEffect(() => {
    const hash = window.location.hash;
    if (wavePending()) waveArrive();
    else if (hash && (landingKey === "*" || landingKey.split(" ").includes(hash))) waveLanding(hash);
  }, [landingKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      if (!a.closest("[data-wave-scope]") && a.dataset.wave == null && !(header && a.closest("header"))) return;
      let url: URL;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || !isTarget(url)) return;
      e.preventDefault();
      e.stopPropagation();
      const from = e.detail === 0 ? null : { x: e.clientX, y: e.clientY };
      if (url.pathname === window.location.pathname) {
        if (url.hash) waveJump(() => jumpTo(url.hash), from);
        return;
      }
      waveTo(url.pathname + url.search + url.hash, from, (href) => router.push(href, { scroll: false }));
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router, header]);

  return null;
}
