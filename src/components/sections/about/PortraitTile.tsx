import { cn } from "@/lib/cn";

const PORTRAITS = 6;

const PLATE = {
  /** Sharplink `.image-wrapper.has-bg` (leadership): their dark gradient behind the headshot — ours the green plate */
  dark: { bg: "linear-gradient(180deg,#d7f1e1 0%,#8fcfac 28%,#2f7d5c 62%,#0b3d2e 100%)", line: "rgba(243,243,243,0.32)" },
  /** Sharplink board cards (no `has-bg`): the plain off-white plate */
  light: { bg: "var(--off-white)", line: "rgba(4,21,15,0.16)" },
};

/**
 * Placeholder portrait in Sharplink's team-card treatment (304 × 346 at 1800): a plate with a dashed blueprint grid and
 * a greyscale subject — here the chrome LS mark at one of six turntable angles (rendered with the end-of-page logomark,
 * tools/blender/about_mark.py) instead of a photo, so the grid reads as intentional until real portraits are supplied.
 * The 6 px pin sits top-left. No hover zoom: Sharplink's headshots stay still.
 */
export default function PortraitTile({ index, label, className, pin = "brand", tone = "dark" }: { index: number; label: string; className?: string; pin?: "brand" | "light"; tone?: "dark" | "light" }) {
  const n = (index % PORTRAITS) + 1;
  const plate = PLATE[tone];
  return (
    <div role="img" aria-label={label} className={cn("relative aspect-[304/346] overflow-hidden", className)} style={{ background: plate.bg }}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, ${plate.line} 1px, transparent 1px) 47px 0 / 16% 100%`,
          WebkitMaskImage: "repeating-linear-gradient(to bottom, #000 0 2px, transparent 2px 4px)",
          maskImage: "repeating-linear-gradient(to bottom, #000 0 2px, transparent 2px 4px)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${plate.line} 1px, transparent 1px) 0 62px / 100% 18%`,
          WebkitMaskImage: "repeating-linear-gradient(to right, #000 0 2px, transparent 2px 4px)",
          maskImage: "repeating-linear-gradient(to right, #000 0 2px, transparent 2px 4px)",
        }}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/clips/about_portrait_${n}.webp`}
        alt=""
        loading="lazy"
        draggable={false}
        className="portrait-img absolute left-1/2 top-[55%] w-[118%] max-w-none -translate-x-1/2 -translate-y-1/2 grayscale-[0.85]"
      />
      <span className={cn("absolute left-0 top-0 h-[6px] w-[6px]", pin === "brand" ? "bg-green-400" : "bg-off-white")} aria-hidden />
    </div>
  );
}
