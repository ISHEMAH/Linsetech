"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Button, ButtonLink } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import SplitReveal from "@/components/motion/SplitReveal";
import { LogoOutline, logoTimeline } from "@/components/motion/LogoDraw";
import { useContact } from "@/components/layout/ContactContext";
import { cn } from "@/lib/cn";

const MARGIN_X = "mx-[clamp(16px,2.5vw,40px)]";
/**
 * Sharplink HomeBanner, between the Stack and the services: a framed dark block (dashed frame, corner pins, a target
 * pin centred on the machine's column) that scrolls normally over the Stack's still-pinned chrome machine. The
 * machine's outline (stack_wire.png, same camera, same 85vh box in columns 8–12) sits in a viewport-tall layer above the
 * block, pinned from the block's "top bottom" to its "center center" (phones "top 30%") and revealed by a clip that
 * follows the block's rising top edge ("top bottom" → "top top", scrub 0), so the chrome turns into line art under it.
 * The logo draws itself from "top 75%" to "center center"; the title develops letter by letter at "top 80%".
 */
export default function Banner() {
  const t = useTranslations("banner");
  const { open } = useContact();
  const root = useRef<HTMLElement>(null);
  const title = t("title");
  const cut = title.indexOf(",");
  const [lead, rest] = cut > 0 ? [title.slice(0, cut + 1), title.slice(cut + 1).trim()] : [title, ""];

  useGSAP(
    () => {
      const el = root.current!;
      const content = el.querySelector<HTMLElement>(".banner-content")!;
      const outline = el.querySelector<HTMLElement>(".banner-outline")!;
      const svg = el.querySelector<SVGSVGElement>(".ls-logo");
      const reduced = prefersReducedMotion();

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const mobile = !!ctx.conditions?.mobile;
        // Sharplink .outline-image-wrapper: clip rect(100% 100% 100% 0%) → rect(0% …), "top bottom" → "top top"
        const clip = gsap.timeline({ paused: true });
        clip.fromTo(outline, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 });
        ScrollTrigger.create({ animation: clip, trigger: content, start: "top bottom", end: "top top", scrub: 0 });
        ScrollTrigger.create({ trigger: content, start: "top bottom", end: mobile ? "top 30%" : "center center", scrub: 0, pin: outline, pinSpacing: false, anticipatePin: 1 });
        // the logo is desktop-only (Sharplink hides it below 800px)
        if (svg && !mobile) {
          const apply = logoTimeline(svg, { rg: (svg.dataset.rg ?? "").split(" "), ag: (svg.dataset.ag ?? "").split(" ") });
          if (reduced) apply(1);
          else ScrollTrigger.create({ trigger: content, start: "top 75%", end: "center center", scrub: true, onUpdate: (s) => apply(s.progress), onRefresh: (s) => apply(s.progress) });
        }
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="dark" className="home-banner relative z-[2] bg-black text-off-white">
      <DashedLine theme="dark" className="top-0" />
      <DashedLine theme="dark" className="top-[25px] md:hidden" />
      <div className={cn("relative pb-[14px] md:px-7 md:pb-0", MARGIN_X)}>
        <span className="absolute left-0 top-0 z-[3] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <span className="absolute right-0 top-0 z-[3] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <DashedLine theme="dark" direction="vertical" className="left-0 max-md:!h-[calc(100%+25px)]" />
        <DashedLine theme="dark" direction="vertical" className="left-full max-md:!h-[calc(100%+25px)]" />
        {/* target pin in the machine's column, at the block's centre (where the machine's centre is when its pin ends) */}
        <div className="pointer-events-none absolute inset-0 z-[2] grid grid-cols-4 gap-x-4 md:grid-cols-12 md:gap-x-[28px]" aria-hidden>
          <div className="col-span-4 flex items-center justify-center md:col-span-5 md:col-start-8">
            <span className="block h-2 w-2 bg-green-400 outline outline-1 outline-offset-8 outline-green-400 md:h-[10px] md:w-[10px] md:outline-offset-[10px]" />
          </div>
        </div>

        <div className="banner-content relative flex max-w-full flex-col items-start overflow-hidden bg-[var(--surface-lighter-subtle)] p-4 md:aspect-[1328/600] md:min-h-[600px] md:justify-between md:px-7 md:pb-[30px] md:pt-7">
          {/* the machine's line art: a viewport-tall layer whose bottom edge is the block's top edge until it pins */}
          <div className="banner-outline pointer-events-none absolute bottom-full left-0 z-0 h-[100lvh] w-full md:-left-7 md:w-[calc(100%+56px)]" style={{ clipPath: "inset(100% 0% 0% 0%)" }} aria-hidden>
            <div className="grid h-full grid-cols-12 items-center gap-x-[28px]">
              <div className="absolute inset-x-0 top-[40svh] h-[60svh] md:relative md:inset-auto md:top-auto md:col-span-5 md:col-start-8 md:h-[85vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/clips/stack_wire.png" alt="" decoding="async" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
              </div>
            </div>
          </div>
          <DashedLine theme="dark" direction="vertical" className="left-0 hidden md:block" />
          <DashedLine theme="dark" direction="vertical" className="right-0 hidden md:block" />

          <LogoOutline className="relative z-[2] hidden w-[96px] md:block" />
          <SplitReveal className="relative z-[2] mt-[448px] max-w-[311px] text-[24px] leading-[1.4] font-medium tracking-[-0.01em] text-balance text-off-white/40 md:my-auto md:max-w-[530px] md:text-[44px] md:leading-[1.23] md:font-normal">
            <span className="text-off-white">{lead}</span> {rest}
          </SplitReveal>
          <div className="relative z-[2] mt-4 flex w-full flex-col gap-1 md:mt-0 md:w-max md:flex-row">
            <ButtonLink href="/services" variant="primary">{t("cta1")}</ButtonLink>
            <Button variant="secondary" arrow={false} onClick={open}>{t("cta2")}</Button>
          </div>
        </div>
      </div>
      {/* bottom corner pins */}
      <div className={cn("relative pb-[14px] md:px-7 md:pb-0", MARGIN_X)} aria-hidden>
        <span className="absolute bottom-0 left-0 z-[3] h-[6px] w-[6px] bg-green-400" />
        <span className="absolute bottom-0 right-0 z-[3] h-[6px] w-[6px] bg-green-400" />
      </div>
      <DashedLine theme="dark" className="bottom-[25px] md:hidden" />
      <DashedLine theme="dark" className="bottom-0" />
    </section>
  );
}
