import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LegalPage from "@/components/sections/company/LegalPage";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalPage.privacy.meta" });
  return pageMetadata({ locale, path: "/privacy", title: t("title"), description: t("description") }, parent);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legalPage.privacy");
  return (
    <LegalPage
      title={t("title")}
      intro={t.raw("intro") as { heading: string; body: string[] }}
      sections={t.raw("sections") as { title: string; body: string[] }[]}
      email={site.email}
    />
  );
}
