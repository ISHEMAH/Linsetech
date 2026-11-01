import type { Service } from "@/content/services";

type T = {
  (key: string): string;
  raw: (key: string) => unknown;
  has: (key: string) => boolean;
};

export type ServiceCopy = {
  title: string;
  headline: string;
  intro: string;
  more: string;
  bullets: { title: string; text: string }[];
  stats: { value: string; label: string; note?: string }[];
  faqs: { q: string; a: string }[];
};

/** A service's copy from the servicesPage messages (localised), falling back to the content/CMS fields. */
export function serviceCopy(t: T, s: Service): ServiceCopy {
  const k = `services.${s.key}`;
  const get = (f: string, fb: string) => (t.has(`${k}.${f}`) ? t(`${k}.${f}`) : fb);
  const raw = <V,>(f: string, fb: V): V => (t.has(`${k}.${f}`) ? (t.raw(`${k}.${f}`) as V) : fb);
  return {
    title: get("title", s.title),
    headline: get("headline", s.headline),
    intro: get("intro", s.intro),
    more: get("more", ""),
    bullets: raw("bullets", s.bullets.map((b) => ({ title: b, text: "" }))),
    stats: raw("stats", s.stats),
    faqs: raw("faqs", s.faqs),
  };
}
