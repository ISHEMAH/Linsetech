import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHero from "@/components/sections/PageHero";
import FaqItem, { FaqGroup } from "@/components/sections/FaqItem";
import { ContactButton } from "@/components/sections/ContactButton";
import { slClip } from "@/content/clips";
import { channels, sla, remoteSteps, downloads, supportContacts, supportPhone } from "@/content/support";
import RailLayout from "@/components/sections/company/RailLayout";
import RailSection from "@/components/sections/company/RailSection";
import FactsBand from "@/components/sections/company/FactsBand";
import HeroCards from "@/components/sections/company/HeroCards";
import HeroWrapper from "@/components/sections/company/HeroWrapper";
import RowList from "@/components/sections/company/RowList";
import SlaTable from "@/components/sections/company/SlaTable";
import DocList from "@/components/sections/company/DocList";
import ContactGrid from "@/components/sections/company/ContactGrid";
import ToolCard from "@/components/sections/company/ToolCard";
import { ActButton } from "@/components/sections/company/actions";
import { ArrowDown } from "@/components/sections/company/icons";
import { JsonLd, faqPageJsonLd, pageMetadata } from "@/lib/seo";
import NewsletterStrip from "@/components/sections/pages/NewsletterStrip";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supportPage.meta" });
  return pageMetadata({ locale, path: "/support", title: t("title"), description: t("description") }, parent);
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supportPage");
  const faq = t.raw("faq.items") as { q: string; a: string }[];

  const rail = [
    { id: "channels", label: t("rail.channels") },
    { id: "sla", label: t("rail.sla") },
    { id: "remote-help", label: t("rail.remote") },
    { id: "downloads", label: t("rail.downloads") },
    { id: "contacts", label: t("rail.contacts") },
    { id: "faq", label: t("rail.faq") },
  ];

  return (
    <>
      <JsonLd data={faqPageJsonLd(faq)} />
      <HeroWrapper>
        <PageHero
          title={t("hero.title")}
          sub={t("hero.lead")}
          clip={slClip("sl_coin_support")}
          overlay="investors"
          gradientHeight="120%"
          cards={
            <HeroCards
              feature={{ eyebrow: t("cards.hours.eyebrow"), tag: t("cards.hours.tag"), title: t("cards.hours.title"), action: { kind: "scroll", target: "#channels" } }}
              sliderTitle={t("cards.slider")}
              slides={[
                { eyebrow: t("cards.emergency.eyebrow"), tag: t("cards.emergency.tag"), title: t("cards.emergency.title", { phone: supportPhone.label }), action: { kind: "href", href: supportPhone.href } },
                { eyebrow: t("cards.remote.eyebrow"), tag: t("cards.remote.tag"), title: t("cards.remote.title"), action: { kind: "scroll", target: "#remote-help" } },
              ]}
              labels={{ prev: t("cards.prev"), next: t("cards.next"), pause: t("cards.pause"), play: t("cards.play") }}
            />
          }
        >
          <ActButton action={{ kind: "heroEnd" }} icon={<ArrowDown />}>
            {t("hero.cta")}
          </ActButton>
        </PageHero>
      </HeroWrapper>

      <FactsBand
        symbol={t("band.symbol")}
        asOf={t("band.asOf")}
        card={{ label: t("band.card.label"), value: t("band.card.value"), note: t("band.card.note") }}
        facts={t.raw("band.facts") as { label: string; value: string }[]}
      />

      <RailLayout items={rail} label={t("rail.label")}>
        <RailSection id="channels" kind="press" title={t("channels.title")}>
          <RowList
            chip="date"
            rows={channels.map((c) => ({
              id: c.key,
              chip: t(`channels.items.${c.key}.chip`),
              title: t(`channels.items.${c.key}.title`, { value: c.value ?? "" }),
              meta: t(`channels.items.${c.key}.text`),
              action: c.action,
            }))}
          />
        </RailSection>

        <RailSection id="sla" kind="black" title={t("sla.title")}>
          <SlaTable
            cols={{ priority: t("sla.cols.priority"), example: t("sla.cols.example"), response: t("sla.cols.response"), resolution: t("sla.cols.resolution") }}
            rows={sla.map((r) => ({
              id: r.key,
              chip: r.level,
              level: t(`sla.rows.${r.key}.level`),
              example: t(`sla.rows.${r.key}.example`),
              response: t(`sla.rows.${r.key}.response`),
              resolution: t(`sla.rows.${r.key}.resolution`),
            }))}
            note={t("sla.note")}
          />
        </RailSection>

        <RailSection id="remote-help" kind="black" title={t("remote.title")}>
          <p className="mb-[56px] max-w-[640px] text-[16px] font-medium leading-[1.35] text-off-white/85 min-[800px]:text-[19px]">{t("remote.lead")}</p>
          <DocList cols={3} items={remoteSteps.map((k, i) => ({ id: k, chip: String(i + 1).padStart(2, "0"), title: t(`remote.steps.${k}.title`), text: t(`remote.steps.${k}.text`) }))} />
          <div className="mt-[56px] flex flex-col items-start gap-7 min-[800px]:flex-row min-[800px]:items-end">
            <ToolCard eyebrow={t("remote.tool.eyebrow")} tag={t("remote.tool.tag")} title={t("remote.tool.title")} />
            <ActButton action={{ kind: "contact" }} variant="primary">
              {t("remote.cta")}
            </ActButton>
          </div>
        </RailSection>

        {/* Sharplink "Additional documents": a plain 24px title and the files as a two-column card-document list */}
        <RailSection id="downloads" kind="documents" heading="small" title={t("downloads.title")}>
          <DocList
            items={downloads.map((d) => ({ id: d.key, chip: d.type, title: t(`downloads.items.${d.key}`), file: { label: t("downloads.download"), soon: t("downloads.soon") } }))}
          />
          <p className="eyebrow mt-7 text-[var(--c-sub)]">{t("downloads.note")}</p>
        </RailSection>

        <RailSection id="contacts" kind="light" title={t("contacts.title")}>
          <ContactGrid
            cards={(["support", "sales", "accounts"] as const).map((k) => ({
              id: k,
              title: t(`contacts.${k}.title`),
              who: t(`contacts.${k}.who`),
              lines: [t(`contacts.${k}.text`)],
              link: { label: supportContacts[k].email, href: supportContacts[k].href },
              button: { label: t(`contacts.${k}.cta`), action: { kind: "href", href: supportContacts[k].href } },
            }))}
            wide={{
              title: t("contacts.press.title"),
              cols: [
                { who: supportContacts.legalName, lines: supportContacts.address, link: { label: supportContacts.phone.label, href: supportContacts.phone.href } },
                { who: t("contacts.press.media"), link: { label: supportContacts.press.email, href: supportContacts.press.href } },
              ],
            }}
          />
        </RailSection>

        <RailSection id="faq" kind="last" title={t("faq.title")}>
          <div className="-mt-6 mb-6 flex flex-wrap items-center gap-4 min-[800px]:absolute min-[800px]:right-0 min-[800px]:top-[28px] min-[800px]:mb-0 min-[800px]:mt-0">
            <p className="eyebrow text-ink/60">{t("faq.more")}</p>
            <ContactButton>{t("faq.reach")}</ContactButton>
          </div>
          {/* the shared accordion: filled cards 4px apart, one open at a time */}
          <FaqGroup className="flex flex-col gap-1">
            {faq.map((it, i) => (
              <FaqItem key={i} index={i} q={it.q} a={it.a} />
            ))}
          </FaqGroup>
        </RailSection>
      </RailLayout>
      {/* Sharplink investors sign-up bar: fixed to the bottom, leaves at this point (end of the content, before the footer) */}
      <NewsletterStrip variant="fixed" />
    </>
  );
}
