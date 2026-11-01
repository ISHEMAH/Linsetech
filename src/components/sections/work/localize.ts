import { projects as localProjects, type Project } from "@/content/work";

type Over = Record<string, unknown>;
const isObj = (v: unknown): v is Over => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep merge where arrays merge by index (an override array of objects patches the items it lists). */
function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) && Array.isArray(over)) return base.map((b, i) => merge(b, over[i])) as T;
  if (isObj(base) && isObj(over)) {
    const out: Over = { ...base };
    for (const [k, v] of Object.entries(over)) out[k] = k in base ? merge((base as Over)[k], v) : v;
    return out as T;
  }
  return (typeof over === typeof base ? over : base) as T;
}

/**
 * The local content (src/content/work.ts) is written in English; French and Kinyarwanda copies live in the
 * work group's messages (`workPage.content.<slug>`). They only apply to projects that still come from the local
 * file: a project served by Sanity is already localized there.
 */
export function localizeProject(p: Project, overrides: Record<string, unknown> | null | undefined): Project {
  const local = localProjects.find((l) => l.slug === p.slug);
  if (!overrides || !local || local.summary !== p.summary) return p;
  const o = overrides[p.slug];
  return isObj(o) ? merge(p, o) : p;
}

export const localizeProjects = (list: Project[], overrides: Record<string, unknown> | null | undefined) => list.map((p) => localizeProject(p, overrides));
