"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";

type Group = { open: number | null; set: (i: number | null) => void };
const FaqContext = createContext<Group | null>(null);

/**
 * Sharplink SectionsFaq's provide("openIndex"): the list owns the open index, so only one item is open at a time —
 * opening another closes the first in parallel. Items rendered outside a group open independently.
 */
export function FaqGroup({ children, className }: { children: ReactNode; className?: string }) {
  const [open, set] = useState<number | null>(null);
  return (
    <FaqContext.Provider value={{ open, set }}>
      <div className={className}>{children}</div>
    </FaqContext.Provider>
  );
}

/** their accordion duration: open = height .4s power2.inOut + answer .32s power2.out (.1s late); close = answer .2s power2.in with height .4s */
const D = 0.4;

/**
 * Sharplink SectionsFaqItem: a filled card (tint on hover), number chip, question, and a 34px black icon box that turns
 * brand while open with both strokes of its plus rotating −135° (.3s). The whole card toggles; the question is the
 * button (keyboard + aria), the answer its region.
 */
export default function FaqItem({ index, q, a }: { index: number; q: string; a: string }) {
  const group = useContext(FaqContext);
  const [solo, setSolo] = useState(false);
  const open = group ? group.open === index : solo;
  const panel = useRef<HTMLDivElement>(null);
  const answer = useRef<HTMLDivElement>(null);
  const shown = useRef(false);
  const id = useId();

  const toggle = () => {
    if (group) group.set(open ? null : index);
    else setSolo((v) => !v);
  };

  useEffect(() => {
    const el = panel.current;
    const content = answer.current;
    if (!el || !content || shown.current === open) return;
    shown.current = open;
    gsap.killTweensOf([el, content]);
    if (prefersReducedMotion()) {
      gsap.set(el, { height: open ? "auto" : 0 });
      gsap.set(content, { autoAlpha: open ? 1 : 0, y: 0 });
      return;
    }
    if (open) {
      gsap.set(el, { height: "auto" });
      gsap.set(content, { autoAlpha: 0, y: 40 });
      const h = el.offsetHeight;
      gsap.fromTo(el, { height: 0 }, { height: h, duration: D, ease: "power2.inOut", onComplete: () => gsap.set(el, { height: "auto" }) });
      gsap.to(content, { autoAlpha: 1, y: 0, duration: D * 0.8, ease: "power2.out", delay: 0.1 });
    } else {
      const h = el.offsetHeight;
      gsap.to(content, { autoAlpha: 0, y: 40, duration: D * 0.5, ease: "power2.in" });
      gsap.fromTo(el, { height: h }, { height: 0, duration: D, ease: "power2.inOut" });
    }
  }, [open]);

  return (
    <div className={cn("faq-item relative overflow-hidden", open && "is-open")} onClick={toggle}>
      <button
        id={`${id}-q`}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-a`}
        className="relative z-[2] flex w-full cursor-pointer flex-wrap items-center gap-3 p-4 text-left min-[800px]:flex-nowrap min-[800px]:gap-7 min-[800px]:p-5"
      >
        <span className="faq-num flex h-[22px] w-[30px] shrink-0 items-center justify-center gap-1 self-start font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em] before:h-1 before:w-1 before:bg-current min-[800px]:self-center">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="order-10 w-full grow pr-8 text-[16px] leading-[1.35] font-medium text-balance min-[800px]:order-none min-[800px]:w-auto min-[800px]:pr-0 min-[800px]:text-[19px]">{q}</span>
        <span className="faq-icon ml-auto flex h-[34px] w-[34px] shrink-0 items-center justify-center text-off-white">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 1L8 15" stroke="currentColor" strokeWidth="1.25" />
            <path d="M15 8L1 8" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </span>
      </button>
      <div ref={panel} id={`${id}-a`} role="region" aria-labelledby={`${id}-q`} className="relative z-[2] h-0 overflow-hidden px-4 min-[800px]:px-[78px]">
        <div ref={answer} className="invisible -mt-1 mb-8 max-w-[726px] cursor-default text-[14px] leading-[1.35] font-medium text-balance min-[800px]:mb-9 min-[800px]:mt-2 min-[800px]:text-[19px]">
          {a}
        </div>
      </div>
    </div>
  );
}
