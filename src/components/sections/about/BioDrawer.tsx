"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useContact } from "@/components/layout/ContactContext";
import { Button, Cross } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import PortraitTile from "./PortraitTile";

export type Bio = { index: number; name: string; role: string; paragraphs: string[]; portraitLabel: string };

const noSubscribe = () => () => {};
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

type Props = { bio: Bio | null; open: boolean; title: string; closeLabel: string; ctaLabel: string; onClose: () => void };

/**
 * Sharplink AboutTeamDrawer (their CSS + timeline, measured):
 * - teleported to <body> (`fixed inset 0`, z 99999 there): ours sits at z 85, above the header (80) and under the contact
 *   dialog (90), so it covers the header like theirs instead of being trapped in the page's stacking contexts;
 * - one paused timeline: the panel (rgba(0,0,0,.4) + blur 33px, padding 16/16 → 20/28 from 800px) slides in from the
 *   right over 0.6s power4.inOut while the black overlay fades to .6 over 0.6s ease-in-out-circ; closing reverses it;
 *   Lenis stops while it is open;
 * - heading row (4px brand square + "MEET OUR LEADERSHIP", secondary CLOSE ×), a dashed rule, then 422px of bio beside a
 *   180px column with the portrait and the CTA (desktop), or the 116px portrait and the CTA in a row above the bio
 *   (phone); the bio scrolls inside a 24px top / bottom fade with a 2px brand thumb on the panel's right edge.
 * Ours also closes on Esc and on the overlay, keeps Tab inside the panel and gives focus back to the opener.
 */
export default function BioDrawer({ bio, open, title, closeLabel, ctaLabel, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const isClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const { open: openContact, isOpen: contactOpen } = useContact();
  const contactRef = useRef(contactOpen);
  useEffect(() => {
    contactRef.current = contactOpen;
  }, [contactOpen]);

  useGSAP(
    () => {
      if (!root.current || !panel.current) return;
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(root.current.querySelector(".overlay"), { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: "circ.inOut" }, 0)
        .fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: "power4.inOut" }, 0);
    },
    { scope: root, dependencies: [isClient] },
  );

  useEffect(() => {
    const t = tl.current;
    const el = root.current;
    const drawer = panel.current;
    if (!t || !el || !drawer) return;
    const lenis = getLenis();
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      lenis?.stop();
      t.eventCallback("onReverseComplete", null);
      // visible before playing, so focus can land inside right away
      gsap.set(el, { autoAlpha: 1 });
      if (prefersReducedMotion()) t.progress(1);
      else t.play();
      scroller.current?.scrollTo(0, 0);
      closeBtn.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key !== "Tab") return;
        const focusables = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
          e.preventDefault();
          first.focus();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (t.progress() === 0) return;
    const done = () => {
      gsap.set(el, { autoAlpha: 0 });
      if (!contactRef.current) lenis?.start();
    };
    if (prefersReducedMotion()) {
      t.progress(0);
      done();
    } else {
      t.eventCallback("onReverseComplete", done);
      t.reverse();
    }
    // the contact dialog takes focus itself (and hands it back to the opener when it closes)
    if (!contactRef.current) opener.current?.focus?.({ preventScroll: true });
  }, [open, onClose]);

  // brand scroll thumb on the right edge of the panel (their .scroll-indicator), only when the bio overflows
  useEffect(() => {
    const el = scroller.current;
    const th = thumb.current;
    if (!el || !th) return;
    const update = () => {
      const can = el.scrollHeight > el.clientHeight + 1;
      th.style.opacity = can ? "1" : "0";
      th.style.height = `${(el.clientHeight / el.scrollHeight) * 100}%`;
      th.style.top = `${(el.scrollTop / el.scrollHeight) * 100}%`;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [bio, isClient]);

  const talk = () => {
    const back = opener.current;
    onClose();
    openContact({ returnFocus: back });
  };

  if (!isClient) return null;
  return createPortal(
    <div
      ref={root}
      data-theme="dark"
      className="fixed inset-0 z-[85] flex text-off-white"
      style={{ visibility: "hidden", opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-labelledby="bio-name"
    >
      <button type="button" aria-label={closeLabel} tabIndex={-1} className="overlay absolute inset-0 cursor-pointer bg-black opacity-0" onClick={onClose} />
      <div
        ref={panel}
        className="absolute inset-y-0 right-0 z-[1] flex w-full max-w-full flex-col px-4 pt-4 min-[800px]:w-auto min-[800px]:px-7 min-[800px]:pt-5"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(33px)", WebkitBackdropFilter: "blur(33px)" }}
      >
        <div className="relative flex items-center justify-between gap-4 pb-5">
          <p className="eyebrow flex items-center gap-3">
            <span className="block h-1 w-1 bg-[var(--brand)]" aria-hidden />
            {title}
          </p>
          <Button ref={closeBtn} variant="secondary" icon={<Cross />} onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
        <div className="relative flex min-h-0 grow flex-col overflow-hidden min-[800px]:grid min-[800px]:grid-cols-[422px_180px] min-[800px]:gap-7">
          <DashedLine theme="dark" className="top-0" />
          {/* portrait + CTA: the right column on desktop, a row above the bio on phones */}
          <div className="relative flex items-start justify-between gap-4 py-4 min-[800px]:order-1 min-[800px]:flex-col min-[800px]:justify-start min-[800px]:gap-0 min-[800px]:py-0">
            <DashedLine theme="dark" direction="vertical" className="left-0 hidden min-[800px]:block" />
            {bio && <PortraitTile index={bio.index} label={bio.portraitLabel} pin="light" className="w-[116px] shrink-0 min-[800px]:w-full" />}
            <div className="flex flex-col items-start gap-[6px] min-[800px]:p-4">
              <Button variant="secondary" arrow={false} onClick={talk}>
                {ctaLabel}
              </Button>
            </div>
          </div>
          <div className="relative flex min-h-0 grow flex-col overflow-hidden">
            <DashedLine theme="dark" className="top-0 min-[800px]:hidden" />
            <DashedLine theme="dark" direction="vertical" className="right-0 hidden -translate-x-px min-[800px]:block" />
            <div
              ref={scroller}
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto pt-5 [scrollbar-width:none] min-[800px]:pt-6 [&::-webkit-scrollbar]:hidden"
              style={{
                WebkitMaskImage: "linear-gradient(180deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)",
                maskImage: "linear-gradient(180deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)",
              }}
            >
              {bio && (
                <>
                  <h2 id="bio-name" className="text-[24px] font-medium leading-[1.4] tracking-[-0.24px] min-[800px]:text-[32px] min-[800px]:leading-[1.16] min-[800px]:tracking-[-0.32px]">
                    {bio.name}
                  </h2>
                  <p className="eyebrow mt-3 text-[var(--off-white-subtle)]">{bio.role}</p>
                  <div className="mt-5 pb-[60px] text-[14px] font-medium leading-[1.35] min-[800px]:mt-6 min-[800px]:pr-5 [&>p+p]:mt-[1lh]">
                    {bio.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-0 w-[2px]" aria-hidden>
          <span ref={thumb} className="absolute w-full bg-[var(--brand)] opacity-0" />
        </span>
      </div>
    </div>,
    document.body,
  );
}
