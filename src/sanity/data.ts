/**
 * Content access with a single rule: if Sanity is configured, read from it; otherwise use the
 * typed content files in src/content. Pages only ever call these functions.
 */
import { client } from "./client";
import { urlFor } from "./image";
import { projects as localProjects, type Project } from "@/content/work";
import { postsFor, postFor, type Post, type Block } from "@/content/news";
import { services as localServices, type Service } from "@/content/services";
import type { Locale } from "@/i18n/routing";

type L = Partial<Record<Locale, string>> | null | undefined;
const pick = (v: L, locale: Locale, fallback = "") => v?.[locale] ?? v?.en ?? fallback;

const PROJECT_FIELDS = `
  "slug": slug.current, title, client, tag, category, year, featured, order, shape, accent, cover, blurb, summary, url,
  result, stats, meta, delivered, screens, journey, engineering
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProject(d: any, locale: Locale): Project {
  return {
    slug: d.slug,
    title: d.title,
    client: d.client ?? "",
    tag: d.tag ?? "",
    category: d.category,
    year: d.year ?? "",
    blurb: pick(d.blurb, locale),
    summary: pick(d.summary, locale),
    shape: d.shape ?? "landscape",
    cover: urlFor(d.cover, 1600),
    accent: d.accent ?? "#16a34a",
    result: { value: d.result?.value ?? "", label: pick(d.result?.label, locale) },
    stats: (d.stats ?? []).map((s: any) => ({ value: s.value, label: pick(s.label, locale) })),
    meta: { scope: pick(d.meta?.scope, locale), period: d.meta?.period ?? "", role: pick(d.meta?.role, locale), stack: d.meta?.stack ?? [] },
    delivered: (d.delivered ?? []).map((x: L) => pick(x, locale)),
    screens: (d.screens ?? []).map((s: any) => ({ src: urlFor(s.image, 1200), caption: pick(s.caption, locale) })),
    journey: (d.journey ?? []).map((s: any) => ({ title: pick(s.title, locale), text: pick(s.text, locale) })),
    engineering: (d.engineering ?? []).map((s: any) => ({ title: pick(s.title, locale), text: pick(s.text, locale) })),
    featured: !!d.featured,
    url: d.url ?? undefined,
  };
}

function blocksFromPortableText(blocks: any[] | undefined): Block[] {
  if (!blocks) return [];
  const out: Block[] = [];
  let list: string[] | null = null;
  for (const b of blocks) {
    if (b._type !== "block") continue;
    const text = (b.children ?? []).map((c: any) => c.text).join("");
    if (b.listItem) {
      (list ??= []).push(text);
      continue;
    }
    if (list) {
      out.push({ type: "ul", items: list });
      list = null;
    }
    if (b.style === "h2" || b.style === "h3") out.push({ type: "h2", text });
    else if (b.style === "blockquote") out.push({ type: "quote", text });
    else out.push({ type: "p", text });
  }
  if (list) out.push({ type: "ul", items: list });
  return out;
}

function mapPost(d: any, locale: Locale): Post {
  return {
    slug: d.slug,
    title: pick(d.title, locale),
    category: d.category,
    date: d.date,
    readTime: d.readTime ?? 3,
    excerpt: pick(d.excerpt, locale),
    author: d.author ?? "Linse",
    body: blocksFromPortableText(d.body?.[locale] ?? d.body?.en),
    featured: !!d.featured,
    pdf: d.pdfUrl ?? undefined,
  };
}

function mapService(d: any, locale: Locale): Service {
  return {
    slug: d.slug,
    key: d.key,
    title: pick(d.title, locale),
    headline: pick(d.headline, locale),
    intro: pick(d.intro, locale),
    bullets: (d.bullets ?? []).map((x: L) => pick(x, locale)),
    stats: (d.stats ?? []).map((s: any) => ({ value: s.value, label: pick(s.label, locale) })),
    related: d.related ?? [],
    faqs: (d.faqs ?? []).map((f: any) => ({ q: pick(f.q, locale), a: pick(f.a, locale) })),
    formation: d.formation ?? "grid",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getProjects(locale: Locale): Promise<Project[]> {
  if (!client) return localProjects;
  const rows = await client.fetch(`*[_type == "project"] | order(order asc, _createdAt desc) { ${PROJECT_FIELDS} }`);
  return rows.length ? rows.map((r: unknown) => mapProject(r, locale)) : localProjects;
}

export async function getProject(locale: Locale, slug: string): Promise<Project | undefined> {
  if (!client) return localProjects.find((p) => p.slug === slug);
  const row = await client.fetch(`*[_type == "project" && slug.current == $slug][0] { ${PROJECT_FIELDS} }`, { slug });
  return row ? mapProject(row, locale) : localProjects.find((p) => p.slug === slug);
}

export async function getPosts(locale: Locale): Promise<Post[]> {
  // local fallback: posts localized for the requested language, newest first
  const sortLocal = () => postsFor(locale);
  if (!client) return sortLocal();
  const rows = await client.fetch(`*[_type == "post"] | order(date desc) { "slug": slug.current, title, category, date, featured, author, readTime, excerpt, body, "pdfUrl": pdf.asset->url }`);
  return rows.length ? rows.map((r: unknown) => mapPost(r, locale)) : sortLocal();
}

export async function getPost(locale: Locale, slug: string): Promise<Post | undefined> {
  if (!client) return postFor(locale, slug);
  const row = await client.fetch(`*[_type == "post" && slug.current == $slug][0] { "slug": slug.current, title, category, date, featured, author, readTime, excerpt, body, "pdfUrl": pdf.asset->url }`, { slug });
  return row ? mapPost(row, locale) : postFor(locale, slug);
}

export async function getServices(locale: Locale): Promise<Service[]> {
  if (!client) return localServices;
  const rows = await client.fetch(`*[_type == "service"] | order(order asc) { "slug": slug.current, key, title, headline, intro, bullets, stats, "related": related[]->slug.current, faqs, formation }`);
  return rows.length ? rows.map((r: unknown) => mapService(r, locale)) : localServices;
}

export async function getService(locale: Locale, slug: string): Promise<Service | undefined> {
  return (await getServices(locale)).find((s) => s.slug === slug);
}
