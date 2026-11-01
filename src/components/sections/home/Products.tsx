import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Reveal from "@/components/motion/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import { Arrow } from "@/components/ui/Button";
import { projects } from "@/content/work";
import { hardwareBrands, featuredDevices } from "@/content/hardware";

/** H8: software we publish + hardware we distribute. */
export default function Products() {
  const t = useTranslations("products");
  const macye = projects.find((p) => p.slug === "macyepay")!;
  return (
    <section data-theme="light" data-chapter="products" className="bg-body px-page py-24 md:py-36">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-green-600">{t("eyebrow")}</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Software */}
          <Reveal className="flex flex-col rounded-[2rem] bg-green-950 p-8 text-white md:p-10">
            <SplitReveal as="h2" className="display text-[clamp(1.8rem,3.4vw,2.8rem)]">{t("softwareTitle")}</SplitReveal>
            <p className="mt-3 text-white/65">{t("softwareBlurb")}</p>
            <Link href={`/work/${macye.slug}` as never} className="group mt-8 flex flex-1 flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
              <div className="flex items-center justify-between">
                <Image src="/work/macyepay/logo.svg" alt="MacyePay" width={140} height={36} className="h-8 w-auto brightness-0 invert" />
                <span className="lbl">{macye.tag.split("·")[1]?.trim()}</span>
              </div>
              <p className="mt-6 text-lg text-white/85">{macye.blurb}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {macye.stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-medium tracking-[-0.02em] text-green-300">{s.value}</p>
                    <p className="text-xs text-white/50">{s.label}</p>
                  </div>
                ))}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-green-300">
                {t("learn")}
                <Arrow className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>

          {/* Hardware */}
          <Reveal className="flex flex-col rounded-[2rem] border border-green-900/10 bg-white/70 p-8 md:p-10" delay={0.1}>
            <SplitReveal as="h2" className="display text-[clamp(1.8rem,3.4vw,2.8rem)]">{t("hardwareTitle")}</SplitReveal>
            <p className="mt-3 text-ink/65">{t("hardwareBlurb")}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {hardwareBrands.map((b) => (
                <li key={b} className="rounded-full border border-ink/10 bg-white px-3 py-1 font-narrow text-xs uppercase tracking-[0.12em] text-ink/70">
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid flex-1 gap-3 sm:grid-cols-3">
              {featuredDevices.map((d) => (
                <div key={d.name} className="flex flex-col justify-between rounded-2xl bg-gradient-to-b from-green-100 to-green-50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
                  <span className="lbl">{d.tag}</span>
                  <div className="mt-8">
                    <p className="font-medium">{d.name}</p>
                    <p className="mt-1 text-xs text-ink/60">{d.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/services/hardware-and-distribution" className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-green-600">
              {t("catalogue")}
              <Arrow className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
