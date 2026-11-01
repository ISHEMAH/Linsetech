"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import CharReveal from "@/components/motion/CharReveal";
import SplitReveal, { type RevealControl } from "@/components/motion/SplitReveal";
import DashedLine from "@/components/ui/DashedLine";
import DarkGradient from "@/components/backdrop/DarkGradient";
import { useContact } from "@/components/layout/ContactContext";
import type { Post } from "@/content/news";
import { clips } from "@/content/clips";
import { cn } from "@/lib/cn";

const HeroIntroScene = dynamic(() => import("@/components/three/HeroIntroScene"), { ssr: false });
const ClipVideo = dynamic(() => import("@/components/media/ClipVideo"), { ssr: false });

const MARGIN = "px-[clamp(16px,2.5vw,40px)]";

/** MacyePay recovery rate over the last 12 months (the product site's figures) */
const RECOVERY = [86, 88, 91, 92, 94, 95, 96, 97, 97, 98, 98, 98];
const CARDS = ["agreements", "businesses", "recovery"] as const;

/** Sharplink HomeProductivityChart (chart.js) as SVG: dashed top rule, 17 dashed verticals with 2px caps, 1.25px line, 6px end square */
function Chart() {
  const W = 386;
  const H = 216;
  const L = 2;
  const R = W - 6;
  const T = 4;
  const min = Math.min(...RECOVERY) - 4;
  const max = Math.max(...RECOVERY) + 1;
  const pts = RECOVERY.map((v, i) => [L + (i / (RECOVERY.length - 1)) * (R - L), H - ((v - min) / (max - min)) * (H - T)] as const);
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full overflow-visible" aria-hidden>
      <g stroke="rgba(255,255,255,.15)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke">
        <line x1={L} x2={R} y1={T} y2={T} />
        {Array.from({ length: 17 }, (_, i) => {
          const x = L + ((R - L) / 16) * i;
          return <line key={i} x1={x} x2={x} y1={T} y2={H} />;
        })}
      </g>
      {Array.from({ length: 17 }, (_, i) => (
        <rect key={i} x={L + ((R - L) / 16) * i - 1} y={T - 1} width={2} height={2} fill="rgba(255,255,255,.4)" />
      ))}
      <polyline points={pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="#fff" strokeWidth={1.25} vectorEffect="non-scaling-stroke" />
      <rect x={ex - 3} y={ey - 3} width={6} height={6} fill="#fff" />
    </svg>
  );
}

/** faint isometric line art on the right of each card (Sharplink's card illustrations) */
function CardArt({ i }: { i: number }) {
  return (
    <svg viewBox="0 0 120 120" className="pointer-events-none absolute right-0 top-0 h-full w-auto text-black/[0.16]" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" aria-hidden>
      {i === 0 && (
        <g strokeLinejoin="round">
          {[0, 9, 18].map((d) => (
            <path key={d} d={`M30 ${74 - d} L64 ${56 - d} L98 ${74 - d} L64 ${92 - d} Z`} />
          ))}
          <path d="M30 56 V74 M98 56 V74 M64 74 V92" strokeDasharray="2 3" />
          <path d="M48 47 L76 62 M54 44 L82 59" />
          <circle cx="76" cy="44" r="7" />
          <path d="M72 50 L70 60 L76 56 L82 60 L80 50" />
        </g>
      )}
      {i === 1 && (
        <g strokeLinejoin="round">
          <path d="M28 52 L60 36 L92 52 L60 68 Z" />
          <path d="M28 52 V84 L60 100 V68 M92 52 V84 L60 100" />
          <path d="M36 72 L52 80 V94 L36 86 Z" />
          <path d="M68 80 L84 72 V60 L68 68 Z" strokeDasharray="2 3" />
          <path d="M24 50 L60 32 L96 50 M60 32 V22 M54 25 L60 22 L66 25" />
        </g>
      )}
      {i === 2 && (
        <g strokeLinejoin="round">
          <path d="M26 78 L60 60 L94 78 L60 96 Z" />
          {[0, 1, 2, 3].map((k) => {
            const x = 40 + k * 12;
            const h = 10 + k * 9;
            const y = 74 - k * 4;
            return <path key={k} d={`M${x} ${y} V${y - h} L${x + 6} ${y - h - 3} V${y - 3} M${x} ${y - h} L${x + 6} ${y - h + 3}`} />;
          })}
          <path d="M36 46 C54 40 70 30 88 18" strokeDasharray="2 3" />
          <rect x="86" y="15" width="5" height="5" />
        </g>
      )}
    </svg>
  );
}

