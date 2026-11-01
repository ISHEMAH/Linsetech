"use client";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Beat } from "@/components/sections/WorkPacing";
import { ChapterLabel } from "./chapterParts";
import { Decode, useDecode } from "./decode";

export type AwardFact = { label: string; value: string };

type Props = {
  beat: Beat;
  /** label text, after the chapter number when there is one */
  label: string;
  index?: ReactNode;
  /** Puture's headline format: lines split at "\n", accent words in [brackets] */
  headline: string;
  kicker: string;
  explainer: string;
  facts: AwardFact[];
  cta: ReactNode;
  /** h1 on /work (the page title), h2 inside the home chapter */
  as?: "h1" | "h2";
  /** server-render the beat as already in (the first screen of /work) */
  initiallyIn?: boolean;
  className?: string;
};

const EASE_FADE =
  "opacity-0 [transition:opacity_1.1s_cubic-bezier(.16,1,.3,1)] group-[.is-in]/award:opacity-100 group-[.is-in]/award:[transition:opacity_1.3s_cubic-bezier(.16,1,.3,1)_.1s]";

/** "a [WSIS Prize] Champion" → text and <em> parts */
function accent(line: string) {
  return line.split(/(\[[^\]]+\])/).map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <em key={i} className="not-italic text-green-500">
        {part.slice(1, -1)}
      </em>
    ) : (
      part
    ),
  );
}

/**
 * Puture's `.work-award`, the opening beat of the Work chapter: the chapter label, a centred headline with the accent
 * words, then a night glass box (blur 14px, #020a07 at .82, fading in over 1.3s after .1s) whose kicker, explainer and
 * facts decode in, and a button. The layer rises with the beat and stays opaque; its children fade (1.1s out, 1.3s in).
 * On phones it is left-aligned over a white wash.
 */
export default function WorkAward({ beat, label, index, headline, kicker, explainer, facts, cta, as: Title = "h2", initiallyIn = false, className }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useDecode(box, `${kicker}|${explainer}|${facts.map((f) => f.label + f.value).join("|")}`);
  const lines = headline.split("\n");

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <div
        data-in={beat.in}
        data-out={beat.out}
        className={cn(
          initiallyIn && "is-in",
          "group/award relative isolate mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-center gap-[clamp(14px,2.4vh,26px)] px-page text-center",
          "pointer-events-none translate-y-9 [transition:translate_1.4s_cubic-bezier(.16,1,.3,1)] [&.is-in]:pointer-events-auto [&.is-in]:translate-y-0 [&.is-in]:[transition:translate_1.6s_cubic-bezier(.16,1,.3,1)_.1s] [&.is-past]:-translate-y-9",
          "max-[900px]:items-start max-[900px]:text-left max-[900px]:before:pointer-events-none max-[900px]:before:absolute max-[900px]:before:inset-0 max-[900px]:before:-z-10 max-[900px]:before:bg-[linear-gradient(#fff0_12%,#ffffffe0_30%_78%,#fff0_94%)] max-[900px]:before:opacity-0 max-[900px]:before:[transition:opacity_1.1s_cubic-bezier(.16,1,.3,1)] max-[900px]:[&.is-in]:before:opacity-100 max-[900px]:[&.is-in]:before:[transition:opacity_1.3s_cubic-bezier(.16,1,.3,1)_.1s]",
        )}
      >
        <ChapterLabel index={index}>{label}</ChapterLabel>
        <Title data-chars="" className={cn(EASE_FADE, "grid max-w-[18em] justify-items-center text-[clamp(34px,4.6vw,80px)] font-normal leading-[1.04] tracking-[-0.04em] text-ink max-[900px]:justify-items-start max-[900px]:text-[clamp(22px,6.5vw,30px)] max-[900px]:leading-[1.12]")}>
          {lines.map((line, i) => (
            <span key={i} className="block">
              {accent(line)}
              {i < lines.length - 1 ? " " : null}
            </span>
          ))}
        </Title>
        <div
          ref={box}
          className={cn(
            "mt-[clamp(10px,2.4vh,24px)] grid w-[min(100%,760px)] justify-items-start gap-[22px] p-[clamp(22px,2.6vw,32px)] text-left text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08),0_30px_80px_-40px_rgba(2,10,7,.6)] max-[900px]:gap-[18px] max-[900px]:p-[18px]",
            "bg-[#020a07]/0 opacity-0 backdrop-blur-none [transition:opacity_1.1s_cubic-bezier(.16,1,.3,1),background-color_1.1s_cubic-bezier(.16,1,.3,1),backdrop-filter_1.1s_cubic-bezier(.16,1,.3,1)]",
            "group-[.is-in]/award:bg-[#020a07]/[.82] group-[.is-in]/award:opacity-100 group-[.is-in]/award:backdrop-blur-[14px] group-[.is-in]/award:[transition:opacity_1.3s_cubic-bezier(.16,1,.3,1)_.1s,background-color_1.3s_cubic-bezier(.16,1,.3,1)_.1s,backdrop-filter_1.3s_cubic-bezier(.33,0,.2,1)_.1s]",
          )}
        >
          <p className="text-[clamp(15px,1.1vw,17px)] leading-[1.6] text-white/[.78] max-[900px]:text-sm">
            <Decode className="mb-2 block font-narrow text-[11px] font-medium uppercase tracking-[0.08em] text-green-300" text={kicker} />
            <Decode text={explainer} />
          </p>
          <dl className="m-0 grid w-full grid-cols-3 gap-4 border-t border-white/[0.12] pt-5 max-[900px]:gap-2.5 max-[900px]:pt-4">
            {facts.map((f) => (
              <div key={f.label} className="grid content-start gap-1.5">
                <dt className="font-narrow text-[11px] font-medium uppercase tracking-[0.08em] text-white/[.62]">
                  <Decode text={f.label} />
                </dt>
                <dd className="m-0 text-[clamp(17px,1.5vw,22px)] leading-[1.2] tracking-[-0.02em] max-[900px]:text-[15px]">
                  <Decode text={f.value} />
                </dd>
              </div>
            ))}
          </dl>
          {cta}
        </div>
      </div>
    </div>
  );
}
