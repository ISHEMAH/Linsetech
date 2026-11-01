import nodemailer from "nodemailer";
import type { ContactData, NewsletterData, NewsletterTopic, Topic } from "./forms";

/**
 * Delivery adapters of the site forms (server only).
 *
 * - Contact / careers: an e-mail over SMTP (nodemailer) when SMTP_URL and CONTACT_TO are set; job applications go to
 *   CAREERS_TO when set. Without SMTP the functions return false (= not delivered) and the visitor is asked to write
 *   to us instead.
 * - Newsletter: a JSON POST to NEWSLETTER_WEBHOOK_URL when set, else an e-mail to CONTACT_TO, else not delivered.
 *
 * Settings are read on every call (no restart needed in dev). Errors are thrown to the route, which logs codes only.
 */

type MailEnv = { url: string; to: string; careersTo: string; from: string };

function mailEnv(): MailEnv | null {
  const url = process.env.SMTP_URL?.trim();
  const to = process.env.CONTACT_TO?.trim();
  if (!url || !to) return null;
  return { url, to, careersTo: process.env.CAREERS_TO?.trim() || to, from: process.env.MAIL_FROM?.trim() || defaultFrom(url, to) };
}

/** Most SMTP servers only relay for the account they authenticate, so default to that account, else to CONTACT_TO. */
function defaultFrom(url: string, to: string): string {
  try {
    const user = decodeURIComponent(new URL(url).username);
    if (user.includes("@")) return `"Linse website" <${user}>`;
  } catch {
    // not a URL nodemailer would accept either; sending will fail and be logged
  }
  return `"Linse website" <${to.split(",")[0].trim()}>`;
}

type Transporter = ReturnType<typeof nodemailer.createTransport>;
const cache = globalThis as { __linseMail?: { url: string; transporter: Transporter } };

function transporter(url: string): Transporter {
  if (cache.__linseMail?.url !== url) {
    // short timeouts: the visitor is waiting on the answer (nodemailer defaults to minutes)
    cache.__linseMail = { url, transporter: nodemailer.createTransport({ url, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 }) };
  }
  return cache.__linseMail.transporter;
}

const TOPIC_LABEL: Record<Topic, string> = {
  build: "Build software",
  buy: "Buy hardware",
  support: "IT support",
  other: "Something else",
  careers: "Job application",
};

const lines = (rows: [string, string][]) =>
  rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${`${k}:`.padEnd(16)}${v}`)
    .join("\n");

export async function deliverContact(d: ContactData): Promise<boolean> {
  const env = mailEnv();
  if (!env) return false;
  const careers = d.need === "careers";
  const subject = careers
    ? `Job application: ${d.role || "open application"} (${d.name})`
    : `Website enquiry: ${TOPIC_LABEL[d.need]} (${d.name}${d.company ? `, ${d.company}` : ""})`;
  const text = [
    careers ? "New job application from the website." : "New project enquiry from the website.",
    "",
    lines([
      ["Role", careers ? d.role || "Open application" : ""],
      ["Name", d.name],
      ["Email", d.email],
      ["Company", d.company],
      ["Need", careers ? "" : TOPIC_LABEL[d.need]],
      ["CV / portfolio", d.cvUrl],
      ["Language", d.locale],
      ["Sent from", d.page],
    ]),
    "",
    careers ? "About the applicant:" : "Message:",
    d.message || "(no message)",
    "",
    "Reply to this e-mail to answer them directly.",
  ].join("\n");

  await transporter(env.url).sendMail({
    from: env.from,
    to: careers ? env.careersTo : env.to,
    replyTo: { name: d.name, address: d.email },
    subject,
    text,
  });
  return true;
}

const TOPIC_NAME: Record<NewsletterTopic, string> = { product: "Product news", insights: "Insights", press: "Press releases", careers: "Careers" };

export async function deliverNewsletter(d: NewsletterData): Promise<boolean> {
  const unsubscribe = d.action === "unsubscribe";
  const webhook = process.env.NEWSLETTER_WEBHOOK_URL?.trim();
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: d.action,
        email: d.email,
        firstName: d.firstName,
        lastName: d.lastName,
        company: d.company,
        topics: d.topics,
        locale: d.locale,
        source: d.source || "site",
        page: d.page,
        at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) throw Object.assign(new Error("newsletter webhook refused"), { status: res.status });
    return true;
  }

  const env = mailEnv();
  if (!env) return false;
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ");
  await transporter(env.url).sendMail({
    from: env.from,
    to: env.to,
    replyTo: name ? { name, address: d.email } : d.email,
    subject: unsubscribe ? "Newsletter unsubscribe" : "Newsletter sign-up",
    text: [
      unsubscribe ? "Please remove this address from every mailing list:" : "Please add this address to the newsletter list:",
      "",
      d.email,
      "",
      lines([
        ["Name", name],
        ["Company", d.company],
        ["Topics", unsubscribe ? "" : d.topics.length ? d.topics.map((k) => TOPIC_NAME[k]).join(", ") : "All"],
        ["Language", d.locale],
        ["From", [d.source, d.page].filter(Boolean).join(" · ")],
      ]),
    ].join("\n"),
  });
  return true;
}
