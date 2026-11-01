"use client";
import { useId, useRef, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { LIMITS, validateNewsletter } from "@/lib/forms";
import { CheckBox16, Honeypot, NOTE, RED_ON_DARK, formValues, mailto, useFormSubmit } from "@/lib/form-client";

/**
 * The footer sign-up, after Sharplink's .newsletter-form: the field and SIGN UP in one row, the error message and the
 * confirmation icon inside the form (so they sit above the dashed rule Footer.tsx draws under the wrapper, whose
 * `[&>form]` rules give the 66px row / 19px field — keep the form a direct child). Submitting shows "Loading..." with
 * field and button at 0.6; on success the field empties, its placeholder becomes the confirmation and a 16px check
 * replaces the button (margin-left auto); errors are a red 13px narrow uppercase line, 12px above and below.
 */
export default function FooterNewsletter() {
  const t = useTranslations("footer.newsletter");
  const tf = useTranslations("forms");
  const locale = useLocale();
  const formEl = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const { status, errors, submit, edited } = useFormSubmit("/api/newsletter", formEl);
  const sending = status === "sending";
  const sent = status === "sent";
  const error = errors.email
    ? tf(`errors.${errors.email}`, { max: LIMITS.email })
    : status === "error"
      ? tf("newsletter.error")
      : status === "limited"
        ? tf("newsletter.limited")
        : null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const outcome = await submit({ ...formValues(e.currentTarget), locale, source: "footer", page: window.location.pathname }, validateNewsletter);
    if (outcome === "sent" && input.current) input.current.value = "";
  }

  return (
    <form ref={formEl} method="post" noValidate onSubmit={onSubmit} className="field-line relative mt-10 flex flex-wrap content-center items-center gap-2 pb-2">
      <label htmlFor={id} className="sr-only">
        {t("placeholder")}
      </label>
      <input
        ref={input}
        id={id}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        maxLength={LIMITS.email}
        placeholder={sent ? t("done") : t("placeholder")}
        disabled={sending}
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={`${id}-note`}
        onInput={() => edited("email")}
        className="h-10 min-w-0 flex-1 bg-transparent text-[clamp(16px,1.3vw,20px)] text-off-white disabled:opacity-60"
      />
      <Honeypot />
      {sent ? (
        <CheckBox16 className="ml-auto" />
      ) : (
        <Button variant="secondary" type="submit" disabled={sending}>
          {sending ? tf("loading") : t("button")}
        </Button>
      )}
      {/* 12px above and below (the form's 8px gap + 4px); out of the flow while empty so the 66px row is untouched */}
      <p id={`${id}-note`} role="alert" className={cn("w-full", NOTE, RED_ON_DARK, error ? "mb-3 mt-1" : "absolute")}>
        {error}
      </p>
      {/* the confirmation lives in the placeholder: said to screen readers here; the fallback is shown */}
      <p role="status" className={status === "later" ? cn("mb-3 mt-1 w-full text-off-white/60", NOTE) : "sr-only"}>
        {sent && t("done")}
        {status === "later" && tf.rich("newsletter.later", { email: site.email, link: mailto(site.email) })}
      </p>
    </form>
  );
}
