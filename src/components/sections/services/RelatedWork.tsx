import Image from "next/image";
import { Link } from "@/i18n/navigation";
import SplitReveal from "@/components/motion/SplitReveal";
import { Arrow } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { BODY, GRID, TITLE, TopSpacer } from "./Lines";
import { cn } from "@/lib/cn";

export type RelatedItem = { slug: string; title: string; tag: string; blurb: string; cover: string | null; year: string };

/** Icon-only ui-button that plays its hover with the card around it (Sharplink `allow-parent-hover`). */
function IconBox() {
  return (
    <span className="ui-btn ui-btn--secondary has-icon allow-parent-hover shrink-0" aria-hidden>
      <span className="ui-btn__icon">
        <span>
          <Arrow />
        </span>
        <span>
          <Arrow />
        </span>
      </span>
    </span>
  );
}

/**
 * Related case studies on the transparent light page (z 3: above the dark block's gradient spilling into it): top spacer,
 * pinned rule, title + blurb columns, then image cards (card-hover: tint + 1.08 image zoom, icon box plays its hover).
 */
export default function RelatedWork({ title, blurb, items, viewLabel }: { title: string; blurb: string; items: RelatedItem[]; viewLabel: string }) {
  if (!items.length) return null;
  return (
    <section data-theme="light" className="relative z-[3] pb-[108px] text-ink min-[800px]:pb-[150px]">
      <TopSpacer />
      <div className={cn(GRID, "pt-[28px]")}>
        <div className="col-span-4">
          <SplitReveal as="h2" className={TITLE}>
            {title}
          </SplitReveal>
        </div>
        <div className="col-span-4 mt-6 min-[800px]:col-span-7 min-[800px]:col-start-6 min-[800px]:mt-0">
          <p className={cn("max-w-[680px]", BODY)}>{blurb}</p>
        </div>
      </div>
      <ul className={cn(GRID, "mt-14 gap-y-10 min-[800px]:mt-20")}>
        {items.map((it) => (
          <li key={it.slug} className="rel col-span-4">
            <Link href={`/work/${it.slug}` as never} className="card-hover group block h-full" aria-label={`${viewLabel}: ${it.title}`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-[#dfece4]">
                {it.cover ? (
                  <Image src={it.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="card-img object-cover" />
                ) : (
                  <div className="card-img flex h-full w-full items-center justify-center">
                    <LogoMark className="h-12 text-ink/20" />
                  </div>
                )}
                <span className="absolute left-0 top-0 h-[6px] w-[6px] bg-green-400" aria-hidden />
              </div>
              <div className="flex items-start justify-between gap-6 px-1 py-5 md:px-2">
                <div>
                  <p className="eyebrow text-ink/60">
                    {it.tag} · {it.year}
                  </p>
                  <h3 className="mt-2 text-[22px] leading-[1.2] tracking-[-0.01em] md:text-[26px]">{it.title}</h3>
                  <p className="mt-3 max-w-[44ch] text-[14px] font-medium leading-[1.4] text-ink/60">{it.blurb}</p>
                </div>
                <IconBox />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
