import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ActButton, type Action } from "./actions";
import { DiagArrow } from "./icons";
import "./company.css";

export type ContactCard = {
  id: string;
  title: string;
  who?: string;
  lines?: string[];
  link?: { label: string; href: string };
  button?: { label: string; action: Action };
};

export type ContactWide = { title: string; cols: { who?: string; lines?: string[]; link?: { label: string; href: string } }[] };

function Body({ who, lines, link }: { who?: string; lines?: string[]; link?: { label: string; href: string } }) {
  return (
    <div className={cn("flex flex-col gap-5 text-[16px] font-medium leading-[1.35] text-[var(--c-grey)] min-[800px]:mt-3 min-[800px]:max-w-[260px]", "co-contact-body")}>
      {who && (
        <p>
          <strong>{who}</strong>
        </p>
      )}
      {lines && lines.length > 0 && (
        <p>
          {lines.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </p>
      )}
      {link && (
        <p>
          <a href={link.href} className="[overflow-wrap:anywhere]">
            {link.label}
          </a>
        </p>
      )}
    </div>
  );
}

/**
 * Sharplink "Other contacts": a 3-column grid of card-investor-contact blocks (dashed rule on top, 32px/500 role,
 * the organisation in strong black, address in grey, an underlined address, a secondary "website ↗" button pinned
 * to the bottom), then an optional wide row with the heading in column one (their "Investor & Media Relations").
 */
export default function ContactGrid({ cards, wide }: { cards: ContactCard[]; wide?: ContactWide }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-y-7 min-[800px]:grid-cols-3 min-[800px]:gap-x-[28px]">
        {cards.map((c) => (
          <div key={c.id} className={cn("contact-item relative flex gap-4 pt-7 min-[800px]:h-full min-[800px]:flex-col min-[800px]:gap-0", "co-dash")}>
            <h3 className="basis-[34%] text-[16px] font-medium leading-[1.35] min-[800px]:basis-auto min-[800px]:text-[clamp(24px,1.8vw,32px)] min-[800px]:leading-[1.16] min-[800px]:tracking-[-0.01em]">{c.title}</h3>
            <div className="flex min-w-0 flex-1 flex-col items-start min-[800px]:flex-grow">
              <Body who={c.who} lines={c.lines} link={c.link} />
              {c.button && (
                <div className="mt-5 min-[800px]:mt-auto min-[800px]:pt-5">
                  <ActButton action={c.button.action} icon={<DiagArrow />}>
                    {c.button.label}
                  </ActButton>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {wide && (
        <div className={cn("relative mt-10 grid grid-cols-1 gap-y-6 pt-7 min-[800px]:grid-cols-3 min-[800px]:gap-x-[28px]", "co-dash")}>
          <h3 className="max-w-[12em] text-[19px] font-medium leading-[1.35] min-[800px]:text-[24px] min-[800px]:leading-[1.4] min-[800px]:tracking-[-0.01em]">{wide.title}</h3>
          {wide.cols.map((col, i) => (
            <Body key={i} {...col} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactNote({ children }: { children: ReactNode }) {
  return <p className="eyebrow mt-6 text-[var(--c-sub)]">{children}</p>;
}
