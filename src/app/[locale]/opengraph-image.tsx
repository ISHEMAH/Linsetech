import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTranslations } from "next-intl/server";
import { LOGO_PATHS } from "@/components/ui/Logo";
import { site } from "@/content/site";
import { SITE_URL, toLocale } from "@/lib/seo";

/** Pages swap in a localized, descriptive alt (src/lib/seo.ts → pageMetadata). */
export const alt = site.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Archivo (the site's typeface; this local file is the SemiBold cut, with every glyph the three locales need). If it
 * cannot be read — e.g. a deployment that does not ship tools/ — the card falls back to next/og's built-in sans.
 */
const archivo = readFile(join(process.cwd(), "src/app/fonts/Archivo-SemiBold.ttf")).catch(() => null);

const OFF_WHITE = "#f3f3f3";

function Mark({ width, color }: { width: number; color: string }) {
  return (
    <svg viewBox="0 0 640 552" width={width} height={Math.round((width * 552) / 640)} fill={color}>
      {LOGO_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Default share card for every page of a locale: dark green field, the LS mark, "Linse" and the site title. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale);
  const [t, font] = await Promise.all([getTranslations({ locale, namespace: "seo" }), archivo]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          padding: "72px 80px",
          backgroundColor: "#020a07",
          backgroundImage: "linear-gradient(135deg, #020a07 0%, #04150f 45%, #0b3d24 100%)",
          color: OFF_WHITE,
          ...(font ? { fontFamily: "Archivo" } : {}),
        }}
      >
        <div style={{ position: "absolute", right: -130, bottom: -150, display: "flex" }}>
          <Mark width={720} color="rgba(243, 243, 243, 0.06)" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Mark width={72} color={OFF_WHITE} />
          <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: -1.6 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ maxWidth: 960, fontSize: 74, fontWeight: 600, lineHeight: 1.06, letterSpacing: -2.4, textWrap: "balance" }}>{t("ogTitle")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(243, 243, 243, 0.62)" }}>
            <div style={{ width: 10, height: 10, backgroundColor: "#22c55e" }} />
            {new URL(SITE_URL).host}
          </div>
        </div>
      </div>
    ),
    { ...size, ...(font ? { fonts: [{ name: "Archivo", data: font, weight: 600, style: "normal" }] } : {}) },
  );
}
