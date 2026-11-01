import { routing, type Locale } from "@/i18n/routing";

/**
 * The form contract shared by the site forms (contact drawer, /contact, careers, newsletter boxes) and the
 * /api/contact + /api/newsletter handlers: limits, the topic allow-list, the anti-spam field names and the validation
 * both sides run. The client validates for instant per-field errors; the server runs the same code and has the last
 * word. Pure: no Node, React or DOM imports.
 */

/** "What do you need?" options of the project form, plus the job application opened from the careers page. */
export const TOPICS = ["build", "buy", "support", "other", "careers"] as const;
export type Topic = (typeof TOPICS)[number];
export const PROJECT_TOPICS = ["build", "buy", "support", "other"] as const satisfies readonly Topic[];

export const LIMITS = { name: 120, email: 254, company: 160, message: 4000, url: 500, role: 160 } as const;

/** Off-screen input people never see; scripts that fill every field give themselves away. */
export const HONEYPOT = "website";
/** When the form was shown (ms since epoch, client clock). */
export const STARTED_AT = "startedAt";
/** Sent faster than this after the form was shown = a script. */
export const MIN_FILL_MS = 3000;

/** footer = footer sign-up, strip = the box on /news and articles, bar = the fixed bar on /careers and /support */
export const NEWSLETTER_SOURCES = ["footer", "strip", "bar"] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];
/** What a subscriber can choose to receive (the strip / bar chips). The footer sign-up sends none: everything. */
export const NEWSLETTER_TOPICS = ["product", "insights", "press", "careers"] as const;
export type NewsletterTopic = (typeof NEWSLETTER_TOPICS)[number];

export type FieldError = "required" | "email" | "tooLong" | "url" | "invalid";
export type FieldErrors = Partial<Record<string, FieldError>>;

/** What both endpoints answer. `delivered: false` = accepted but not sent anywhere: the UI shows the e-mail fallback. */
export type FormResponse =
  | { ok: true; delivered: boolean }
  | { ok: false; error: "validation"; fields: FieldErrors }
  | { ok: false; error: "bad_request" | "too_large" | "rate_limited" | "server"; retryAfter?: number };

export type ContactData = {
  name: string;
  email: string;
  company: string;
  need: Topic;
  message: string;
  /** careers only: the role applied for and a CV / portfolio link */
  role: string;
  cvUrl: string;
  locale: Locale;
  page: string;
};

export type NewsletterData = {
  action: "subscribe" | "unsubscribe";
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  /** empty = no preference given (footer): all topics */
  topics: NewsletterTopic[];
  locale: Locale;
  source: NewsletterSource | "";
  page: string;
};

export type Validation<T> = { ok: true; data: T } | { ok: false; fields: FieldErrors };

type Raw = Record<string, unknown>;

/** Control characters out (they would end up in mail headers); line breaks and tabs kept only when `multiline`. */
function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  const text = multiline ? value.replace(/\r\n?/g, "\n") : value;
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const control = code < 32 || code === 127 || code === 0x2028 || code === 0x2029;
    out += !control || (multiline && (ch === "\n" || ch === "\t")) ? ch : " ";
  }
  return multiline ? out.trim() : out.replace(/\s+/g, " ").trim();
}

