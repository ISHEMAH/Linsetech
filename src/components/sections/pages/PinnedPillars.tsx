"use client";
import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { LogoMark } from "@/components/ui/Logo";

/** A3: four pillars highlight one by one while the mark rotates. */
export default function PinnedPillars({ eyebrow, items }: { eyebrow: string; items: { title: string; text: string }[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current!;
      const rows = el.querySelectorAll<HTMLElement>(".row");
      const mark = el.querySelector<HTMLElement>(".mark")!;
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const active = Math.min(items.length - 1, Math.floor(self.progress * items.length));
          rows.forEach((r, i) => r.classList.toggle("is-active", i === active));
          mark.style.transform = `rotateY(${self.progress * 360}deg) rotateX(${Math.sin(self.progress * Math.PI) * 18}deg)`;
        },
      });
    },
    { scope: root },
  );
  return (
    <section ref={root} data-theme="light" className="relative h-[300vh] bg-paper">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="px-page mx-auto grid w-full max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow text-green-600">{eyebrow}</p>
            <ol className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
              {items.map((it, i) => (
                <li key={it.title} className="row py-5">
                  <div className="flex items-baseline gap-4">
                    <span className="idx tabular-nums">0{i + 1}</span>
                    <div>
                      <h3 className="text-2xl font-medium tracking-[-0.02em] md:text-3xl">{it.title}</h3>
                      <p className="blurb mt-1 max-w-md text-sm text-ink/65">{it.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center justify-center [perspective:1200px]">
            <LogoMark className="mark h-[min(40vw,380px)] text-green-500 drop-shadow-[0_30px_40px_rgba(22,163,74,.25)] [transform-style:preserve-3d]" />
          </div>
        </div>
      </div>
    </section>
  );
}
