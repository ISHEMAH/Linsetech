"use client";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import ClipVideo from "@/components/media/ClipVideo";
import LoopClip from "./LoopClip";

export const aboutClips = {
  mark: { webm: "/clips/about_mark_chrome.webm", mp4: "/clips/about_mark_safari.mp4", poster: "/clips/about_mark_poster.webp" },
  logo: { webm: "/clips/about_logo_chrome.webm", mp4: "/clips/about_logo_safari.mp4", poster: "/clips/about_logo_poster.webp" },
};

/**
 * The About hero visual, measured on sharplink.com/about: their gem clip sits in a FIXED full-window layer
 * (`.video-bg`) that loops on its own (6.7 s, `<video loop>`; currentTime keeps running whatever the scroll) and fades
 * out with the first ~60 % of a window of scroll (opacity 1 / .94 / .5 / 0 at 0 / 200 / 400 / 600 px on a 1000 px
 * window), so it never travels with the page. Ours plays the frosted-glass LS chain (tools/blender/about_mark.py,
 * a seamless 6 s loop) the same way.
 *
 * `mode="scrub"` instead drives the clip's time from the scroll (ClipVideo scrub) across the hero and keeps the layer
 * up until the hero has left — the clip loops seamlessly, so either reading works.
 */
export default function AboutHeroClip({ mode = "loop" }: { mode?: "loop" | "scrub" }) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      const el = root.current!;
      const hero = el.closest("section") ?? el;
      if (prefersReducedMotion()) return;
      const fadeEnd = () => (mode === "scrub" ? hero.offsetHeight : window.innerHeight * 0.6);
      const video = () => el.querySelector("video");
      gsap.fromTo(
        el,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          ease: "power2.in",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: () => `+=${fadeEnd()}`,
            scrub: true,
            invalidateOnRefresh: true,
            // a faded-out loop does not need to keep decoding
            onLeave: () => mode === "loop" && video()?.pause(),
            onEnterBack: () => mode === "loop" && video()?.play().catch(() => {}),
          },
        },
      );
      if (mode === "scrub") {
        ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (s) => (progress.current = s.progress) });
      }
    },
    { scope: root, dependencies: [mode] },
  );

  return (
    <div ref={root} className="pointer-events-none fixed inset-0" aria-hidden>
      {/* the chain enters top right and leaves bottom left, like Sharplink's gems: its left edge (~40 % into the frame)
          is kept 60 px clear of the heading, whose right edge is min(936px, 40px + 58vw) */}
      <div className="absolute right-[-16vw] top-[42svh] h-[66svh] aspect-[1000/1400] opacity-80 sm:right-[-4vw] md:left-[calc(min(936px,40px_+_58vw)_+_60px_-_39.8svh)] md:right-auto md:top-[-12svh] md:h-[124svh] md:opacity-100">
        {mode === "scrub" ? (
          <ClipVideo mode="scrub" progressRef={progress} webm={aboutClips.mark.webm} mp4={aboutClips.mark.mp4} fit="contain" />
        ) : (
          <LoopClip webm={aboutClips.mark.webm} mp4={aboutClips.mark.mp4} poster={aboutClips.mark.poster} />
        )}
      </div>
    </div>
  );
}
