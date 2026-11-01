import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PageHero from "@/components/sections/PageHero";
import { slClip } from "@/content/clips";
import { roles, openApplication, teams, perks, hiringSteps, lifeTiles, careersContact, type Role } from "@/content/careers";
import RailLayout from "@/components/sections/company/RailLayout";
import RailSection from "@/components/sections/company/RailSection";
import FactsBand from "@/components/sections/company/FactsBand";
import HeroCards from "@/components/sections/company/HeroCards";
import HeroWrapper from "@/components/sections/company/HeroWrapper";
import OpenRoles, { type RoleView } from "@/components/sections/company/OpenRoles";
import DocList from "@/components/sections/company/DocList";
import ContactGrid from "@/components/sections/company/ContactGrid";
import TitleReveal from "@/components/sections/company/TitleReveal";
import { TileGrid, Pictogram, MarkOutline } from "@/components/sections/company/Tiles";
import { ActButton } from "@/components/sections/company/actions";
import { ArrowDown } from "@/components/sections/company/icons";
import { pageMetadata } from "@/lib/seo";
import NewsletterStrip from "@/components/sections/pages/NewsletterStrip";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careersPage.meta" });
  return pageMetadata({ locale, path: "/careers", title: t("title"), description: t("description") }, parent);
}

const ART = { fullstack: "laptop", technician: "box", open: "people" } as const;

/**
 * /careers on Sharplink's /investors system: hero (coin clip, investors overlay, 120% gradient, cards in columns 9–12)
 * → light facts band (their Nasdaq block) → open roles (press releases: flipped gradient, light → black) → perks + how
 * we hire (governance: black) → life at Linse (documents: top gradient, black → green → arc into the light page) →
 * apply (contacts: transparent light) → footer. The sticky rail spans the widgets.
 */
export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("careersPage");

  const view = (r: Role): RoleView => ({
    slug: r.slug,
    title: t(`role.${r.key}.title`),
    team: r.team,
    teamLabel: t(`teams.${r.team}`),
    typeLabel: t(`types.${r.type}`),
    location: r.location,
    summary: t(`role.${r.key}.summary`),
    do: t.raw(`role.${r.key}.do`) as string[],
    bring: t.raw(`role.${r.key}.bring`) as string[],
    art: ART[r.key],
  });
  const roleViews = roles.map(view);
  const openView = view(openApplication);

  const rail = [
    { id: "open-roles", label: t("rail.roles") },
    { id: "perks", label: t("rail.perks") },
    { id: "how-we-hire", label: t("rail.hiring") },
    { id: "life", label: t("rail.life") },
    { id: "apply", label: t("rail.apply") },
  ];

  return (
    <>
      <HeroWrapper>
        <PageHero
          title={t("hero.title")}
          sub={t("hero.lead")}
          clip={slClip("sl_coin_careers")}
          overlay="investors"
          gradientHeight="120%"
          cards={
            <HeroCards
              feature={{ eyebrow: t("cards.hire.eyebrow"), tag: t("cards.hire.tag"), title: t("cards.hire.title"), action: { kind: "scroll", target: "#how-we-hire" } }}
              sliderTitle={t("cards.roles")}
              slides={[...roleViews, openView].map((r) => ({ eyebrow: r.typeLabel, tag: r.location, title: r.title, action: { kind: "role" as const, slug: r.slug } }))}
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
        card={{ label: t("band.card.label"), value: String(roles.length), note: t("band.card.note") }}
        facts={t.raw("band.facts") as { label: string; value: string }[]}
      />

      <RailLayout items={rail} label={t("rail.label")}>
        <RailSection id="open-roles" kind="press" title={t("roles.title")}>
          <OpenRoles
            roles={roleViews}
            open={openView}
            teams={teams.map((k) => ({ key: k, label: t(`teams.${k}`) }))}
            email={careersContact.email}
            labels={{
              search: t("roles.search"),
              allTeams: t("roles.allTeams"),
              empty: t("roles.empty"),
              view: t("roles.view"),
              drawer: {
                heading: t("drawer.heading"),
                close: t("drawer.close"),
                about: t("drawer.about"),
                do: t("drawer.do"),
                bring: t("drawer.bring"),
                apply: t("drawer.apply"),
                email: t("drawer.email"),
                note: t("drawer.note", { email: careersContact.email }),
              },
            }}
          />
        </RailSection>

        <RailSection id="perks" kind="black" title={t("rail.perks")}>
          <TileGrid
            tone="dark"
            cards={perks.map((p) => ({
              id: p.key,
              art: <Pictogram name={p.icon} />,
              title: t(`perks.items.${p.key}.title`),
              label: t(`perks.items.${p.key}.label`),
              text: t(`perks.items.${p.key}.text`),
            }))}
          />
        </RailSection>

        <RailSection id="how-we-hire" kind="black" title={t("hiring.title")}>
          <DocList items={hiringSteps.map((k, i) => ({ id: k, chip: String(i + 1).padStart(2, "0"), title: t(`hiring.steps.${k}.title`), text: t(`hiring.steps.${k}.text`) }))} />
        </RailSection>

        <RailSection id="life" kind="documents" title={t("life.title")}>
          <TitleReveal
            as="p"
            text={t("life.statement")}
            scrub={{ start: "top 85%", end: "bottom 45%" }}
            initial={0.2}
            order="reading"
            className="mb-[56px] max-w-[24em] text-[26px] font-normal leading-[1.15] tracking-[-0.02em] min-[800px]:mb-[84px] min-[800px]:text-[clamp(26px,2.45vw,44px)]"
          />
          <TileGrid tone="light" cards={lifeTiles.map((k) => ({ id: k, art: <MarkOutline />, title: t(`life.tiles.${k}`), label: t("life.photos") }))} />
        </RailSection>

        <RailSection id="apply" kind="last" title={t("apply.title")}>
          <ContactGrid
            cards={[
              {
                id: "careers",
                title: t("apply.careers.title"),
                who: t("apply.careers.who"),
                lines: [t("apply.careers.text")],
                link: { label: careersContact.email, href: `mailto:${careersContact.email}` },
                button: { label: t("apply.careers.cta"), action: { kind: "href", href: `mailto:${careersContact.email}` } },
              },
              {
                id: "open",
                title: t("apply.open.title"),
                who: t("apply.open.who"),
                lines: [t("apply.open.text")],
                button: { label: t("apply.open.cta"), action: { kind: "contact", topic: "careers" } },
              },
              {
                id: "office",
                title: t("apply.office.title"),
                who: careersContact.legalName,
                lines: careersContact.address,
                button: { label: t("apply.office.cta"), action: { kind: "href", href: careersContact.maps, external: true } },
              },
            ]}
          />
        </RailSection>
      </RailLayout>
      {/* Sharplink investors sign-up bar: fixed to the bottom, leaves at this point (end of the content, before the footer) */}
      <NewsletterStrip variant="fixed" />
    </>
  );
}
