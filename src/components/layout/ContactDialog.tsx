"use client";
import { useEffect, useEffectEvent, useId, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useContact } from "./ContactContext";
import { Button, Cross } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import DashedLine from "@/components/ui/DashedLine";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { LIMITS, TOPICS, validateContact, type Topic } from "@/lib/forms";
import { Field, Honeypot, NOTE, RED_ON_LIGHT, formValues, mailto, useFormSubmit } from "@/lib/form-client";
import { currentOpener, restoreFocus, trapTab } from "@/lib/focus-trap";

/**
 * Contact drawer, choreographed like Sharplink's team drawer (/about): the panel slides in from the right over 0.6 s
 * power4.inOut while a black overlay fades to 0.6 (0.6 s circ.inOut); closing plays the same timeline backwards.
 * While it is open Lenis is stopped and the header, main and footer are inert; focus lands on the close button as the
 * slide starts, Tab stays in the panel, Esc closes, and focus goes back to the opener.
 * `open({ topic: "careers", role })` (careers "Apply") turns it into a job application: role line, CV / portfolio link.
 */
export default function ContactDialog() {
  const t = useTranslations("contact");
  const tf = useTranslations("forms");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const { isOpen, request, close } = useContact();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const formEl = useRef<HTMLFormElement>(null);
  const resultEl = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const shown = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const inerted = useRef<HTMLElement[]>([]);
  const armed = useRef(false);
  const titleId = useId();
  const needId = useId();
  const { status, errors, submit, reset, markStart, edited } = useFormSubmit("/api/contact", formEl);
  const [formKey, setFormKey] = useState(0);
  const [need, setNeed] = useState<Topic>("build");
  const [role, setRole] = useState("");
  const [applied, setApplied] = useState(request);
  if (request !== applied) {
    // a new open() call: preselect what it asks for (typed values stay)
    setApplied(request);
    setNeed(request.topic ?? "build");
    setRole(request.topic === "careers" ? (request.role ?? "") : "");
  }

  const careers = need === "careers";
  const sending = status === "sending";
  const failed = status === "error" || status === "limited";
  const done = status === "sent" || status === "later";
  const inbox = careers ? site.careersEmail : site.email;

  useGSAP(
    () => {
      const el = root.current;
      const drawer = panel.current;
      if (!el || !drawer) return;
      tl.current = gsap
        .timeline({ paused: true })
        .fromTo(el.querySelector(".overlay"), { opacity: 0 }, { opacity: 0.6, duration: 0.6, ease: "circ.inOut" }, 0)
        .fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: "power4.inOut" }, 0);
    },
    { scope: root },
  );

  const returnTarget = useEffectEvent(() => request.returnFocus ?? null);
  // closed after a send: back to an empty form for next time
  const onClosed = useEffectEvent(() => {
    if (status !== "sent" && status !== "later") return;
    reset();
    setFormKey((k) => k + 1);
    armed.current = false;
  });

  useEffect(() => {
    const el = root.current;
    const drawer = panel.current;
    const t = tl.current;
    if (!el || !drawer || !t) return;
    const lenis = getLenis();
    const reduced = prefersReducedMotion();
    if (isOpen) {
      if (!shown.current) {
        shown.current = true;
        opener.current = returnTarget() ?? currentOpener();
        lenis?.stop();
        inerted.current = [...document.querySelectorAll<HTMLElement>("body > header, body > main, body > footer")].filter((n) => !n.inert);
        inerted.current.forEach((n) => (n.inert = true));
        t.eventCallback("onReverseComplete", null);
        gsap.set(el, { autoAlpha: 1 }); // visible before the slide starts, so focus can move in now
        if (reduced) t.progress(1);
        else t.play();
        closeBtn.current?.focus({ preventScroll: true });
        if (!armed.current) {
          markStart();
          armed.current = true;
        }
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          return;
        }
        trapTab(e, drawer);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (!shown.current) return;
    shown.current = false;
    inerted.current.forEach((n) => (n.inert = false));
    inerted.current = [];
    restoreFocus(opener.current);
    opener.current = null;
    const finish = () => {
      gsap.set(el, { autoAlpha: 0 });
      lenis?.start();
      onClosed();
    };
    if (reduced) {
      t.progress(0);
      finish();
    } else {
      t.eventCallback("onReverseComplete", finish);
      t.reverse();
    }
  }, [isOpen, close, markStart]);

  // the form unmounts on a result: move focus to the message so it is read and Tab keeps working
  useEffect(() => {
    if (done) resultEl.current?.focus({ preventScroll: true });
  }, [done]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    await submit({ ...formValues(e.currentTarget), need, role: careers ? role : "", locale, page: window.location.pathname }, validateContact);
  }

  return (
    // inert (not aria-hidden) while closed or closing: focus is still on the close button when it flips, and inert
    // drops it cleanly before the opener gets it back
    <div ref={root} className="fixed inset-0 z-[90] invisible opacity-0" inert={!isOpen} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" aria-label={tn("close")} className="overlay absolute inset-0 bg-black opacity-0" onClick={close} tabIndex={-1} />
      <div
        ref={panel}
        tabIndex={-1}
        // pt: the cookie banner (fixed, top) pushes fixed UI down by --cookie-offset, like the header and the menu
        className="panel absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col bg-paper pt-[var(--cookie-offset,0px)] text-ink outline-none"
        data-lenis-prevent
      >
        <div className="relative flex items-center justify-between px-5 py-4 sm:px-7 sm:py-5">
          <p className="eyebrow flex items-center gap-3 text-ink/70">
            <span className="block h-1 w-1 bg-green-400" aria-hidden />
            Linse
          </p>
          <Button ref={closeBtn} type="button" variant="secondary" onClick={close} aria-label={tn("close")} icon={<Cross />} />
          <DashedLine className="bottom-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-10 pt-7 sm:px-7">
          <h2 id={titleId} className="text-[clamp(28px,3vw,40px)] font-medium leading-[1.1] tracking-[-0.03em]">
            {careers ? t("careers.title") : t("title")}
          </h2>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-[1.45] text-ink/70">{careers ? t("careers.sub") : t("sub")}</p>
          {careers && role && (
            <p className="eyebrow mt-5 flex items-center gap-3 text-ink/70">
              <span className="block h-1 w-1 shrink-0 bg-green-400" aria-hidden />
              <span>
                {t("careers.role")}: <span className="text-ink">{role}</span>
              </span>
            </p>
          )}

          {done ? (
            <div ref={resultEl} tabIndex={-1} role="status" className="relative mt-8 bg-green-100 p-6 text-green-900 outline-none">
              <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-green-400" aria-hidden />
              <LogoMark className="mb-4 h-8 text-green-600" />
              <p className="text-lg">
                {status === "sent" ? (careers ? t("careers.sent") : t("sent")) : t.rich("later", { email: inbox, link: mailto(inbox) })}
              </p>
            </div>
          ) : (
            <form key={formKey} ref={formEl} method="post" noValidate onSubmit={onSubmit} aria-busy={sending} className="relative mt-8 grid gap-4 sm:grid-cols-2">
              <Field name="name" label={t("name")} autoComplete="name" required maxLength={LIMITS.name} error={errors.name} onEdit={edited} />
              <Field
                name="email"
                label={careers ? t("careers.email") : t("email")}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={LIMITS.email}
                error={errors.email}
                onEdit={edited}
              />
              {careers ? (
                <Field name="cvUrl" label={t("cvUrl")} inputMode="url" autoComplete="url" maxLength={LIMITS.url} placeholder="https://" error={errors.cvUrl} onEdit={edited} />
              ) : (
                <Field name="company" label={t("company")} autoComplete="organization" maxLength={LIMITS.company} error={errors.company} onEdit={edited} />
              )}
              <div className="grid content-start gap-1.5">
                <label htmlFor={needId} className="eyebrow text-ink/60">
                  {t("need")}
                </label>
                <span className="relative">
                  <select
                    id={needId}
                    name="need"
                    value={need}
                    onChange={(e) => {
                      setNeed(e.target.value as Topic);
                      edited("need");
                    }}
                    aria-invalid={errors.need ? true : undefined}
                    aria-describedby={errors.need ? `${needId}-error` : undefined}
                    className="field pr-8 aria-[invalid=true]:border-[#d32f2f]!"
                  >
                    {TOPICS.map((k) => (
                      <option key={k} value={k}>
                        {t(`needs.${k}`)}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px]" aria-hidden>
                    ▼
                  </span>
                </span>
                {errors.need && (
                  <p id={`${needId}-error`} className={cn(NOTE, RED_ON_LIGHT)}>
                    {tf("errors.invalid")}
                  </p>
                )}
              </div>
              <Field
                name="message"
                label={careers ? t("careers.message") : t("message")}
                multiline
                rows={4}
                className="sm:col-span-2"
                error={errors.message}
                onEdit={edited}
              />
              <Honeypot />
              <div className="sm:col-span-2">
                <p role="alert" className={cn(NOTE, RED_ON_LIGHT, failed && "mb-4")}>
                  {status === "error" && tf.rich("error", { email: inbox, link: mailto(inbox) })}
                  {status === "limited" && tf.rich("limited", { email: inbox, link: mailto(inbox) })}
                </p>
                <Button type="submit" variant="primary" disabled={sending}>
                  {sending ? tf("sending") : failed ? tf("retry") : t("send")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
