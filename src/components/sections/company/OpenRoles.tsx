"use client";
import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { currentOpener, restoreFocus, trapTab } from "@/lib/focus-trap";
import { useContact } from "@/components/layout/ContactContext";
import { Button, Cross } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";
import RowList from "./RowList";
import { ActButton, ROLE_EVENT } from "./actions";
import { Chevron, DiagArrow } from "./icons";
import { Pictogram, Tile } from "./Tiles";
import "./company.css";

const noSubscribe = () => () => {};

export type RoleView = {
  slug: string;
  title: string;
  team: string;
  teamLabel: string;
  typeLabel: string;
  location: string;
  summary: string;
  do: string[];
  bring: string[];
  art: "box" | "stack" | "people" | "laptop";
};

type Labels = {
  search: string;
  allTeams: string;
  empty: string;
  view: string;
  drawer: { heading: string; close: string; about: string; do: string; bring: string; apply: string; email: string; note: string };
};

/**
 * Open roles = Sharplink press releases: search box + select at the top right of the heading (b2iLibToolsContainer),
 * then press rows. A row opens the role in a drawer built like their team drawer ("read bio").
 */
export default function OpenRoles({ roles, open, teams, labels, email }: { roles: RoleView[]; open: RoleView; teams: { key: string; label: string }[]; labels: Labels; email: string }) {
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [current, setCurrent] = useState<RoleView | null>(null);
  const all = useMemo(() => [...roles, open], [roles, open]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const slug = (e as CustomEvent<string>).detail;
      const r = all.find((x) => x.slug === slug);
      if (r) setCurrent(r);
    };
    window.addEventListener(ROLE_EVENT, onOpen);
    return () => window.removeEventListener(ROLE_EVENT, onOpen);
  }, [all]);

  const needle = q.trim().toLowerCase();
  const filtered = roles.filter((r) => (!team || r.team === team) && (!needle || `${r.title} ${r.teamLabel} ${r.location}`.toLowerCase().includes(needle)));
  const rows = [...filtered, open].map((r) => ({
    id: r.slug,
    chip: r.typeLabel,
    title: r.title,
    meta: `${r.teamLabel} · ${r.location}`,
    action: { kind: "role" as const, slug: r.slug },
  }));

  return (
    <>
      {/* filters: right of the heading on desktop (absolute in the section column), stacked above the list on mobile */}
      <div className="-mt-6 mb-8 flex flex-row-reverse flex-wrap gap-2 min-[800px]:absolute min-[800px]:right-0 min-[800px]:top-[28px] min-[800px]:z-[2] min-[800px]:mb-0 min-[800px]:mt-0 min-[800px]:gap-3">
        <label className={cn("flex gap-[2px]", "co-select-wrap")}>
          <span className="sr-only">{labels.allTeams}</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={cn("co-field", "co-select")}>
            <option value="">{labels.allTeams}</option>
            {teams.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <span className={cn("co-field", "co-select-icon", "pointer-events-none flex w-[34px] items-center justify-center p-0")} aria-hidden>
            <Chevron />
          </span>
        </label>
        <label className="grow min-[800px]:grow-0">
          <span className="sr-only">{labels.search}</span>
          <input type="text" inputMode="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.search} className={cn("co-field", "w-full min-[800px]:w-[212px]")} />
        </label>
      </div>
      {needle || team ? filtered.length === 0 && <p className="eyebrow pb-6 text-[var(--c-sub)]">{labels.empty}</p> : null}
      <RowList rows={rows} chip="date" actionLabel={labels.view} />
      <RoleDrawer role={current} onClose={() => setCurrent(null)} labels={labels.drawer} email={email} />
    </>
  );
}

