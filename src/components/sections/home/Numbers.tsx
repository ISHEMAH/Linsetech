"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { LOGO_PATHS } from "@/components/ui/Logo";
import Decode from "@/components/motion/Decode";

/** Sample KPIs: edit in the Studio (siteSettings.numbers) once real figures are confirmed. */
const KPIS = [
  { key: "projects", value: 24, suffix: "", spark: [3, 5, 4, 7, 9, 8, 12, 14] },
  { key: "products", value: 1, suffix: "", spark: [0, 0, 0, 1, 1, 1, 1, 1] },
  { key: "devices", value: 1200, suffix: "+", spark: [40, 90, 120, 260, 380, 520, 800, 1200] },
  { key: "uptime", value: 99.9, suffix: "%", spark: [99.2, 99.5, 99.7, 99.8, 99.9, 99.9, 99.9, 99.9] },
] as const;

function sparkPath(vals: readonly number[]) {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 100, 28 - ((v - min) / (max - min || 1)) * 24]);
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
}

export default function Numbers() {
  const t = useTranslations("numbers");
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      el.querySelectorAll<HTMLElement>(".kpi").forEach((kpi, i) => {
        const num = kpi.querySelector<HTMLElement>(".num")!;
        const target = Number(num.dataset.value);
        const decimals = target % 1 ? 1 : 0;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: prefersReducedMotion() ? 0 : 1.8,
          delay: i * 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: kpi, start: "top 85%", once: true },
          onUpdate: () => (num.textContent = obj.v.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })),
        });
        gsap.to(kpi.querySelector(".sparkline path"), { strokeDashoffset: 0, duration: 1.6, delay: i * 0.12, scrollTrigger: { trigger: kpi, start: "top 85%", once: true } });
      });
      gsap.from(".kpi", { y: 40, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: el, start: "top 75%", once: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-theme="dark" data-chapter="numbers" className="bg-dark relative overflow-hidden px-page py-24 text-white md:py-36">
      <svg viewBox="0 0 640 552" className="pointer-events-none absolute -right-20 top-1/2 h-[120%] -translate-y-1/2 opacity-[0.12]" fill="none" stroke="#4ade80" strokeWidth="1.2" aria-hidden>
        {LOGO_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      <div className="relative mx-auto max-w-7xl">
        <p className="eyebrow text-green-300">{t("eyebrow")}</p>
        <h2 className="display mt-4 text-[clamp(2.2rem,5vw,4.6rem)]">
          <Decode text={t("title")} />
        </h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.key} className="kpi rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <p className="font-narrow text-xs uppercase tracking-[0.16em] text-white/55">{t(`items.${k.key}`)}</p>
              <p className="mt-6 text-5xl font-medium tracking-[-0.04em] tabular-nums">
                <span className="num" data-value={k.value}>0</span>
                <span className="text-green-300">{k.suffix}</span>
              </p>
              <svg viewBox="0 0 100 30" className="sparkline mt-6 h-8 w-full" preserveAspectRatio="none" aria-hidden>
                <path d={sparkPath(k.spark)} fill="none" stroke="#4ade80" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
