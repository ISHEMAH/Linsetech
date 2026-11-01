"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useContact } from "./ContactContext";
import MobileMenu from "./MobileMenu";
import { HUD_CHAPTERS } from "./ChapterBadge";

/** DarkGradient's image as a small RGBA grid (read once), so the colour behind the header can be composited per frame */
type Grid = { px: Uint8ClampedArray; w: number; h: number };
let gradientGrid: Grid | null = null;
function loadGradientGrid(done: () => void) {
  if (gradientGrid) return;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 80;
    c.height = 160;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, c.width, c.height);
    gradientGrid = { px: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
    done();
  };
  img.src = "/bg/gradient-dark.webp";
}

/** relative luminance of an sRGB colour (0–255 channels) */
function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** the Puture chapter on screen (ChapterBadge sets html[data-chapter]); on phones the menu button reads it */
const onChapterChange = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-chapter"] });
  return () => mo.disconnect();
};
const readChapter = () => document.documentElement.dataset.chapter ?? "";

/** Sharplink's .top-blur layers: blur radius and the `to top` mask band it covers */
const band = (stops: string) => `linear-gradient(to top, ${stops})`;
const TOP_BLUR: [number, string][] = [
  [1, band("rgba(0,0,0,0) 50%, #000 62.5%, #000 75%, rgba(0,0,0,0) 87.5%")],
  [2, band("rgba(0,0,0,0) 62.5%, #000 75%, #000 87.5%, rgba(0,0,0,0) 100%")],
  [4, band("rgba(0,0,0,0) 75%, #000 87.5%, #000 100%")],
  [8, band("rgba(0,0,0,0) 87.5%, #000 100%")],
];

/**
 * Sharplink site-header: logo left, tabs right. Every tab is a secondary ui-button (label slides up on hover,
 * current route gets the 6px brand square); the glass tint follows the section under it via html[data-nav].
 */
