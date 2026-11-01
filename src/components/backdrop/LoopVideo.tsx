"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { whenNear } from "@/lib/near";

const noSubscribe = () => () => {};
const isSafari = () => typeof navigator !== "undefined" && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const REDUCED = "(prefers-reduced-motion: reduce)";
const onReducedChange = (cb: () => void) => {
  const m = window.matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/**
 * A muted, inline, natively looping (or play-once) alpha clip: VP9 WebM everywhere, HEVC-with-alpha MP4 in Safari,
 * attached once it is near the viewport. Reduced motion shows its first frame instead of playing.
 */
export default function LoopVideo({ webm, mp4, poster, loop = true, className }: { webm: string; mp4: string; poster?: string; loop?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const safari = useSyncExternalStore(noSubscribe, isSafari, () => null);
  const reduced = useSyncExternalStore(onReducedChange, () => window.matchMedia(REDUCED).matches, () => false);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || near) return;
    return whenNear(v, () => setNear(true));
  }, [near]);
  const src = safari === null || !near ? undefined : safari ? mp4 : webm;
  return <video ref={ref} className={cn("block h-full w-full object-cover", className)} src={src} poster={poster} autoPlay={!reduced} muted loop={loop} playsInline preload="auto" disablePictureInPicture aria-hidden />;
}
