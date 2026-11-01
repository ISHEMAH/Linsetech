"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Check, CopyIcon, Download } from "@/components/sections/news/Icons";
import { cn } from "@/lib/cn";

const label = "font-narrow text-[13px] font-medium uppercase leading-[1.4] tracking-[0.08em]";

/** "← All articles" (Sharplink .back-cta: narrow 13px, 12px icon, colour fades on hover in .2s). */
export function BackLink({ className }: { className?: string }) {
  const t = useTranslations("newsPage.article");
  return (
    <Link href="/news" className={cn(label, "flex w-fit items-center gap-2 text-ink transition-colors duration-200 ease-[var(--ease-in-out-quad)] hover:text-ink/50", className)}>
      <ArrowLeft />
      {t("back")}
    </Link>
  );
}

/**
 * Sharplink article aside panels: "Share:" with stacked secondary buttons (LinkedIn, X/Twitter, copy link) and
 * "Download:" with a PDF button + icon box. Without a PDF file the button prints the page (save as PDF).
 * `layout="rail"` stacks them for the sticky left rail, `layout="inline"` lays them out in rows under the article
 * on small screens.
 */
export default function ShareRail({ title, pdf, layout = "rail", className }: { title: string; pdf?: string; layout?: "rail" | "inline"; className?: string }) {
  const t = useTranslations("newsPage.article");
  const [copied, setCopied] = useState(false);
  const share = (kind: "linkedin" | "x") => {
    const url = encodeURIComponent(window.location.href);
    const href = kind === "linkedin" ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}` : `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${url}`;
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=640");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  const stack = layout === "rail" ? "flex-col items-start" : "flex-row flex-wrap";

  return (
    <div className={cn("flex", layout === "rail" ? "flex-col" : "flex-col gap-6 sm:flex-row sm:gap-12", className)}>
      <div className="flex flex-col items-start">
        <p className={cn(label, "mb-[10px] text-ink/60")}>{t("share")}</p>
        <div className={cn("flex gap-[2px]", stack)}>
          <Button variant="secondary" arrow={false} onClick={() => share("linkedin")}>
            LinkedIn
          </Button>
          <Button variant="secondary" arrow={false} onClick={() => share("x")}>
            X/Twitter
          </Button>
          <Button variant="secondary" icon={copied ? <Check /> : <CopyIcon />} onClick={copy} aria-live="polite">
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      </div>
      <div className={cn("flex flex-col items-start", layout === "rail" && "mt-6")}>
        <p className={cn(label, "mb-[10px] text-ink/60")}>{t("download")}</p>
        {pdf ? (
          <a href={pdf} target="_blank" rel="noreferrer" className="ui-btn ui-btn--secondary has-icon">
            <span className="ui-btn__content">
              <span>{t("pdf")}</span>
              <span aria-hidden>{t("pdf")}</span>
            </span>
            <span className="ui-btn__icon">
              <span>
                <Download />
              </span>
              <span aria-hidden>
                <Download />
              </span>
            </span>
          </a>
        ) : (
          <Button variant="secondary" icon={<Download />} onClick={() => window.print()}>
            {t("pdf")}
          </Button>
        )}
      </div>
    </div>
  );
}
