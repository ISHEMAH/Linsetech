import { useTranslations } from "next-intl";
import SplitReveal from "@/components/motion/SplitReveal";
import DashedLine from "@/components/ui/DashedLine";
import FaqItem, { FaqGroup } from "@/components/sections/FaqItem";
import { ContactButton } from "@/components/sections/ContactButton";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

/**
 * Sharplink "section-faq": a three-column header (title | empty | "Got more questions?" + Reach us) framed by dashed
 * lines with the brand pin, then the list in columns 5–12: filled cards 4px apart, one open at a time. The title
 * develops letter by letter at "top 80%"; the rows themselves are static (no entrance animation). `eyebrow` is kept for
 * callers but, as on Sharplink, not shown.
 */
export default function FAQ({ title, items, top = "spaced" }: { eyebrow?: string; title: string; items: Item[]; top?: "spaced" | "flush" | "tail" }) {
  const t = useTranslations("faq");
  // "flush": the dashed rule opens the section (the home page, where the news above leaves Sharplink's 160px);
  // "spaced": room above it, so after a section without bottom padding the title sits where it always did;
  // "tail": room for a dark gradient trailing out of the section above to fade first (/services, after its dark close)
  return (
    <section data-theme="light" className={cn("section-faq relative z-[3] px-[clamp(16px,2.5vw,40px)] pb-6 text-ink min-[800px]:pb-36", top === "spaced" && "pt-[84px]", top === "tail" && "pt-[360px]")}>
      <div className="relative grid grid-cols-1 min-[800px]:grid-cols-3 min-[800px]:gap-x-[28px]">
        <DashedLine className="top-0 max-[799px]:!-left-[clamp(16px,2.5vw,40px)] max-[799px]:!w-screen" />
        <span className="absolute left-0 top-0 z-[1] h-[6px] w-[6px] bg-green-400" aria-hidden />
        <div className="relative min-[800px]:pb-[52px] min-[800px]:pt-7">
          <DashedLine direction="vertical" className="left-full hidden min-[800px]:block" />
          <SplitReveal className="mb-4 pt-7 text-[44px] leading-[1.23] tracking-[-0.01em] min-[800px]:mb-0 min-[800px]:pt-0 min-[800px]:text-[68px] min-[800px]:leading-[1.06] min-[800px]:tracking-[-0.02em]">{title}</SplitReveal>
        </div>
        <div className="relative hidden min-[800px]:block" aria-hidden>
          <DashedLine direction="vertical" className="left-0" />
          <DashedLine direction="vertical" className="left-full" />
        </div>
        <div className="relative min-[800px]:pb-[52px] min-[800px]:pt-7">
          <DashedLine direction="vertical" className="left-0 hidden min-[800px]:block" />
          <div className="mb-14 flex flex-col items-start gap-4 min-[800px]:mb-0 min-[800px]:flex-row min-[800px]:items-center min-[800px]:justify-end min-[800px]:gap-5">
            <p className="eyebrow">{t("more")}</p>
            <ContactButton variant="secondary">{t("reach")}</ContactButton>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 pb-6 min-[800px]:grid-cols-3 min-[800px]:gap-x-[28px] min-[800px]:pb-0">
        <DashedLine className="top-0 max-[799px]:!-left-[clamp(16px,2.5vw,40px)] max-[799px]:!w-screen" />
        <div className="relative hidden min-[800px]:block" aria-hidden>
          <DashedLine direction="vertical" className="left-full" />
        </div>
        <div className="relative min-[800px]:col-span-2">
          <DashedLine direction="vertical" className="left-0 max-[799px]:!h-[calc(100%+24px)]" />
          <DashedLine direction="vertical" className="left-full min-[800px]:hidden max-[799px]:!h-[calc(100%+24px)]" />
          <FaqGroup className="flex flex-col gap-1">
            {items.map((it, i) => (
              <FaqItem key={i} index={i} q={it.q} a={it.a} />
            ))}
          </FaqGroup>
        </div>
        <DashedLine className="top-full max-[799px]:!-left-[clamp(16px,2.5vw,40px)] max-[799px]:!w-screen min-[800px]:hidden" />
      </div>
    </section>
  );
}
