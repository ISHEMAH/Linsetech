import type { Metadata, ResolvingMetadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";
import DashedLine from "@/components/ui/DashedLine";
import ContactForm from "@/components/sections/news/ContactForm";
import CopyButton from "@/components/sections/news/CopyButton";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return pageMetadata({ locale, path: "/contact", title: t("metaTitle"), description: t("metaDescription") }, parent);
}

const M = "px-[clamp(16px,2.5vw,40px)]";
const eyebrow = "font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em]";
/** Sharplink .contact .item: 28px padding, none on the left of the first column. */
const cell = "relative flex flex-col gap-7 py-7 md:px-7";

/** one horizontal row rule, overshooting the grid by 16px each side (Sharplink .contact .line.horizontal) */
function Rule({ className, flush = false }: { className?: string; flush?: boolean }) {
  return (
    <div className={cn("pointer-events-none absolute h-px", flush ? "inset-x-0" : "-inset-x-4", className)}>
      <DashedLine className="top-0" />
    </div>
  );
}

/** vertical rules on each column edge that meets a gutter (Sharplink pairs them around the 28px gutter) */
function Gutters({ edges = ["1r", "2l", "2r", "3l"] }: { edges?: ("1r" | "2l" | "2r" | "3l")[] }) {
  const pos = { "1r": "left-[calc((100%-56px)/3)]", "2l": "left-[calc((100%-56px)/3+28px)]", "2r": "left-[calc((100%-56px)/3*2+28px)]", "3l": "left-[calc((100%-56px)/3*2+56px)]" };
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
      {edges.map((e) => (
        <div key={e} className={cn("absolute inset-y-0 w-px", pos[e])}>
          <DashedLine direction="vertical" />
        </div>
      ))}
    </div>
  );
}

/**
 * /contact, after sharplink.com/contact: a light page on a three-column dashed grid (paired vertical rules around
 * each gutter, paired horizontal rules at the top). First row = office, phone and hours (their `.main`, address at
 * 24px); second row = the three mailboxes with COPY; then the project form (two columns) beside Support / Careers,
 * and the 400px spacer whose rules run into the footer gradient.
 */
export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  const mail = [
    { key: "general", value: site.email },
    { key: "support", value: site.supportEmail },
    { key: "careers", value: site.careersEmail },
  ] as const;

  return (
    <section data-theme="light" className="relative z-[2] overflow-x-clip text-ink">
      <h1 className="sr-only">{t("title")}</h1>

      <div className={cn("relative pt-[clamp(110px,9vw,146px)]", M)}>
        {/* row 1 — office · phone · hours */}
        <div className="relative grid gap-x-7 pt-7 md:grid-cols-3">
          <Gutters />
          <Rule className="top-0" />
          <Rule className="top-7" />
          <div className={cn(cell, "md:pl-0")}>
            <p className={eyebrow}>{t("office")}</p>
            <address className="text-[clamp(20px,1.6vw,24px)] font-medium not-italic leading-[1.4] tracking-[-0.01em]">
              {site.address.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
          </div>
          <div className={cell}>
            <p className={eyebrow}>{t("phone")}</p>
            <div className="flex flex-col items-start gap-2">
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="link text-[clamp(20px,1.6vw,24px)] font-medium leading-[1.4] tracking-[-0.01em]">
                {site.phone}
              </a>
              <CopyButton value={site.phone} label={t("copy")} done={t("copied")} />
            </div>
          </div>
          <div className={cell}>
            <p className={eyebrow}>{t("hours")}</p>
            <ul className="text-[clamp(16px,1.25vw,19px)] font-medium leading-[1.5]">
              <li>{t("hoursLines.week")}</li>
              <li>{t("hoursLines.sat")}</li>
              <li className="text-ink/50">{t("hoursLines.sun")}</li>
            </ul>
            <p className={cn(eyebrow, "-mt-3 text-ink/50")}>{t("timezone")}</p>
          </div>
        </div>

        {/* row 2 — mailboxes */}
        <div className="relative grid gap-x-7 md:grid-cols-3">
          <Gutters />
          <Rule className="top-0" />
          {mail.map((m, i) => (
            <div key={m.key} className={cn(cell, i === 0 && "md:pl-0")}>
              <p className={eyebrow}>{t(m.key)}</p>
              <div className="flex flex-col items-start gap-2">
                <a href={`mailto:${m.value}`} className="link break-all text-[clamp(19px,1.6vw,24px)] font-medium leading-[1.4] tracking-[-0.01em]">
                  {m.value}
                </a>
                <CopyButton value={m.value} label={t("copy")} done={t("copied")} />
              </div>
            </div>
          ))}
        </div>

        {/* row 3 — the form (2 columns) and the other doors */}
        <div className="relative grid gap-x-7 md:grid-cols-3">
          <Gutters edges={["2r", "3l"]} />
          <Rule className="top-0" />
          <div className="relative py-7 md:col-span-2 md:pr-7">
            <div>
              <p className={cn(eyebrow, "sq text-ink/60")}>{t("formEyebrow")}</p>
              <h2 className="mt-5 text-[clamp(26px,2.2vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]">{t("formTitle")}</h2>
              <p className="mt-3 max-w-[48ch] text-[16px] leading-[1.45] text-ink/65">{t("formSub")}</p>
            </div>
            <div className="mt-10">
              <ContactForm />
            </div>
          </div>
          <div className="relative flex flex-col py-7 md:px-7">
            <p className={cn(eyebrow, "text-ink/60")}>{t("links.eyebrow")}</p>
            <div className="mt-5 flex flex-col">
              {(["support", "careers"] as const).map((k, i) => (
                <div key={k} className={cn("door relative py-7", i === 0 && "pt-2")}>
                  {i > 0 && <Rule className="top-0" flush />}
                  <h3 className="text-[clamp(17px,1.25vw,19px)] font-medium leading-[1.35]">{t(`links.${k}Title`)}</h3>
                  <p className="mt-2 text-[15px] leading-[1.45] text-ink/60">{t(`links.${k}Text`)}</p>
                  <ButtonLink href={`/${k}`} variant="secondary" className="mt-5">
                    {t(`links.${k}Cta`)}
                  </ButtonLink>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* spacer: Sharplink keeps 400px of grid under the content before the footer */}
        <div className="relative h-[clamp(200px,24vw,400px)]">
          <Gutters />
          <Rule className="top-0" />
        </div>
      </div>
    </section>
  );
}
