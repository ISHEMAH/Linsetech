"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import SplitReveal from "@/components/motion/SplitReveal";
import { services } from "@/content/services";
import { Arrow } from "@/components/ui/Button";
import ServiceIcon from "@/components/ui/ServiceIcon";

/** H3: service cards land on the grid. */
export default function WhatWeDo() {
  const t = useTranslations("whatWeDo");
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".card", {
        y: 90,
        rotateX: 14,
        opacity: 0,
        transformOrigin: "50% 100%",
        duration: 1.3,
        stagger: 0.1,
        scrollTrigger: { trigger: ".cards", start: "top 80%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="light" data-chapter="services" className="bg-body px-page py-24 md:py-36">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow text-green-600">{t("eyebrow")}</p>
        <SplitReveal className="display mt-4 max-w-3xl text-[clamp(2.2rem,5vw,4.6rem)]">{t("title")}</SplitReveal>
        <div className="cards mt-14 grid gap-4 [perspective:1400px] sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}` as never}
              className="card group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl border border-green-900/10 bg-white/70 p-6 backdrop-blur-sm transition-colors hover:border-green-500/50"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-300 text-green-900 shadow-inner">
                  <ServiceIcon name={s.key} className="h-7 w-7" />
                </span>
                <span className="font-narrow text-xs text-green-700/70">0{i + 1}</span>
              </div>
              <div>
                <h3 className="text-2xl font-medium tracking-[-0.02em]">{t(`items.${s.key}.title`)}</h3>
                <p className="mt-2 text-sm text-ink/65">{t(`items.${s.key}.blurb`)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-green-600">
                  {t("explore")}
                  <Arrow className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-300/20 blur-3xl transition-opacity group-hover:opacity-100 md:opacity-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
