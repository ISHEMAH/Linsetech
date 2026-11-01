"use client";
import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import CharReveal from "@/components/motion/CharReveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import LoopVideo from "@/components/backdrop/LoopVideo";
import { cn } from "@/lib/cn";

export type HeroClip = { webm: string; mp4: string; poster?: string; loop?: boolean };

type Props = {
  title: string;
  eyebrow?: string;
  /** Sharplink `.description`: 19px, max 332px, under the heading */
  sub?: string;
  /** buttons under the description */
  children?: ReactNode;
  /** Sharplink `.cards-wrapper`: stacked cards in columns 9–12 (presentation / events) */
  cards?: ReactNode;
  /** full-window, fixed, transparent chrome clip (Sharplink `.video-bg`) */
  clip?: HeroClip;
  /** recoloured Sharplink `.bg-overlay` mask over the clip (public/bg/hero-overlay-<name>.webp) */
  overlay?: "about" | "investors" | "none";
  /** height of the hero's own dark gradient (Sharplink: about/opportunity 130%, investors 120%) */
  gradientHeight?: string;
  /** below 800px (Sharplink: about/opportunity 150%); defaults to `gradientHeight` */
  gradientHeightMobile?: string;
  /** a custom fixed layer instead of `clip` (faded out the same way) */
  visual?: ReactNode;
  /**
   * Which Sharplink hero this is (their CSS, measured):
   * - "investors": heading in columns 1–4, 88px title, description + CTA, cards in columns 9–12; overlay FIXED over the clip;
   * - "about": heading max 496px, 68px title (1.06, −1.36px), CTAs stacked 4px apart; overlay scrolls with the hero;
   * - "opportunity": heading max 534px, 88px title, CTAs stacked 4px apart; overlay scrolls with the hero; mobile clip
   *   is the bottom 67lvh, masked at its top, framed at 94%.
   */
  variant?: "investors" | "about" | "opportunity";
  className?: string;
  /** @deprecated kept for older call sites */
  aside?: ReactNode;
  /** @deprecated use `cards` */
  corner?: ReactNode;
  /** @deprecated */
  size?: string;
  /** @deprecated */
  fade?: string;
};

/**
 * Sharplink inner-page hero (InvestorsHero / AboutHero / EthereumHero), ported:
 * - section: min-height 100lvh, padding-top 110px (82px mobile), above the page (z 2);
 * - its own SiteGradientBgDark (top, `gradientHeight`, z 0): black → green → arc into the light page, longer than the hero;
 * - the clip in a fixed full-window layer (z 1; mobile: bottom 80lvh) and the overlay mask over it (z 2, desktop only);
 * - copy in a 12-column grid (z 3): heading (letters revealed in random order from 0.1s), description, CTA; cards in
 *   columns 9–12, 28px apart.
 * Timing per hero (their setup functions, read from the chunks):
 * - investors: description, CTA, presentation card and slider fade in 0.8s power2.out, 0.2s apart after 0.3s (desktop);
 *   on phones only the description and CTA do, and the two cards fade in with the scroll instead (0.8s from 0.5 of a
 *   1.3 timeline scrubbed "top top" → "bottom 80%"). Clip and overlay fade out power2.in, "top top" → "bottom 50%"
 *   ("bottom 80%" on phones);
 * - about / opportunity: the eyebrow comes with the title, the CTAs (and our description) fade in 0.5s power2.out after
 *   1.2s, once the title has finished; only the clip fades out (power2.in, "top top" → "bottom 50%", "bottom 60%" on
 *   phones) — the overlay stays opaque and scrolls away with the hero.
 */
