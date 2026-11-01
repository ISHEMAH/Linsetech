import { cn } from "@/lib/cn";

/** 16px line icons in the weight of the shared Arrow (Sharplink svgs/ico*.svg). */
export function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-[14px] w-[14px]", className)} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M2.5 5.5 8 11l5.5-5.5" strokeLinecap="square" />
    </svg>
  );
}

export function Download({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-[14px] w-[14px]", className)} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 2v8M4.5 6.5 8 10l3.5-3.5M2.5 13.5h11" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-[12px] w-[12px]", className)} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M13.5 8h-11M7 3.5 2.5 8 7 12.5" strokeLinecap="square" />
    </svg>
  );
}

export function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("h-3 w-3", className)} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <path d="M3.5 3.5V1h7.5v7.5H8.5" />
      <path d="M1 3.5h7.5V11H1z" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("h-3 w-3", className)} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M1.5 6.5 4.5 9.5 10.5 2.5" strokeLinecap="square" />
    </svg>
  );
}
