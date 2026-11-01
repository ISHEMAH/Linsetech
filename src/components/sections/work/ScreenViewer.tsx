"use client";
import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";
import { Arrow } from "@/components/ui/Button";
import type { Screen } from "@/content/work";
import { Device, ScreenImage, type DeviceShape } from "./Device";
import styles from "./case.module.css";

export type ViewerLabels = { close: string; previous: string; next: string; comingSoon: string };

/**
 * Puture's `.screen-viewer`: a modal dialog over a near-black veil (fade .3s), the screen in its device and
 * "03 / 12 · caption" under it, round previous/next steps (52px, accent on hover), a "Close ×" top-right.
 * Arrow keys step, Escape or a click on the veil closes, a 48px horizontal swipe steps. Lenis is paused while open.
 */
export default function ScreenViewer({ screens, shape, start, labels, onClose }: { screens: Screen[]; shape: DeviceShape; start: number; labels: ViewerLabels; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(start);
  const down = useRef<number | null>(null);
  const step = (d: number) => setI((n) => (n + d + screens.length) % screens.length);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focus = document.activeElement;
    el.showModal();
    getLenis()?.stop();
    return () => {
      getLenis()?.start();
      if (focus instanceof HTMLElement) focus.focus({ preventScroll: true });
    };
  }, []);

  const s = screens[i];
  const width = shape === "portrait" ? "h-[calc(100svh-180px)] w-auto aspect-[9/16]" : "w-[min(84vw,calc((100svh-200px)*1.333))]";

  return (
    <dialog
      ref={ref}
      className={`${styles.viewer} fixed inset-0 m-0 h-full max-h-none w-full max-w-none place-items-center border-0 bg-[#010604f0] p-0 text-off-white open:grid`}
      aria-label={s.caption}
      data-lenis-prevent=""
      data-theme="dark"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={(e) => (down.current = e.clientX)}
      onPointerUp={(e) => {
        if (down.current === null) return;
        const dx = e.clientX - down.current;
        down.current = null;
        if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
      }}
    >
      <figure className="m-0 grid justify-items-center gap-4">
        <div className={width}>
          <Device shape={shape} fit={shape === "portrait" ? "height" : "width"}>
            <div key={i} className={`${styles.viewerImg} absolute inset-0`}>
              <ScreenImage screen={s} shape={shape} index={i} sizes="84vw" label={labels.comingSoon} />
            </div>
          </Device>
        </div>
        <figcaption className="flex max-w-[84vw] gap-3 text-[15px]">
          <span className="font-narrow text-[11px] uppercase leading-[22px] tracking-[0.08em] text-off-white/55">
            {String(i + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}
          </span>
          {s.caption}
        </figcaption>
      </figure>
      {screens.length > 1 && (
        <>
          <button type="button" onClick={() => step(-1)} aria-label={labels.previous} className="absolute left-[max(clamp(16px,2.5vw,40px),16px)] top-1/2 grid h-[52px] w-[52px] -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors duration-200 hover:bg-green-500 max-md:bottom-[calc(env(safe-area-inset-bottom)+20px)] max-md:top-auto max-md:translate-y-0">
            <Arrow className="rotate-180" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label={labels.next} className="absolute right-[max(clamp(16px,2.5vw,40px),16px)] top-1/2 grid h-[52px] w-[52px] -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors duration-200 hover:bg-green-500 max-md:bottom-[calc(env(safe-area-inset-bottom)+20px)] max-md:top-auto max-md:translate-y-0">
            <Arrow />
          </button>
        </>
      )}
      <button type="button" onClick={onClose} className="absolute right-[max(clamp(16px,2.5vw,40px),16px)] top-[calc(env(safe-area-inset-top)+14px)] inline-flex h-10 cursor-pointer items-center gap-2.5 px-1 font-narrow text-[11px] uppercase tracking-[0.08em]">
        {labels.close}
        <span className="relative h-3 w-3 before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:rotate-45 before:bg-current after:absolute after:left-0 after:top-1/2 after:h-px after:w-3 after:-rotate-45 after:bg-current" aria-hidden />
      </button>
    </dialog>
  );
}
