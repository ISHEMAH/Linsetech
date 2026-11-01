"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { Arrow, Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { routing, type Locale } from "@/i18n/routing";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const archivoNarrow = Archivo_Narrow({ subsets: ["latin"], variable: "--font-archivo-narrow", display: "swap" });

/** a copy of messages seo.error: this page ships with every page, and importing the message files would bundle them all */
type Copy = { eyebrow: string; title: string; text: string; retry: string; home: string; reference: string };
const COPY: Record<Locale, Copy> = {
  en: { eyebrow: "Error", title: "Something went wrong", text: "This page could not be displayed. Try again, or go back to the home page.", retry: "Try again", home: "Return home", reference: "Error reference: {digest}" },
  fr: { eyebrow: "Erreur", title: "Une erreur est survenue", text: "Cette page n’a pas pu s’afficher. Réessayez ou revenez à l’accueil.", retry: "Réessayer", home: "Retour à l’accueil", reference: "Référence de l’erreur : {digest}" },
  rw: { eyebrow: "Ikosa", title: "Habaye ikibazo", text: "Uru rupapuro ntirwashoboye kugaragara. Ongera ugerageze, cyangwa usubire ahabanza.", retry: "Ongera ugerageze", home: "Subira ahabanza", reference: "Kode y’ikosa: {digest}" },
};

/**
 * Shown when the root layout itself fails. It replaces that layout, so it brings its own document, global styles and
 * fonts, and has no next-intl provider: the copy (kept in step with messages seo.error) follows the locale of the URL.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const first = (usePathname() ?? "/").split("/")[1];
  const locale = routing.locales.find((l) => l === first) ?? routing.defaultLocale;
  const t = COPY[locale];
  const home = locale === routing.defaultLocale ? "/" : `/${locale}`;

  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <html lang={locale} className={`${archivo.variable} ${archivoNarrow.variable} h-full overflow-x-clip antialiased`}>
      <body className="min-h-full flex flex-col">
        <title>{`${t.title} — Linse`}</title>
        <main data-theme="dark" className="bg-dark flex flex-1 flex-col justify-between gap-16 px-[clamp(16px,2.5vw,40px)] pb-[52px] pt-7 text-off-white">
          <a href={home} className="self-start text-[1.05rem]">
            <Logo />
          </a>
          <div className="flex flex-col gap-6">
            <p className="eyebrow text-off-white/60">{t.eyebrow}</p>
            <h1 className="h1-sm max-w-[18ch]">{t.title}</h1>
            <p className="max-w-[46ch] text-[16px] font-medium leading-[1.35] text-off-white/75 min-[800px]:text-[19px]">{t.text}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button type="button" onClick={() => retry()}>
                {t.retry}
              </Button>
              {/* a full page load: the app state that failed is not reused (ButtonLink needs the next-intl provider) */}
              <a href={home} className="ui-btn ui-btn--secondary has-icon">
                <span className="ui-btn__content">
                  <span>{t.home}</span>
                  <span aria-hidden>{t.home}</span>
                </span>
                <span className="ui-btn__icon">
                  <span>
                    <Arrow />
                  </span>
                  <span aria-hidden>
                    <Arrow />
                  </span>
                </span>
              </a>
            </div>
          </div>
          <p className="eyebrow min-h-[1.4em] text-off-white/40">{digest && t.reference.replace("{digest}", digest)}</p>
        </main>
      </body>
    </html>
  );
}
