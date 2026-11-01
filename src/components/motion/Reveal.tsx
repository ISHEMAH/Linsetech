"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** selector for staggered children; defaults to the element itself */
  stagger?: string;
  y?: number;
  delay?: number;
  start?: string;
};

/**
 * Sharplink block reveal: `autoAlpha 0 → 1` with a short rise, `0.8s power2.out`, staggered by 0.15s when a
 * selector is given (their hero fades CTAs / eyebrow / blurb / press card with `stagger: 0.2`, lists with 0.15).
 */
export default function Reveal({ as: Tag = "div", children, className, stagger, y = 20, delay = 0, start = "top 85%" }: Props) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const targets = stagger ? el.querySelectorAll(stagger) : el;
      gsap.from(targets, {
        autoAlpha: 0,
        y,
        duration: 0.8,
        delay,
        stagger: stagger ? 0.15 : 0,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
