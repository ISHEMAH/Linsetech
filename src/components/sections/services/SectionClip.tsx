"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { whenNear } from "@/lib/near";
import { cn } from "@/lib/cn";
import type { Clip } from "@/content/clips";

const isSafari = () => typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

type Props = Clip & {
  /** loop while on screen (sphere, watch, logo), or play through once per visit (Sharplink's runway coins) */
  loop?: boolean;
  fit?: "contain" | "cover";
  className?: string;
};

/**
 * Sharplink `StoryblokVideo` as used inside their sections (lazy: false): muted, inline, transparent chrome clip that
 * plays as soon as any of it is on screen and pauses when it leaves; with `loop={false}` it plays through and holds its
 * last frame — and since `play()` on an ended video starts it over, it replays on every return, as theirs does.
 * WebM (VP9 + alpha) everywhere, HEVC-with-alpha MP4 in Safari, picked on the client.
 */
export default function SectionClip({ webm, mp4, poster, loop = true, fit = "contain", className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    let io: IntersectionObserver | undefined;
    const stop = whenNear(v, () => {
      v.src = isSafari() ? mp4 : webm;
      if (prefersReducedMotion()) return;
      const play = () => v.play().catch(() => requestAnimationFrame(() => v.play().catch(() => {})));
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) play();
        else v.pause();
      });
      io.observe(v);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, [webm, mp4, loop]);

  return (
    <video
      ref={ref}
      className={cn("block h-full w-full", fit === "contain" ? "object-contain" : "object-cover", className)}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden
    />
  );
}
