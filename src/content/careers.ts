import { site } from "./site";

/**
 * Careers content (structure only — every visible string lives in messages/pages/company/*.json under
 * `careersPage`). Roles are the two openings from company.ts plus the always-open application.
 */
export type TeamKey = "engineering" | "field";
export type RoleKey = "fullstack" | "technician" | "open";

export type Role = {
  slug: string;
  /** key under careersPage.role.* */
  key: RoleKey;
  team: TeamKey | "any";
  type: "fullTime" | "open";
  location: string;
};

export const roles: Role[] = [
  { slug: "fullstack-engineer", key: "fullstack", team: "engineering", type: "fullTime", location: "Kigali" },
  { slug: "field-technician", key: "technician", team: "field", type: "fullTime", location: "Kigali" },
];

/** shown after the openings, never filtered out by the team filter */
export const openApplication: Role = { slug: "open-application", key: "open", team: "any", type: "open", location: "Kigali" };

export const teams: TeamKey[] = ["engineering", "field"];

export const perks = [
  { key: "products", icon: "box" },
  { key: "scope", icon: "stack" },
  { key: "team", icon: "people" },
  { key: "tools", icon: "laptop" },
] as const;

export const hiringSteps = ["apply", "call", "task", "team"] as const;

export const lifeTiles = ["engineering", "design", "field", "sales"] as const;

export const careersContact = {
  email: site.careersEmail,
  legalName: site.legalName,
  address: site.address,
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.join(", "))}`,
};
