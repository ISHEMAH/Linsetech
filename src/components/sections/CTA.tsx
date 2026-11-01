"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, useGSAP } from "@/lib/gsap";
import { useContact } from "@/components/layout/ContactContext";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";

/**
 * End-of-page banner in Sharplink's "home-banner" treatment: a dark plate revealed by a clip-path from the bottom as
 * it scrolls in, the mark top-left, a two-tone statement (the part after the last comma is dimmed), the primary
 * action opens the contact drawer; the chrome machine's line art sits at the right.
 * `after="dark"`: the section itself is dark too, so a dark section above (the home Process chapter) runs straight into it
 * instead of opening a light gap while the plate rises.
 */
export default function CTA({ title, sub, secondary, after = "light" }: { title?: string; sub?: string; secondary?: { label: string; href: string }; after?: "light" | "dark" }) {
  const t = useTranslations("cta");
  const { open } = useContact();
  const root = useRef<HTMLElement>(null);
  const text = title ?? t("title");
  const cut = text.lastIndexOf(",");
  const parts = cut > 0 ? [text.slice(0, cut + 1), text.slice(cut + 1).trim()] : [text];

  useGSAP(
    () => {
      const el = root.current!;
      gsap.fromTo(el.querySelector(".cta-inner"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "top 20%", scrub: 0 } });
      gsap.from(el.querySelectorAll(".cta-in"), { autoAlpha: 0, y: 40, stagger: 0.12, duration: 1, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 45%", once: true } });
      gsap.fromTo(el.querySelector(".cta-wire"), { yPercent: 8 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="dark" data-chapter="contact" className={cn("relative z-[2] h-[100svh] min-h-[640px] text-off-white", after === "dark" ? "bg-[#020a07]" : "bg-transparent")}>
      <div className="cta-inner absolute inset-0 overflow-hidden bg-[#020a07]" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
        <DashedLine theme="dark" className="top-[112px]" />
        <DashedLine theme="dark" className="bottom-[96px]" />
        <DashedLine theme="dark" direction="vertical" className="left-[clamp(16px,2.5vw,40px)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/clips/stack_wire.png" alt="" loading="lazy" decoding="async" className="cta-wire pointer-events-none absolute right-[6%] top-[8%] hidden h-[84%] w-auto opacity-80 md:block" draggable={false} aria-hidden />
        <span className="absolute right-[26%] top-[46%] hidden h-2 w-2 bg-green-400 shadow-[0_0_14px_#22c55e] md:block" aria-hidden />
        <div className="absolute left-[clamp(24px,4vw,64px)] top-[150px]">
          <LogoMark className="cta-in h-8 text-off-white" />
        </div>
        <div className="absolute bottom-[clamp(120px,18vh,180px)] left-[clamp(24px,4vw,64px)] max-w-[min(90vw,760px)]">
          <h2 className="cta-in h1-sm">
            {parts.map((p, i) => (
              <span key={i} className={i === 1 ? "block text-off-white/45" : "block"}>
                {p}
              </span>
            ))}
          </h2>
          <p className="cta-in mt-6 max-w-[46ch] text-[17px] leading-[1.35] text-off-white/70">{sub ?? t("sub")}</p>
          <div className="cta-in mt-10 flex flex-wrap gap-[2px]">
            <Button variant="primary" onClick={open}>{t("button")}</Button>
            {secondary && (
              <ButtonLink href={secondary.href as never} variant="secondary">
                {secondary.label}
              </ButtonLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
