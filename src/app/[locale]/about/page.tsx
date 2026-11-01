import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHero from "@/components/sections/PageHero";
import HeroCtas from "@/components/sections/about/HeroCtas";
import StoryLongform, { type StoryRow } from "@/components/sections/about/StoryLongform";
import AboutQuote from "@/components/sections/about/AboutQuote";
import AboutPeople from "@/components/sections/about/AboutPeople";
import { storyRows, pillars, milestones } from "@/content/company";
import { slClip } from "@/content/clips";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage.meta" });
  return pageMetadata({ locale, path: "/about", title: t("title"), description: t("description") }, parent);
}

/**
 * About, on sharplink.com/about's structure and backgrounds: hero (chrome LS chain clip under their about overlay, own
 * 130% dark gradient) → light long-form story on the fixed light backdrop → quote (flipped dark gradient, 115%) → black
 * people section (blurb, leadership with bio drawer, team) → "board" block (partners, documents, contacts) on a top
 * dark gradient (180%) that fades into the light page → the looping chrome LS mark on light → footer.
 */
export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");

  const rows: StoryRow[] = [
    ...storyRows.map((id) => ({ id, label: t(`story.rows.${id}.label`), items: [{ text: t(`story.rows.${id}.text`) }] })),
    {
      id: "pillars",
      label: t("story.whatLabel"),
      items: pillars.map((id, i) => ({ kicker: `0${i + 1}`, text: `${t(`story.pillars.${id}.title`)} — ${t(`story.pillars.${id}.text`)}` })),
    },
    {
      id: "milestones",
      label: t("story.milestonesLabel"),
      items: milestones.map((y) => ({ kicker: y, text: `${t(`story.milestones.${y}.title`)} — ${t(`story.milestones.${y}.text`)}` })),
    },
  ];

  return (
    <>
      <PageHero variant="about" title={t("hero.title")} clip={slClip("sl_chain")} overlay="about" gradientHeight="130%">
        <HeroCtas work={t("hero.cta1")} talk={t("hero.cta2")} />
      </PageHero>
      <StoryLongform heading={t("story.heading")} rows={rows} />
      <AboutQuote text={t("quote.text")} name={t("quote.name")} role={t("quote.role")} portraitLabel={t("people.portrait")} />
      <AboutPeople />
    </>
  );
}
