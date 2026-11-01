"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import styles from "./case.module.css";

const CHAR_MS = 26;
const LINE_MS = 380;

/**
 * Puture's `.type-lines` (the log in each process step): the lines type themselves 26 ms per character with 380 ms
 * between lines, a blinking block cursor (.62em × 1.1em, accent, .9s steps(2)) on the active line. Typing starts once
 * the card is `.is-in` and at least 60 % visible, and starts over from empty on every re-entry. The first line is the
 * bright one. Reduced motion: all lines shown, cursor on the last.
 */
export default function TypeLines({ lines, className, dark }: { lines: string[]; className?: string; dark?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const rows = [...el.querySelectorAll<HTMLElement>("[data-type-line]")];
    const slots = rows.map((r) => r.querySelector<HTMLElement>("[data-type-slot]"));
    const activate = (n: number) => rows.forEach((r, i) => r.classList.toggle("is-active", i === n));
    if (prefersReducedMotion()) {
      slots.forEach((s, i) => s && (s.textContent = lines[i]));
      activate(lines.length - 1);
      return;
    }
    let timers: number[] = [];
    const stop = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };
    const type = (line: number, chars: number) => {
      const slot = slots[line];
      if (!slot) return;
      activate(line);
      slot.textContent = lines[line].slice(0, chars);
      if (chars < lines[line].length) timers.push(window.setTimeout(() => type(line, chars + 1), CHAR_MS));
      else if (line < lines.length - 1) timers.push(window.setTimeout(() => type(line + 1, 0), LINE_MS));
    };
    const beat = el.closest<HTMLElement>("[data-in]");
    let seen = false;
    let running = false;
    const sync = () => {
      const go = seen && (!beat || beat.classList.contains("is-in"));
      if (go && !running) {
        running = true;
        stop();
        slots.forEach((s) => s && (s.textContent = ""));
        type(0, 0);
      } else if (!go && running && beat) {
        running = false;
        stop();
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        seen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    const mo = new MutationObserver(sync);
    if (beat) mo.observe(beat, { attributes: true, attributeFilter: ["class"] });
    return () => {
      io.disconnect();
      mo.disconnect();
      stop();
    };
  }, [lines]);

  return (
    <div ref={root} className={cn("grid gap-1.5 font-mono text-[13px] uppercase leading-[1.5] max-[900px]:text-[11px]", dark ? "text-[#b6bac2]" : "text-[#3a3f48]", className)}>
      <p className="sr-only">{lines.join(". ")}</p>
      {lines.map((line, i) => (
        <p key={i} data-type-line="" className={cn("group/line min-h-[1.5em]", i === 0 && (dark ? "text-white" : "text-ink"))} aria-hidden="true">
          <span data-type-slot="" />
          <span className={cn(styles.typeCursor, "ml-0.5 hidden h-[1.1em] w-[.62em] bg-green-400 align-[-.18em] group-[.is-active]/line:inline-block")} />
        </p>
      ))}
    </div>
  );
}
