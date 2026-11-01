"use client";
import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/** A5: horizontal milestones scrubbed by scroll. */
export default function Timeline({ eyebrow, items }: { eyebrow: string; items: { year: string; title: string; text: string }[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const track = el.querySelector<HTMLElement>(".track")!;
      const dist = track.scrollWidth - el.clientWidth;
      if (dist <= 0) return;
      gsap.to(track, {
        x: -dist,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: `+=${dist}`, scrub: prefersReducedMotion() ? false : 0.6, pin: true, invalidateOnRefresh: true },
      });
      gsap.to(".line", { scaleX: 1, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: `+=${dist}`, scrub: true } });
    },
    { scope: root },
  );
  return (
    <section ref={root} data-theme="dark" className="bg-dark relative overflow-hidden py-24 text-white">
      <div className="px-page">
        <p className="eyebrow text-green-300">{eyebrow}</p>
        <div className="relative mt-16">
          <div className="absolute left-0 top-5 h-px w-full bg-white/10" />
          <div className="line absolute left-0 top-5 h-px w-full origin-left scale-x-0 bg-green-400" />
          <div className="track flex w-max gap-10 pr-[40vw]">
            {items.map((m) => (
              <div key={m.year} className="w-[min(70vw,380px)] shrink-0">
                <span className="relative block h-10">
                  <span className="absolute left-0 top-5 h-3 w-3 -translate-y-1/2 rounded-full bg-green-400 shadow-[0_0_0_6px_rgba(34,197,94,.2)]" />
                </span>
                <p className="text-5xl font-medium tracking-[-0.04em] text-green-300">{m.year}</p>
                <h3 className="mt-3 text-xl font-medium">{m.title}</h3>
                <p className="mt-2 text-sm text-white/65">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
