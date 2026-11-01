import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import DashedLine from "@/components/ui/DashedLine";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import DarkGradient from "@/components/backdrop/DarkGradient";
import NewsCover from "@/components/sections/news/NewsCover";
import DateBadge from "@/components/sections/news/DateBadge";
import { badgeDate } from "@/components/sections/news/data";
import NewsSlider from "@/components/sections/home/NewsSlider";
import type { Post } from "@/content/news";

/**
 * The card's "Read more": Sharplink's secondary `hide-text` ui-button (only the arrow box shows; hovering the card
 * reveals the label on the brand colour while the box slides right). Same markup and CSS as <Button hideText>, as a span
 * because the whole card is the link.
 */
function ReadMore({ label }: { label: string }) {
  return (
    <span className="ui-btn ui-btn--secondary has-icon allow-parent-hover hide-text" aria-hidden>
      <span className="ui-btn__content">
        <span>{label}</span>
        <span>{label}</span>
      </span>
      <span className="ui-btn__icon">
        <span>
          <Arrow />
        </span>
        <span>
          <Arrow />
        </span>
      </span>
    </span>
  );
}

/**
 * Sharplink "section-news": eyebrow + heading in the first of three dashed columns, "Visit our blog" in the last; the
 * latest three articles (CardArticle: pinned thumbnail, type + date badges, title, hide-text "Read more") in the three
 * columns on desktop, a swipe carousel on phones. Static on desktop (no reveal), no image zoom or title tint on hover.
 * Opens on Sharplink's dark edge under the dark contact banner (black → green → the arc fading out), with room above
 * the header so the heading arrives on the light end; a scrubbed black plate over the light page went through grey.
 */
export default function NewsTeaser({ posts }: { posts: Post[] }) {
  const t = useTranslations("news");
  const tc = useTranslations("pages.news.categories");
  const cover = useTranslations("newsPage.cover");
  const locale = useLocale();
  const items = posts.slice(0, 3);
  const cards = items.map((p) => (
    <Link key={p.slug} href={`/news/${p.slug}` as never} className="card-news flex flex-col gap-5 min-[800px]:gap-4">
      {/* bg-black: Nav.tsx turns the header white while one of these dark thumbnails passes under the logo */}
      <span className="block bg-black">
        <NewsCover title={p.title} category={p.category} tag={cover(p.category)} />
      </span>
      <span className="flex justify-between gap-[2px]">
        <DateBadge theme="light" className="!text-ink">{tc(p.category)}</DateBadge>
        <DateBadge theme="light" className="!text-ink">{badgeDate(locale, p.date)}</DateBadge>
      </span>
      <h3 className="line-clamp-3 text-[16px] leading-[1.35] font-medium min-[800px]:text-[24px] min-[800px]:leading-[1.4] min-[800px]:tracking-[-0.01em]">{p.title}</h3>
      <span className="flex gap-[2px]">
        <ReadMore label={t("readMore")} />
      </span>
    </Link>
  ));

  return (
    <section data-theme="light" data-chapter="news" className="section-news relative z-[3] px-[clamp(16px,2.5vw,40px)] pb-[120px] pt-[36vh] text-ink min-[800px]:pb-0">
      {/* 35vh tall, 1.3× while the section scrolls in: faded to ~10 % by the heading 36vh down */}
      <DarkGradient position="top" height="35vh" />
      {/* header: three dashed columns, brand pin */}
      <div className="relative grid grid-cols-1 min-[800px]:grid-cols-3 min-[800px]:gap-x-[28px]">
        <DashedLine className="top-0" />
        <span className="absolute left-0 top-0 z-[1] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <div className="relative pt-7">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-[44px] leading-[1.23] tracking-[-0.01em] min-[800px]:mt-7 min-[800px]:text-[68px] min-[800px]:leading-[1.06] min-[800px]:tracking-[-0.02em]">{t("title")}</h2>
          <DashedLine direction="vertical" className="left-full hidden min-[800px]:block" />
        </div>
        <div className="relative hidden min-[800px]:block" aria-hidden>
          <DashedLine direction="vertical" className="left-0" />
          <DashedLine direction="vertical" className="left-full" />
        </div>
        <div className="relative flex items-start pt-7">
          <DashedLine direction="vertical" className="left-0 hidden min-[800px]:block" />
          <ButtonLink href="/news" variant="secondary" className="min-[800px]:ml-auto">
            {t("all")}
          </ButtonLink>
        </div>
      </div>

      {/* desktop: the three columns */}
      <ul className="relative hidden grid-cols-3 gap-x-[28px] min-[800px]:grid">
        {[0, 1, 2].map((c) => (
          <li key={c} className="relative pb-[160px] pt-[52px]">
            {cards[c]}
            {c < 2 && <DashedLine direction="vertical" className="left-full" />}
            {c > 0 && <DashedLine direction="vertical" className="left-0" />}
          </li>
        ))}
      </ul>

      {/* phones: carousel */}
      <NewsSlider prev={t("prev")} next={t("next")}>
        {cards}
      </NewsSlider>
    </section>
  );
}
