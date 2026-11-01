import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import type { PostCategory } from "@/content/news";

/**
 * Placeholder cover art composed like Sharplink's article thumbnails (black plate, a glow rising from the bottom,
 * a faint dashed grid, a two-tone title top-left, a partner-style lockup in the middle, brand pins), in our green
 * and with the LS mark. Everything is sized in container units so the same art reads as a 1500px hero and as a
 * 182px list thumbnail.
 */
const GLOW: Record<PostCategory, string> = {
  company:
    "radial-gradient(60% 55% at 50% 118%, rgba(134,239,172,0.85) 0%, rgba(34,197,94,0.55) 30%, rgba(11,61,46,0) 75%), radial-gradient(38% 46% at 102% 104%, rgba(205,239,217,0.7), rgba(34,197,94,0) 70%), radial-gradient(38% 46% at -2% 104%, rgba(134,239,172,0.45), rgba(34,197,94,0) 70%), linear-gradient(180deg, #020a07 0%, #020a07 42%, #06281f 70%, #0f5132 100%)",
  product:
    "radial-gradient(70% 60% at 78% 120%, rgba(134,239,172,0.9) 0%, rgba(34,197,94,0.55) 32%, rgba(11,61,46,0) 75%), radial-gradient(34% 44% at 104% 100%, rgba(205,239,217,0.75), rgba(34,197,94,0) 70%), linear-gradient(180deg, #020a07 0%, #020a07 45%, #06281f 72%, #0b3d2e 100%)",
  hardware:
    "radial-gradient(70% 60% at 22% 120%, rgba(134,239,172,0.85) 0%, rgba(34,197,94,0.5) 32%, rgba(11,61,46,0) 75%), radial-gradient(34% 44% at -4% 100%, rgba(205,239,217,0.7), rgba(34,197,94,0) 70%), linear-gradient(180deg, #020a07 0%, #020a07 45%, #06281f 72%, #0b3d2e 100%)",
  insights:
    "radial-gradient(90% 70% at 50% 125%, rgba(74,222,128,0.8) 0%, rgba(22,163,74,0.5) 35%, rgba(11,61,46,0) 78%), radial-gradient(30% 40% at 102% 102%, rgba(205,239,217,0.55), rgba(34,197,94,0) 70%), radial-gradient(30% 40% at -2% 102%, rgba(205,239,217,0.55), rgba(34,197,94,0) 70%), linear-gradient(180deg, #020a07 0%, #020a07 38%, #06281f 68%, #0f5132 100%)",
  press:
    "radial-gradient(55% 50% at 50% 120%, rgba(74,222,128,0.7) 0%, rgba(22,163,74,0.4) 32%, rgba(11,61,46,0) 75%), radial-gradient(36% 46% at 103% 104%, rgba(205,239,217,0.6), rgba(34,197,94,0) 70%), linear-gradient(180deg, #020a07 0%, #020a07 50%, #04150f 75%, #0b3d2e 100%)",
};

/** Split a title into two balanced lines (at a colon when there is one), like Sharplink's two-tone cover titles. */
function split(title: string): [string, string] {
  const colon = title.indexOf(": ");
  if (colon > 0 && colon < title.length - 3) return [title.slice(0, colon + 1), title.slice(colon + 2)];
  const words = title.split(" ");
  if (words.length < 3) return [title, ""];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ").length;
    const diff = Math.abs(a - (title.length - a));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

const dash = (dir: "to right" | "to bottom") => `repeating-linear-gradient(${dir}, #000 0 2px, transparent 2px 4px)`;

export default function NewsCover({
  title,
  category,
  tag,
  className,
  ratio = "768 / 432",
  pins = true,
}: {
  title: string;
  category: PostCategory;
  /** right half of the lockup ("Linse | tag") */
  tag: string;
  className?: string;
  ratio?: string;
  pins?: boolean;
}) {
  const [a, b] = split(title);
  return (
    <div className={cn("relative overflow-hidden bg-[#020a07] [container-type:inline-size]", className)} style={{ aspectRatio: ratio }} aria-hidden>
      {/* no hover zoom: Sharplink's article thumbnails stay still */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ background: GLOW[category] }} />
        {/* dashed grid: vertical then horizontal lines, each masked into 2px dashes */}
        <div
          className="absolute inset-x-[4%] inset-y-0"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(243,243,243,0.13) 1px, transparent 1px)",
            backgroundSize: "calc(100% / 8) 100%",
            maskImage: dash("to bottom"),
            WebkitMaskImage: dash("to bottom"),
          }}
        />
        <div
          className="absolute inset-x-[4%] inset-y-0"
          style={{
            backgroundImage: "linear-gradient(to bottom, rgba(243,243,243,0.13) 1px, transparent 1px)",
            backgroundSize: "100% calc(100% / 5.5)",
            backgroundPosition: "0 1.6%",
            maskImage: dash("to right"),
            WebkitMaskImage: dash("to right"),
          }}
        />
        {/* lockup */}
        <div className="absolute left-1/2 top-[58%] flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap text-off-white" style={{ gap: "3.4cqw" }}>
          <span className="flex items-center" style={{ gap: "1.6cqw" }}>
            <span className="block" style={{ height: "7.2cqw", aspectRatio: "640 / 552" }}>
              <LogoMark className="h-full w-full" />
            </span>
            <span className="font-medium tracking-[-0.04em]" style={{ fontSize: "7.6cqw", lineHeight: 1 }}>
              Linse
            </span>
          </span>
          <span className="block w-px bg-off-white/90" style={{ height: "10.5cqw" }} />
          <span className="font-medium tracking-[-0.04em]" style={{ fontSize: "7.6cqw", lineHeight: 1 }}>
            {tag}
          </span>
        </div>
      </div>
      {/* title, two tones */}
      <p className="absolute font-medium tracking-[-0.025em]" style={{ left: "6%", top: "5.2%", right: "8%", fontSize: "4.1cqw", lineHeight: 1.04 }}>
        <span className="block text-green-400">{a}</span>
        {b && <span className="block text-off-white">{b}</span>}
      </p>
      {pins && (
        <>
          <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-green-400" />
          <span className="absolute h-[5px] w-[5px] bg-green-400" style={{ right: "4%", top: "2%" }} />
        </>
      )}
    </div>
  );
}
