"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { whenNear } from "@/lib/near";
import { cn } from "@/lib/cn";

type Props = {
  /** VP9 WebM with alpha (Chrome / Firefox / Edge) */
  webm: string;
  /** HEVC-with-alpha MP4 (Safari) */
  mp4: string;
  poster?: string;
  className?: string;
  fit?: "cover" | "contain";
};

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Sharplink's about clips (`<video muted loop playsinline>`): a seamless pre-rendered alpha loop. The source is picked
 * after mount (HEVC-alpha for Safari, VP9-alpha elsewhere) so the server and client markup agree, attached once it is
 * near the viewport, and the clip only plays while it is on screen. Reduced motion keeps it on its first frame.
 */
export default function LoopClip({ webm, mp4, poster, className, fit = "contain" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    let io: IntersectionObserver | undefined;
    const stop = whenNear(v, () => {
      v.src = isSafari() ? mp4 : webm;
      if (prefersReducedMotion()) return;
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
      io.observe(v);
    });
    return () => {
      stop();
      io?.disconnect();
    };
  }, [webm, mp4]);

  return (
    <video
      ref={ref}
      className={cn("block h-full w-full", fit === "cover" ? "object-cover" : "object-contain", className)}
      poster={poster}
      preload="auto"
      muted
      loop
      playsInline
      disablePictureInPicture
      aria-hidden
    />
  );
}
