"use client";
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { whenNear } from "@/lib/near";

type Props = {
  /** VP9 WebM (Chrome / Firefox / Edge), with alpha when the clip is transparent */
  webm: string;
  /** HEVC-with-alpha (or H.264) MP4 for Safari */
  mp4: string;
  poster?: string;
  /** "play": plays once on mount (hero intro); "scrub": currentTime follows progressRef (0..1) */
  mode: "play" | "scrub";
  progressRef?: RefObject<number>;
  /** called when a "play" clip reaches its end */
  onEnded?: () => void;
  /** "play" mode: when the clip ends, seek back here (seconds) and keep playing — the idle loop */
  loopFrom?: number;
  className?: string;
  /** object-fit for the element */
  fit?: "cover" | "contain";
};

const noSubscribe = () => () => {};
const isSafari = () => typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Sharplink's video technique: a pre-rendered clip shipped as a WebM/HEVC pair, either played once
 * or scrubbed by scroll (currentTime driven from a ScrollTrigger progress ref, smoothed per frame).
 */
export default function ClipVideo({ webm, mp4, poster, mode, progressRef, onEnded, loopFrom, className, fit = "cover" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  // the server cannot know the browser: render no source there and during hydration, then the right file on the client
  const safari = useSyncExternalStore(noSubscribe, isSafari, () => null);
  // and only once the element is within ~1.5 screens of the viewport
  const [near, setNear] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || near) return;
    return whenNear(v, () => setNear(true));
  }, [near]);
  const src = safari === null || !near ? undefined : safari ? mp4 : webm;

  useEffect(() => {
    const v = ref.current;
    // runs once the client has picked the file (src is empty during SSR/hydration), and again if it changes
    if (!v || !src) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    if (mode === "play") {
      if (prefersReducedMotion()) {
        const seek = () => {
          v.currentTime = Math.max(0, v.duration - 0.05);
        };
        if (v.readyState >= 1) seek();
        else v.addEventListener("loadedmetadata", seek, { once: true });
        return;
      }
      const play = () => {
        v.play().catch(() => {});
      };
      // start now: iOS Safari ignores preload and buffers nothing before play(), so waiting for "canplay" never ends
      play();
      if (loopFrom === undefined) return;
      const loop = () => {
        v.currentTime = loopFrom;
        play();
      };
      v.addEventListener("ended", loop);
      return () => v.removeEventListener("ended", loop);
    }
    // scrub: iOS Safari loads no frame data until the element has played once, so seeks would show nothing.
    // Prime it with a muted play() → pause() (allowed without a gesture); elsewhere it just starts the download.
    if (v.readyState < 2) {
      const p = v.play();
      if (p) p.then(() => v.pause()).catch(() => {});
    }
    // ease currentTime toward the target every tick (Sharplink sets currentTime from ScrollTrigger).
    // Frame-rate independent lerp (~0.28 per 60 fps frame, so it trails the smoothed scroll by only a few frames)
    // and never more than one seek in flight: queued seeks are what make a scrubbed clip stutter.
    let current = -1;
    const tick = (_time: number, dt: number) => {
      if (!v.duration || !progressRef) return;
      const target = gsap.utils.clamp(0, v.duration - 0.03, (progressRef.current ?? 0) * v.duration);
      if (current < 0) current = target;
      current += (target - current) * (1 - Math.exp(-dt * 0.02));
      if (Math.abs(target - current) < 0.002) current = target;
      if (!v.paused) return; // still priming
      if (!v.seeking && Math.abs(v.currentTime - current) >= 1 / 60) v.currentTime = current;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [mode, progressRef, loopFrom, src]);

  return (
    <video
      ref={ref}
      className={cn("block h-full w-full", fit === "cover" ? "object-cover" : "object-contain", className)}
      src={src}
      // a scrubbed clip starts on its own first frame: a poster would be swapped out by the first seek
      poster={mode === "scrub" ? undefined : poster}
      preload="auto"
      muted
      playsInline
      disablePictureInPicture
      onEnded={onEnded}
      aria-hidden
    />
  );
}
