import { cn } from "@/lib/cn";

/** Sharplink icon set used on the investors page: diagonal arrow, download, chevrons, plus (1.25–1.6px strokes, square caps). */
const base = "h-[14px] w-[14px] shrink-0";

export function DiagArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 12 12 4M5.5 4H12v6.5" strokeLinecap="square" />
    </svg>
  );
}

export function Download({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 2.5V10M4.75 6.75 8 10l3.25-3.25M3 13.25h10" strokeLinecap="square" />
    </svg>
  );
}

export function Chevron({ dir = "down", className }: { dir?: "down" | "up" | "left" | "right"; className?: string }) {
  const rot = { down: 0, up: 180, left: 90, right: -90 }[dir];
  return (
    <svg viewBox="0 0 16 16" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn(base, className)} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" strokeLinecap="square" />
    </svg>
  );
}
