"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { Act, UiIcon, type Action } from "./actions";
import { Chevron, DiagArrow } from "./icons";
import MarkIllo from "./MarkIllo";
import "./company.css";

type Card = { eyebrow: string; tag: string; title: string; action: Action };
type Labels = { prev: string; next: string; pause: string; play: string };

/**
 * Sharplink investors hero, top right (grid columns 9–12, 28px apart): the presentation card (glass, illustration
 * bleeding off the bottom, eyebrow + file type, 16px title, diagonal-arrow icon that turns brand on hover) and the
 * events slider (title, glass card with a 6px pin, prev / next stacked on the right, a faint fill that grows over
 * 5s then advances; cards cross-fade .3s out / .5s in after .2s).
 * Both blocks are `.hero-card` and start hidden: PageHero fades them in one after the other (desktop) or with the
 * scroll (phones), like their `$presentation` / `$events`.
 */
export default function HeroCards({ feature, sliderTitle, slides, labels }: { feature: Card; sliderTitle: string; slides: Card[]; labels: Labels }) {
  return (
    <div className="pointer-events-auto flex flex-col gap-7">
      <Act action={feature.action} className={cn("hero-card invisible group flex items-center overflow-hidden text-off-white", "co-brand-hover")}>
        <span className={cn("flex w-full items-center", "co-glass")} style={{ backgroundColor: "var(--surface-lighter)" }}>
          <MarkIllo className="-mb-[26px] w-[120px] shrink-0 self-end text-off-white transition-colors duration-[250ms] ease-[var(--ease-in-out-quad)] group-hover:text-[var(--brand)]" />
          <span className="flex grow flex-col gap-4 py-5 pr-5">
            <span className="eyebrow flex items-center justify-between gap-3 text-off-white/60">
              <span>{feature.eyebrow}</span>
              <span>{feature.tag}</span>
            </span>
            <span className="flex items-end justify-between gap-4 text-[16px] font-medium leading-[1.35]">
              <span className="max-w-[200px] text-balance">{feature.title}</span>
              <UiIcon icon={<DiagArrow />} />
            </span>
          </span>
        </span>
      </Act>
      <Slider title={sliderTitle} slides={slides} labels={labels} />
    </div>
  );
}

const AUTOPLAY = 5000;

function PauseIcon({ paused }: { paused: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden>
      {paused ? <path d="M5 3.5v9l7-4.5z" /> : <path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" />}
    </svg>
  );
}

/**
 * The auto-advancing slider, made operable: only the current slide is reachable (the others are `inert`), it holds
 * while hovered or while focus is inside it, the pause button stops it for good (and it never auto-advances with
 * reduced motion).
 */
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const m = window.matchMedia(RM);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

function Slider({ title, slides, labels }: { title: string; slides: Card[]; labels: Labels }) {
  const [idx, setIdx] = useState(0);
  // null = not chosen by the visitor: then it follows prefers-reduced-motion (read on the client only)
  const [userStopped, setUserStopped] = useState<boolean | null>(null);
  const reduced = useSyncExternalStore(subscribeRM, prefersReducedMotion, () => false);
  const stopped = userStopped ?? reduced;
  const fill = useRef<HTMLDivElement>(null);
  const hold = useRef({ hover: false, focus: false, stopped: false });
  const prog = useRef({ p: 0, last: 0 });
  const n = slides.length;

  useEffect(() => {
    hold.current.stopped = stopped;
  }, [stopped]);

  useEffect(() => {
    if (n <= 1) return;
    prog.current = { p: 0, last: performance.now() };
    const tick = () => {
      const now = performance.now();
      const st = prog.current;
      const dt = now - st.last;
      st.last = now;
      const h = hold.current;
      if (!h.hover && !h.focus && !h.stopped) st.p = Math.min(1, st.p + dt / AUTOPLAY);
      if (fill.current) fill.current.style.width = `${st.p * 100}%`;
      if (st.p >= 1) {
        st.p = 0;
        setIdx((i) => (i + 1) % n);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [n, idx]);

  const step = (d: number) => setIdx((i) => (i + d + n) % n);

  return (
    <div
      className="hero-card invisible"
      onMouseEnter={() => (hold.current.hover = true)}
      onMouseLeave={() => (hold.current.hover = false)}
      onFocus={() => (hold.current.focus = true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hold.current.focus = false;
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[16px] font-medium leading-[1.35] text-off-white">{title}</p>
        {n > 1 && (
          <button
            type="button"
            onClick={() => setUserStopped(!stopped)}
            aria-label={stopped ? labels.play : labels.pause}
            className="flex h-6 w-6 items-center justify-center text-off-white/60 transition-colors duration-[250ms] hover:text-off-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--brand)]"
          >
            <PauseIcon paused={stopped} />
          </button>
        )}
      </div>
      <div className="flex gap-[2px]">
        <div className="relative grid grow overflow-hidden" aria-live={stopped ? "polite" : "off"} style={{ backgroundColor: "var(--surface-lighter)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          {slides.map((c, i) => (
            <div
              key={i}
              className={cn("[grid-area:1/1]", i === idx ? "z-[1] opacity-100 transition-opacity delay-200 duration-500" : "pointer-events-none opacity-0 transition-opacity duration-300")}
              aria-hidden={i !== idx}
              inert={i !== idx}
            >
              <Act action={c.action} className={cn("group relative flex h-full w-full flex-col gap-4 p-5 text-off-white", "co-brand-hover")}>
                <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-[var(--brand)]" aria-hidden />
                <span className="eyebrow flex items-center justify-between gap-3 text-off-white/60">
                  <span>{c.eyebrow}</span>
                  <span>{c.tag}</span>
                </span>
                <span className="flex grow items-end justify-between gap-7 text-[16px] font-medium leading-[1.35]">
                  <span className="line-clamp-2 grow text-balance">{c.title}</span>
                  <UiIcon icon={<DiagArrow />} />
                </span>
              </Act>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-0 z-[2]">
            <div ref={fill} className="h-full bg-[rgba(254,254,241,0.03)]" style={{ width: 0 }} />
          </div>
        </div>
        {n > 1 && (
          <div className="flex w-[41px] shrink-0 flex-col gap-[2px]">
            <button type="button" className={"co-ctl"} onClick={() => step(-1)} aria-label={labels.prev}>
              <span>
                <Chevron dir="left" />
              </span>
              <span aria-hidden>
                <Chevron dir="left" />
              </span>
            </button>
            <button type="button" className={"co-ctl"} onClick={() => step(1)} aria-label={labels.next}>
              <span>
                <Chevron dir="right" />
              </span>
              <span aria-hidden>
                <Chevron dir="right" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
