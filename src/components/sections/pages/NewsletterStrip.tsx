"use client";
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { Button, Cross } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { LIMITS, NEWSLETTER_TOPICS, limitOf, validateNewsletter, type NewsletterTopic } from "@/lib/forms";
import { CheckBox16, Honeypot, NOTE, RED_ON_DARK, RED_ON_LIGHT, formValues, mailto, useFormSubmit } from "@/lib/form-client";
import { restoreFocus, trapTab } from "@/lib/focus-trap";

type Theme = "dark" | "light";

const FIELDS = [
  { name: "email", type: "email", autoComplete: "email", inputMode: "email", max: LIMITS.email, required: true },
  { name: "firstName", type: "text", autoComplete: "given-name", inputMode: "text", max: LIMITS.name, required: false },
  { name: "lastName", type: "text", autoComplete: "family-name", inputMode: "text", max: LIMITS.name, required: false },
  { name: "company", type: "text", autoComplete: "organization", inputMode: "text", max: LIMITS.company, required: false },
] as const;

/** the CTA's brand icon box (Sharplink btn-accent) */
const ACCENT = { "--icon-bg": "var(--brand)", "--icon-fg": "var(--black)", "--icon-bg-hover": "var(--brand)" } as CSSProperties;
const isPhone = () => window.matchMedia("(max-width: 799px)").matches;

/**
 * Sharplink's investors-email-alert, measured on sharplink.com/news and /investors.
 *
 * - `inline` (news index, dark; articles, light): a surface box, narrow eyebrow, 16px title, then four 32px fields
 *   (Email*, First name, Last name, Company; 167px wide, 4px apart) with CONTINUE bottom-right (glass label + brand
 *   arrow box). Continue checks the fields and switches instantly to step 2: "Configure what you'll want to receive"
 *   with toggle chips (34px, narrow uppercase; checked = off-white fill), a helper line, an Unsubscribe row, SUBSCRIBE,
 *   and a × top-right that goes back to step 1. Phones show the title and an arrow-only button that opens the form.
 * - `fixed` (careers, support): the same form in a glass bar fixed to the bottom of the screen (blur 20, 28px side
 *   margins, 120px tall at desktop), no eyebrow. It fades in once mounted (0.8s power3.out) and out (0.4s power2.out)
 *   when the end marker it leaves in the page reaches the bottom of the screen, back in when scrolling up. Phones get
 *   a 66px bar (title + arrow) that opens a full-height glass panel under the header and stops Lenis.
 *
 * Posts to /api/newsletter. Sending reads "Loading..." with fields and buttons at 0.6; on success the fields empty, the
 * e-mail placeholder becomes the confirmation and a 16px check replaces the button; errors are a red 13px narrow
 * uppercase line under the fields.
 */
export default function NewsletterStrip({ theme = "dark", className, variant = "inline" }: { theme?: Theme; className?: string; variant?: "inline" | "fixed" }) {
  return variant === "fixed" ? <NewsletterBar /> : <InlineStrip theme={theme} className={className} />;
}

