"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollTrigger } from "@/lib/gsap";

/** Puture's numbers for the two chapters that carry the HUD (Sharplink's sections have none) */
export const HUD_CHAPTERS: Record<string, string> = { work: "02", process: "03" };

/**
 * Puture's HUD, fixed bottom-left at 16/16: an accent index box and a black text box (inset hairline, a 9px "Chapter"
 * kicker over the name), colour .5s / opacity .9s. Only the Work and Process chapters carry it. Hidden at ≤900px,
 * where the menu button reads the chapter instead (Nav follows html[data-chapter], set here).
 */
export default function ChapterBadge() {
  const t = useTranslations("chapters");
  const [chapter, setChapter] = useState<string | null>(null);

  useEffect(() => {
    const triggers: ScrollTrigger[] = [];
    const id = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
        const key = el.dataset.chapter!;
        if (!HUD_CHAPTERS[key]) return;
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: "top 50%",
            end: "bottom 50%",
            // adjacent chapters toggle at the same scroll point: leaving one only clears the HUD if it still shows it
            onToggle: (self) => setChapter((c) => (self.isActive ? key : c === key ? null : c)),
          }),
        );
      });
    }, 200);
    return () => {
      window.clearTimeout(id);
      triggers.forEach((tr) => tr.kill());
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (chapter) html.dataset.chapter = chapter;
    else delete html.dataset.chapter;
    return () => {
      delete html.dataset.chapter;
    };
  }, [chapter]);

  // always rendered (GSAP pins re-parent siblings; a null → element swap would make React insert against a moved node)
  return (
    <div
      className="pointer-events-none fixed bottom-4 left-4 z-[60] hidden items-stretch gap-[3px] font-narrow uppercase transition-opacity duration-[900ms] min-[901px]:flex"
      style={{ opacity: chapter ? 1 : 0 }}
      aria-live="polite"
    >
      <span className="flex min-w-[38px] items-center justify-center bg-green-500 px-2 text-[13px] font-medium tabular-nums text-white transition-colors duration-500">
        {chapter ? HUD_CHAPTERS[chapter] : ""}
      </span>
      <span className="flex flex-col justify-center bg-black px-3 py-[7px] text-off-white shadow-[inset_0_0_0_1px_#ffffff24]">
        <span className="text-[9px] leading-none tracking-[0.12em] text-white/50">{t("kicker")}</span>
        <span className="mt-1 text-[12px] leading-none tracking-[0.08em]">{chapter ? t(chapter as "work") : ""}</span>
      </span>
    </div>
  );
}
