import { cn } from "@/lib/cn";

/**
 * Puture's `[data-in]` reveal: hidden 36px below, rises in once its beat is on, drifts 36px up once it is past.
 * Opacity and translate run on their own clocks: 1.1s / 1.4s out, 1.3s / 1.6s in after .1s (their navigation css).
 * (Class strings stay literal so Tailwind can see them.)
 */
export const REVEAL =
  "opacity-0 translate-y-9 pointer-events-none [transition:opacity_1.1s_cubic-bezier(.16,1,.3,1),translate_1.4s_cubic-bezier(.16,1,.3,1)] [&.is-in]:pointer-events-auto [&.is-in]:opacity-100 [&.is-in]:translate-y-0 [&.is-in]:[transition:opacity_1.3s_cubic-bezier(.16,1,.3,1)_.1s,translate_1.6s_cubic-bezier(.16,1,.3,1)_.1s] [&.is-past]:-translate-y-9";

/**
 * Puture's label wipe (`.scene [data-in] .label`): inside a beat, a 300 %-tall gradient mask slides down over 1.8s
 * after .2s as the beat comes in, and back up as it leaves. Outside a beat it does nothing.
 */
const WIPE =
  "[[data-in]_&]:[mask-image:linear-gradient(#0000_30%,#000_60%)] [[data-in]_&]:[mask-size:100%_300%] [[data-in]_&]:[mask-position:0_0] [[data-in]_&]:[transition:mask-position_1.8s_cubic-bezier(.16,1,.3,1)_.2s] [[data-in].is-in_&]:[mask-position:0_100%]";

/** Puture's `.label`: an index box and a text box, narrow uppercase. */
export function ChapterLabel({ index, children, dark, className }: { index?: React.ReactNode; children: React.ReactNode; dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex gap-[3px] font-narrow text-[11px] font-medium uppercase leading-none tracking-[0.08em]", WIPE, className)}>
      {index && <span className="inline-flex items-center bg-green-500 px-[9px] pb-[6px] pt-[7px] text-white">{index}</span>}
      <span className={cn("inline-flex items-center px-[9px] pb-[6px] pt-[7px]", dark ? "bg-off-white text-ink" : "bg-ink text-off-white")}>{children}</span>
    </span>
  );
}
