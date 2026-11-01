"use client";
import type { ReactNode } from "react";
import { useContact } from "@/components/layout/ContactContext";
import { scrollToTarget } from "@/lib/lenis";
import { Button, Arrow } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Topic } from "@/lib/forms";

/** What a card / row / button does. Plain data so server pages can pass it to client components. */
export type Action =
  | { kind: "href"; href: string; external?: boolean }
  /** an in-page anchor: lands 150px under the top in 2.2s and puts `#id` in the URL (Sharplink's anchor links) */
  | { kind: "scroll"; target: string }
  /** Sharplink InvestorsHero "Learn more": scroll to the bottom of the hero in 1.3s */
  | { kind: "heroEnd" }
  /** the contact drawer, optionally on a topic (`careers` with no role = an open application) */
  | { kind: "contact"; topic?: Topic }
  | { kind: "role"; slug: string };

/** Window event the roles list listens to, so a hero card can open a role drawer. */
export const ROLE_EVENT = "linse:open-role";

/** Sharplink lands an anchor 150px under the viewport top (measured: governance top = 150 after the rail click). */
export const ANCHOR_OFFSET = -150;

export function useRunAction() {
  const { open } = useContact();
  return (a: Action) => {
    if (a.kind === "scroll") scrollToTarget(a.target, ANCHOR_OFFSET, 2.2, a.target.startsWith("#") ? a.target : undefined);
    else if (a.kind === "heroEnd") {
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero) scrollToTarget(hero.getBoundingClientRect().bottom + window.scrollY, 0, 1.3);
    } else if (a.kind === "contact") open(a.topic ? { topic: a.topic } : undefined);
    else if (a.kind === "role") window.dispatchEvent(new CustomEvent(ROLE_EVENT, { detail: a.slug }));
  };
}

/** An `a` for links, a `button` for everything else; same box either way. */
export function Act({ action, className, children, label }: { action: Action; className?: string; children: ReactNode; label?: string }) {
  const run = useRunAction();
  if (action.kind === "href")
    return (
      <a href={action.href} className={className} aria-label={label} {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  return (
    <button type="button" onClick={() => run(action)} className={cn("text-left", className)} aria-label={label}>
      {children}
    </button>
  );
}

/** ui-button icon box as plain spans, for use inside a clickable row / card (plays with the parent's hover). */
export function UiIcon({ icon, variant = "secondary", className }: { icon: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  return (
    <span className={cn("ui-btn has-icon allow-parent-hover", `ui-btn--${variant}`, className)} aria-hidden>
      <span className="ui-btn__icon">
        <span>{icon}</span>
        <span>{icon}</span>
      </span>
    </span>
  );
}

/** A labelled ui-button that runs an Action (mailto / external links render as `a`). */
export function ActButton({ action, children, icon, variant = "secondary", className }: { action: Action; children: ReactNode; icon?: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  const run = useRunAction();
  const ic = icon ?? <Arrow />;
  if (action.kind === "href")
    return (
      <a
        href={action.href}
        className={cn("ui-btn has-icon", `ui-btn--${variant}`, className)}
        {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span className="ui-btn__content">
          <span>{children}</span>
          <span aria-hidden>{children}</span>
        </span>
        <span className="ui-btn__icon">
          <span>{ic}</span>
          <span aria-hidden>{ic}</span>
        </span>
        {variant === "primary" && (
          <span className="ui-btn__icon ui-btn__icon--left" aria-hidden>
            <span>{ic}</span>
            <span>{ic}</span>
          </span>
        )}
      </a>
    );
  return (
    <Button variant={variant} icon={ic} onClick={() => run(action)} className={className}>
      {children}
    </Button>
  );
}