/**
 * Sharplink HomeHeroProductivityWrapper. Desktop: ONE pinned section (Sharplink .home-productivity): the hero lives in an
 * .animated-mask over a 3 × 3 grid (heading | card | three numbered cards). Pinned "top top" for 1.5 × the section height,
 * scrub true, the mask clips from the viewport to the card while the whole hero fades and shrinks to .85, the dark
 * gradient behind it shrinks to 1.1 × / 1.3 × the card, the dashed grid and the heading rise 300px, the heading's letters
 * play at .7 (reverse on scroll back), the chart and its figures come in, the cards slide in from x 100.
 * Phones: the hero is its own screen (film fixed in the bottom 75lvh, fading out as it scrolls away, over the dark gradient)
 * and the products follow as a normal section (heading reveal at "top 20%", the card's figures when it reaches the centre).
 */
export default function HeroProductivity({ latest, latestDate }: { latest?: Post; latestDate?: string }) {
  const t = useTranslations("hero");
  const tp = useTranslations("productivity");
  const { open } = useContact();
  const root = useRef<HTMLElement>(null);
  const title = useRef<RevealControl | null>(null);
  const scroll = useRef(0);
  const cardNdc = useRef({ x: 0, y: 0, h: 0.6 });

  useGSAP(
    () => {
      const el = root.current!;
      const reduced = prefersReducedMotion();
      const q = gsap.utils.selector(el);

      // intro (Sharplink HomeHero): CTAs → eyebrow → blurb → press card, .8s power2.out, stagger .2, delay .3
      gsap.to(q(".hero-in"), { autoAlpha: 1, duration: 0.8, ease: "power2.out", stagger: 0.2, delay: reduced ? 0 : 0.3 });

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const desktop = !!ctx.conditions?.desktop;
        const chartIn = [...q(".pc-heading"), ...q(".pc-label"), ...q(".pc-img"), ...q(".pc-cta")];

        if (!desktop) {
          // phones: Nav.tsx reads the header theme from the dark gradient behind the hero (no manual section)
          delete el.dataset.themeManual;
          if (reduced) {
            gsap.set(chartIn, { autoAlpha: 1 });
            return;
          }
          // film + overlay (fixed) fade out while the hero scrolls away: 1s power2.in, scrubbed "top top" → "bottom center"
          const fade = gsap.timeline({ paused: true });
          fade.to([q(".hero-film"), q(".hero-shade")], { autoAlpha: 0, duration: 1, ease: "power2.in" }, 0);
          ScrollTrigger.create({ trigger: q(".hero")[0], start: "top top", end: "bottom center", scrub: true, animation: fade });
          // products: heading letters when the section reaches 20%, the card's figures when it reaches the centre
          const body = q(".prod-body")[0];
          // (onRefresh: a page opened further down starts with them already played)
          ScrollTrigger.create({ trigger: body, start: "top 20%", onEnter: () => title.current?.play(), onRefresh: (st) => st.progress > 0 && title.current?.play() });
          const c = gsap.timeline({ paused: true, defaults: { ease: "none" } });
          c.fromTo(q(".pc-img"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.1)
            .to(q(".pc-heading"), { autoAlpha: 1, duration: 0.2 }, 0)
            .fromTo(q(".pc-label"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.15 }, 0.15)
            .fromTo(q(".pc-value"), { yPercent: 100 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, stagger: 0.15 }, 0.3)
            .fromTo(q(".pc-cta"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.3);
          // theirs plays when the card's top reaches the centre, or once the section top is 20 % above the viewport
          ScrollTrigger.create({ trigger: q(".prod-chart")[0], start: "top center", onEnter: () => c.play(), onRefresh: (st) => st.progress > 0 && c.play() });
          ScrollTrigger.create({ trigger: body, start: "top -20%", onEnter: () => c.play() });
          return;
        }

        // desktop: the pinned section drives the header itself
        el.dataset.themeManual = "1";
        const mask = q(".prod-mask")[0];
        const hero = q(".hero")[0];
        const card = q(".prod-chart")[0];
        const grad = mask.querySelector<HTMLElement>("[data-dg]")!;
        const setH = () => el.style.setProperty("--sh", `${el.offsetHeight}px`);
        setH();
        ScrollTrigger.addEventListener("refreshInit", setH);

        const clipTo = () => {
          const m = mask.getBoundingClientRect();
          const c = card.getBoundingClientRect();
          // where the mark settles when the real-time fallback scene is used (NDC of the card centre)
          cardNdc.current = { x: ((c.left + c.width / 2) / window.innerWidth) * 2 - 1, y: -(((c.top - m.top + c.height * 0.42) / window.innerHeight) * 2 - 1), h: c.height / window.innerHeight };
          return `inset(${c.top - m.top}px ${m.right - c.right}px ${m.bottom - c.bottom}px ${c.left - m.left}px)`;
        };

        // Sharplink's timeline (gsap defaults ease "none"), 1.8 long; the header turns light at .3
        const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        tl.fromTo(hero, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: reduced ? 1 : 0.85, duration: 1.2 }, 0.1)
          .fromTo(grad, { width: () => mask.offsetWidth + 200, height: () => mask.offsetHeight * 1.1 }, { width: () => card.offsetWidth * 1.1, height: () => card.offsetHeight * 1.3, duration: 1.3 }, 0)
          .fromTo(mask, { clipPath: () => `inset(0px 0px ${Math.max(0, mask.offsetHeight - window.innerHeight)}px 0px)` }, { clipPath: clipTo, duration: 1 }, 0)
          .fromTo(q(".pl"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
          .fromTo(q(".prod-card"), { autoAlpha: 0, x: reduced ? 0 : 100 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.2, ease: "power2.out" }, 0.8)
          // the heading's letters: played (time-based) when the scrub passes .7, run back when it returns
          .to({}, { duration: 0.1, onStart: () => title.current?.play(), onReverseComplete: () => title.current?.reverse() }, 0.7)
          .fromTo([...q(".pl-move"), ...q(".prod-heading")], { y: reduced ? 0 : 300 }, { y: 0, duration: 1.8 }, 0)
          .fromTo(q(".prod-title"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.8)
          .fromTo(q(".pc-img"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.8)
          .to(q(".pc-heading"), { autoAlpha: 1, duration: 0.2 }, 0.7)
          .fromTo(q(".pc-label"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.15 }, 0.95)
          .fromTo(q(".pc-value"), { yPercent: 100 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, stagger: 0.15 }, 1.1)
          .fromTo(q(".pc-cta"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.1)
          .fromTo([...q(".prod-desc"), ...q(".prod-wrap")], { autoAlpha: 0, y: reduced ? 0 : 150 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.9);

        // only while the header line is over this section: a refresh elsewhere on the page must not repaint the header
        const theme = (p: number) => {
          const r = el.getBoundingClientRect();
          if (r.top > 40 || r.bottom <= 40) return;
          document.documentElement.dataset.nav = p * tl.duration() >= 0.3 ? "light" : "dark";
        };
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => `+=${el.offsetHeight * 1.5}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          animation: tl,
          onUpdate: (self) => {
            scroll.current = Math.min(1, self.progress * 2);
            theme(self.progress);
          },
          onRefresh: (self) => theme(self.progress),
        });
        return () => ScrollTrigger.removeEventListener("refreshInit", setH);
      });
    },
    { scope: root },
  );

  const press = latest && (
    <Link href={`/news/${latest.slug}` as never} className="news-card relative block p-5">
      <span className="flex items-center justify-between">
        <span className="eyebrow">{t("news")}</span>
        <span className="eyebrow text-off-white/60">{latestDate}</span>
      </span>
      <span className="mt-4 flex gap-5">
        <span className="line-clamp-2 grow self-end text-[16px] leading-[1.35] font-medium text-balance">{latest.title}</span>
        {/* Sharplink: an icon-only secondary ui-button that plays its hover with the card (box → brand, arrow rolls up) */}
        <span className="ui-btn ui-btn--secondary has-icon allow-parent-hover shrink-0" aria-hidden>
          <span className="ui-btn__icon">
            <span>
              <Arrow />
            </span>
            <span>
              <Arrow />
            </span>
          </span>
        </span>
      </span>
    </Link>
  );

  return (
    <section ref={root} data-theme="dark" data-theme-manual="1" data-chapter="welcome" className="home-prod relative z-[2]">
      {/* phones: Sharplink's mobile-only gradient behind the hero and the top of the products (200vh, scale 1.3 → 0.5) */}
      <div className="md:hidden">
        <DarkGradient height="200vh" />
      </div>

      {/* hero. Desktop: Sharplink .animated-mask (102vw, section-tall) that clips down to the card, holding the card's
          gradient and the hero; phones: an ordinary first screen */}
      <div className="prod-mask relative md:absolute md:left-1/2 md:top-0 md:z-[4] md:h-[max(var(--sh,100lvh),100lvh)] md:w-[102vw] md:-translate-x-1/2 md:overflow-hidden">
        <div className="hidden md:block">
          <DarkGradient parallax={false} height="110%" />
        </div>
        <div data-theme="dark" className="hero relative flex min-h-[100lvh] flex-col justify-between pb-6 pt-[calc(110px+var(--cookie-offset,0px))] text-off-white md:absolute md:left-[calc(1vw-1px)] md:top-0 md:h-[100lvh] md:w-[calc(100vw+2px)] md:bg-green-950">
          {/* phones: Sharplink .overlay-gradient — black over the top 40% of the screen, gone by 60% */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[100lvh] bg-[linear-gradient(180deg,#000_40%,transparent_60%)] md:hidden" aria-hidden />
          {/* film: phones fixed in the bottom 75lvh with a soft top edge (Sharplink .video-bg < 800px); desktop fills the hero */}
          <div className="hero-film pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[75lvh] [mask-image:linear-gradient(0deg,#000_80%,transparent_98%)] md:absolute md:inset-0 md:h-full md:[mask-image:none]">
            {clips.hero.enabled ? (
              <ClipVideo mode="play" loopFrom={7.5} webm={clips.hero.webm} mp4={clips.hero.mp4} poster={clips.hero.poster} className="absolute inset-0 object-[74%_45%] md:object-center" />
            ) : (
              <HeroIntroScene scrollRef={scroll} cardRef={cardNdc} className="absolute inset-0" />
            )}
            <div className="grain" aria-hidden />
          </div>
          {/* soft scrims so the heading, the footer and the nav stay legible over the bright band rims of the looping clip */}
          <div
            className="hero-shade pointer-events-none fixed inset-x-0 top-0 z-[1] h-[100lvh] md:absolute md:inset-0 md:h-auto"
            style={{ background: "linear-gradient(180deg, rgb(2 10 7 / .5) 0%, rgb(2 10 7 / 0) 15%), radial-gradient(ellipse 48% 52% at 16% 30%, rgb(2 10 7 / .72) 0%, rgb(2 10 7 / .4) 45%, rgb(2 10 7 / 0) 78%), linear-gradient(0deg, rgb(2 10 7 / .55) 0%, rgb(2 10 7 / 0) 24%)" }}
            aria-hidden
          />

          <div className={cn("relative z-[2]", MARGIN)}>
            <CharReveal as="h1" text={t("title")} className="h1 max-w-[7.6em] text-balance" delay={0.1} duration={1} />
            <div className="hero-in invisible mt-7 flex w-max flex-col items-stretch gap-1">
              <ButtonLink href="/work" variant="primary">{t("cta1")}</ButtonLink>
              <Button variant="secondary" arrow={false} onClick={open}>{t("cta2")}</Button>
            </div>
          </div>

          <div className={cn("relative z-[2] grid grid-cols-4 items-end gap-x-4 gap-y-2 md:grid-cols-12 md:gap-x-[28px]", MARGIN)}>
            <div className="hero-in invisible col-span-4 flex items-center gap-3 md:col-span-3">
              <span className="eyebrow">{t("proudly")}</span>
              <Image src="/work/macyepay/logo.svg" alt="MacyePay" width={120} height={30} className="h-7 w-auto brightness-0 invert" />
            </div>
            <p className="hero-in invisible col-span-4 max-w-[409px] text-[19px] leading-[1.35] font-medium md:col-span-5">{t("sub")}</p>
            {press && (
              <div className="hero-in invisible col-span-4 max-md:absolute max-md:inset-x-[clamp(16px,2.5vw,40px)] max-md:top-[calc(100%+32px)]">{press}</div>
            )}
          </div>
        </div>
      </div>

      {/* products (Sharplink .home-productivity): 160px spacer (320 on phones), 3 × 3 grid, 160px spacer */}
      <div data-theme="light" className={cn("prod-body relative", MARGIN)}>
        <div className="relative grid h-[320px] grid-cols-1 gap-x-[28px] md:h-[160px] md:grid-cols-3" aria-hidden>
          <div className="relative hidden md:block">
            <DashedLine direction="vertical" className="pl pl-move left-full" />
          </div>
          <div className="relative">
            <DashedLine direction="vertical" className="pl pl-move left-0" />
            <DashedLine direction="vertical" className="pl pl-move left-full" />
            <DashedLine className="pl top-[calc(100%-24px)] !-left-[clamp(16px,2.5vw,40px)] !w-screen md:hidden" />
          </div>
          <div className="relative hidden md:block">
            <DashedLine direction="vertical" className="pl pl-move left-0" />
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-y-2 md:grid-cols-3 md:grid-rows-[repeat(3,1fr)] md:gap-[28px]">
          <DashedLine className="pl pl-move top-0 max-md:!-left-[clamp(16px,2.5vw,40px)] max-md:!w-screen" />

          {/* heading (col 1, row 1), with the brand pin */}
          <div className="prod-heading relative pt-7 before:absolute before:left-0 before:top-0 before:z-[1] before:h-[6px] before:w-[6px] before:bg-green-400">
            <SplitReveal manual controlRef={title} className="prod-title text-[44px] leading-[1.23] tracking-[-0.01em] text-balance text-ink min-[1200px]:text-[68px] min-[1200px]:leading-[1.06] min-[1200px]:tracking-[-0.02em]">
              {tp("title")}
            </SplitReveal>
            <DashedLine direction="vertical" className="pl left-full" />
            <DashedLine className="pl top-full hidden !w-[calc(100%+28px)] md:block" />
          </div>

          {/* filler (col 1, row 2) */}
          <div className="relative hidden md:col-start-1 md:row-start-2 md:block" aria-hidden>
            <DashedLine className="pl pl-move top-0 !w-[calc(100%+28px)]" />
            <DashedLine direction="vertical" className="pl pl-move left-full !-top-7 !h-[calc(100%+56px)]" />
            <DashedLine className="pl pl-move top-full !w-[calc(100%+28px)]" />
          </div>

          {/* description (col 1, row 3) */}
          <div className="relative mb-4 pb-[46px] pt-4 md:col-start-1 md:row-start-3 md:mb-0 md:pb-0 md:pt-7">
            <DashedLine className="pl pl-move top-full !-left-[clamp(16px,2.5vw,40px)] !w-screen md:hidden" />
            <DashedLine className="pl pl-move top-0 hidden md:block" />
            <p className="prod-desc max-w-[310px] text-[16px] leading-[1.35] font-medium text-ink">{tp("desc")}</p>
            <DashedLine direction="vertical" className="pl pl-move left-full hidden md:block" />
          </div>

          {/* the card (col 2, rows 1–3): on desktop its dark gradient is the one inside the hero's mask */}
          <div data-theme="dark" className="prod-chart pointer-events-none relative z-[5] flex min-h-[367px] min-w-0 flex-col p-4 text-off-white md:col-start-2 md:row-span-3 md:row-start-1 md:px-7 md:pb-7 md:pt-[25px]">
            <div className="absolute inset-0 overflow-hidden md:hidden" aria-hidden>
              <DarkGradient parallax={false} height="130%" />
            </div>
            <DashedLine direction="vertical" className="pl pl-move left-0 hidden md:block" />
            <DashedLine direction="vertical" className="pl pl-move left-full hidden md:block" />
            <div className="pc-heading invisible relative z-[1] opacity-0">
              <div className="flex justify-between pb-4 md:pb-7">
                <span className="pc-label eyebrow invisible opacity-0">{tp("stats.processed")}</span>
                <span className="overflow-hidden text-[19px] leading-[1.35] font-medium">
                  <span className="pc-value block">RWF 500M+</span>
                </span>
              </div>
              <div className="relative flex justify-between pb-6 pt-4 md:py-7">
                <DashedLine theme="dark" className="top-0" />
                <span className="pc-label eyebrow invisible opacity-0">{tp("stats.recovery")}</span>
                <span className="overflow-hidden text-[19px] leading-[1.35] font-medium">
                  <span className="pc-value block">98%</span>
                </span>
              </div>
            </div>
            <div className="pc-img invisible relative z-[1] mb-8 aspect-[311/160] w-full opacity-0 md:mb-auto md:aspect-[386/216] min-[1200px]:mb-[153px]">
              <Chart />
            </div>
            <div className="pc-cta pointer-events-auto invisible relative z-[1] mt-auto flex flex-col opacity-0">
              <ButtonLink href="/work/macyepay" variant="tertiary">{tp("cta")}</ButtonLink>
            </div>
          </div>

          {/* three numbered cards (col 3) */}
          {CARDS.map((k, i) => (
            <div key={k} className="prod-wrap relative md:col-start-3">
              {i > 0 && <DashedLine direction="vertical" className="pl left-0 hidden !-top-7 !h-7 md:block" />}
              {i > 0 && <DashedLine className="pl top-0 hidden !-left-7 !w-[calc(100%+28px)] md:block" />}
              <div className="prod-card relative flex h-full min-h-[120px] flex-col gap-3 overflow-hidden bg-[var(--surface-darker-secondary)] p-5 text-ink">
                <span className="flex h-[22px] w-[30px] items-center justify-center gap-1 self-start bg-ink font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-off-white before:h-1 before:w-1 before:bg-current">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="relative z-[1] max-w-[60%] text-[16px] leading-[1.35] font-medium">{tp(`cards.${k}`)}</p>
                <CardArt i={i} />
              </div>
              {i < CARDS.length - 1 && <DashedLine className="pl top-full hidden md:block" />}
            </div>
          ))}
        </div>

        <div className="relative grid h-[160px] grid-cols-1 gap-x-[28px] md:grid-cols-3" aria-hidden>
          <div className="relative hidden md:block">
            <DashedLine direction="vertical" className="pl pl-move left-full" />
          </div>
          <div className="relative">
            <DashedLine direction="vertical" className="pl pl-move left-0" />
            <DashedLine direction="vertical" className="pl pl-move left-full" />
          </div>
          <div className="relative hidden md:block">
            <DashedLine direction="vertical" className="pl pl-move left-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
