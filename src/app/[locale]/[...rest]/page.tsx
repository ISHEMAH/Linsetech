import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { brandTitle, toLocale } from "@/lib/seo";

/** Same 404 title as [locale]/not-found.tsx, whose metadata replaces this once notFound() is thrown. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "notFoundPage" });
  return { title: { absolute: brandTitle(t("metaTitle")) }, robots: { index: false } };
}

/** Any unknown path under a locale renders [locale]/not-found.tsx inside the site layout (next-intl pattern). */
export default function CatchAll() {
  notFound();
}
