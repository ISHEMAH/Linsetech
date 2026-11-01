/**
 * Sharplink `.gradient-bg-light`: one viewport-fixed radial tint behind the whole page (light sections are transparent
 * and show it; dark sections paint over it). Colours are Sharplink's mapped to Linse green (OKLCH hue swap, same
 * lightness/chroma): #c4d5e7 → #c6d9c8; the warm whites stay. `short` = their 500px variant (article pages).
 */
export default function LightBackdrop({ short = false }: { short?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 -z-10 w-screen overflow-hidden"
      style={{ height: short ? 500 : "100lvh", background: "radial-gradient(ellipse 100% 130% at 50% -30%, #c6d9c8 45%, #fdfbf7 85%, #f7f7f5)" }}
    />
  );
}
