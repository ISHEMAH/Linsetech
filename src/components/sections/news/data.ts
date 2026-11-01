import { client } from "@/sanity/client";
import { getPost, getPosts } from "@/sanity/data";
import { postFor, postsFor, type Post } from "@/content/news";
import type { Locale } from "@/i18n/routing";

/**
 * Posts for the news pages: Sanity when it is configured (already localised there), otherwise the typed content
 * file in the visitor's language. (`@/sanity/data` returns the English local posts for every locale.)
 */
export async function loadPosts(locale: Locale): Promise<Post[]> {
  return client ? getPosts(locale) : postsFor(locale);
}

export async function loadPost(locale: Locale, slug: string): Promise<Post | undefined> {
  return client ? getPost(locale, slug) : postFor(locale, slug);
}

/** "May 11, 2026" style used on every date badge, in the visitor's language. */
// any first path segment reaches [locale] pages (/foo.txt → "foo.txt") while the layout 404s them; Intl throws on a
// non-locale, so anything but fr/rw formats as English
export const badgeDate = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale === "rw" ? "rw-RW" : locale === "fr" ? "fr" : "en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
