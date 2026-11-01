import { setRequestLocale, getTranslations } from "next-intl/server";
import HeroProductivity from "@/components/sections/home/HeroProductivity";
import Stack from "@/components/sections/home/Stack";
import Banner from "@/components/sections/home/Banner";
import Opportunity from "@/components/sections/home/Opportunity";
import WorkChapter from "@/components/sections/WorkChapter";
import WaveLinks from "@/components/sections/work/WaveLinks";
import Process from "@/components/sections/home/Process";
import NewsTeaser from "@/components/sections/home/NewsTeaser";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";
import ChapterBadge from "@/components/layout/ChapterBadge";
import { getProjects, getPosts, getServices } from "@/sanity/data";
import { localizeProjects } from "@/components/sections/work/localize";
import { badgeDate } from "@/components/sections/news/data";
import type { Locale } from "@/i18n/routing";
import type { Metadata, ResolvingMetadata } from "next";
import { pageMetadata, toLocale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }, parent: ResolvingMetadata): Promise<Metadata> {
  // single-segment URLs such as /foo.txt land here too (and 404 in the layout): Intl throws on a non-locale
  const locale = toLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "meta" });
  // same segment as the layout, so its title template does not apply: the full site title is the page title
  return pageMetadata({ locale, path: "/", title: t("title"), description: t("description") }, parent);
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [all, posts, services, tw] = await Promise.all([getProjects(locale as Locale), getPosts(locale as Locale), getServices(locale as Locale), getTranslations("workPage")]);
  const projects = localizeProjects(all, tw.has("content") ? (tw.raw("content") as Record<string, unknown>) : null);
  const faq = t.raw("faq.items") as { q: string; a: string }[];

  return (
    <>
      {/* the date is formatted here: browsers lack Kinyarwanda locale data, so a client-side format would not hydrate */}
      <HeroProductivity latest={posts[0]} latestDate={posts[0] ? badgeDate(locale, posts[0].date) : undefined} />
      <Stack />
      {/* Sharplink HomeBanner: slides over the Stack's still-pinned machine, which turns into line art under it */}
      <Banner />
      <Opportunity services={services} />
      {/* Work's links (exhibits, award, "See all work") leave through Puture's pixel wave */}
      <div data-wave-scope>
        <WorkChapter projects={projects.slice(0, 3)} tail={{ label: t("work.all"), href: "/work" }} compact />
      </div>
      <Process />
      {/* dark contact banner: continues Process's dark frame, News turns light under it (TurnLight) */}
      <CTA after="dark" />
      <NewsTeaser posts={posts} />
      <FAQ eyebrow={t("faq.eyebrow")} title={t("faq.title")} items={faq} top="flush" />
      <ChapterBadge />
      <WaveLinks landing={["#work", "#process"]} />
    </>
  );
}
