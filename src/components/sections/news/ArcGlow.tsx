import { cn } from "@/lib/cn";

/**
 * Sharplink's gradient-bg-dark arc in our palette: a near-black core at the bottom centre, a green rim, then light.
 * "page" fills a light screen like their 404 (measured: light top, rim ≈ 45% height, black by the bottom edge);
 * "fade" is the short band that hands a light page over to the dark footer (their footer gradient's top).
 */
const ARC = {
  page: "radial-gradient(185% 100% at 50% 100%, #010604 0%, #020a07 7%, #04150f 17%, #06281f 27%, #0b3d2e 37%, #1d6a48 47%, #4f9d76 56%, #93c9aa 65%, rgba(196,226,207,0.7) 77%, rgba(214,236,222,0) 93%)",
  fade: "linear-gradient(180deg, rgba(2,10,7,0) 45%, #020a07 97%), radial-gradient(150% 100% at 50% 100%, #020a07 0%, #020a07 10%, #04150f 24%, #0b3d2e 42%, #2b7a55 58%, rgba(124,189,151,0.75) 72%, rgba(196,226,207,0.35) 86%, rgba(214,236,222,0) 100%)",
};

export default function ArcGlow({ variant = "page", className }: { variant?: keyof typeof ARC; className?: string }) {
  return <div className={cn("pointer-events-none absolute", className)} style={{ background: ARC[variant] }} aria-hidden />;
}

/** Light page background shared by the article, contact and 404 pages (Sharplink gradient-bg-light, in green). */
export const LIGHT_BG = "radial-gradient(120% 70% at 30% -10%, #cfe6d8 0%, #dcefe3 35%, #eef6f0 62%, #f7f9f7 85%), #f7f9f7";