export default function Nav() {
  const t = useTranslations("nav");
  const tc = useTranslations("chapters");
  const pathname = usePathname();
  const { open } = useContact();
  const chapter = useSyncExternalStore(onChapterChange, readChapter, () => "");
  const root = useRef<HTMLElement>(null);
  const logo = useRef<HTMLAnchorElement>(null);
  // the menu closes on navigation (Sharplink closes it in the route middleware): reset while rendering a new path
  const [menu, setMenu] = useState({ open: false, path: pathname });
  if (menu.path !== pathname) setMenu({ open: false, path: pathname });
  const menuOpen = menu.open;
  const setMenuOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setMenu((m) => ({ open: typeof next === "function" ? next(m.open) : next, path: pathname }));

  // Sharplink forces the dark header (and its Close button) while the menu is open, and gives the theme back as it
  // closes; the menu also closes when the window grows past the phone breakpoint
  const menuOpenRef = useRef(false);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) document.documentElement.dataset.nav = "dark";
    else window.dispatchEvent(new Event("headertheme"));
  }, [menuOpen]);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 800px)");
    const onChange = () => {
      if (m.matches) setMenu((v) => ({ ...v, open: false }));
    };
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  // Header theme = what is actually behind the logo on the header line (40px from the top), every frame while scrolling
  // (the tabs carry their own backgrounds, the logo does not):
  // - sections that drive the header themselves (data-theme-manual: the home hero, Stack, services) are left alone;
  // - a section with an opaque background, or inside an opaque wrapper (the case-study space), sets it by its data-theme;
  // - otherwise the light backdrop shows through, and the dark gradient edges and black blocks covering the line are
  //   composited over it with the image's real colours (the gradients fade out through green and spill across
  //   sections, so section boundaries alone get it wrong for a few hundred pixels — badly on phones).
  useEffect(() => {
    const LINE = 40;
    const BACKDROP = [247, 247, 245]; // LightBackdrop away from its centre glow
    const covers = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.top <= LINE && r.bottom > LINE ? r : null;
    };
    const opaqueBg = (cs: CSSStyleDeclaration) => {
      if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
      const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const parts = m[1].split(",").map((x) => parseFloat(x));
      return parts.length < 4 || parts[3] > 0.9;
    };
    const opaqueBehind = (el: HTMLElement) => {
      for (let e: HTMLElement | null = el; e && e !== document.body; e = e.parentElement) if (opaqueBg(getComputedStyle(e))) return true;
      return false;
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      if (menuOpenRef.current) return; // the open menu keeps the header dark
      const themed = [...document.querySelectorAll<HTMLElement>("[data-theme]")].filter((el) => {
        if (el.closest("header, .mobile-menu, [role=dialog]")) return false;
        if (!covers(el)) return false;
        // fixed layers (drawers, backdrops) are not the page, but a section that ScrollTrigger pins is
        return getComputedStyle(el).position !== "fixed" || !!el.closest(".pin-spacer");
      });
      const sec = themed[themed.length - 1]; // innermost (descendants come after their ancestors); none in a gap
      if (sec?.closest("[data-theme-manual]")) return;
      let theme = sec?.dataset.theme === "dark" ? "dark" : "light";
      if (!sec || !opaqueBehind(sec)) {
        // black blocks of the page itself (not hidden overlays of drawers/menus, which live outside main)
        const black = [...document.querySelectorAll<HTMLElement>("main .bg-black")].some((b) => {
          if (!covers(b)) return false;
          const cs = getComputedStyle(b);
          return cs.position !== "fixed" && cs.visibility !== "hidden" && parseFloat(cs.opacity) >= 0.5;
        });
        const gradients = [...document.querySelectorAll<HTMLElement>("[data-dg]")].flatMap((g) => {
          const r = covers(g);
          return r ? [{ r, flipped: g.dataset.dg === "bottom" }] : [];
        });
        const grid = gradientGrid;
        if (black) theme = "dark";
        else if (gradients.length && grid) {
          const box = logo.current?.getBoundingClientRect();
          const xs = box && box.width ? [0.2, 0.5, 0.8].map((f) => box.left + box.width * f) : [40, 70, 100];
          let lum = 0;
          for (const x of xs) {
            const c = [...BACKDROP];
            for (const { r, flipped } of gradients) {
              let u = (x - r.left) / r.width;
              let v = (LINE - r.top) / r.height;
              if (flipped) [u, v] = [1 - u, 1 - v]; // the bottom variant is the image turned 180°
              const col = Math.min(grid.w - 1, Math.max(0, Math.floor(u * grid.w)));
              const row = Math.min(grid.h - 1, Math.max(0, Math.floor(v * grid.h)));
              const i = (row * grid.w + col) * 4;
              const a = grid.px[i + 3] / 255;
              for (let k = 0; k < 3; k++) c[k] += (grid.px[i + k] - c[k]) * a;
            }
            lum += luminance(c) / xs.length;
          }
          // below ~0.2 white type has more contrast than the ink colour
          theme = lum < 0.2 ? "dark" : "light";
        }
      }
      if (document.documentElement.dataset.nav !== theme) document.documentElement.dataset.nav = theme;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    loadGradientGrid(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("headertheme", schedule); // a backdrop changed colour without a scroll (CaseBackdrop)
    const id = window.setTimeout(update, 150);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("headertheme", schedule);
      window.clearTimeout(id);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  const isActive = (href: string) => pathname === href;
  const items = site.nav.filter((i) => i.key !== "home");

  return (
    <>
      <header ref={root} className="nav-chrome fixed inset-x-0 top-0 z-[80]">
        {/* Sharplink .top-blur: four backdrop blurs (1/2/4/8px) masked into bands, strongest at the top, reaching 60px
            below the header on phones and 150px from 800px, so content softens as it slides under */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -bottom-[60px] -z-10 min-[800px]:-bottom-[150px]">
          {TOP_BLUR.map(([px, mask], i) => (
            <div key={px} className="absolute inset-0" style={{ zIndex: 5 + i, backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)`, maskImage: mask, WebkitMaskImage: mask }} />
          ))}
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-[calc(12px+var(--cookie-offset,0px))] min-[800px]:px-7 min-[800px]:pb-0 min-[800px]:pt-[calc(16px+var(--cookie-offset,0px))]">
          <Link ref={logo} href="/" className="relative z-[2] text-[1.05rem]" aria-label={t("homeLabel")}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-[2px] min-[800px]:flex" aria-label={t("primary")}>
            {items.map((item) => (
              <ButtonLink key={item.key} href={item.href} variant="secondary" arrow={false} active={isActive(item.href)}>
                {t(item.key)}
              </ButtonLink>
            ))}
            <Button variant="secondary" onClick={open}>
              {t("cta")}
            </Button>
            <LocaleSwitcher />
          </nav>

          <div className="flex items-center gap-[2px] min-[800px]:hidden">
            <LocaleSwitcher />
            <Button variant="secondary" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-controls="mobile-menu" icon={<Hamburger open={menuOpen} />}>
              {menuOpen ? t("close") : HUD_CHAPTERS[chapter] ? `${HUD_CHAPTERS[chapter]} ${tc(chapter as "work")}` : t("menu")}
            </Button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

/** Sharplink svg-hamburger: two bars 4px apart that fold into a cross. */
function Hamburger({ open }: { open: boolean }) {
  return (
    <svg className={cn("hamburger", open && "is-open")} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path className="hl hl--top" d="M15 8L1 8" stroke="currentColor" strokeWidth="1.25" />
      <path className="hl hl--bottom" d="M15 8L1 8" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/** each language under its own name */
const NATIVE: Record<(typeof routing.locales)[number], string> = { en: "English", fr: "Français", rw: "Kinyarwanda" };

function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  // same page in the other language, keeping the query and the section anchor
  const switchTo = (next: (typeof routing.locales)[number]) =>
    router.replace(`${pathname}${window.location.search}${window.location.hash}` as never, { locale: next });
  return (
    <label className="nav-tab relative cursor-pointer !px-3 has-[select:focus-visible]:outline has-[select:focus-visible]:outline-1 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-[var(--brand)]">
      <span className="sr-only">{t("language")}</span>
      {/* the visible label; the native picker sits invisibly on top at 16px so iPhone Safari does not zoom on tap */}
      <span aria-hidden className="pointer-events-none pr-4 font-narrow text-[13px] uppercase tracking-[0.08em]">
        {locale}
      </span>
      <select
        value={locale}
        onChange={(e) => switchTo(e.target.value as (typeof routing.locales)[number])}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-[16px] opacity-0 outline-none"
        aria-label={t("language")}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l} lang={l} className="text-ink">
            {NATIVE[l]}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-[9px]" aria-hidden>▼</span>
    </label>
  );
}
