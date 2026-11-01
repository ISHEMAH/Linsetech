import Image from "next/image";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/ui/Logo";
import type { Screen } from "@/content/work";

/** screen = 4:3 web screens, portrait = 9:16, wide = 16:10 composites shown whole on their own light backdrop */
export type DeviceShape = "screen" | "portrait" | "wide";

const ASPECT: Record<DeviceShape, string> = { screen: "aspect-[4/3]", portrait: "aspect-[9/16]", wide: "aspect-[16/10]" };

/** Puture's `.device`: a black frame with a 1px light edge (squared here), the screen cover-fitted inside. */
export function Device({ shape, className, children, glow = false, fit = "width" }: { shape: DeviceShape; className?: string; children: React.ReactNode; glow?: boolean; fit?: "width" | "height" }) {
  return (
    <div
      className={cn("relative overflow-hidden", fit === "width" ? "w-full" : "h-full", ASPECT[shape], shape === "wide" ? "bg-[#f1f1ed]" : "bg-black", className)}
      style={{ boxShadow: glow ? "0 0 0 1px rgba(255,255,255,.14), 0 40px 120px -40px rgba(34,197,94,.42)" : "0 0 0 1px rgba(255,255,255,.14)" }}
    >
      {children}
    </div>
  );
}

/** A screen image, or an intentional "coming soon" tile (grid, LS mark, numbered label) when there is none yet. */
export function ScreenImage({ screen, shape, index, sizes, label, priority = false }: { screen: Screen; shape: DeviceShape; index: number; sizes: string; label: string; priority?: boolean }) {
  if (screen.src) {
    return <Image src={screen.src} alt={screen.caption} fill sizes={sizes} priority={priority} className={shape === "wide" ? "object-contain" : "object-cover object-top"} />;
  }
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#04150f,#0b3d2e_70%,#0f5132)]"
      style={{ backgroundImage: "linear-gradient(rgba(220,255,232,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(220,255,232,.06) 1px,transparent 1px),linear-gradient(135deg,#04150f,#0b3d2e 70%,#0f5132)", backgroundSize: "28px 28px,28px 28px,100% 100%" }}
      role="img"
      aria-label={`${screen.caption} — ${label}`}
    >
      <LogoMark className="w-[18%] min-w-10 text-green-400/35" />
      <span className="absolute bottom-3 left-3 inline-flex gap-[3px] font-narrow text-[11px] font-medium uppercase leading-none tracking-[0.08em]">
        <span className="bg-green-500 px-[9px] pb-[6px] pt-[7px] text-white">{String(index + 1).padStart(2, "0")}</span>
        <span className="bg-off-white px-[9px] pb-[6px] pt-[7px] text-ink">{label}</span>
      </span>
    </div>
  );
}
