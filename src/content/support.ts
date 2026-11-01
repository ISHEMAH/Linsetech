import { site } from "./site";

/**
 * Support content (structure only — visible strings live in messages/pages/company/*.json under `supportPage`).
 * Contact details are the placeholders from site.ts; channels / SLA come from company.ts.
 */
const tel = `tel:${site.phone.replace(/[^+\d]/g, "")}`;
const mail = (to: string, subject?: string) => `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;

export type Action = { kind: "href"; href: string; external?: boolean } | { kind: "scroll"; target: string } | { kind: "contact" };

export const channels: { key: "desk" | "phone" | "remote" | "onsite"; value?: string; action: Action }[] = [
  { key: "desk", value: site.supportEmail, action: { kind: "href", href: mail(site.supportEmail) } },
  { key: "phone", value: site.phone, action: { kind: "href", href: tel } },
  { key: "remote", action: { kind: "scroll", target: "#remote-help" } },
  { key: "onsite", action: { kind: "contact" } },
];

export const sla = [
  { key: "p1", level: "P1" },
  { key: "p2", level: "P2" },
  { key: "p3", level: "P3" },
] as const;

export const remoteSteps = ["call", "tool", "fix"] as const;

/** Placeholder files: no file exists yet, every row is shown as "coming soon". */
export const downloads = [
  { key: "winTool", type: "EXE" },
  { key: "macTool", type: "DMG" },
  { key: "handbook", type: "PDF" },
  { key: "slaTerms", type: "PDF" },
  { key: "warranty", type: "PDF" },
  { key: "onboarding", type: "PDF" },
  { key: "macyepay", type: "PDF" },
  { key: "inventory", type: "XLSX" },
] as const;

export const supportContacts = {
  support: { email: site.supportEmail, href: mail(site.supportEmail) },
  sales: { email: site.email, href: mail(site.email, "Sales") },
  accounts: { email: site.email, href: mail(site.email, "Accounts") },
  press: { email: site.email, href: mail(site.email, "Press") },
  phone: { label: site.phone, href: tel },
  legalName: site.legalName,
  address: site.address,
};

export const supportPhone = { label: site.phone, href: tel };
export const faqCount = 5;
