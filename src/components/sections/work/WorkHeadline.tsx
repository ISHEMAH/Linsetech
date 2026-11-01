"use client";
import { useMemo, useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { workPacing } from "@/components/sections/WorkPacing";
import WorkAward from "./WorkAward";
import { useBeatChars } from "./beatMotion";

type Props = {
  count: number;
  label: string;
  title: string;
  /** word of the title set in the accent (Puture's <em> in the work-award title) */
  highlight: string;
  kicker: string;
  about: string;
  facts: [string, string][];
  browse: string;
};

/**
 * The opening beat of the Work chapter on /work, laid over the pinned floor: the same award beat as the home chapter
 * (Puture's `.work-award`: headline with the accent word, night glass box whose copy decodes in, a button), on the
 * chapter's own pacing (award .15 → 5.35, then 2.4 screens of travel to project 1). Here it is the page's first screen,
 * so it is in from the top and its letters rise on load.
 */
export default function WorkHeadline({ count, label, title, highlight, kicker, about, facts, browse }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const pacing = useMemo(() => workPacing(count, false, true, false), [count]);
  const beat = useMemo(() => ({ ...pacing.award, in: 0 }), [pacing]);
  useBeatChars(root, title);

  useGSAP(
    () => {
      const el = root.current!;
      const chapter = el.parentElement!.querySelector<HTMLElement>("[data-chapter]");
      const node = el.querySelector<HTMLElement>("[data-in]")!;
      if (!chapter) return;
      const apply = (progress: number) => {
        const s = progress * pacing.total;
        node.classList.toggle("is-in", s >= beat.in && s < beat.out);
        node.classList.toggle("is-past", s >= beat.out);
      };
      const st = ScrollTrigger.create({ trigger: chapter, start: "top top", end: "bottom bottom", onUpdate: (self) => apply(self.progress), onRefresh: (self) => apply(self.progress) });
      apply(st.progress);
    },
    { scope: root, dependencies: [pacing, beat] },
  );

  const headline = highlight && title.includes(highlight) ? title.replace(highlight, `[${highlight}]`) : title;

  return (
    <div ref={root} className="pointer-events-none absolute inset-0 z-[2]">
      <div className="sticky top-0 h-svh">
        <WorkAward
          beat={beat}
          initiallyIn
          as="h1"
          label={label}
          headline={headline}
          kicker={kicker}
          explainer={about}
          facts={facts.map(([k, v]) => ({ label: k, value: v }))}
          cta={
            <a href="#archive" className="ui-btn ui-btn--light has-icon">
              <span className="ui-btn__content">
                <span>{browse}</span>
                <span aria-hidden>{browse}</span>
              </span>
              <span className="ui-btn__icon">
                <span>
                  <svg viewBox="0 0 16 16" className="h-[14px] w-[14px] rotate-90" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" strokeLinecap="square" />
                  </svg>
                </span>
                <span aria-hidden>
                  <svg viewBox="0 0 16 16" className="h-[14px] w-[14px] rotate-90" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" strokeLinecap="square" />
                  </svg>
                </span>
              </span>
            </a>
          }
        />
      </div>
    </div>
  );
}
