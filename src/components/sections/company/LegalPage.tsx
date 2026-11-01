import DashedLine from "@/components/ui/DashedLine";
import { cn } from "@/lib/cn";
import TitleReveal from "./TitleReveal";
import "./company.css";

type Section = { title: string; body: string[] };

/**
 * Sharplink legal page (/privacy-policy): transparent over the fixed light backdrop (no own background; the footer's
 * gradient rises out of it), the 88px title top-left,
 * 120px lower a full-bleed dashed rule and the intro (19px lead + 16px subtle paragraphs, max 1031px), then one
 * block per section: full-bleed dashed rule, a 1fr / 2fr grid with the heading on the left (the rail of headings)
 * and the body on the right (max 913px, 16px gaps).
 */
export default function LegalPage({ title, intro, sections, email }: { title: string; intro: { heading: string; body: string[] }; sections: Section[]; email: string }) {
  const M = "px-[clamp(16px,2.5vw,40px)]";
  const withMail = (text: string) => {
    const parts = text.split("{email}");
    return parts.flatMap((p, i) => (i < parts.length - 1 ? [p, <a key={i} href={`mailto:${email}`}>{email}</a>] : [p]));
  };
  return (
    <section data-theme="light" className={cn("co-light relative z-[2] min-h-[100lvh] pb-[96px] pt-[110px] text-ink min-[800px]:pb-[140px]")}>
      <header>
        <div className={cn(M, "pt-[clamp(0px,5vh,56px)]")}>
          <TitleReveal as="h1" text={title} start="top 95%" className="text-[44px] font-normal leading-[1.23] tracking-[-0.01em] min-[800px]:text-[clamp(44px,6.1vw,88px)] min-[800px]:leading-[0.96] min-[800px]:tracking-[-0.03em]" />
        </div>
        <div className="relative mt-[56px] min-[800px]:mt-[120px]">
          <DashedLine className="top-0" />
          <div className={cn(M, "pb-[68px] pt-6 min-[800px]:pb-[112px] min-[800px]:pt-7")}>
            <div className={cn("max-w-[1031px]", "co-legal-body")}>
              <h2 className="text-[19px] font-medium leading-[1.35]">{intro.heading}</h2>
              {intro.body.map((p, i) => (
                <p key={i} className="mt-4">
                  {withMail(p)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </header>
      {sections.map((sec, i) => (
        <div key={i} id={`section-${i + 1}`} className="relative">
          <DashedLine className="top-0" />
          <div className={cn(M, "flex flex-col gap-4 pb-11 pt-6 min-[800px]:grid min-[800px]:grid-cols-[1fr_2fr] min-[800px]:gap-7 min-[800px]:pb-14 min-[800px]:pt-7")}>
            <h3 className="text-balance text-[19px] font-medium uppercase leading-[1.35]">{sec.title}</h3>
            <div className={cn("flex max-w-[913px] flex-col gap-4", "co-legal-body")}>
              {sec.body.map((p, j) => (
                <p key={j}>{withMail(p)}</p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