function RoleDrawer({ role, onClose, labels, email }: { role: RoleView | null; onClose: () => void; labels: Labels["drawer"]; email: string }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const isOpen = useRef(false);
  const lastRole = useRef<RoleView | null>(null);
  const [shown, setShown] = useState<RoleView | null>(null);
  const { open: openContact, isOpen: contactOpen } = useContact();
  // rendered into <body>: inside the page it would be trapped under later sections' stacking contexts (main is z 1,
  // the rail container z 2, the facts band z 3); Sharplink teleports its team drawer to the body as well
  const isClient = useSyncExternalStore(noSubscribe, () => true, () => false);
  const contactRef = useRef(contactOpen);
  useEffect(() => {
    contactRef.current = contactOpen;
  }, [contactOpen]);

  if (role && role !== shown) setShown(role);

  useGSAP(
    () => {
      if (!root.current || !panel.current) return;
      // the root's visibility is set by hand (below), so it is visible before focus moves in
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(root.current!.querySelector(".overlay"), { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: "circ.inOut" }, 0)
        .fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: "power4.inOut" }, 0);
    },
    { scope: root, dependencies: [isClient] },
  );

  const requestClose = useEffectEvent(() => onClose());

  // Open: visible at once (focus() does nothing while visibility is hidden, and the timeline only renders on the next
  // tick), then the slide; focus goes to CLOSE, Tab stays in the panel, Esc closes. Close: focus back to the opener,
  // unless Apply handed over to the contact drawer, which gives it back itself when it closes.
  useEffect(() => {
    const t = tl.current;
    const el = root.current;
    const drawer = panel.current;
    if (!t || !el || !drawer) return;
    const lenis = getLenis();
    const reduced = prefersReducedMotion();
    if (role) {
      if (role !== lastRole.current) scroller.current?.scrollTo(0, 0);
      lastRole.current = role;
      if (!isOpen.current) {
        isOpen.current = true;
        opener.current = currentOpener();
        lenis?.stop();
        t.eventCallback("onReverseComplete", null);
        gsap.set(el, { autoAlpha: 1 });
        if (reduced) t.progress(1);
        else t.play();
        drawer.querySelector<HTMLElement>(".cta-close")?.focus({ preventScroll: true });
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          requestClose();
          return;
        }
        trapTab(e, drawer);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (!isOpen.current) return;
    isOpen.current = false;
    lastRole.current = null;
    if (!contactRef.current) restoreFocus(opener.current);
    const finish = () => {
      gsap.set(el, { autoAlpha: 0 });
      if (!contactRef.current) lenis?.start();
    };
    if (reduced) {
      t.progress(0);
      finish();
    } else {
      t.eventCallback("onReverseComplete", finish);
      t.reverse();
    }
  }, [role]);

  // brand scroll thumb on the right edge of the bio (team-drawer .scroll-indicator)
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
  }, [shown]);

  // job application in the contact drawer, for this role; focus returns to the row / card that opened the role
  const apply = () => {
    const back = opener.current;
    const title = shown?.title;
    onClose();
    openContact({ topic: "careers", role: title, returnFocus: back });
  };

  const r = shown;
  if (!isClient) return null;
  return createPortal(
    <div ref={root} data-theme="dark" className={cn("fixed inset-0 z-[85] flex text-off-white", "co-dark")} style={{ visibility: "hidden", opacity: 0 }} role="dialog" aria-modal inert={!role} aria-label={r?.title}>
      <button type="button" tabIndex={-1} aria-hidden className="overlay absolute inset-0 cursor-pointer bg-black opacity-0" onClick={onClose} />
      <div
        ref={panel}
        data-lenis-prevent
        className="absolute inset-y-0 right-0 z-[1] flex w-full max-w-full flex-col px-4 pt-[calc(16px+var(--cookie-offset,0px))] min-[800px]:w-auto min-[800px]:px-7 min-[800px]:pt-[calc(20px+var(--cookie-offset,0px))]"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(33px)", WebkitBackdropFilter: "blur(33px)" }}
      >
        <div className="relative flex items-center justify-between pb-5">
          <p className="eyebrow flex items-center gap-3">
            <span className="block h-1 w-1 bg-[var(--brand)]" aria-hidden />
            {labels.heading}
          </p>
          <Button variant="secondary" className="cta-close" icon={<Cross />} onClick={onClose}>
            {labels.close}
          </Button>
        </div>
        <div className="relative flex min-h-0 grow flex-col overflow-hidden min-[800px]:grid min-[800px]:grid-cols-[minmax(0,422px)_180px] min-[800px]:gap-7">
          <DashedLine theme="dark" className="top-0" />
          {/* thumb + ctas (right column on desktop, top row on mobile) */}
          <div className="relative flex items-start justify-between gap-4 py-4 min-[800px]:order-1 min-[800px]:flex-col min-[800px]:justify-start min-[800px]:gap-0 min-[800px]:py-0 min-[800px]:pt-6">
            <Tile tone="dark" className="w-[116px] shrink-0 min-[800px]:w-full">
              {r && <Pictogram name={r.art} />}
            </Tile>
            <div className="flex flex-col items-start gap-[6px] min-[800px]:p-4 min-[800px]:pl-0">
              <Button variant="primary" onClick={apply}>
                {labels.apply}
              </Button>
              {r && (
                <ActButton action={{ kind: "href", href: `mailto:${email}?subject=${encodeURIComponent(r.title)}` }} icon={<DiagArrow />}>
                  {labels.email}
                </ActButton>
              )}
            </div>
          </div>
          <div className="relative flex min-h-0 grow flex-col overflow-hidden">
            <DashedLine theme="dark" direction="vertical" className="right-0 hidden min-[800px]:block" />
            <div ref={scroller} className={cn("min-h-0 flex-1 overflow-y-auto pt-5 min-[800px]:pt-6", "co-scroller")}>
              {r && (
                <>
                  <h2 className="text-[24px] font-medium leading-[1.4] tracking-[-0.01em] min-[800px]:text-[32px] min-[800px]:leading-[1.16]">{r.title}</h2>
                  <p className="eyebrow mt-3 text-[var(--c-sub)]">
                    {r.teamLabel} · {r.location} · {r.typeLabel}
                  </p>
                  <div className="mt-5 pb-[60px] text-[14px] font-medium leading-[1.35] min-[800px]:mt-6 min-[800px]:pr-5">
                    <h3 className="text-[16px] text-off-white">{labels.about}</h3>
                    <p className="mt-2 text-off-white/75">{r.summary}</p>
                    <h3 className="mt-6 text-[16px] text-off-white">{labels.do}</h3>
                    <ul className="mt-2 space-y-1.5 text-off-white/75">
                      {r.do.map((x) => (
                        <li key={x} className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:bg-[var(--brand)]">
                          {x}
                        </li>
                      ))}
                    </ul>
                    <h3 className="mt-6 text-[16px] text-off-white">{labels.bring}</h3>
                    <ul className="mt-2 space-y-1.5 text-off-white/75">
                      {r.bring.map((x) => (
                        <li key={x} className="relative pl-4 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:bg-[var(--brand)]">
                          {x}
                        </li>
                      ))}
                    </ul>
                    <p className="eyebrow mt-8 text-[var(--c-sub)]">{labels.note.replace("{email}", email)}</p>
                  </div>
                </>
              )}
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 w-[2px]" aria-hidden>
              <span ref={thumb} className="absolute w-full bg-[var(--brand)] opacity-0" />
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
