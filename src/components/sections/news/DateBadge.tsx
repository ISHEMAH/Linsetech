import { cn } from "@/lib/cn";

/** Sharplink ui-date-badge: 30px tall, 1px subtle stroke, narrow 13px uppercase in the subtle text colour. */
export default function DateBadge({ children, className, theme = "dark" }: { children: React.ReactNode; className?: string; theme?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex h-[30px] w-fit shrink-0 items-center justify-center whitespace-nowrap border px-2 font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em]",
        theme === "dark" ? "border-[var(--stroke-off-white-subtle)] text-[var(--off-white-subtle)]" : "border-[var(--stroke-black-subtle)] text-[rgba(11,20,17,0.5)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
