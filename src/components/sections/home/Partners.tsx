import { useTranslations } from "next-intl";
import { partnerBadges } from "@/content/hardware";

/** H9: logo marquee (text badges until partner logos are supplied). */
export default function Partners() {
  const t = useTranslations("partners");
  const items = [...partnerBadges, ...partnerBadges];
  return (
    <section data-theme="light" className="bg-paper py-16">
      <div className="px-page mx-auto max-w-7xl">
        <p className="eyebrow text-green-600">{t("eyebrow")}</p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.02em]">{t("title")}</h2>
      </div>
      <div className="mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ul className="marquee-track flex w-max gap-3" style={{ ["--marquee-duration" as string]: "38s" }}>
          {items.map((p, i) => (
            <li key={i} className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm text-ink/70 whitespace-nowrap">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
