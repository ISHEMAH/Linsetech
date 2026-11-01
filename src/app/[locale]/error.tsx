"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";

/**
 * Error boundary for the pages of a locale. It renders inside the site layout (header and footer stay), as a dark
 * band with the ui buttons: `retry` re-fetches and re-renders the segment, the link goes back to the home page.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("seo.error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  // server errors reach the client as a generic Error with a digest that matches the server logs
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <section data-theme="dark" className="bg-dark relative z-[2] flex min-h-[100lvh] flex-col justify-center gap-6 px-[clamp(16px,2.5vw,40px)] pb-[52px] pt-[clamp(104px,8vw,118px)] text-off-white">
      <p className="eyebrow text-off-white/60">{t("eyebrow")}</p>
      <h1 className="h1-sm max-w-[18ch]">{t("title")}</h1>
      <p className="max-w-[46ch] text-[16px] font-medium leading-[1.35] text-off-white/75 min-[800px]:text-[19px]">{t("text")}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Button type="button" onClick={() => retry()}>
          {t("retry")}
        </Button>
        <ButtonLink href="/" variant="secondary">
          {t("home")}
        </ButtonLink>
      </div>
      {digest && <p className="eyebrow mt-4 text-off-white/40">{t("reference", { digest })}</p>}
    </section>
  );
}
