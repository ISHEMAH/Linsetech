import DashedLine from "@/components/ui/DashedLine";
import BandLetters from "./BandLetters";
import { LOGO_PATHS } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import "./company.css";

type Fact = { label: string; value: string };

type Props = {
  /** the big line (Sharplink's quote symbol, 68px over columns 1–8) */
  symbol: string;
  /** the "as of" line under it (their lastUpdate row) */
  asOf: string;
  /** the card in columns 9–12 (their price card: label, 68px value) */
  card: { label: string; value: string; note?: string };
  /** label / value pairs, two columns each, four per row (their b2iQuoteRow cells) */
  facts: Fact[];
};

/** Dashed circuit around the LS mark (the line drawing on Sharplink's price card), off-white, centred low in the card. */
function Circuit() {
  const d = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeDasharray: "3 3", vectorEffect: "non-scaling-stroke" as const };
  const nodes: [number, number, string][] = [
    [200, 40, "M200 52v42l-28 28v26"],
    [60, 120, "M72 126h56l22 22"],
    [340, 120, "M328 126h-46l-24 24"],
    [312, 182, "M312 194v30l-30 30h-18"],
    [76, 300, "M82 300v-34l26-26h18"],
    [52, 368, "M64 374l14-14h70l26-26"],
    [348, 368, "M336 374l-14-14h-70l-26-26"],
  ];
  return (
    <svg viewBox="0 0 400 420" className="pointer-events-none absolute bottom-0 left-1/2 w-[86%] max-w-[520px] -translate-x-1/2 text-off-white/80" aria-hidden>
      <circle cx="200" cy="264" r="96" {...d} />
      <circle cx="200" cy="264" r="76" {...d} />
      {nodes.map(([x, y, path]) => (
        <g key={`${x}-${y}`}>
          <rect x={x - 9} y={y - 9} width="18" height="18" {...d} />
          <path d={path} {...d} />
        </g>
      ))}
      <path d="M200 360v60" {...d} />
      <g transform="translate(166 236) scale(0.105)">
        {LOGO_PATHS.map((p) => (
          <path key={p} d={p} {...d} strokeDasharray="2 2" />
        ))}
      </g>
    </svg>
  );
}

/**
 * Sharplink's Nasdaq block (.investors-nasdaq), the light band between the hero and the widgets: transparent over the
 * fixed light backdrop, padding 161 / 152px (108px mobile), above the widget list (their z 2 over z 1) so the flipped
 * gradient rising from the first widget passes under it. Inside: the heading rule with its pin, then their quote grid —
 * 68px symbol over columns 1–8, the "as of" line with a dashed rule (56px under it), label/value cells two columns
 * wide with dashed rules, and the price card in columns 9–12 over rows 1–4 (28px padding, off-white type, the
 * recoloured dark gradient as its picture). A vertical dashed rule runs at the end of column 8.
 */
export default function FactsBand({ symbol, asOf, card, facts }: Props) {
  const cell = "relative col-span-2 flex flex-col gap-3 py-5 min-[800px]:py-7";
  return (
    <section data-theme="light" data-band className="co-light relative z-[3] py-[108px] text-ink min-[800px]:pb-[152px] min-[800px]:pt-[161px]">
      <div className="relative px-[clamp(16px,2.5vw,40px)]">
        <div className="relative">
          <DashedLine className="top-0" reveal />
          <span className="absolute left-0 top-0 z-[1] h-[6px] w-[6px] bg-[var(--brand)]" aria-hidden />
          {/* static block: only the symbol's and the figure's letters fade in (BandLetters), like their quote widget */}
          <div data-band-trigger className="relative grid grid-cols-4 gap-x-4 min-[800px]:grid-cols-12 min-[800px]:gap-x-[28px]">
            {/* end of column 8 (their .line.vertical: column width × 8 + gap × 7) */}
            <div className="absolute inset-y-0 hidden w-px min-[800px]:block" style={{ left: "calc((100% - 308px) / 12 * 8 + 196px)" }} aria-hidden>
              <DashedLine direction="vertical" className="left-0" />
            </div>
            <p className="col-span-4 pb-6 pt-[22px] text-[32px] font-medium leading-[1.16] tracking-[-0.01em] min-[800px]:col-span-8 min-[800px]:py-7 min-[800px]:text-[clamp(44px,4.72vw,68px)] min-[800px]:font-normal min-[800px]:leading-[1.06] min-[800px]:tracking-[-0.02em]">
              <BandLetters text={symbol} />
            </p>
            <p className="co-dash-bottom co-bleed eyebrow relative col-span-4 pb-6 text-[var(--c-sub)] min-[800px]:col-span-8 min-[800px]:pb-14">{asOf}</p>
            <div
              className="relative col-span-4 my-4 flex aspect-[343/224] flex-col justify-start gap-4 overflow-hidden px-4 py-3 text-off-white [background-position:center_top] [background-size:100%_165%] min-[800px]:col-span-4 min-[800px]:col-start-9 min-[800px]:row-span-4 min-[800px]:row-start-1 min-[800px]:my-0 min-[800px]:aspect-auto min-[800px]:gap-5 min-[800px]:p-7 min-[800px]:[background-position:center_bottom] min-[800px]:[background-size:100%_100%]"
              style={{ backgroundImage: "url(/bg/gradient-dark.webp)" }}
            >
              <span className="eyebrow relative z-[1]">{card.label}</span>
              <BandLetters
                text={card.value}
                className="relative z-[1] text-[52px] font-normal leading-[1.04] tracking-[-0.025em] min-[800px]:text-[clamp(44px,4.72vw,68px)] min-[800px]:leading-[1.06] min-[800px]:tracking-[-0.02em]"
              />
              {card.note && <span className="eyebrow relative z-[1] text-off-white/70">{card.note}</span>}
              <Circuit />
            </div>
            {facts.map((f, i) => (
              <div key={i} className={cn("co-fact", cell, i < 4 && "co-fact--row1")}>
                <span className="eyebrow text-[var(--c-sub)]">{f.label}</span>
                {/* 19px like their quote values; an e-mail address steps down with the column so it stays on one line */}
                <span className={cn("font-medium leading-[1.35] [overflow-wrap:anywhere]", f.value.includes("@") ? "text-[16px] min-[800px]:text-[clamp(14px,1.06vw,19px)]" : "text-[19px]")}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
