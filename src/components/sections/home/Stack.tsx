"use client";
import { Fragment, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import DashedLine from "@/components/ui/DashedLine";
import SplitReveal from "@/components/motion/SplitReveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import { clips } from "@/content/clips";
import { cn } from "@/lib/cn";

const MachineScene = dynamic(() => import("@/components/three/MachineScene"), { ssr: false });
const ClipVideo = dynamic(() => import("@/components/media/ClipVideo"), { ssr: false });

const ROWS = ["build", "own", "supply", "support"] as const;
/**
 * stack_chrome.webm (9 s): 0–40 % the machine assembles, then the chamber icon swaps at 40 / 55 / 70 / 85 % — one icon
 * per row. Sharplink's clip has no assembly (frame 0 is the finished machine), so only the assembled part is used.
 */
const SWAPS = [0.55, 0.85] as const; // row 1 → 2 and row 3 → 4 (row 2 → 3 at .70 falls in between)
const CLIP_MIN = 0.45; // icon 1 fully formed
const CLIP_MAX = 0.99;
const MARGIN = "px-[clamp(16px,2.5vw,40px)]";

const setNav = (theme: "dark" | "light") => {
  document.documentElement.dataset.nav = theme;
};

/** Title split into words / letters so the active row can light its letters up in random order (Sharplink HomePropositionsItem). */
function Letters({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => (
    <Fragment key={`${i}-${w}`}>
      <span className="word">
        {Array.from(w).map((ch, j) => (
          <span key={`${j}-${ch}`} className="letter">
            {ch}
          </span>
        ))}
      </span>
      {i < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

/**
 * Sharplink "home-propositions", measured at 1440×900:
 * - the header and the rows scroll with the page; only the machine column (85vh, columns 8–12) is pinned, from its
 *   centre at the viewport centre (phones: its top at 40 %, rising in) until the home banner's centre reaches the
 *   viewport centre — the banner slides over it and turns it into line art (Banner.tsx);
 * - the row that straddles the viewport centre is "active" (eyebrow / blurb / line .4 → 1); its letters light up in
 *   random order when it is entered and stay lit until another row is entered;
 * - rows 2+ are off-white on their dark gradient (gradient-dark, bottom variant) anchored to the list bottom and
 *   stretched upward (scaleY 1 → 1.9) as the list scrolls, so the page goes light → green → near black;
 * - the machine clip holds its finished first state until row 1's bottom is 80px below the centre, then scrubs
 *   linearly until the last row's top + 80px reaches the centre (phones: row 1 "bottom bottom" → last row "top top").
 */
export default function Stack() {
  const t = useTranslations("stack");
  const root = useRef<HTMLElement>(null);
  const progress = useRef(CLIP_MIN);
  const row = useRef(0);
  const [clipReady, setClipReady] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      const machine = el.querySelector<HTMLElement>(".machine")!;
      const box = el.querySelector<HTMLElement>(".machine-box")!;
      const list = el.querySelector<HTMLElement>(".propositions")!;
      const rows = Array.from(el.querySelectorAll<HTMLElement>(".prop-row"));
      const reduced = prefersReducedMotion();
      const banner = document.querySelector<HTMLElement>(".home-banner");
      const phone = () => window.matchMedia("(max-width: 767px)").matches;

      // machine pin: desktop from "center center" (top at 7.5vh), phones from 40 % down with a rise-in over the first
      // .4 of a (.4 + .5 per row) timeline (scrub .6), until the banner's centre is at the viewport centre
      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 768px)", mobile: "(max-width: 767px)" }, (ctx) => {
        const desktop = !!ctx.conditions?.desktop;
        const rise = gsap.timeline({ paused: true, defaults: { ease: "none" } });
        if (!desktop && !reduced) {
          rise.fromTo(box, { y: 100, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0);
          rise.to({}, { duration: ROWS.length * 0.5 });
        }
        ScrollTrigger.create({
          trigger: machine,
          start: desktop ? "center center" : "top 40%",
          endTrigger: banner ?? el,
          end: banner ? "center center" : "bottom top",
          pin: machine,
          pinSpacing: false,
          anticipatePin: 1,
          ...(rise.duration() ? { scrub: 0.6, animation: rise } : {}),
        });
      });

      // rows: the class follows the centre line; the letters only change when a row is entered (Sharplink sets the
      // active index on enter / enter-back only, so the last row stays lit after you scroll past it)
      const letters = rows.map((r) => Array.from(r.querySelectorAll<HTMLElement>(".letter")));
      let lit = -1;
      const light = (i: number) => {
        if (i === lit) return;
        const prev = lit;
        lit = i;
        row.current = i;
        if (reduced) {
          if (prev >= 0) gsap.set(letters[prev], { opacity: 0.4 });
          gsap.set(letters[i], { opacity: 1 });
          return;
        }
        if (prev >= 0) gsap.to(letters[prev], { opacity: 0.4, duration: 0.3, ease: "power2.out", overwrite: true });
        gsap.to(gsap.utils.shuffle([...letters[i]]), { opacity: 1, duration: 0.2, stagger: 0.03, ease: "none", overwrite: true });
      };
      rows.forEach((r, i) => {
        ScrollTrigger.create({
          trigger: r,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => r.classList.toggle("is-active", self.isActive),
          onEnter: () => light(i),
          onEnterBack: () => light(i),
        });
      });

      // header theme while the header line (29px, Sharplink useSwitchTheme "10% 29px") is over the section: light over
      // its top, dark once the gradient behind the logo is dark enough for white type (luminance < .2, Nav.tsx's rule),
      // measured on this gradient at 17 % of the list (phones 24 %: their rows are a screen tall). Derived from the
      // positions on every update so a refresh or a jump lands on the right theme; outside the section the neighbours
      // decide (the hero's pin, Nav.tsx for the banner and the phone products).
      const theme = () => {
        const r = el.getBoundingClientRect();
        if (r.top > 29 || r.bottom <= 29) return;
        const lr = list.getBoundingClientRect();
        setNav(lr.top + lr.height * (phone() ? 0.24 : 0.17) <= 29 ? "dark" : "light");
      };
      ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onUpdate: theme, onToggle: theme, onRefresh: theme });

      // clip scrub from the live positions of the rows (distances still to scroll, in px)
      const update = () => {
        const vh = window.innerHeight;
        const mobile = phone();
        const first = rows[0].getBoundingClientRect();
        const last = rows[rows.length - 1].getBoundingClientRect();
        const r2 = rows[1].getBoundingClientRect().top - vh / 2; // row 1 → 2 change
        const r4 = last.top - vh / 2; // row 3 → 4 change
        const s0 = mobile ? first.bottom - vh : first.bottom - (vh / 2 + 80);
        const s1 = mobile ? last.top : last.top + 80 - vh / 2;
        // linear in the scroll position, scaled so the clip's swaps land on the row changes; held outside the window.
        // Up to the first change it starts from CLIP_MIN, so the clip rests on exactly the frame of the still shown
        // before it loads (the straight line rested at ~.49, and the swap from still to clip jumped)
        const span = Math.max(1, r4 - r2);
        const lo = s0 - r2;
        const u = gsap.utils.clamp(lo, s1 - r2, -r2);
        const p = u < 0 && lo < 0 ? CLIP_MIN + ((SWAPS[0] - CLIP_MIN) * (u - lo)) / -lo : SWAPS[0] + (u * (SWAPS[1] - SWAPS[0])) / span;
        progress.current = gsap.utils.clamp(CLIP_MIN, CLIP_MAX, p);
      };
      ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onUpdate: update, onRefresh: update });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="light" data-theme-manual="1" data-chapter="stack" className="stack relative isolate">
      {/* header: scrolls with the page, above the gradient; the heading develops letter by letter at "top 80%" */}
      <div className={cn("prop-head relative z-[1] pt-[28px] pb-[34px] md:pb-[108px]", MARGIN)}>
        <DashedLine className="top-0" />
        <span className="absolute top-0 left-[clamp(16px,2.5vw,40px)] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <p className="eyebrow text-ink">{t("eyebrow")}</p>
        <SplitReveal className="mt-4 max-w-[580px] text-[44px] leading-[1.23] tracking-[-0.01em] text-balance text-ink md:text-[68px] md:leading-[1.06] md:tracking-[-0.02em]">
          {t("title")}
        </SplitReveal>
      </div>

      {/* machine: columns 8–12 at the section top, pinned while the rows scroll past (in flow, 60svh, below md) */}
      {/* explicit width: the pin rewrites `inset` inline, so an auto-width absolute box would shrink to fit */}
      <div className="machine pointer-events-none relative z-[2] w-full will-change-transform md:absolute md:top-0 md:left-0">
        <div className={cn("grid grid-cols-12 gap-x-[28px]", MARGIN)}>
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <div className="machine-box relative h-[60svh] md:h-[85vh]">
              {clips.stack.enabled ? (
                <>
                  {/* the resting frame as a still until the clip shows its first seek: on a slow connection (or a busy
                      Safari) the column stayed empty for the whole section while the 7 MB file arrived. With the still
                      covering the wait, the file is attached 1.5 screens ahead (2.5 loaded it on landing, desktop) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={clips.stack.hold} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full object-contain", clipReady && "invisible")} />
                  <ClipVideo mode="scrub" progressRef={progress} webm={clips.stack.webm} mp4={clips.stack.mp4} poster={clips.stack.poster} fit="contain" near="150% 0px" onReady={() => setClipReady(true)} className="absolute inset-0" />
                </>
              ) : (
                <MachineScene progressRef={progress} rowRef={row} variant="stack" className="absolute inset-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* rows over Sharplink's gradient-dark (bottom variant): 100 % of the list, anchored at its bottom, scale 1 → 1.9 */}
      <div className="propositions relative pb-[164px]">
        <DarkGradient position="bottom" height="100%" initialScale={1} speed={0.9} />
        <ol className="prop-list relative z-[1]">
          {ROWS.map((k, i) => (
            <li key={k} className={cn("prop-row relative min-h-[100svh] pt-[50px] md:min-h-0 md:pt-0", i === 0 ? "text-ink" : "text-off-white")}>
              <div className={cn("relative py-[28px]", MARGIN)}>
                <DashedLine theme={i === 0 ? "light" : "dark"} className="line top-0" />
                <p className="eyebrow">{t(`rows.${k}.eyebrow`)}</p>
              </div>
              <div className={cn("grid grid-cols-12 gap-x-[28px] gap-y-4 pb-[56px]", MARGIN)}>
                <h3 className="title col-span-12 max-w-[325px] text-[clamp(24px,2.3vw,32px)] leading-[1.16] font-medium tracking-[-0.01em] text-balance md:col-span-3" aria-label={t(`rows.${k}.title`)}>
                  <span aria-hidden>
                    <Letters text={t(`rows.${k}.title`)} />
                  </span>
                </h3>
                <p className="content col-span-12 max-w-[325px] text-[15px] leading-[1.35] font-medium md:col-span-4 md:col-start-4">{t(`rows.${k}.blurb`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
