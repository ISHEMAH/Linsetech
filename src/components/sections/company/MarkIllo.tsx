import { LOGO_PIECES } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * Card illustration in the manner of Sharplink's presentation card (a faceted ETH diamond with dashed callouts):
 * the LS mark's five strokes as translucent planes over an offset back face, plus dashed corner boxes.
 * Colour = currentColor, so the card can turn it brand on hover.
 */
export default function MarkIllo({ className }: { className?: string }) {
  const S = { vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 120 150" className={cn("block", className)} fill="none" aria-hidden>
      <g transform="translate(18 44) scale(0.13) skewY(-8)">
        <g transform="translate(70 -60)" opacity="0.45">
          {LOGO_PIECES.map((d) => (
            <path key={d} d={d} stroke="currentColor" strokeWidth="1" {...S} />
          ))}
        </g>
        {LOGO_PIECES.map((d, i) => (
          <path key={d} d={d} fill="currentColor" fillOpacity={0.1 + (i % 3) * 0.08} stroke="currentColor" strokeWidth="1" {...S} />
        ))}
      </g>
      <g stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" {...S}>
        <rect x="12" y="44" width="14" height="14" {...S} />
        <rect x="70" y="30" width="16" height="16" {...S} />
        <rect x="80" y="104" width="12" height="12" {...S} />
        <path d="M26 51 70 38M86 46 86 104" {...S} />
      </g>
    </svg>
  );
}
