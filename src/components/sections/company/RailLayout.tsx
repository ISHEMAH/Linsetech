"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/lenis";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Chevron } from "./icons";
import { ANCHOR_OFFSET } from "./actions";
import "./company.css";

type Item = { id: string; label: string };

type Props = {
  items: Item[];
  /** aria-label of the nav */
  label: string;
  children: ReactNode;
};

/**
 * Sharplink `InvestorsWidgets`: a sticky in-page nav over the left three columns, the sections in the right nine; the
 * container is transparent (padding-top 160px, 28px mobile, where the first widget's flipped gradient rises).
 * - pin: from "top 95px" (66px on mobile) until the list bottom reaches the viewport centre, without spacing
 * - theme: dark until pinned, then the header's theme (their `k ? "theme-dark" : currentTheme`)
 * - active item: the section between "top 30%" and "bottom 40%" (onEnter / onEnterBack); it is a primary
 *   ui-button with the brand square, the others secondary
 * - click: smooth scroll leaving the section top 150px under the viewport top, over 2.2s (Lenis' expo-out), and
 *   `#id` pushed to the URL
 * - < 800px: a centred dropdown (active label + chevron), items stagger in (power4.out .4s, .05) over a blurred
 *   overlay and out in reverse order (.2s, .03); colours set locally (company.css `.co-rail-drop`) because the dark
 *   nav around it would otherwise apply `[data-theme="dark"] .ui-btn--primary`
 */
export default function RailLayout({ items, label, children }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [headerTheme, setHeaderTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

  // follow the header's theme (html[data-nav], set by Nav from the section under it)
  useEffect(() => {
    const html = document.documentElement;
    const read = () => setHeaderTheme(html.dataset.nav === "light" ? "light" : "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: ["data-nav"] });
    return () => mo.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 799px)", desktop: "(min-width: 800px)" }, (ctx) => {
        const mobile = !!ctx.conditions?.mobile;
        ScrollTrigger.create({
          trigger: track.current,
          start: mobile ? "top 66px" : "top 95px",
          endTrigger: el,
          end: "bottom center",
          onEnter: () => setPinned(true),
          onLeaveBack: () => {
            setPinned(false);
            setOpen(false);
          },
          onLeave: () => setOpen(false),
        });
      });
      items.forEach((it, i) => {
        const sec = el.querySelector(`#${it.id}`);
        if (!sec) return;
        ScrollTrigger.create({ trigger: sec, start: "top 30%", end: "bottom 40%", onEnter: () => setActive(i), onEnterBack: () => setActive(i) });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [items.map((i) => i.id).join()] },
  );

  // mobile dropdown items
  useGSAP(
    () => {
      const links = root.current?.querySelectorAll(".rail-drop-link");
      if (!links?.length) return;
      if (prefersReducedMotion()) {
        gsap.set(links, { autoAlpha: open ? 1 : 0, y: 0 });
        return;
      }
      if (open) gsap.to(links, { autoAlpha: 1, y: 0, stagger: 0.05, ease: "power4.out", duration: 0.4, overwrite: true });
      else gsap.to(links, { autoAlpha: 0, y: 10, stagger: { each: 0.03, from: "end" }, ease: "power4.out", duration: 0.2, overwrite: true });
    },
    { scope: root, dependencies: [open] },
  );

  // Sharplink's anchor links: lenis.scrollTo(el, { offset: -150, duration: 2.2 }) (default expo-out) + pushState("#id")
  const go = (i: number) => {
    setOpen(false);
    scrollToTarget(`#${items[i].id}`, ANCHOR_OFFSET, 2.2, `#${items[i].id}`);
  };

  const theme = pinned ? headerTheme : "dark";
  const railH = 28 + items.length * 36;

  return (
    <div ref={root} className="relative z-[2] pt-[28px] min-[800px]:pt-[160px]" style={{ "--rail-h": `${railH}px` } as CSSProperties}>
      <div ref={track} className={cn("co-rail-track", "top-[28px] min-[800px]:top-[160px]")} style={{ bottom: `calc(50vh - 95px - ${railH}px)` }}>
        <nav aria-label={label} data-theme={theme} data-theme-manual="1" className={cn("co-rail-nav", "px-[clamp(16px,2.5vw,40px)]")}>
          {/* desktop: stacked ui-buttons */}
          <ul className="hidden flex-col items-start gap-[2px] pt-[28px] min-[800px]:flex">
            {items.map((it, i) => (
              <li key={it.id}>
                <Button
                  variant={i === active ? "primary" : "secondary"}
                  arrow={false}
                  active={i === active}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => go(i)}
                >
                  {it.label}
                </Button>
              </li>
            ))}
          </ul>
          {/* mobile: dropdown — the toggle is a light-theme primary (black, off-white, brand square) with an accent
              chevron box that always points down; the current item is accent (brand fill, white type, no square) */}
          <div className="co-rail-drop flex justify-center pb-4 min-[800px]:hidden">
            <div className="relative z-[1] w-max">
              <Button variant="primary" active className="co-drop-toggle" icon={<Chevron dir="down" />} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
                {items[active]?.label}
              </Button>
              <ul className={cn("absolute left-0 top-[calc(100%+2px)] flex w-full flex-col items-stretch gap-[2px]", !open && "pointer-events-none")}>
                {items.map((it, i) => (
                  <li key={it.id} className="rail-drop-link [&_.ui-btn]:w-full" style={{ opacity: 0, visibility: "hidden", transform: "translateY(10px)" }}>
                    <Button
                      variant={i === active ? "primary" : "secondary"}
                      className={i === active ? "co-drop-accent" : undefined}
                      arrow={false}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => go(i)}
                      tabIndex={open ? 0 : -1}
                    >
                      {it.label}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
      {/* the overlay behind the open dropdown (blur 16, black .5, .3s): above the sections (z 2), under the rail (z 4) */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[3] bg-black/50 backdrop-blur-[16px] transition-opacity duration-300 ease-[var(--ease-in-out-quad)] min-[800px]:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* < 800px the dropdown takes its own row above the first section (Sharplink: the nav is in flow on mobile) */}
      <div className="h-[50px] min-[800px]:hidden" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  );
}
