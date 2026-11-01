import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ServicesHero from "@/components/sections/pages/ServicesHero";
import ServiceChapter from "@/components/sections/pages/ServiceChapter";
import EngagementModels from "@/components/sections/pages/EngagementModels";
import ProcessStrip from "@/components/sections/pages/ProcessStrip";
import Statement from "@/components/sections/services/Statement";
import Transformation from "@/components/sections/services/Transformation";
import Runway from "@/components/sections/services/Runway";
import { serviceCopy } from "@/components/sections/services/copy";
import type { StatCard } from "@/components/sections/services/StatCards";
import FAQ from "@/components/sections/FAQ";
import { ContactButton } from "@/components/sections/ContactButton";
import { ButtonLink } from "@/components/ui/Button";
import { MODEL_ART, ROW_ART } from "@/content/services";
import { slClip } from "@/content/clips";
import { getServices, getProjects } from "@/sanity/data";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "servicesPage.meta" });
  return pageMetadata({ locale, path: "/services", title: t("title"), description: t("description") }, parent);
}

/**
 * /services on sharplink.com/ethereum-opportunity's section order and background system (docs/briefs/sl-backgrounds.md):
 * hero (sl_press clip, about overlay, 130 % gradient) → scrolling text (light) → breakthrough (light, sphere clip) →
 * transformation (head gradient bottom 100 %, the six services as numbered rows + stat cards on black) → commodity
 * (engagement models; content gradient top calc(100% + 500px)) → supercycle (light, watch clip: IT services) → runway
 * (light, coins clip: MacyePay, values on the rising framework gradient) → framework (process; role block with the
 * looping mark) → FAQ on the light page → footer. No CTA banner at the end.
 */
export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("servicesPage");
  const [services, projects] = await Promise.all([getServices(locale as Locale), getProjects(locale as Locale)]);
  const copies = services.map((s) => serviceCopy(t, s));
  const models = t.raw("models.items") as { title: string; text: string; includes: string[] }[];
  const macye = projects.find((p) => p.slug === "macyepay");
  const valueLabels = t.raw("runway.values") as string[];
  const values = macye
    ? [macye.stats[0], macye.stats[1], macye.result].filter(Boolean).map((s, i) => ({ eyebrow: valueLabels[i] ?? s.label, value: s.value }))
    : [];

  return (
    <>
      <ServicesHero title={t("hero.title")} cta={t("hero.cta")} target="services-intro" />
      <Statement id="services-intro" paragraphs={t.raw("statement") as string[]} />
      <ServiceChapter variant="breakthrough" title={t("breakthrough.title")} blurb={t("breakthrough.blurb")} body={t.raw("breakthrough.body") as string[]} clip={slClip("sl_sphere")} z={3} />
      <Transformation
        id="services-list"
        title={t("transformation.title")}
        blurb={t("transformation.blurb")}
        body={t.raw("transformation.body") as string[]}
        rows={services.map((s, i) => ({
          title: copies[i].title,
          text: [copies[i].intro],
          art: ROW_ART[s.key],
          href: `/services/${s.slug}`,
          cta: t("transformation.explore", { service: copies[i].title }),
        }))}
        stats={t.raw("transformation.stats") as StatCard[]}
      />
      <EngagementModels
        id="models"
        title={t("models.title")}
        blurb={t("models.blurb")}
        cards={models.map((m, i) => ({ ...m, art: MODEL_ART[i] ?? "project" }))}
        action={<ContactButton variant="secondary">{t("models.cta")}</ContactButton>}
      />
      <ServiceChapter
        variant="supercycle"
        title={t("supercycle.title")}
        blurb={t("supercycle.blurb")}
        body={t.raw("supercycle.body") as string[]}
        clip={slClip("sl_watch")}
        action={
          <ButtonLink href="/services/it-services" variant="secondary">
            {t("supercycle.cta")}
          </ButtonLink>
        }
        quote={{ text: t("supercycle.quote.text"), name: t("supercycle.quote.name"), role: t("supercycle.quote.role"), portraitLabel: t("supercycle.quote.portrait") }}
        z={3}
      />
      <Runway
        title={t("runway.title")}
        tagline={t("runway.tagline")}
        clip={slClip("sl_coins")}
        values={values}
        action={
          <ButtonLink href="/work/macyepay" variant="secondary">
            {t("runway.cta")}
          </ButtonLink>
        }
      />
      <ProcessStrip
        title={t("process.title")}
        blurb={t("process.blurb")}
        body={t("process.body")}
        steps={t.raw("process.steps") as { title: string; text: string }[]}
        clip={slClip("about_logo")}
        action={<ContactButton variant="secondary">{t("process.cta")}</ContactButton>}
      />
      <FAQ eyebrow={t("faq.eyebrow")} title={t("faq.title")} items={copies.flatMap((c) => c.faqs)} top="tail" />
    </>
  );
}
