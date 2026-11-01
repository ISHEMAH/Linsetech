import DashedLine from "@/components/ui/DashedLine";
import DarkGradient from "@/components/backdrop/DarkGradient";
import TextReveal from "./TextReveal";
import PortraitTile from "./PortraitTile";

const M = "px-[clamp(16px,2.5vw,40px)]";

/** Outlined double quote, the blueprint glyph in Sharplink's about-quote (207 × 147 at 1800) and supercycle quote. */
export function QuoteGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 207 147" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d="M8 139V74C8 38 26 14 62 6l6 14C46 28 38 44 37 66h31v73H8Z" />
      <path d="M118 139V74c0-36 18-60 54-68l6 14c-22 8-30 24-31 46h31v73h-60Z" />
      <path d="M8 74h29M118 74h29" strokeDasharray="2 2" />
    </svg>
  );
}

/**
 * Sharplink about-quote: the page turns dark behind it (their flipped dark gradient, 115% of the block), an
 * outlined quote glyph in columns 1–3, the quote (32 px, letters revealed on enter) in columns 4–9 with the author
 * pinned to the bottom of the 500 px block, and a small portrait in columns 10–12.
 */
export default function AboutQuote({ text, name, role, portraitLabel }: { text: string; name: string; role: string; portraitLabel: string }) {
  return (
    <section data-theme="dark" className="relative z-[2] pb-[clamp(96px,16vh,160px)] pt-[clamp(140px,20vh,220px)] text-off-white">
      {/* Sharplink .about-quote .gradient: flipped dark gradient, 115% of the block — the light page turns black behind the quote */}
      <DarkGradient position="bottom" height="115%" heightMobile="130%" />
      <div className={`relative z-[1] ${M}`}>
        {/* the long-form's dashed column guides carry on through the quote, closed by a dashed rule under the author */}
        <div className={`pointer-events-none absolute inset-0 hidden ${M} md:block`} aria-hidden>
          <div className="relative grid h-full grid-cols-12 gap-x-[28px]">
            <div className="relative col-span-3">
              <DashedLine theme="dark" direction="vertical" className="right-0" />
            </div>
            <div className="relative col-span-6">
              <DashedLine theme="dark" direction="vertical" className="left-0" />
              <DashedLine theme="dark" direction="vertical" className="right-0" />
            </div>
            <div className="relative col-span-3">
              <DashedLine theme="dark" direction="vertical" className="left-0" />
            </div>
            <DashedLine theme="dark" className="bottom-0" />
          </div>
        </div>
        <div className="relative grid grid-cols-1 gap-x-[28px] gap-y-10 md:min-h-[498px] md:grid-cols-12">
          <div className="pt-[28px] md:col-span-3">
            <QuoteGlyph className="h-auto w-[clamp(96px,11.5vw,207px)] text-off-white/25" />
          </div>
          <div className="flex flex-col justify-between gap-12 md:col-span-6 md:px-[28px] md:pt-[28px]">
            <blockquote>
              <TextReveal text={text} className="max-w-[17em] text-[clamp(24px,1.8vw,32px)] font-medium leading-[1.16] tracking-[-0.01em]" />
            </blockquote>
            <p className="pb-[28px]">
              <strong className="block text-[19px] font-medium leading-[1.35]">{name}</strong>
              <span className="eyebrow mt-1 block text-off-white/60">{role}</span>
            </p>
          </div>
          <div className="hidden pt-[28px] md:col-span-3 md:block">
            <PortraitTile index={0} className="w-[min(207px,100%)]" label={portraitLabel} pin="light" />
          </div>
        </div>
      </div>
    </section>
  );
}
