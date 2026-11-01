import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import Reveal from "@/components/motion/Reveal";
import DarkGradient from "@/components/backdrop/DarkGradient";
import HideFooter from "@/components/sections/news/HideFooter";
import { brandTitle, toLocale } from "@/lib/seo";

/** Own title (absolute: the layout's template is not applied when notFound() comes from the layout segment itself). Next adds noindex. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: toLocale(locale), namespace: "notFoundPage" });
  return { title: { absolute: brandTitle(t("metaTitle")) } };
}

/**
 * Sharplink's 404 (main.error): a light screen, "Page not found" eyebrow, the 32px apology on two lines and a
 * secondary "Return home" button, with the dark arc rising from the bottom (gradient-bg-dark "bottom", 60% tall);
 * the footer is not shown. Same composition in our light green → dark green.
 */
export default function NotFound() {
  const t = useTranslations("notFoundPage");
  return (
    <section data-theme="light" className="relative z-[2] min-h-[100lvh] overflow-hidden text-ink">
      <HideFooter />
      {/* Sharplink .error .gradient: flipped dark gradient, 70% tall, 50px below the screen, not scroll-scaled (measured 910px at 1000px) */}
      <DarkGradient position="bottom" height="70%" heightMobile="60%" parallax={false} style={{ bottom: -50 }} />
      <div className="relative flex min-h-[100lvh] flex-col gap-6 px-[clamp(16px,2.5vw,40px)] pb-[52px] pt-[clamp(104px,8vw,118px)]">
        <DashedLine className="top-[96px] md:hidden" />
        <Reveal>
          <p className="font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em]">{t("eyebrow")}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="whitespace-pre-line text-[clamp(26px,2.2vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]">{t("title")}</h1>
        </Reveal>
        <Reveal delay={0.2} className="mt-1">
          <ButtonLink href="/" variant="secondary">
            {t("cta")}
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
