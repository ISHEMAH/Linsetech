"use client";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { currentOpener, restoreFocus } from "@/lib/focus-trap";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";
import DashedLine from "@/components/ui/DashedLine";
import { useContact } from "./ContactContext";

/**
 * Sharplink mobile menu: links, the company block and the legal links over their dark gradient on an off-white base.
 * The panel fades in (.3s ease-in-out-quad, CSS), its gradient settles (1.2s ease-out-quad, CSS) and the items rise in — `{opacity:0, y:20}` → `{opacity:1, y:0, 0.5s power2.out, stagger .08, delay .15}`;
 * closing drops them `{opacity:0, y:-10, 0.25s power2.in, stagger .03}`. Lenis is stopped while it is open.
 */
export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("nav");
  const th = useTranslations("hero");
  const tf = useTranslations("footer.legal");
  const root = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const inerted = useRef<HTMLElement[]>([]);
  const { open: openContact } = useContact();
  const items = [...site.nav, { key: "careers", href: "/careers" }, { key: "support", href: "/support" }, { key: "contact", href: "/contact" }] as const;

  // Escape closes it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!open && !wasOpen.current) return;
    wasOpen.current = open;
    const targets = el.querySelectorAll(".stagger-item");
    const lenis = getLenis();
    gsap.killTweensOf(targets);
    if (open) {
      lenis?.stop();
      // the page under the menu is inert, so Tab stays on the header and the menu (it reached the hidden links of the
      // page and the footer's email field); focus goes back to the Menu button on close
      opener.current = currentOpener();
      inerted.current = [...document.querySelectorAll<HTMLElement>("body > main, body > footer")].filter((n) => !n.inert);
      inerted.current.forEach((n) => (n.inert = true));
      gsap.set(targets, { opacity: 0, y: 20 });
      gsap.to(targets, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.15 });
    } else {
      lenis?.start();
      inerted.current.forEach((n) => (n.inert = false));
      inerted.current = [];
      restoreFocus(opener.current);
      opener.current = null;
      gsap.to(targets, { opacity: 0, y: -10, duration: 0.25, stagger: 0.03, ease: "power2.in" });
    }
  }, [open]);

  return (
    <div
      ref={root}
      id="mobile-menu"
      className={cn("mobile-menu fixed inset-0 z-[70] flex flex-col overflow-y-auto overflow-x-hidden bg-off-white pt-[calc(58px+var(--cookie-offset,0px))] text-off-white min-[800px]:hidden", open && "is-open")}
      aria-hidden={!open}
      inert={!open}
      data-lenis-prevent
    >
      {/* Sharplink: their dark gradient image (no parallax, scaleY 1.3) fixed over the off-white base — black at the top,
          the light arc at the bottom — 200% tall, settling to 120% as the menu opens (CSS) */}
      <div className="mobile-menu__gradient pointer-events-none fixed left-1/2 top-0 w-[calc(100%+200px)] origin-top [transform:translateX(-50%)_scaleY(1.3)]" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/bg/gradient-dark.webp" alt="" draggable={false} className="block h-full w-full" style={{ objectFit: "fill" }} />
      </div>
      <nav className="relative z-[1] flex flex-col" aria-label={t("mobileNav")}>
        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li key={item.key} className="stagger-item relative">
              <Link href={item.href as never} onClick={onClose} className="relative block px-4 py-3 text-[24px] font-medium leading-[1.4] tracking-[-0.01em]">
                {i === 0 && <DashedLine theme="dark" className="top-0" />}
                {t(item.key as "home")}
                <DashedLine theme="dark" className="bottom-0" />
              </Link>
            </li>
          ))}
          <li className="stagger-item relative">
            <button
              type="button"
              onClick={() => {
                onClose();
                openContact();
              }}
              className="relative block w-full px-4 py-3 text-left text-[24px] font-medium leading-[1.4] tracking-[-0.01em]"
            >
              {t("cta")}
              <DashedLine theme="dark" className="bottom-0" />
            </button>
          </li>
        </ul>
        {/* company block (Sharplink's Nasdaq badge): the software we publish */}
        <div className="stagger-item relative flex items-center gap-4 px-4 pb-5 pt-[37px]">
          <span className="eyebrow text-off-white/85">{th("proudly")}</span>
          <Image src="/work/macyepay/logo.svg" alt="MacyePay" width={120} height={30} className="h-6 w-auto brightness-0 invert" />
        </div>
        <div className="stagger-item flex items-center gap-3 px-4 pb-[60px] pt-6 font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em] text-[var(--off-white-subtle)] underline">
          <Link href="/privacy" onClick={onClose}>
            {tf("privacy")}
          </Link>
          <Link href="/terms" onClick={onClose}>
            {tf("terms")}
          </Link>
        </div>
      </nav>
    </div>
  );
}
