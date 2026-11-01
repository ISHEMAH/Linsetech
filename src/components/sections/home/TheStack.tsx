"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ScrollTrigger, useGSAP, gsap } from "@/lib/gsap";

const AssembleScene = dynamic(() => import("@/components/three/AssembleScene"), { ssr: false });
const ROWS = ["build", "own", "supply", "support"] as const;

/** H4: four rows highlight one by one while the LS mark assembles from its strokes (replaces Sharplink's piston video). */
export default function TheStack() {
  const t = useTranslations("stack");
  const root = useRef<HTMLElement>(null);
  const explode = useRef(1);

  useGSAP(
    () => {
      const el = root.current!;
      const rows = el.querySelectorAll<HTMLElement>(".row");
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          explode.current = 1 - Math.min(1, p / 0.85);
          const active = Math.min(ROWS.length - 1, Math.floor(p * ROWS.length));
          rows.forEach((r, i) => r.classList.toggle("is-active", i === active));
        },
      });
      gsap.from(".stack-head > *", { y: 30, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: el, start: "top 70%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="light" data-chapter="stack" className="relative h-[320vh] bg-paper">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="px-page mx-auto grid w-full max-w-7xl items-center gap-10 md:grid-cols-2">
          <div>
            <div className="stack-head">
              <p className="eyebrow text-green-600">{t("eyebrow")}</p>
              <h2 className="display mt-4 text-[clamp(2rem,4.4vw,4rem)]">{t("title")}</h2>
            </div>
            <ol className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
              {ROWS.map((k, i) => (
                <li key={k} className="row py-5">
                  <div className="flex items-baseline gap-4">
                    <span className="idx tabular-nums">0{i + 1}</span>
                    <div>
                      <h3 className="text-2xl font-medium tracking-[-0.02em] md:text-3xl">{t(`rows.${k}.title`)}</h3>
                      <p className="blurb mt-1 max-w-md text-sm text-ink/65">{t(`rows.${k}.blurb`)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative aspect-square w-full md:aspect-[4/5]">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_60%,#cdefd9_0%,transparent_65%)]" />
            <AssembleScene explodeRef={explode} className="absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