function InlineStrip({ theme, className }: { theme: Theme; className?: string }) {
  const t = useTranslations("newsPage.newsletter");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dark = theme === "dark";
  return (
    <div data-theme={theme} className={cn("relative", dark ? "bg-[rgba(238,238,240,0.06)] text-off-white" : "bg-[rgba(11,20,17,0.035)] text-ink", className)}>
      <div className="relative min-h-[126px] p-5">
        <p className={cn("flex items-center gap-2 pb-[17px] pr-4 pt-1 font-narrow text-[12px] uppercase leading-[1.4] tracking-[0.08em]", dark ? "text-off-white/45" : "text-ink/55")}>
          <span className="block h-[6px] w-[6px] bg-green-400" aria-hidden />
          {t("eyebrow")}
        </p>
        <Signup variant="strip" theme={theme} titleId={titleId} open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}

function NewsletterBar() {
  const wrap = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // in once mounted (fonts ready), out when the end marker reaches the bottom of the screen, back when scrolling up
  useGSAP(
    () => {
      const el = wrap.current;
      const end = marker.current;
      if (!el || !end) return;
      const reduced = prefersReducedMotion();
      let ready = false;
      let past = end.getBoundingClientRect().top <= window.innerHeight;
      let alive = true;
      const show = () => gsap.to(el, { autoAlpha: 1, duration: reduced ? 0 : 0.8, ease: "power3.out", overwrite: true });
      const hide = () => gsap.to(el, { autoAlpha: 0, duration: reduced ? 0 : 0.4, ease: "power2.out", overwrite: true });
      ScrollTrigger.create({
        trigger: end,
        start: "top bottom",
        onEnter: () => {
          past = true;
          if (ready && !openRef.current) hide();
        },
        onLeaveBack: () => {
          past = false;
          if (ready) show();
        },
      });
      (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!alive) return;
        ready = true;
        if (!past) show();
      });
      return () => {
        alive = false;
      };
    },
    { scope: wrap },
  );

  // phone panel: Lenis stops, focus moves to × and stays in the panel, Esc / a wider screen closes it
  useEffect(() => {
    if (!open) return;
    const el = wrap.current;
    const lenis = getLenis();
    // Safari does not focus a tapped button: fall back to the arrow that opened the panel
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : el?.querySelector<HTMLElement>('button[type="submit"]');
    lenis?.stop();
    el?.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (el) trapTab(e, el);
    };
    const wide = window.matchMedia("(min-width: 800px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      lenis?.start();
      restoreFocus(opener);
    };
  }, [open]);

  return (
    <>
      {/* end marker: the bar leaves when this (the end of the page content, before the footer) reaches the bottom */}
      <div ref={marker} className="h-0" aria-hidden />
      {/* above the page sections (main's stacking context), below the header (z 80), the menu and the drawers */}
      <div
        ref={wrap}
        data-theme="dark"
        data-newsletter-bar=""
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-labelledby={open ? titleId : undefined}
        data-lenis-prevent={open || undefined}
        className={cn(
          "invisible fixed inset-x-0 bottom-0 z-50 p-4 opacity-0 min-[800px]:px-7",
          open ? "top-[calc(58px+var(--cookie-offset,0px))] overflow-y-auto overscroll-contain bg-[var(--surface-darker-tertiary)] pt-[50px] backdrop-blur-[20px]" : "pointer-events-none",
        )}
      >
        <div className={cn("pointer-events-auto relative text-off-white min-[800px]:p-5", !open && "bg-[var(--surface-darker-tertiary)] backdrop-blur-[20px]")}>
          <Signup variant="bar" theme="dark" titleId={titleId} open={open} setOpen={setOpen} />
        </div>
      </div>
    </>
  );
}

