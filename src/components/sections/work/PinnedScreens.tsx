"use client";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import type { Screen } from "@/content/work";
import { Device, ScreenImage, type DeviceShape } from "./Device";
import ScreenViewer, { type ViewerLabels } from "./ScreenViewer";
import styles from "./case.module.css";

type Props = {
  screens: Screen[];
  /** one scroll stop per item; item i shows screen i (wrapping) */
  items: string[];
  shape: DeviceShape;
  heading: string;
  /** under the device, after the counter */
  caption: string;
  labels: ViewerLabels;
  open: string;
};

/**
 * Puture's `.case-program__body` (device 1.65fr · "Key engineering" list 1fr) made into a pinned sequence: the device
 * stays centred in the viewport while the list scrolls past it; the item crossing the middle lights up (.35 → 1,
 * .3s) and its screen wipes in over the previous one (clip-path from the bottom, .9s expo-out). The counter and the
 * segment bar under the device follow; clicking the device opens the viewer on the current screen.
 */
export default function PinnedScreens({ screens, items, shape, heading, caption, labels, open }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const stops = Math.max(items.length, 1);
  const screenAt = (i: number) => i % screens.length;

  // centre the pinned column: top = 50svh − half its height
  useEffect(() => {
    const el = pin.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.style.setProperty("--half", `${el.offsetHeight / 2}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const rows = root.current!.querySelectorAll<HTMLElement>("[data-stop]");
      rows.forEach((row, i) =>
        ScrollTrigger.create({
          trigger: row,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActive(i),
        }),
      );
    },
    { scope: root, dependencies: [stops] },
  );

  const current = screenAt(active);

  return (
    <div ref={root} className="grid items-start gap-[clamp(28px,4vw,56px)] min-[900px]:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <div
        ref={pin}
        className="sticky z-10 top-[max(84px,calc(50svh-var(--half,300px)))] max-[900px]:top-[72px] max-[900px]:-mx-[clamp(16px,2.5vw,40px)] max-[900px]:bg-[#020a07] max-[900px]:px-[clamp(16px,2.5vw,40px)] max-[900px]:pb-3 max-[900px]:before:absolute max-[900px]:before:inset-x-0 max-[900px]:before:bottom-full max-[900px]:before:h-[72px] max-[900px]:before:bg-[#020a07]"
      >
        <button type="button" onClick={() => setViewer(current)} aria-label={`${open}: ${screens[current].caption}`} className="block w-full cursor-zoom-in border-0 bg-transparent p-0">
          <Device shape={shape} glow className={shape === "portrait" ? "mx-auto max-w-[min(100%,calc((100svh-260px)*0.5625))]" : ""}>
            {screens.map((s, i) => {
              const shown = i === current;
              const below = i < current || (current === 0 && i === 0);
              return (
                <div
                  key={i}
                  className="absolute inset-0 transition-[clip-path] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]"
                  style={{ clipPath: shown || below ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)", zIndex: shown ? 2 : below ? 1 : 0 }}
                  aria-hidden={!shown}
                >
                  <ScreenImage screen={s} shape={shape} index={i} sizes="(min-width:900px) 56vw, 100vw" label={labels.comingSoon} priority={i === 0} />
                </div>
              );
            })}
          </Device>
        </button>
        <div className="mt-3 flex items-start justify-between gap-6 bg-transparent">
          <p className="min-w-0 text-[13px] text-off-white/60">
            <span className="mr-2.5 font-narrow text-[11px] uppercase tracking-[0.08em] text-green-300">
              {String(current + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}
            </span>
            {caption}
          </p>
          <ol className="mt-1.5 flex shrink-0 gap-1" aria-hidden>
            {items.map((_, i) => (
              <li key={i} className={cn("h-1 w-7 transition-colors duration-300", i <= active ? "bg-green-500" : "bg-white/20")} />
            ))}
          </ol>
        </div>
      </div>

      <div className="max-[900px]:relative max-[900px]:z-0">
        <h3 className="mb-1.5 font-narrow text-[11px] font-medium uppercase tracking-[0.08em] text-off-white/50">{heading}</h3>
        <ol className={cn(styles.counted, "m-0 list-none p-0")}>
          {items.map((t, i) => (
            <li
              key={i}
              data-stop
              className={cn(
                "grid min-h-[56svh] grid-cols-[34px_minmax(0,1fr)] content-center border-t border-white/15 py-3.5 text-[clamp(17px,1.35vw,21px)] leading-[1.35] tracking-[-0.01em] transition-opacity duration-300 first:min-h-[46svh] first:content-start last:min-h-[62svh] max-[900px]:min-h-[48svh] max-[900px]:content-end max-[900px]:first:content-end",
                i === active ? "opacity-100" : i < active ? "opacity-35 max-[900px]:opacity-0" : "opacity-35",
              )}
            >
              {t}
            </li>
          ))}
        </ol>
      </div>
      {viewer !== null && <ScreenViewer screens={screens} shape={shape} start={viewer} labels={labels} onClose={() => setViewer(null)} />}
    </div>
  );
}
