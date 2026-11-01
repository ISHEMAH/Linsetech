"use client";
import { useRef, type ElementType } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|=+*#";

/** Puture-style "decode": the text scrambles then settles left-to-right when it enters. */
export default function Decode({ as: Tag = "span", text, className, duration = 1.2, start = "top 85%" }: { as?: ElementType; text: string; className?: string; duration?: number; start?: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        duration,
        ease: "power2.inOut",
        scrollTrigger: { trigger: el, start, once: true },
        onUpdate() {
          const settled = Math.floor(state.p * text.length);
          let out = "";
          for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === " " || c === "\n" || i < settled) out += c;
            else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          el.textContent = out;
        },
        onComplete() {
          el.textContent = text;
        },
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