function Signup({ variant, theme, titleId, open, setOpen }: { variant: "strip" | "bar"; theme: Theme; titleId: string; open: boolean; setOpen: (v: boolean) => void }) {
  const t = useTranslations("newsPage.newsletter");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const formEl = useRef<HTMLFormElement>(null);
  const chipsEl = useRef<HTMLFieldSetElement>(null);
  const toTopics = useRef(false);
  const uid = useId();
  const { status, errors, submit, check, reset, edited } = useFormSubmit("/api/newsletter", formEl);
  const [step, setStep] = useState<0 | 1>(0);
  const [topics, setTopics] = useState<NewsletterTopic[]>([]);
  const [topicError, setTopicError] = useState(false);
  const [action, setAction] = useState<"subscribe" | "unsubscribe">("subscribe");
  const dark = theme === "dark";
  const bar = variant === "bar";
  const sending = status === "sending";
  const subscribed = status === "sent" && action === "subscribe";
  const red = dark ? RED_ON_DARK : RED_ON_LIGHT;
  const badField = FIELDS.find((f) => errors[f.name])?.name;
  const error = badField
    ? tf(`errors.${errors[badField]}`, { max: limitOf(badField) ?? 0 })
    : status === "error"
      ? tf("newsletter.error")
      : status === "limited"
        ? tf("newsletter.limited")
        : null;

  // step 2 opened from Continue: carry on at the first topic
  useEffect(() => {
    if (step !== 1 || !toTopics.current) return;
    toTopics.current = false;
    chipsEl.current?.querySelector("input")?.focus({ preventScroll: true });
  }, [step]);

  const values = () => ({ ...formValues(formEl.current!), locale, source: bar ? "bar" : "strip", page: window.location.pathname });
  const clearFields = () => formEl.current?.querySelectorAll<HTMLInputElement>("input[type=email], input[type=text]").forEach((i) => (i.value = ""));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    if (!open && isPhone()) {
      setOpen(true); // phone: the arrow opens the form
      return;
    }
    if (step === 0) {
      if (!check(values(), validateNewsletter)) return;
      toTopics.current = true;
      setStep(1);
      return;
    }
    if (!topics.length) {
      setTopicError(true);
      chipsEl.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }
    setAction("subscribe");
    const outcome = await submit({ ...values(), topics, action: "subscribe" }, validateNewsletter);
    if (outcome === "sent") clearFields();
  }

  async function unsubscribe() {
    if (sending) return;
    setAction("unsubscribe");
    setTopicError(false);
    const outcome = await submit({ ...values(), action: "unsubscribe" }, validateNewsletter);
    if (outcome === "sent") clearFields();
  }

  function close() {
    setStep(0);
    setTopicError(false);
    if (!sending) reset();
    if (open) setOpen(false);
  }

  const toggle = (k: NewsletterTopic, on: boolean) => {
    setTopics((list) => (on ? [...new Set([...list, k])] : list.filter((x) => x !== k)));
    setTopicError(false);
    edited("topics");
  };

  const input = cn(
    "h-8 w-full min-w-0 pl-3 text-[16px] font-medium leading-[1.35] outline outline-1 transition-[outline-color] duration-200 disabled:opacity-60 min-[800px]:text-[14px]",
    dark
      ? "bg-[var(--surface-darker-tertiary)] text-off-white outline-[rgba(242,242,242,0.15)] placeholder:text-[rgba(242,242,242,0.6)] focus:outline-off-white aria-[invalid=true]:outline-[#f44336]"
      : "bg-[var(--surface-darker)] text-black outline-[rgba(0,0,0,0.15)] placeholder:text-[var(--black-subtle)] focus:outline-ink aria-[invalid=true]:outline-[#d32f2f]",
  );
  const chip = cn(
    "relative flex h-[34px] cursor-pointer select-none items-center gap-3 px-3 font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em] transition-colors duration-200 has-[:checked]:bg-off-white has-[:checked]:text-black has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:outline-[var(--brand)]",
    dark ? "bg-[var(--surface-darker-tertiary)] hover:bg-[var(--hover-on-light)]" : "bg-[var(--surface-darker)] hover:bg-[var(--hover-on-light-secondary)]",
  );
  const box = cn(
    "peer size-[18px] shrink-0 cursor-pointer appearance-none border checked:border-[var(--brand)] checked:bg-[var(--brand)] disabled:cursor-not-allowed",
    dark ? "border-[rgba(243,243,243,0.15)]" : "border-[rgba(0,0,0,0.15)]",
  );
  const ctaLabel = sending && action === "subscribe" ? tf("loading") : step === 1 ? t("submit") : t("continue");

  return (
    <form ref={formEl} method="post" noValidate onSubmit={onSubmit} aria-labelledby={titleId}>
      <p
        id={titleId}
        className={cn(
          "font-medium leading-[1.35]",
          bar
            ? cn("flex items-center text-[14px] min-[800px]:mb-4 min-[800px]:min-h-8 min-[800px]:p-0 min-[800px]:pr-4 min-[800px]:text-[16px]", open ? "min-h-8 pr-12" : "min-h-[66px] p-4 pr-14")
            : "min-h-8 pr-4 text-[16px] min-[800px]:mb-4",
        )}
      >
        {t("title")}
      </p>

      {(step === 1 || open) && (
        <Button
          type="button"
          variant="secondary"
          data-close=""
          icon={<Cross />}
          aria-label={t("close")}
          onClick={close}
          className={cn("absolute!", bar && open ? "right-0 top-0" : "right-5 top-5", step === 0 && "min-[800px]:hidden")}
        />
      )}

      <div
        className={cn(
          "flex flex-col gap-[10px] pb-7 pt-[22px] min-[800px]:flex-row min-[800px]:gap-1 min-[800px]:pb-0 min-[800px]:pr-[150px] min-[800px]:pt-0",
          step === 1 && "min-[800px]:pb-3",
          !open && "max-[799px]:hidden",
        )}
      >
        {FIELDS.map((f) => (
          <div key={f.name} className="min-[800px]:w-[167px] min-[800px]:min-w-0 min-[800px]:shrink">
            <label htmlFor={`${uid}-${f.name}`} className="sr-only">
              {t(`fields.${f.name}`)}
            </label>
            <input
              id={`${uid}-${f.name}`}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              inputMode={f.inputMode}
              maxLength={f.max}
              required={f.required}
              placeholder={f.name === "email" ? (subscribed ? t("done") : `${t("fields.email")}*`) : t(`fields.${f.name}`)}
              disabled={sending}
              aria-invalid={errors[f.name] ? true : undefined}
              aria-describedby={`${uid}-note`}
              onInput={() => edited(f.name)}
              className={input}
            />
          </div>
        ))}
      </div>
      <p id={`${uid}-note`} role="alert" className={cn(NOTE, red, error && "mt-2")}>
        {error}
      </p>

      {step === 1 && (
        <>
          <fieldset ref={chipsEl} className="min-w-0" aria-describedby={`${uid}-help`}>
            <legend className="mb-3 mt-3 text-[14px] font-medium leading-[1.35] min-[800px]:text-[16px]">{t("configure")}</legend>
            <div className="flex flex-col gap-2 min-[800px]:flex-row min-[800px]:flex-wrap min-[800px]:gap-[2px]">
              {NEWSLETTER_TOPICS.map((k) => (
                <label key={k} className={chip}>
                  <input type="checkbox" name="topics" value={k} checked={topics.includes(k)} disabled={sending} onChange={(e) => toggle(k, e.target.checked)} className={box} />
                  <span className="pointer-events-none absolute left-3 top-1/2 hidden size-[18px] -translate-y-1/2 items-center justify-center text-black peer-checked:flex" aria-hidden>
                    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M13 4 5.86 12 3 8.8" />
                    </svg>
                  </span>
                  {t(`topics.${k}`)}
                </label>
              ))}
            </div>
            <p id={`${uid}-help`} className={cn("mt-2 text-[14px] leading-[1.35] min-[800px]:text-[16px]", dark ? "text-off-white/60" : "text-ink/60")}>
              {t("helper")}
            </p>
            <p role="alert" className={cn(NOTE, red, (topicError || errors.topics) && "mt-2")}>
              {topicError ? t("helper") : errors.topics ? tf("errors.invalid") : null}
            </p>
          </fieldset>
          <div className="flex flex-col items-start gap-3 pt-6 text-[14px] font-medium leading-[1.35] min-[800px]:text-[16px]">
            <p>{t("unsubscribeText")}</p>
            <Button type="button" variant={dark ? "tertiary" : "secondary"} arrow={false} disabled={sending} onClick={unsubscribe}>
              {sending && action === "unsubscribe" ? tf("loading") : t("unsubscribe")}
            </Button>
          </div>
        </>
      )}

      {/* subscribed: the confirmation is the e-mail placeholder, said to screen readers here; otherwise a visible line */}
      <p role="status" className={status === "later" || (status === "sent" && action === "unsubscribe") ? cn(NOTE, "mt-2", dark ? "text-off-white/60" : "text-ink/60") : "sr-only"}>
        {subscribed && t("done")}
        {status === "sent" && action === "unsubscribe" && t("unsubscribed")}
        {status === "later" && (action === "unsubscribe" ? t.rich("unsubLater", { email: site.email, link: mailto(site.email) }) : tf.rich("newsletter.later", { email: site.email, link: mailto(site.email) }))}
      </p>
      <Honeypot />

      <div
        className={cn(
          "flex justify-end min-[800px]:absolute min-[800px]:bottom-5 min-[800px]:right-5",
          open ? "max-[799px]:mt-6" : cn("max-[799px]:absolute", bar ? "max-[799px]:bottom-4 max-[799px]:right-4" : "max-[799px]:bottom-5 max-[799px]:right-5"),
        )}
      >
        {subscribed ? (
          <CheckBox16 className="my-[9px] mr-2" />
        ) : (
          <Button
            type="submit"
            variant={dark ? "tertiary" : "secondary"}
            style={ACCENT}
            disabled={sending}
            aria-label={ctaLabel}
            // phone, closed: arrow only (the first span is the label; underscores would read as spaces in a variant)
            className={cn(open ? "max-[799px]:w-full" : "max-[799px]:[&>span:first-child]:hidden!")}
          >
            {ctaLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
