import { cn } from "@/lib/cn";
import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "light";

type Extras = {
  variant?: Variant;
  /** right-hand icon box with the arrow (Sharplink `has-icon`) */
  arrow?: boolean;
  /** custom icon for the icon box (replaces the arrow) */
  icon?: ReactNode;
  /** current route / selected: 6px brand square before the label (Sharplink `.ui-button.active`) */
  active?: boolean;
  /** hovering an ancestor `a`, `button` or `.card-hover` plays the hover choreography (Sharplink `allow-parent-hover`, on by default) */
  parentHover?: boolean;
  /** only the icon box shows; hovering reveals the label beside it (Sharplink `hide-text`, e.g. the news cards' "Read more") */
  hideText?: boolean;
};

/** Sharplink's arrow: a shaft and a head with short flat feet, 16px box, 1.25 stroke */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      <path d="M7.24 12.99H9.22L14.25 7.86 8.99 2.5H7.22" />
      <path d="M1.26 7.77 14.26 7.81" />
    </svg>
  );
}

/** Sharplink's close cross (3.05 → 12.95 in a 16px box) */
export function Cross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn("h-4 w-4", className)} fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden>
      <path d="M3.05 3.05 12.95 12.95M12.95 3.05 3.05 12.95" />
    </svg>
  );
}

/**
 * Sharplink ui-button internals: the label is duplicated so it can slide up out of a mask while its twin slides in;
 * the icon box does the same. Primary buttons with an icon also carry a hidden left icon that rises in from below
 * while the right one leaves and the label shifts 34px right (see `.ui-btn--primary.has-icon:hover` in globals.css).
 */
function Inner({ children, variant, icon, hideText }: { children?: ReactNode; variant: Variant; icon: ReactNode; hideText?: boolean }) {
  return (
    <>
      {children != null && children !== false && (
        <span className="ui-btn__content">
          <span>{children}</span>
          <span aria-hidden>{children}</span>
        </span>
      )}
      {icon && (
        <span className="ui-btn__icon">
          <span>{icon}</span>
          <span aria-hidden>{icon}</span>
        </span>
      )}
      {icon && variant === "primary" && !hideText && (
        <span className="ui-btn__icon ui-btn__icon--left" aria-hidden>
          <span>{icon}</span>
          <span>{icon}</span>
        </span>
      )}
    </>
  );
}

function classes({ variant, icon, active, parentHover, hideText, className }: Extras & { icon: ReactNode; className?: string }) {
  return cn("ui-btn", `ui-btn--${variant}`, icon && "has-icon", active && "is-active", parentHover && "allow-parent-hover", hideText && "hide-text", className);
}

/** Sharplink's ui-button: squared, narrow uppercase, icon box on the right. Theme follows the nearest [data-theme]. */
export function Button({ variant = "primary", className, children, arrow = true, icon, active, parentHover = true, hideText, ...rest }: ComponentProps<"button"> & Extras) {
  const ic = icon ?? (arrow ? <Arrow /> : null);
  return (
    <button className={classes({ variant, icon: ic, active, parentHover, hideText, className })} {...rest}>
      <Inner variant={variant} icon={ic} hideText={hideText}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  children,
  arrow = true,
  icon,
  active,
  parentHover = true,
  hideText,
  href,
  ...rest
}: Omit<ComponentProps<typeof Link>, "href"> & Extras & { href: string; children?: ReactNode }) {
  const ic = icon ?? (arrow ? <Arrow /> : null);
  return (
    <Link href={href as never} className={classes({ variant, icon: ic, active, parentHover, hideText, className })} {...rest}>
      <Inner variant={variant} icon={ic} hideText={hideText}>
        {children}
      </Inner>
    </Link>
  );
}
