"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import DashedLine from "@/components/ui/DashedLine";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { ButtonLink } from "@/components/ui/Button";
import DarkGradient from "@/components/backdrop/DarkGradient";
import type { Service } from "@/content/services";
import WhenNear from "@/components/media/WhenNear";
import { clips } from "@/content/clips";

const ClipVideo = dynamic(() => import("@/components/media/ClipVideo"), { ssr: false });

const MARGIN = "px-[clamp(16px,2.5vw,40px)]";
const BRIGHT = "#F3F3F3";

/**
 * Sharplink "opportunity-wrapper" (HomeOpportunity), after the home banner:
 * - their gradient-dark image (top variant, 110 % of the block, parallax 1.3 → 0.9) takes the page from black through
 *   green to the light backdrop; Nav.tsx reads the header theme straight from it;
 * - the statement is split into lines and letters, all at opacity 0; the first line is #F3F3F3, the others off-white at
 *   40 %. Shuffled letters fade in (0.5 each, stagger 1/n, from .25) scrubbed on the section "top 80%" → "top 20%";
 * - eyebrow, CTA and statement pin at "top 160px" → "bottom 280px" (phones 100 / 320px); while pinned the dim lines turn
 *   white in reading order (stagger amount .7), then the statement leaves (opacity 0, y −200, .5 at .7) and the header
 *   row turns to its light theme at .8;
 * - their chrome clip (an 8.7 s loop, a fixed 3:4 box at the right from 160px down, soft top edge) fades in when the
 *   list reaches 75 % and out near the end, beside the service cards.
 */
