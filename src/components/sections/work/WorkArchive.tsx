"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flip, gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/cn";
import { Arrow, Button } from "@/components/ui/Button";
import { ChapterLabel } from "@/components/sections/WorkChapter";
import type { Project, ProjectCategory } from "@/content/work";

const ORDER: ProjectCategory[] = ["software", "systems", "web", "design", "hardware"];

/**
 * The archive the Work chapter ends into: Puture-style rows (a rule above each, index · title · client · field ·
 * year · arrow; the title takes the accent and the arrow nudges on hover), filter tabs per field (Sharplink
 * secondary tabs, the active one with the brand square; rows re-flow with Flip), and a hover preview: the
 * project's cover rides next to the pointer in a frame that opens with a clip and swaps covers between rows.
 */
export default function WorkArchive({ projects, index }: { projects: Project[]; index: string }) {
  const t = useTranslations("workPage.archive");
  const tc = useTranslations("workPage.categories");
  const [filter, setFilter] = useState<ProjectCategory | "all">("all");
  const [hover, setHover] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  const cats = useMemo(() => ORDER.filter((c) => projects.some((p) => p.category === c)), [projects]);
  const shown = (p: Project) => filter === "all" || p.category === filter;
  const count = projects.filter(shown).length;

  const choose = (f: ProjectCategory | "all") => {
    if (f === filter) return;
    if (list.current && !prefersReducedMotion()) flip.current = Flip.getState(list.current.querySelectorAll("li"));
    setHover(null);
    setFilter(f);
  };

  useLayoutEffect(() => {
    const state = flip.current;
    flip.current = null;
    if (!state || !list.current) return;
    Flip.from(state, {
      targets: list.current.querySelectorAll("li"),
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.3, ease: "power2.in" }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter]);

  // the preview follows the pointer with a short lag (Puture's exhibit cursor uses the same feel)
  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    const pos = { x: 0, y: 0, tx: 0, ty: 0, init: false };
    let raf = 0;
    const tick = () => {
      pos.x += (pos.tx - pos.x) * 0.16;
      pos.y += (pos.ty - pos.y) * 0.16;
      el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pos.tx = e.clientX + 36;
      pos.ty = e.clientY;
      if (!pos.init) {
        pos.x = pos.tx;
        pos.y = pos.ty;
        pos.init = true;
      }
      raf ||= requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = hover !== null ? projects[hover] : null;
  const portrait = current ? current.shape !== "landscape" : false;

  return (
    <section id="archive" data-theme="light" className="relative z-[3] bg-body pb-[clamp(96px,14vh,160px)] pt-[clamp(96px,14vh,160px)] text-ink">
      {/* the pinned floor fades into the archive instead of meeting it on a hard edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-[22svh] bg-[linear-gradient(180deg,rgba(205,239,217,0),#cdefd9)]" aria-hidden />
      <div className="mx-auto grid w-full max-w-[1440px] gap-[clamp(32px,5vh,56px)] px-[clamp(16px,2.5vw,40px)]">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="grid max-w-[860px] justify-items-start gap-[18px]">
            <span data-fade>
              <ChapterLabel index={index}>{t("label")}</ChapterLabel>
            </span>
            <h2 data-chars className="text-[clamp(36px,5vw,78px)] font-normal leading-none tracking-[-0.04em]">
              {t("title")}
            </h2>
            <p data-fade className="max-w-[40em] text-[18px] leading-[1.45] text-ink/65 max-md:text-base">
              {t("sub")}
            </p>
          </div>
          <div data-fade className="grid justify-items-start gap-3 md:justify-items-end">
            <div className="flex flex-wrap gap-[2px]" role="group" aria-label={t("filter")}>
              {(["all", ...cats] as const).map((f) => {
                const n = f === "all" ? projects.length : projects.filter((p) => p.category === f).length;
                return (
                  <Button key={f} variant="secondary" arrow={false} active={filter === f} aria-pressed={filter === f} onClick={() => choose(f)}>
                    {f === "all" ? t("all") : tc(f)}
                    <span className="ml-1.5 tabular-nums opacity-50">{String(n).padStart(2, "0")}</span>
                  </Button>
                );
              })}
            </div>
            <p className="font-narrow text-[11px] uppercase tracking-[0.08em] text-ink/50" aria-live="polite">
              {t("count", { count })}
            </p>
          </div>
        </header>

        <div data-fade>
          <div className="grid grid-cols-[56px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.7fr)_34px] gap-4 pb-3 font-narrow text-[11px] font-medium uppercase tracking-[0.08em] text-ink/45 max-md:hidden">
            <span>#</span>
            <span>{t("project")}</span>
            <span>{t("client")}</span>
            <span>{t("category")}</span>
            <span>{t("year")}</span>
            <span />
          </div>
          <ol ref={list} className="m-0 list-none border-b border-ink/15 p-0" onPointerLeave={() => setHover(null)}>
            {projects.map((p, i) => (
              <li key={p.slug} className={cn("border-t border-ink/15", !shown(p) && "hidden")}>
                <Link
                  href={`/work/${p.slug}` as never}
                  onPointerEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  className="card-hover group grid grid-cols-[56px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,.8fr)_minmax(0,.7fr)_34px] items-center gap-4 py-[22px] max-md:grid-cols-[40px_minmax(0,1fr)_34px] max-md:gap-x-3 max-md:gap-y-1 max-md:py-4"
                >
                  <span className="font-narrow text-[11px] uppercase tracking-[0.08em] text-ink/45 max-md:row-span-2 max-md:self-start max-md:pt-2">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-[clamp(24px,2.6vw,44px)] leading-[1.05] tracking-[-0.035em] transition-[color,translate] duration-300 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-2 group-hover:text-green-700">
                      {p.title}
                    </span>
                    {p.placeholder && <span className="shrink-0 bg-ink/10 px-1.5 pb-[3px] pt-1 font-narrow text-[10px] uppercase tracking-[0.08em] text-ink/60">{t("sample")}</span>}
                  </span>
                  <span className="text-[15px] text-ink/65 max-md:col-start-2 max-md:row-start-2 max-md:text-[13px]">
                    {p.client}
                    <span className="md:hidden">
                      {" · "}
                      {tc(p.category)} · {p.year}
                    </span>
                  </span>
                  <span className="text-[15px] text-ink/65 max-md:hidden">{tc(p.category)}</span>
                  <span className="font-narrow text-[13px] uppercase tracking-[0.06em] text-ink/65 max-md:hidden">{p.year}</span>
                  <span className="grid h-[34px] w-[34px] place-items-center bg-[var(--surface-darker)] transition-[background-color,color] duration-300 group-hover:bg-green-400 group-hover:text-ink max-md:col-start-3 max-md:row-span-2 max-md:row-start-1">
                    <Arrow className="transition-[translate] duration-[400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* hover preview (pointer devices) */}
      <div ref={preview} className="pointer-events-none fixed left-0 top-0 z-[60] hidden md:block" aria-hidden>
        <div
          className="relative -translate-y-1/2 overflow-hidden bg-[#020a07] shadow-[0_30px_80px_-30px_rgba(2,10,7,.55)] transition-[clip-path,width,height] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          style={{ width: portrait ? 210 : 360, height: portrait ? 373 : 270, clipPath: current ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)" }}
        >
          {projects.map((p, i) =>
            p.cover ? (
              <Image
                key={p.slug}
                src={p.cover}
                alt=""
                fill
                sizes="360px"
                className={cn("object-cover object-top transition-[opacity,scale] duration-500 ease-[cubic-bezier(.16,1,.3,1)]", hover === i ? "scale-100 opacity-100" : "scale-[1.08] opacity-0")}
              />
            ) : null,
          )}
          {current && (
            <span className="absolute bottom-2 left-2 inline-flex gap-[3px] font-narrow text-[10px] font-medium uppercase leading-none tracking-[0.08em]">
              <span className="bg-green-500 px-2 pb-[5px] pt-1.5 text-white">{String((hover ?? 0) + 1).padStart(2, "0")}</span>
              <span className="bg-off-white px-2 pb-[5px] pt-1.5 text-ink">{tc(current.category)}</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
