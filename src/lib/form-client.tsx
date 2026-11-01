"use client";
import { useCallback, useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { HONEYPOT, STARTED_AT, limitOf, type FieldError, type FieldErrors, type FormResponse, type Validation } from "./forms";

/**
 * Client side of the site forms: the submit state machine, a labelled field with its error, the honeypot and the
 * small pieces the forms share. Endpoint contract and validation live in ./forms.
 */

/** idle → sending → sent (delivered) | later (accepted, not delivered: show the e-mail fallback) | error / limited
 * (network, server, rate limit: the form stays filled for a retry). Field errors (client or 400) go back to idle. */
export type Status = "idle" | "sending" | "sent" | "later" | "error" | "limited";
export type Outcome = "sent" | "later" | "invalid" | "error" | "limited";

type Payload = Record<string, unknown>;

export function useFormSubmit(endpoint: string, form: RefObject<HTMLFormElement | null>) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const startedAt = useRef(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const focusNext = useRef<"invalid" | "restore" | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // after an answer: first invalid field, or back to where focus was when the field / button got disabled
  useEffect(() => {
    const el = form.current;
    const want = focusNext.current;
    if (!el || !want || status === "sending") return;
    focusNext.current = null;
    if (want === "invalid") {
      el.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    if (document.activeElement && document.activeElement !== document.body) return;
    // after a success on a touch screen, focusing the input would only pop the keyboard back up
    if ((status === "sent" || status === "later") && window.matchMedia("(pointer: coarse)").matches) return;
    const prev = lastFocus.current;
    const usable = prev && prev.isConnected && !prev.matches(":disabled") && el.contains(prev);
    (usable ? prev : el.querySelector<HTMLElement>('input:not([type="hidden"]):not([tabindex="-1"]):not(:disabled)'))?.focus({ preventScroll: true });
  }, [status, errors, form]);

  const submit = useCallback(
    async (payload: Payload, validate?: (raw: Payload) => Validation<unknown>): Promise<Outcome> => {
      const local = validate?.(payload);
      if (local && !local.ok) {
        focusNext.current = "invalid";
        setErrors(local.fields);
        setStatus("idle");
        return "invalid";
      }
      lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      focusNext.current = "restore";
      setErrors({});
      setStatus("sending");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, [STARTED_AT]: startedAt.current }),
        });
        const body = (await res.json().catch(() => null)) as FormResponse | null;
        if (res.ok && body?.ok) {
          const done = body.delivered ? "sent" : "later";
          setStatus(done);
          return done;
        }
        if (res.status === 400 && body && !body.ok && body.error === "validation") {
          focusNext.current = "invalid";
          setErrors(body.fields);
          setStatus("idle");
          return "invalid";
        }
        if (res.status === 429) {
          setStatus("limited");
          return "limited";
        }
      } catch {
        // network error: same as a server error
      }
      setStatus("error");
      return "error";
    },
    [endpoint],
  );

  /** validate without sending (a multi-step form's "Continue"): shows the field errors and returns whether it passed */
  const check = useCallback((payload: Payload, validate: (raw: Payload) => Validation<unknown>) => {
    const local = validate(payload);
    if (local.ok) {
      setErrors({});
      return true;
    }
    focusNext.current = "invalid";
    setErrors(local.fields);
    setStatus("idle");
    return false;
  }, []);
  /** back to idle without errors (the fill timer keeps running: call markStart for a brand-new form) */
  const reset = useCallback(() => {
    setStatus("idle");
    setErrors({});
  }, []);
  /** restart the fill timer: a fresh form, or a drawer holding the form opens */
  const markStart = useCallback(() => {
    startedAt.current = Date.now();
  }, []);
  /** the visitor edited a field: drop its error (and leave a finished state so the button comes back) */
  const edited = useCallback((name: string) => {
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
    setStatus((s) => (s === "sent" || s === "later" || s === "error" || s === "limited" ? "idle" : s));
  }, []);

  return { status, errors, submit, check, reset, markStart, edited };
}

/** Form values as a plain object (FormData strings). */
export const formValues = (form: HTMLFormElement): Payload => Object.fromEntries(new FormData(form));

/** Error lines: Sharplink .error-message (narrow 13px / 1.4, 500, 1.04px tracking, uppercase). #f44336 is theirs, on
 * dark; on light it is one Material step darker (#d32f2f) so 13px text keeps a 4.5:1 contrast. */
export const NOTE = "font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em]";
export const RED_ON_DARK = "text-[#f44336]";
export const RED_ON_LIGHT = "text-[#d32f2f]";

/** Rich-text tag renderer for `<link>{email}</link>` in messages. */
export const mailto = (address: string) =>
  function MailLink(chunks: ReactNode) {
    return (
      <a href={`mailto:${address}`} className="underline underline-offset-2">
        {chunks}
      </a>
    );
  };

type FieldProps = {
  label: string;
  name: string;
  error?: FieldError;
  onEdit?: (name: string) => void;
  multiline?: boolean;
  rows?: number;
  className?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  placeholder?: string;
};

/** Eyebrow label over a `.field` box; a field error shows under it and is tied to the input (aria-describedby). */
export function Field({ label, name, error, onEdit, multiline, rows, className, ...input }: FieldProps) {
  const t = useTranslations("forms.errors");
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    className: "field aria-[invalid=true]:border-[#d32f2f]!",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    onInput: onEdit ? () => onEdit(name) : undefined,
  };
  return (
    // content-start: a two-line error in the neighbouring cell must not push this input down
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="eyebrow text-ink/60">
        {label}
      </label>
      {multiline ? <textarea rows={rows} {...shared} required={input.required} maxLength={input.maxLength} /> : <input {...shared} {...input} />}
      {error && (
        <p id={errorId} className={cn(NOTE, RED_ON_LIGHT)}>
          {t(error, { max: limitOf(name) ?? 0 })}
        </p>
      )}
    </div>
  );
}

/** Off-screen trap field (see HONEYPOT). Out of the tab order and hidden from assistive tech. */
export function Honeypot() {
  return (
    <div className="sr-only" aria-hidden>
      <label>
        Website
        <input type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** Sharplink's 16px check (newsletter success), stroke 1.25, in a 16px box. */
export function CheckBox16({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center", className)} aria-hidden>
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.25">
        <path d="M13 4 5.86 12 3 8.8" />
      </svg>
    </span>
  );
}
