import type { Block } from "@/content/news";
import s from "./news-classes";

/**
 * Sharplink article-section-content typography: 16px / 1.56, weight 500 in the grey text colour, 24px between
 * blocks, sub-headings in full ink; list items sit between rules with a 24px box holding the 6px brand square.
 */
export default function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className={s.prose}>
      {blocks.map((b, i) => {
        if (b.type === "h2")
          return (
            <h2 key={i} id={`h-${i}`}>
              {b.text}
            </h2>
          );
        if (b.type === "quote") return <blockquote key={i}>{b.text}</blockquote>;
        if (b.type === "ul")
          return (
            <ul key={i}>
              {b.items!.map((it) => (
                <li key={it}>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}
