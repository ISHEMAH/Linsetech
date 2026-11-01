"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { LIMITS, PROJECT_TOPICS, validateContact } from "@/lib/forms";
import { Field, Honeypot, NOTE, RED_ON_LIGHT, formValues, mailto, useFormSubmit } from "@/lib/form-client";

/**
 * The contact drawer's brief form, laid out for the page. Same contract as ContactDialog: JSON POST to /api/contact.
 * Sending → sent (delivered) or the "write to us" fallback (not delivered); field errors show under each field, and
 * network / server errors keep the values for a retry.
 */
export default function ContactForm() {
  const t = useTranslations("contactPage.form");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const formEl = useRef<HTMLFormElement>(null);
  const resultEl = useRef<HTMLDivElement>(null);
  const needId = useId();
  const [formKey, setFormKey] = useState(0);
  const { status, errors, submit, reset, markStart, edited } = useFormSubmit("/api/contact", formEl);
  const sending = status === "sending";
  const failed = status === "error" || status === "limited";
  const done = status === "sent" || status === "later";

  useEffect(() => {
    if (done) resultEl.current?.focus({ preventScroll: true });
  }, [done]);
  // "Send another message": focus the fresh form's first field
  useEffect(() => {
    if (formKey) formEl.current?.querySelector("input")?.focus({ preventScroll: true });
  }, [formKey]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    await submit({ ...formValues(e.currentTarget), locale, page: window.location.pathname }, validateContact);
  }

  if (done)
    return (
      <div ref={resultEl} tabIndex={-1} className="relative bg-green-100 p-6 text-green-900 outline-none" role="status">
        <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-green-400" aria-hidden />
        <LogoMark className="mb-4 h-8 text-green-600" />
        <p className="max-w-[52ch] text-lg leading-[1.35]">{status === "sent" ? t("sent") : t.rich("later", { email: site.email, link: mailto(site.email) })}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            reset();
            markStart();
            setFormKey((k) => k + 1);
          }}
        >
          {t("again")}
        </Button>
      </div>
    );

  return (
    <form key={formKey} ref={formEl} method="post" noValidate onSubmit={onSubmit} aria-busy={sending} className="relative grid gap-4 sm:grid-cols-2">
      <Field name="name" label={t("name")} autoComplete="name" required maxLength={LIMITS.name} error={errors.name} onEdit={edited} />
      <Field name="email" label={t("email")} type="email" inputMode="email" autoComplete="email" required maxLength={LIMITS.email} error={errors.email} onEdit={edited} />
      <Field name="company" label={t("company")} autoComplete="organization" maxLength={LIMITS.company} error={errors.company} onEdit={edited} />
      <div className="grid content-start gap-1.5">
        <label htmlFor={needId} className="eyebrow text-ink/60">
          {t("need")}
        </label>
        <span className="relative">
          <select
            id={needId}
            name="need"
            onChange={() => edited("need")}
            aria-invalid={errors.need ? true : undefined}
            aria-describedby={errors.need ? `${needId}-error` : undefined}
            className="field pr-8 aria-[invalid=true]:border-[#d32f2f]!"
          >
            {PROJECT_TOPICS.map((k) => (
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
      <Field name="message" label={t("message")} multiline rows={5} className="sm:col-span-2" error={errors.message} onEdit={edited} />
      <Honeypot />
      <div className="sm:col-span-2">
        <p role="alert" className={cn(NOTE, RED_ON_LIGHT, failed && "mb-4")}>
          {status === "error" && tf.rich("error", { email: site.email, link: mailto(site.email) })}
          {status === "limited" && tf.rich("limited", { email: site.email, link: mailto(site.email) })}
        </p>
        <Button type="submit" variant="primary" disabled={sending}>
          {sending ? t("sending") : failed ? tf("retry") : t("send")}
        </Button>
      </div>
    </form>
  );
}
