import { cn } from "@/lib/cn";

/** The LS mark, reconstructed as exact polygons from the brand bitmap (640 × 552 box). */
export const LOGO_PATHS = [
  "M320 0 L365.5 78.9 L140.8 468 L288.8 468 L241.5 550 L2.4 550 Z",
  "M393.3 127.8 L439.4 207.7 L363.9 338 L515.2 338 L637.6 550 L299.5 550 L346.8 468 L498.2 468 L470.5 420 L224.5 420 Z",
];

/** The same mark split into its five strokes, for the "assemble" animation. */
export const LOGO_PIECES = [
  "M320 0 L365.5 78.9 L140.8 468 L49.8 468 Z",
  "M49.8 468 L288.8 468 L241.5 550 L2.4 550 Z",
  "M393.3 127.8 L439.4 207.7 L363.9 338 L271.9 338 Z",
  "M271.9 338 L515.2 338 L562.5 420 L224.5 420 Z",
  "M470.5 420 L562.5 420 L637.6 550 L299.5 550 L346.8 468 L498.2 468 Z",
];

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 640 552"
      fill="currentColor"
      className={cn("block", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {LOGO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function Logo({ className, word = "Linse" }: { className?: string; word?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-[1.35em] w-auto" title={word} />
      <span className="text-[1.15em] font-semibold tracking-[-0.03em]">{word}</span>
    </span>
  );
}
