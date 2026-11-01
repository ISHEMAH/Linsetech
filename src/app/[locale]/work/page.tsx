import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import WorkIndex from "@/components/sections/pages/WorkIndex";
import WaveLinks from "@/components/sections/work/WaveLinks";
import { localizeProjects } from "@/components/sections/work/localize";
import { getProjects } from "@/sanity/data";
import type { Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workPage.meta" });
  return pageMetadata({ locale, path: "/work", title: t("title"), description: t("description") }, parent);
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("workPage");
  const over = t.has("content") ? (t.raw("content") as Record<string, unknown>) : null;
  const projects = localizeProjects(await getProjects(locale as Locale), over);

  return (
    <div data-wave-scope>
      <WorkIndex projects={projects} />
      <WaveLinks />
    </div>
  );
}
