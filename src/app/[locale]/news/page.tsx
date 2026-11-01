import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CharReveal from "@/components/motion/CharReveal";
import DashedLine from "@/components/ui/DashedLine";
import NewsList, { type ListItem } from "@/components/sections/pages/NewsList";
import NewsletterStrip from "@/components/sections/pages/NewsletterStrip";
import DateBadge from "@/components/sections/news/DateBadge";
import NewsCover from "@/components/sections/news/NewsCover";
import PressList, { type PressItem } from "@/components/sections/news/PressList";
import ReadMore from "@/components/sections/news/ReadMore";
import { badgeDate, loadPosts } from "@/components/sections/news/data";
import s from "@/components/sections/news/news-classes";
import { cn } from "@/lib/cn";
import DarkGradient from "@/components/backdrop/DarkGradient";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  return pageMetadata({ locale, path: "/news", title: t("metaTitle"), description: t("metaDescription") }, parent);
}

const M = "px-[clamp(16px,2.5vw,40px)]";
const subtitle = "relative pb-7 text-[clamp(26px,2.2vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]";

/**
 * /news, after sharplink.com/news: a short dark heading ("Latest News", letters fade in at random) over a glow
 * that hugs the top edges; "Featured Blog" (7 cols) beside "Most Recent" (5 cols) on a dashed grid; the
 * newsletter box; "All articles" with filters and pager; "Press Releases" with search, year and First/Last nav.
 */
export default async function NewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("newsPage");
  const all = await loadPosts(locale as Locale);
  const featured = all.find((p) => p.featured) ?? all[0];
  const recent = all.filter((p) => p.slug !== featured.slug).slice(0, 4);
  const tag = (c: string) => t(`cover.${c}`);

  const blogs: ListItem[] = all
    .filter((p) => p.category !== "press")
    .map((p) => ({ slug: p.slug, title: p.title, category: p.category, year: p.date.slice(0, 4), date: badgeDate(locale, p.date), catLabel: t(`categories.${p.category}`), tag: tag(p.category) }));
  const press: PressItem[] = all
    .filter((p) => p.category === "press")
    .map((p) => ({ slug: p.slug, title: p.title, year: p.date.slice(0, 4), date: badgeDate(locale, p.date), pdf: p.pdf }));

  return (
    <>
      <section data-theme="dark" className="relative z-[2] bg-black text-off-white">
        {/* heading: Sharplink .news-hero .heading .gradient — the flipped dark gradient (1000px), black where the grid starts */}
        <div className="relative overflow-hidden">
          <DarkGradient position="bottom" height="1000px" heightMobile="900px" />
          <div className={cn("relative z-[1] pb-[clamp(72px,9vw,160px)] pt-[clamp(132px,11.5vw,208px)]", M)}>
            <CharReveal as="h1" text={t("title")} className="h1-sm" delay={0.25} />
          </div>
        </div>

        <div className={cn("relative grid lg:grid-cols-12", M)}>
          {/* Featured */}
          <div className="relative flex flex-col lg:col-span-7">
            <h2 className={subtitle}>
              {t("featured")}
              <DashedLine theme="dark" className="bottom-0" />
            </h2>
            <div className="relative flex-1 py-7 lg:pr-7">
              <Link href={`/news/${featured.slug}` as never} className={cn(s.row, "group -mx-[clamp(16px,2.5vw,40px)] -my-7 flex flex-col px-[clamp(16px,2.5vw,40px)] py-7 lg:-mr-7 lg:pr-7")}>
                <NewsCover title={featured.title} category={featured.category} tag={tag(featured.category)} />
                <DateBadge className="mt-6">{badgeDate(locale, featured.date)}</DateBadge>
                <h3 className="mt-5 line-clamp-2 text-[clamp(20px,1.6vw,24px)] font-medium leading-[1.4] tracking-[-0.01em]">{featured.title}</h3>
                <ReadMore label={t("readMore")} className="mt-5" />
              </Link>
              <DashedLine theme="dark" direction="vertical" className="right-0 hidden lg:block" />
            </div>
            <DashedLine theme="dark" className="bottom-0" />
          </div>

          {/* Most recent */}
          <div className="relative mt-16 lg:col-span-5 lg:mt-0">
            <h2 className={cn(subtitle, "lg:pl-7")}>
              {t("recent")}
              <DashedLine theme="dark" className="bottom-0" />
            </h2>
            <ul>
              {recent.map((p) => (
                <li key={p.slug} className="recent-item relative">
                  <Link href={`/news/${p.slug}` as never} className={cn(s.row, "group flex flex-col py-7 lg:px-7")}>
                    <span className="flex flex-wrap items-center gap-3">
                      <DateBadge>{badgeDate(locale, p.date)}</DateBadge>
                      <span className="font-narrow text-[12px] font-medium uppercase tracking-[0.08em] text-off-white/45">{t(`categories.${p.category}`)}</span>
                    </span>
                    <h3 className="mt-5 line-clamp-2 text-[clamp(17px,1.25vw,19px)] font-medium leading-[1.35]">{p.title}</h3>
                    <ReadMore label={t("readMore")} className="mt-5" />
                  </Link>
                  <DashedLine theme="dark" className="bottom-0" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* newsletter (Sharplink alert-form-wrapper: 84px above, 56px below, a dashed rule under it) */}
        <div className={cn("relative pb-14 pt-[clamp(56px,6vw,84px)]", M)}>
          <NewsletterStrip />
        </div>
        <div className="absolute inset-x-[clamp(16px,2.5vw,40px)] bottom-0 h-px">
          <DashedLine theme="dark" className="top-0" />
        </div>
      </section>

      <NewsList items={blogs} title={t("allPosts")} />
      <PressList items={press} title={t("press")} />
    </>
  );
}
