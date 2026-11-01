"use client";
/**
 * Puture's scrambles (their ContactDialog chunk), on GSAP's ScrambleTextPlugin (free since 3.13):
 *  - `<Decode>` + `useDecode`: Puture's `.decode`. Each word keeps its place with transparent text while a live copy
 *    decodes over it. When the beat turns `.is-in`, item n starts at .35 + .14·n s and its words follow one another,
 *    .014 s per character of the item (capped at 1.2 s for the whole item); each word decodes in .42 s
 *    (chars ░▒▓▌▐▀▄, speed .6, revealDelay .12). It replays every time the beat comes back in.
 *  - `scrambleLabel`: Puture's hover label (`hn`): the label keeps its width and re-decodes in .6 s at speed .9.
 */
import { Fragment, useEffect, type RefObject } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { cn } from "@/lib/cn";

if (typeof window !== "undefined") gsap.registerPlugin(ScrambleTextPlugin);

export const SCRAMBLE_CHARS = "░▒▓▌▐▀▄";

const START = 0.35;
const PER_ITEM = 0.14;
const PER_CHAR = 0.014;
const ITEM_MAX = 1.2;
const WORD = 0.42;
const REVEAL_DELAY = 0.12;
const HOVER = 0.6;

/** One decoding item (a kicker, a paragraph, a fact): words stay in place, a live copy scrambles over each. */
export function Decode({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("decode", className)} data-decode-item="">
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="relative inline-block" data-decode={w}>
            <span className="text-transparent">{w}</span>
            <span className="absolute inset-0 select-none overflow-hidden whitespace-nowrap" aria-hidden="true" />
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/** Runs the decode of every `<Decode>` inside `ref` whenever the closest `[data-in]` beat becomes `.is-in`. */
export function useDecode(ref: RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-decode-item]")].map((item) =>
      [...item.querySelectorAll<HTMLElement>("[data-decode]")].map((w) => ({ text: w.dataset.decode ?? "", live: w.lastElementChild as HTMLElement | null })),
    );
    if (prefersReducedMotion()) {
      items.flat().forEach(({ text, live }) => live && (live.textContent = text));
      return;
    }
    const beat = root.closest<HTMLElement>("[data-in]") ?? root;
    let on = false;
    let tl: gsap.core.Timeline | null = null;
    const sync = () => {
      const now = beat.classList.contains("is-in");
      if (now === on) return;
      on = now;
      if (!now) return;
      tl?.kill();
      const t = gsap.timeline();
      items.forEach((words, n) => {
        const total = words.reduce((sum, w) => sum + w.text.length + 1, 0);
        const spread = Math.min(ITEM_MAX, total * PER_CHAR);
        let done = 0;
        words.forEach(({ text, live }) => {
          if (!live) return;
          live.textContent = "";
          t.to(live, { duration: WORD, ease: "none", scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.6, revealDelay: REVEAL_DELAY } }, START + n * PER_ITEM + (done / Math.max(1, total)) * spread);
          done += text.length + 1;
        });
      });
      tl = t;
    };
    const mo = new MutationObserver(sync);
    mo.observe(beat, { attributes: true, attributeFilter: ["class"] });
    sync();
    return () => {
      mo.disconnect();
      tl?.kill();
    };
  }, [ref, key]);
}

/** Puture's hover scramble on a label: fixed width while it decodes again (.6 s, speed .9). */
export function scrambleLabel(el: HTMLElement | null, text?: string) {
  if (!el || prefersReducedMotion()) return;
  const label = text ?? el.dataset.label ?? el.textContent ?? "";
  el.dataset.label = label;
  el.style.width = `${el.getBoundingClientRect().width}px`;
  gsap.to(el, {
    duration: HOVER,
    scrambleText: { text: label, chars: SCRAMBLE_CHARS, speed: 0.9 },
    overwrite: true,
    onComplete: () => {
      el.style.width = "";
    },
  });
}
