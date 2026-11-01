import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { site } from "@/content/site";
import { THEME_COLOR } from "@/lib/seo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // one manifest for the whole site: written in the default locale
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "meta" });
  return {
    name: site.name,
    short_name: site.name,
    description: t("description"),
    lang: routing.defaultLocale,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
