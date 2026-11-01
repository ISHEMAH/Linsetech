"use client";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** H2: one sentence builds word by word with green highlight boxes while the page brightens (Puture About). */
export default function Statement() {
  const t = useTranslations("statement");
  const root = useRef<HTMLElement>(null);
  const words = useMemo(() => {
    const hl = t("highlights").split(",").map((w) => w.trim().toLowerCase());
    return t("text").split(" ").map((w) => ({ w, hl: hl.includes(w.replace(/[^\p{L}]/gu, "").toLowerCase()) }));
  }, [t]);

  useGSAP(
    () => {
      const el = root.current!;
      const sticky = el.querySelector<HTMLElement>(".sticky-inner")!;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            document.documentElement.dataset.nav = self.progress > 0.62 ? "light" : "dark";
          },
        },
      });
      tl.from(".sw", { opacity: 0.12, y: 14, stagger: 0.18, ease: "none" }, 0)
        .to(".sw-hl", { backgroundSize: "100% 100%", color: "#04150f", stagger: 0.25, ease: "none" }, 0.6)
        .to(sticky, { backgroundColor: "#f7f9f7", color: "#0b1411", ease: "none", duration: 1.2 }, "-=0.5")
        .to(".grid-lines", { opacity: 0.6, ease: "none" }, "<");
      ScrollTrigger.refresh();
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="dark" data-chapter="about" className="relative h-[260vh]">
      <div className="sticky-inner sticky top-0 flex h-screen items-center overflow-hidden bg-green-950 text-white">
        <div className="grid-lines absolute inset-0 opacity-20" aria-hidden />
        <div className="px-page relative mx-auto max-w-5xl">
          <p className="display text-[clamp(1.9rem,5vw,4.6rem)]">
            {words.map(({ w, hl }, i) => (
              <span key={i} className="sw inline-block">
                <span
                  className={hl ? "sw-hl rounded-[0.12em] px-[0.12em] transition-none" : undefined}
                  style={hl ? { backgroundImage: "linear-gradient(#22c55e,#22c55e)", backgroundSize: "0% 100%", backgroundRepeat: "no-repeat", backgroundPosition: "0 0" } : undefined}
                >
                  {w}
                </span>
                {" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