export default function Opportunity({ services }: { services: Service[] }) {
  const t = useTranslations("opportunity");
  const tw = useTranslations("whatWeDo.items");
  // the cards' blurbs come from the services pages' messages, like their titles (the content fallback is English only)
  const ts = useTranslations("servicesPage.services");
  const root = useRef<HTMLElement>(null);
  // the clip plays only while its window is on (from a screen before the fade, see below)
  const [partsOn, setPartsOn] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      const block = el.querySelector<HTMLElement>(".opp-block")!;
      const head = el.querySelector<HTMLElement>(".opp-head")!;
      const statement = el.querySelector<HTMLElement>(".opp-statement")!;
      const list = el.querySelector<HTMLElement>(".cards")!;
      // the clip layer is fixed (Sharplink .video-container) but mounted lazily inside an in-flow anchor: the anchor carries
      // the layer's opacity (--po) and, while the fade window is active, data-on (shown) so the clip idles otherwise
      const partsBox = el.querySelector<HTMLElement>(".opp-parts-anchor");
      const reduced = prefersReducedMotion();
      const setHead = (theme: "dark" | "light") => (head.dataset.theme = theme);

      // cards: fade + title rise between 75% and 50% (CardOpportunity)
      el.querySelectorAll<HTMLElement>(".card-opp").forEach((card) => {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "none" }, 0).fromTo(card.querySelector(".title-inner"), { yPercent: 100 }, { yPercent: 0, duration: 0.3, ease: "none" }, 0);
        ScrollTrigger.create({ trigger: card, start: "top 75%", end: "top 50%", scrub: true, animation: tl });
      });

      if (reduced) {
        gsap.set(statement, { color: BRIGHT });
        // no fades: the clip (held on a still frame) is simply shown beside the list and gone after it — it is fixed, so
        // left on it stayed over the rest of the page
        if (partsBox) {
          const show = (st: ScrollTrigger) => {
            partsBox.style.setProperty("--po", st.isActive ? "1" : "0");
            if (st.isActive) partsBox.dataset.on = "1";
            else delete partsBox.dataset.on;
            setPartsOn(st.isActive);
          };
          ScrollTrigger.create({ trigger: list, endTrigger: el, start: "top 75%", end: "bottom 60%", onToggle: show, onRefresh: show });
        }
        return;
      }

      // the split and its timelines depend on the line breaks: built once the fonts are in, rebuilt when the width changes
      let split: SplitText | null = null;
      let ctx: gsap.Context | null = null;
      let width = 0;
      const build = () => {
        ctx?.revert();
        split?.revert();
        width = window.innerWidth;
        const mobile = window.matchMedia("(max-width: 767px)").matches;
        const s = SplitText.create(statement, { type: "lines,words,chars", linesClass: "opp-line", wordsClass: "opp-word", charsClass: "opp-ch" });
        split = s;
        ctx = gsap.context(() => {
          gsap.set(s.chars, { opacity: 0 });
          const first = s.lines.length ? s.chars.filter((c) => s.lines[0].contains(c)) : [];
          const rest = s.chars.filter((c) => !first.includes(c));
          const restShuffled = gsap.utils.shuffle([...rest]);
          const firstShuffled = gsap.utils.shuffle([...first]);
          gsap.set(firstShuffled, { color: BRIGHT });

          const reveal = gsap.timeline();
          reveal.to(restShuffled, { opacity: 1, duration: 0.5, stagger: 1 / Math.max(1, restShuffled.length), ease: "none" }, 0.25);
          reveal.to(firstShuffled, { opacity: 1, duration: 0.5, stagger: 1 / Math.max(1, firstShuffled.length), ease: "none" }, 0.25);
          ScrollTrigger.create({ trigger: el, start: "top 80%", end: "top 20%", scrub: true, animation: reveal });

          const pinned = gsap.timeline({ paused: true });
          pinned.to(rest, { color: BRIGHT, duration: 0.02, stagger: { amount: 0.7 }, ease: "none" });
          pinned.to(statement, { autoAlpha: 0, y: mobile ? -50 : -200, duration: mobile ? 0.3 : 0.5, ease: mobile ? "power1.inOut" : "none" }, mobile ? 0.6 : 0.7);
          // their header row follows the site theme, which turns light here (desktop); phones switch at the same point
          pinned.to({}, { duration: 0, onReverseComplete: () => setHead("dark"), onComplete: () => setHead("light") }, 0.8);
          ScrollTrigger.create({
            trigger: block,
            start: mobile ? "top 100px" : "top 160px",
            end: mobile ? "bottom 320px" : "bottom 280px",
            scrub: true,
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
            animation: pinned,
            onRefresh: (self) => setHead(self.progress * pinned.duration() >= 0.8 ? "light" : "dark"),
          });

          // the chrome clip: in when the list reaches 75 %, held through the whole list, out over the last fifth as the
          // Work chapter's soft top edge comes in (desktop: until the section's bottom is 40 % up the screen) — as
          // Sharplink's video stays until the next section; fading by "bottom bottom" took it away mid-list
          if (partsBox) {
            const fade = gsap.timeline({ paused: true });
            fade.fromTo(partsBox, { "--po": 0 }, { "--po": 1, duration: 0.3, ease: "none" }, 0);
            fade.to(partsBox, { "--po": 0, duration: mobile ? 0.3 : 0.5, ease: "none" }, mobile ? 0.5 : 2);
            ScrollTrigger.create({
              trigger: list,
              endTrigger: el,
              start: mobile ? "bottom 90%" : "top 75%",
              end: mobile ? "bottom 75%" : "bottom 60%",
              scrub: true,
              animation: fade,
            });
            // the clip is shown and playing (data-on) from a screen before the fade, still at opacity 0, so its decoder
            // is running by the time it fades in
            ScrollTrigger.create({
              trigger: list,
              endTrigger: el,
              start: mobile ? "bottom 190%" : "top 175%",
              end: mobile ? "bottom 75%" : "bottom 60%",
              onToggle: (st) => {
                if (st.isActive) partsBox.dataset.on = "1";
                else delete partsBox.dataset.on;
                setPartsOn(st.isActive);
              },
            });
          }
        });
        ScrollTrigger.refresh();
      };
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (!cancelled) build();
      });
      let timer = 0;
      const onResize = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (split && window.innerWidth !== width) build();
        }, 200);
      };
      window.addEventListener("resize", onResize);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        ctx?.revert();
        split?.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} data-chapter="services" className="relative z-[3] pb-[50lvh] md:pb-[120px]">
      {/* statement block over their dark gradient */}
      <div className="relative flex min-h-[calc(100lvh+60px)] pt-[128px] md:min-h-[calc(100lvh+200px)] md:pt-[160px]">
        <DarkGradient position="top" height="110%" heightMobile="130%" speed={0.4} />
        <div className="opp-block relative z-[1] flex w-full flex-col pb-16 text-off-white md:pb-8">
          <div data-theme="dark" className={`opp-head relative z-[6] flex flex-col items-start gap-4 pt-[22px] md:flex-row md:justify-between ${MARGIN}`}>
            <DashedLine theme="dark" className="opp-head-line--dark top-0" />
            <DashedLine theme="light" className="opp-head-line--light top-0" />
            <span className="absolute left-[clamp(16px,2.5vw,40px)] top-0 z-[1] h-[6px] w-[6px] bg-green-400" aria-hidden />
            <p className="opp-eyebrow eyebrow">{t("eyebrow")}</p>
            <ButtonLink href="/services" variant="secondary">{t("cta")}</ButtonLink>
          </div>
          <div className={`relative z-[6] mt-11 grow md:mt-3 ${MARGIN}`}>
            <p className="opp-statement max-w-[1000px] text-[24px] leading-[1.4] font-medium tracking-[-0.01em] text-balance text-off-white/40 md:text-[44px] md:leading-[1.23] md:font-normal">{t("statement")}</p>
          </div>
        </div>
      </div>

      {/* cards + parts */}
      <div data-theme="light" className={`cards relative grid gap-0 pb-[140px] md:grid-cols-2 ${MARGIN}`}>
        <div className="relative">
          <DashedLine className="top-0" />
          {services.map((s, i) => (
            <article key={s.slug} className="card-opp relative grid grid-cols-[72px_1fr] gap-6 py-9 text-ink">
              <DashedLine className="bottom-0" />
              <span className="flex h-14 w-14 items-center justify-center border border-ink/15 text-ink/70">
                <ServiceIcon name={s.key} className="h-7 w-7" />
              </span>
              <div>
                <p className="eyebrow text-ink/50">{String(i + 1).padStart(2, "0")}</p>
                <div className="overflow-hidden">
                  <h3 className="title-inner mt-2 text-[clamp(20px,1.7vw,26px)] leading-[1.15] tracking-[-0.01em]">
                    <Link href={`/services/${s.slug}` as never} className="hover:text-green-700">{tw(`${s.key}.title`)}</Link>
                  </h3>
                </div>
                <p className="mt-3 max-w-[48ch] text-[15px] leading-[1.45] text-ink/70">{ts.has(`${s.key}.intro`) ? ts(`${s.key}.intro`) : s.intro}</p>
              </div>
            </article>
          ))}
        </div>
        {/* Sharplink .video-container: fixed, 3:4, flush right from 160px down, soft top edge, faded by the list's scroll */}
        <div className="opp-parts-anchor relative hidden md:block" style={{ ["--po" as string]: 0 }}>
          {/* attached two screens ahead (the box itself is fixed, so it would always count as on screen) */}
          {clips.opportunity.enabled && (
            <WhenNear className="absolute inset-0" margin="200% 0px">
              <div className="opp-parts pointer-events-none fixed right-0 top-[160px] z-0 aspect-[3/4] h-[calc(100vh-160px)] [mask-image:linear-gradient(0deg,#000_80%,transparent)]" style={{ opacity: "var(--po)" }}>
                <ClipVideo mode="play" loop active={partsOn} near="0px" webm={clips.opportunity.webm} mp4={clips.opportunity.mp4} poster={clips.opportunity.poster} className="absolute inset-0" />
              </div>
            </WhenNear>
          )}
        </div>
      </div>
    </section>
  );
}