export default function PageHero({ title, eyebrow, sub, children, cards, clip, overlay = "none", gradientHeight = "130%", gradientHeightMobile, visual, variant = "investors", className, corner, aside }: Props) {
  const inv = variant === "investors";
  const root = useRef<HTMLElement>(null);
  const cardsNode = cards ?? corner;

  useGSAP(
    () => {
      const el = root.current!;
      const q = <T extends HTMLElement = HTMLElement>(s: string) => [...el.querySelectorAll<T>(s)];
      const eyebrowEl = q(".hero-eyebrow");
      const copy = q(".hero-sub, .hero-ctas");
      const wrap = el.querySelector<HTMLElement>(".hero-cards");
      const cardEls = wrap ? (q(".hero-card").length ? q(".hero-card") : [wrap]) : [];
      const layers = q(".hero-layer");
      if (prefersReducedMotion()) {
        gsap.set([...eyebrowEl, ...copy, ...cardEls], { autoAlpha: 1 });
        return;
      }
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 800px)", mobile: "(max-width: 799px)" }, (ctx) => {
        const mobile = !!ctx.conditions?.mobile;
        const tl = gsap.timeline({ paused: true });
        if (inv) {
          const fadeIn = { autoAlpha: 1, duration: 0.8, ease: "power2.out", stagger: 0.2, delay: 0.3 };
          if (mobile) {
            gsap.to([...eyebrowEl, ...copy], fadeIn);
            if (layers.length) tl.to(layers, { autoAlpha: 0, duration: 1, ease: "power2.in" }, 0);
            if (cardEls.length) tl.to(cardEls, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0.5);
          } else {
            gsap.to([...eyebrowEl, ...copy, ...cardEls], fadeIn);
            if (layers.length) tl.to(layers, { autoAlpha: 0, duration: 1, ease: "power2.in" }, 0);
          }
        } else {
          if (eyebrowEl.length) gsap.to(eyebrowEl, { autoAlpha: 1, duration: 0.5, delay: 0.1, ease: "power2.out" });
          if (copy.length) gsap.to(copy, { autoAlpha: 1, duration: 0.5, delay: 1.2, ease: "power2.out" });
          if (layers.length) tl.to(layers, { autoAlpha: 0, duration: 1, ease: "power2.in" }, 0);
        }
        if (tl.getChildren().length) {
          const end = inv ? (mobile ? "bottom 80%" : "bottom 50%") : mobile ? "bottom 60%" : "bottom 50%";
          ScrollTrigger.create({ trigger: el, start: "top top", end, scrub: true, animation: tl });
        }
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      data-theme="dark"
      data-hero
      // the cookie banner pushes the header down by --cookie-offset (0 → 48px, 75px on phones) on a first visit; the
      // hero copy moves with it, as Sharplink's hero paddings do (the fixed clip / overlay layers stay put)
      className={cn(
        "relative z-[2] min-h-[100lvh] pb-4 pt-[calc(82px_+_var(--cookie-offset,0px))] text-off-white [--gh:var(--gh-m)] min-[800px]:pt-[calc(110px_+_var(--cookie-offset,0px))] min-[800px]:[--gh:var(--gh-d)]",
        className,
      )}
      style={{ ["--gh-d" as string]: gradientHeight, ["--gh-m" as string]: gradientHeightMobile ?? (variant === "investors" ? gradientHeight : "150%") }}
    >
      <DarkGradient position="top" height="var(--gh)" />

      {clip && (
        <div
          className={cn(
            "hero-layer pointer-events-none fixed inset-x-0 bottom-0 z-[1] min-[800px]:bottom-auto min-[800px]:top-0 min-[800px]:h-[100lvh]",
            variant === "opportunity" ? "h-[67lvh] [mask-image:linear-gradient(0deg,#000_70%,transparent_98%)] min-[800px]:[mask-image:none]" : "h-[80lvh]",
          )}
        >
          <LoopVideo webm={clip.webm} mp4={clip.mp4} poster={clip.poster} loop={clip.loop ?? true} className={variant === "opportunity" ? "max-[799px]:object-[94%_center]" : undefined} />
        </div>
      )}
      {/* Sharplink .about-hero::before (mobile only): black → transparent over the top of the clip so the heading stays legible */}
      {clip && variant === "about" && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[100lvh] bg-[linear-gradient(#000_30%,transparent_60%)] min-[800px]:hidden" />}
      {!clip && visual && <div className="hero-layer pointer-events-none fixed inset-0 z-[1] h-[100lvh]">{visual}</div>}
      {!clip && !visual && aside && <div className="hero-layer pointer-events-none fixed inset-y-0 right-0 z-[1] hidden h-[100lvh] w-[55%] md:block">{aside}</div>}
      {overlay !== "none" && (
        <div
          aria-hidden
          className={cn("pointer-events-none left-0 top-0 z-[2] hidden w-full min-[800px]:block", inv ? "hero-layer fixed h-[100lvh]" : "absolute h-full")}
          style={{ backgroundImage: `url(/bg/hero-overlay-${overlay}.webp)`, backgroundSize: "100% 100%" }}
        />
      )}

      <div className="relative z-[3] grid grid-cols-4 gap-x-[16px] px-[clamp(16px,2.5vw,40px)] min-[800px]:grid-cols-12 min-[800px]:gap-x-[28px]">
        <div className={cn("relative z-[2]", inv ? "col-span-4" : "col-span-4 min-[800px]:col-span-12", variant === "about" && "max-w-[496px]", variant === "opportunity" && "max-w-[534px]")}>
          {eyebrow && <p className="hero-eyebrow eyebrow sq invisible mb-6 text-off-white/70">{eyebrow}</p>}
          <CharReveal
            as="h1"
            text={title}
            className={cn(
              "text-balance",
              inv && "text-[52px] leading-[1.04] tracking-[-1.3px] min-[800px]:text-[88px] min-[800px]:leading-[0.96] min-[800px]:tracking-[-2.64px] max-[799px]:max-w-[300px]",
              variant === "about" && "text-[44px] leading-[1.23] tracking-[-0.44px] min-[800px]:text-[68px] min-[800px]:leading-[1.06] min-[800px]:tracking-[-1.36px]",
              variant === "opportunity" && "text-[44px] leading-[1.23] tracking-[-0.44px] min-[800px]:text-[88px] min-[800px]:leading-[0.96] min-[800px]:tracking-[-2.64px]",
            )}
            delay={0.1}
            duration={1}
          />
          {sub && <p className="hero-sub invisible mt-4 max-w-[332px] text-balance text-[16px] font-medium leading-[1.35] min-[800px]:mt-6 min-[800px]:text-[19px]">{sub}</p>}
          {children && <div className={cn("hero-ctas invisible flex w-max flex-col items-start", inv ? "mt-6 gap-[2px] min-[800px]:mt-7" : "mt-7 gap-1")}>{children}</div>}
        </div>
        {/* cards that mark their own blocks `.hero-card` (HeroCards) fade one by one; anything else fades as one block */}
        {cardsNode && (
          <div className="hero-cards col-span-4 mt-[35vh] flex flex-col gap-[28px] min-[800px]:col-start-9 min-[800px]:mt-0 [&:not(:has(.hero-card))]:invisible">{cardsNode}</div>
        )}
      </div>
    </section>
  );
}
