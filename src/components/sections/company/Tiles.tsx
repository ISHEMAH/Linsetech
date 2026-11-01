import type { ReactNode } from "react";
import { LOGO_PATHS } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/** The dotted 6 × 7 grid Sharplink draws behind its headshots (1px dots every 4px). */
function DotGrid({ tone }: { tone: "dark" | "light" }) {
  const c = tone === "dark" ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.22)";
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 236 268" preserveAspectRatio="none" aria-hidden>
      <g stroke={c} strokeWidth="1" strokeDasharray="1 3" vectorEffect="non-scaling-stroke">
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * (236 / 6)} y1="0" x2={(i + 1) * (236 / 6)} y2="268" vectorEffect="non-scaling-stroke" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * (268 / 7)} x2="236" y2={(i + 1) * (268 / 7)} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}

/**
 * Headshot frame (card-team .image-wrapper): off-white, 236/268 (164/188 on mobile), pin top-left, dotted grid, art
 * centred; the dark variant carries their turned dark gradient (leadership grid), the light one is plain (board grid).
 */
export function Tile({ tone, children, className }: { tone: "dark" | "light"; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("relative aspect-[164/188] overflow-hidden min-[800px]:aspect-[236/268]", className)}
      style={{ backgroundColor: "var(--off-white)" }}
    >
      {/* Sharplink .image-wrapper.has-bg::after: their gradient-dark image (ours recoloured), centre 55% / 150% 210%, turned 180° */}
      {tone === "dark" && (
        <span
          className="absolute inset-[-1px] rotate-180"
          style={{ background: "url(/bg/gradient-dark.webp) center 55% / 150% 210% no-repeat" }}
          aria-hidden
        />
      )}
      <DotGrid tone={tone} />
      <span className="absolute left-0 top-0 z-[2] h-[6px] w-[6px] bg-[var(--brand)]" aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.25, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
const DASH = { ...LINE, strokeWidth: 1, strokeDasharray: "2 3" };

/** Line-art pictograms for the perk tiles, with Sharplink's dashed callout boxes. */
export function Pictogram({ name, className }: { name: "box" | "stack" | "people" | "laptop"; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-[52%] w-[52%] text-off-white", className)} aria-hidden>
      {name === "box" && (
        <g>
          <path {...LINE} d="M50 18 78 34v32L50 82 22 66V34Z" fill="currentColor" fillOpacity="0.08" />
          <path {...LINE} d="M22 34 50 50 78 34M50 50v32" />
          <rect {...DASH} x="44" y="12" width="12" height="12" />
          <rect {...DASH} x="72" y="60" width="12" height="12" />
          <path {...DASH} d="M56 18 72 60" />
        </g>
      )}
      {name === "stack" && (
        <g>
          <path {...LINE} d="M50 20 80 36 50 52 20 36Z" fill="currentColor" fillOpacity="0.1" />
          <path {...LINE} d="M20 36v12l30 16 30-16V36M20 48v12l30 16 30-16V48M50 52v24" />
          <rect {...DASH} x="14" y="30" width="12" height="12" />
          <rect {...DASH} x="74" y="54" width="12" height="12" />
          <path {...DASH} d="M26 36h48" />
        </g>
      )}
      {name === "people" && (
        <g>
          <circle {...LINE} cx="40" cy="38" r="9" fill="currentColor" fillOpacity="0.1" />
          <path {...LINE} d="M23 72c0-12 8-19 17-19s17 7 17 19" />
          <circle {...LINE} cx="64" cy="43" r="7" />
          <path {...LINE} d="M54 72c0-9 5-14 10-14s11 5 11 14" />
          <rect {...DASH} x="32" y="24" width="16" height="6" />
          <path {...DASH} d="M16 78h68" />
        </g>
      )}
      {name === "laptop" && (
        <g>
          <path {...LINE} d="M28 28h44v30H28Z" fill="currentColor" fillOpacity="0.08" />
          <path {...LINE} d="M22 64h56l6 8H16Z" />
          <path {...LINE} d="M35 37h16M35 43h24M35 49h10" />
          <rect {...DASH} x="62" y="20" width="14" height="14" />
          <path {...DASH} d="M50 58v6" />
        </g>
      )}
    </svg>
  );
}

/** The LS mark in outline over the light tile (placeholder for team photos). */
export function MarkOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="-60 -60 760 672" className={cn("h-[40%] w-[40%] text-ink/70", className)} aria-hidden>
      {LOGO_PATHS.map((d) => (
        <path key={d} d={d} {...LINE} fill="currentColor" fillOpacity="0.04" />
      ))}
      <rect {...DASH} x="-40" y="-40" width="720" height="632" />
    </svg>
  );
}

type Card = { id: string; art: ReactNode; title: string; label: string; text?: string };

/**
 * Sharplink team grid (card-team): 4 per row on desktop (2 on mobile), 28px gutters, 36px row gap; the frame, the
 * 19px/500 name 16px below, the narrow uppercase role 8px under it.
 */
export function TileGrid({ cards, tone }: { cards: Card[]; tone: "dark" | "light" }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 min-[800px]:grid-cols-4 min-[800px]:gap-x-[28px] min-[800px]:gap-y-9">
      {cards.map((c) => (
        <div key={c.id} className="tile-card flex flex-col">
          <Tile tone={tone}>{c.art}</Tile>
          <p className="mt-4 text-[16px] font-medium leading-[1.35] min-[800px]:text-[19px]">{c.title}</p>
          <p className="eyebrow mb-3 mt-2 text-[var(--c-sub)]">{c.label}</p>
          {c.text && <p className="max-w-[30ch] text-[14px] font-medium leading-[1.4] text-[var(--c-sub)]">{c.text}</p>}
        </div>
      ))}
    </div>
  );
}
