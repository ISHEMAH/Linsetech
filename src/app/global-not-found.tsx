import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Arrow } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { routing } from "@/i18n/routing";
import { brandTitle } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const archivoNarrow = Archivo_Narrow({ subsets: ["latin"], variable: "--font-archivo-narrow", display: "swap" });

/*
 * 404 for URLs that match no route at all: paths the proxy skips (anything with a file extension, /api/…), which
 * never reach the [locale] layout. Next renders this document directly, so it imports the global styles and fonts
 * itself. There is no locale on these URLs: the copy is the default locale's (Next adds the noindex tag).
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "notFoundPage" });
  return { title: brandTitle(t("metaTitle")) };
}

export default async function GlobalNotFound() {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "notFoundPage" });

  return (
    <html lang={routing.defaultLocale} className={`${archivo.variable} ${archivoNarrow.variable} h-full overflow-x-clip antialiased`}>
      <body className="min-h-full flex flex-col">
        <main data-theme="dark" className="bg-dark flex flex-1 flex-col justify-between gap-16 px-[clamp(16px,2.5vw,40px)] pb-[52px] pt-7 text-off-white">
          <Link href="/" className="self-start text-[1.05rem]">
            <Logo />
          </Link>
          <div className="flex flex-col gap-6">
            <p className="eyebrow text-off-white/60">{t("eyebrow")}</p>
            <h1 className="whitespace-pre-line text-[clamp(26px,2.2vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]">{t("title")}</h1>
            <Link href="/" className="ui-btn ui-btn--primary has-icon mt-1 self-start">
              <span className="ui-btn__content">
                <span>{t("cta")}</span>
                <span aria-hidden>{t("cta")}</span>
              </span>
              <span className="ui-btn__icon">
                <span>
                  <Arrow />
                </span>
                <span aria-hidden>
                  <Arrow />
                </span>
              </span>
              <span className="ui-btn__icon ui-btn__icon--left" aria-hidden>
                <span>
                  <Arrow />
                </span>
                <span>
                  <Arrow />
                </span>
              </span>
            </Link>
          </div>
          <span aria-hidden />
        </main>
      </body>
    </html>
  );
}