// Bare addresses only: no display names, quotes, comments or lists (the address becomes a Reply-To header).
const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@(?:[^\s@<>()[\]\\,;:".]+\.)+[^\s@<>()[\]\\,;:".]{2,}$/;

function email(value: unknown, fields: FieldErrors): string {
  const v = clean(value);
  if (!v) fields.email = "required";
  else if (v.length > LIMITS.email) fields.email = "tooLong";
  else if (!EMAIL.test(v)) fields.email = "email";
  return v;
}

function text(key: string, value: unknown, max: number, fields: FieldErrors, { required = false, multiline = false } = {}): string {
  const v = clean(value, multiline);
  if (required && !v) fields[key] = "required";
  else if (v.length > max) fields[key] = "tooLong";
  return v;
}

/** http(s) link; a bare "linkedin.com/in/…" gets https:// in front. */
function link(key: string, value: unknown, fields: FieldErrors): string {
  const v = clean(value);
  if (!v) return "";
  if (v.length > LIMITS.url) {
    fields[key] = "tooLong";
    return v;
  }
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    const ok = (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") && !url.username && !url.password;
    if (ok && url.href.length <= LIMITS.url) return url.href;
  } catch {
    // fall through
  }
  fields[key] = "url";
  return v;
}

const isLocale = (v: unknown): v is Locale => typeof v === "string" && (routing.locales as readonly string[]).includes(v);
/** the site path the form was sent from (context for the team), nothing else */
const page = (v: unknown) => (typeof v === "string" && /^\/[\w\-/]{0,200}$/.test(v) ? v : "");

export function validateContact(raw: Raw): Validation<ContactData> {
  const fields: FieldErrors = {};
  const need = clean(raw.need);
  const isTopic = (TOPICS as readonly string[]).includes(need);
  if (!isTopic) fields.need = "invalid";
  const careers = need === "careers";
  const data: ContactData = {
    name: text("name", raw.name, LIMITS.name, fields, { required: true }),
    email: email(raw.email, fields),
    company: careers ? "" : text("company", raw.company, LIMITS.company, fields),
    need: (isTopic ? need : "other") as Topic,
    message: text("message", raw.message, LIMITS.message, fields, { multiline: true }),
    role: careers ? text("role", raw.role, LIMITS.role, fields) : "",
    cvUrl: careers ? link("cvUrl", raw.cvUrl, fields) : "",
    locale: isLocale(raw.locale) ? raw.locale : routing.defaultLocale,
    page: page(raw.page),
  };
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, data };
}

/** Topics as an array (JSON) or a comma-separated string (url-encoded); anything off the allow-list is an error. */
function topicList(value: unknown, fields: FieldErrors): NewsletterTopic[] {
  if (value == null || value === "") return [];
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : null;
  if (!list || list.length > NEWSLETTER_TOPICS.length * 2) {
    fields.topics = "invalid";
    return [];
  }
  const out = new Set<NewsletterTopic>();
  for (const item of list) {
    const v = clean(item);
    if ((NEWSLETTER_TOPICS as readonly string[]).includes(v)) out.add(v as NewsletterTopic);
    else fields.topics = "invalid";
  }
  return [...out];
}

/** Sign-up (email required; first / last name, company and topics optional) or unsubscribe (email only). */
export function validateNewsletter(raw: Raw): Validation<NewsletterData> {
  const fields: FieldErrors = {};
  const source = clean(raw.source);
  const unsubscribe = raw.action === "unsubscribe";
  const data: NewsletterData = {
    action: unsubscribe ? "unsubscribe" : "subscribe",
    email: email(raw.email, fields),
    firstName: unsubscribe ? "" : text("firstName", raw.firstName, LIMITS.name, fields),
    lastName: unsubscribe ? "" : text("lastName", raw.lastName, LIMITS.name, fields),
    company: unsubscribe ? "" : text("company", raw.company, LIMITS.company, fields),
    topics: unsubscribe ? [] : topicList(raw.topics, fields),
    locale: isLocale(raw.locale) ? raw.locale : routing.defaultLocale,
    source: (NEWSLETTER_SOURCES as readonly string[]).includes(source) ? (source as NewsletterSource) : "",
    page: page(raw.page),
  };
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, data };
}

/** The maximum length behind a "tooLong" error, for the message ("{max} characters at most"). */
export function limitOf(field: string): number | undefined {
  const map: Record<string, number> = { ...LIMITS, cvUrl: LIMITS.url, firstName: LIMITS.name, lastName: LIMITS.name };
  return map[field];
}
