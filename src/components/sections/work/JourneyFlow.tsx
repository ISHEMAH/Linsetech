import { cn } from "@/lib/cn";
import { ChapterLabel } from "@/components/sections/WorkChapter";
import styles from "./case.module.css";

/** stroke icons (24-unit box) for the step tiles, in order */
const ICONS = [
  "M12 5v14M5 12h14",
  "M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4",
  "M3 7h18v12H3V7Zm0 4h18M7 15h3",
  "M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5",
  "m5 12 4 4 10-10",
];

/**
 * Puture's `.flow` (System): stages on a 24px grid, side by side with 56px gaps (stacked under 900px). Each stage
 * glows in turn on a 3.6s loop, 1.2s apart, and a light signal runs along the link to the next one.
 */
export default function JourneyFlow({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol
      className="m-0 grid list-none grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-14 p-0 max-[900px]:grid-cols-1 max-[900px]:gap-10"
      style={{ "--cols": Math.min(steps.length, 4) } as React.CSSProperties}
    >
      {steps.map((s, i) => (
        <li key={i} className={cn(styles.stage, "relative grid content-start justify-items-start gap-[18px] p-[22px]")} style={{ "--i": i } as React.CSSProperties}>
          <ChapterLabel index={String(i + 1).padStart(2, "0")} dark>
            {s.title}
          </ChapterLabel>
          <div className="flex w-full items-start gap-3 border-t border-white/10 pt-3.5">
            <span className="grid h-8 w-8 flex-none place-items-center bg-green-500 text-white shadow-[0_8px_16px_rgba(0,0,0,.3)]" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
                <path d={ICONS[i % ICONS.length]} />
              </svg>
            </span>
            <p className="text-[clamp(15px,1.15vw,17px)] leading-[1.4] tracking-[-0.01em] text-off-white/85">{s.text}</p>
          </div>
          {i < steps.length - 1 && <span className={cn(styles.link, "absolute left-full top-1/2 h-[2px] w-14 max-[900px]:left-1/2 max-[900px]:top-full max-[900px]:h-10 max-[900px]:w-[2px]")} style={{ "--i": i } as React.CSSProperties} aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
