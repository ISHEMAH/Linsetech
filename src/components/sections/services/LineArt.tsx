import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import s from "./LineArt.module.css";

/* Dotted line drawings in a 168×112 box (Sharplink's opp / commodity thumbnails): `d` = dotted stroke,
   `sq` = a small square node, `f` = a filled dot. */
// presentation attributes (not classes) so the drawing never falls back to black fills
const DOT = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", strokeDasharray: "0.01 3.6" } as const;
const SQ = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeDasharray: "2 2" } as const;
const D = (d: string) => <path {...DOT} d={d} />;
const C = (cx: number, cy: number, r: number) => <circle {...DOT} cx={cx} cy={cy} r={r} />;
const R = (x: number, y: number, w: number, h: number) => <rect {...DOT} x={x} y={y} width={w} height={h} />;
const Q = (x: number, y: number, z = 6) => <rect {...SQ} x={x - z / 2} y={y - z / 2} width={z} height={z} />;
const F = (cx: number, cy: number, r = 2) => <circle fill="currentColor" cx={cx} cy={cy} r={r} />;

const ARROW = (x: number, y: number, dir: "r" | "l" | "u" | "d") =>
  ({ r: D(`M${x - 5} ${y - 5}L${x} ${y}L${x - 5} ${y + 5}`), l: D(`M${x + 5} ${y - 5}L${x} ${y}L${x + 5} ${y + 5}`), u: D(`M${x - 5} ${y + 5}L${x} ${y}L${x + 5} ${y + 5}`), d: D(`M${x - 5} ${y - 5}L${x} ${y}L${x + 5} ${y - 5}`) })[dir];

const hub = (n: number, r0: number, r1: number, cx = 84, cy = 56) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
    const x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1;
    return (
      <g key={i}>
        {D(`M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`)}
        {Q(x1, y1)}
      </g>
    );
  });

export const ART: Record<string, ReactNode> = {
  // ── design
  brand: (<>{C(70, 56, 30)}{R(78, 30, 46, 46)}{D("M30 56H138M84 12V100")}{D("M48 90L84 22L120 90Z")}{Q(70, 56)}{Q(101, 53)}{Q(84, 22)}</>),
  flow: (<>{R(14, 34, 34, 46)}{R(67, 34, 34, 46)}{R(120, 34, 34, 46)}{D("M48 57H63")}{ARROW(64, 57, "r")}{D("M101 57H116")}{ARROW(117, 57, "r")}{D("M20 44H42M20 52H36M73 44H95M73 52H86M126 44H148M126 52H140")}{Q(31, 70)}{Q(84, 70)}{Q(137, 70)}</>),
  system: (<>{R(34, 22, 28, 28)}{R(70, 22, 28, 28)}{R(106, 22, 28, 28)}{R(34, 62, 28, 28)}{R(70, 62, 28, 28)}{R(106, 62, 28, 28)}{F(84, 76, 6)}{D("M24 12H144M24 100H144")}{Q(24, 12)}{Q(144, 100)}</>),
  a11y: (<>{C(84, 56, 40)}{C(84, 56, 26)}{C(84, 40, 5)}{D("M66 50H102M84 50V70M84 70L74 86M84 70L94 86")}{Q(44, 56)}{Q(124, 56)}{Q(84, 16)}{Q(84, 96)}</>),
  // ── websites & apps
  browser: (<>{R(22, 16, 124, 80)}{D("M22 30H146")}{F(30, 23, 1.6)}{F(37, 23, 1.6)}{F(44, 23, 1.6)}{R(32, 40, 62, 26)}{R(102, 40, 34, 46)}{R(32, 74, 28, 12)}{R(66, 74, 28, 12)}{Q(146, 96)}</>),
  cart: (<>{D("M26 26H40L52 74H118L130 38H46")}{C(60, 88, 6)}{C(110, 88, 6)}{R(70, 14, 30, 22)}{D("M70 25H100M85 14V36")}{ARROW(85, 48, "d")}{D("M85 38V48")}{Q(26, 26)}{Q(130, 38)}</>),
  phone: (<>{R(62, 10, 44, 92)}{D("M62 22H106M62 88H106")}{C(84, 95, 3)}{R(70, 30, 28, 14)}{R(70, 50, 28, 8)}{R(70, 64, 18, 8)}{D("M30 40H52M30 56H52M116 48H138M116 64H138")}{Q(30, 40)}{Q(30, 56)}{Q(138, 48)}{Q(138, 64)}</>),
  cms: (<>{R(40, 26, 56, 70)}{R(50, 18, 56, 70)}{R(60, 10, 56, 70)}{D("M70 24H106M70 34H100M70 44H106M70 54H92")}{D("M118 70L142 46L150 54L126 78L116 80Z")}{Q(40, 96)}</>),
  // ── systems & integration
  platform: (<>{D("M84 14L136 38L84 62L32 38Z")}{D("M32 54L84 78L136 54")}{D("M32 70L84 94L136 70")}{D("M84 62V94")}{Q(84, 14)}{Q(32, 38)}{Q(136, 38)}</>),
  erp: (<>{R(70, 42, 28, 28)}{F(84, 56, 3)}{hub(6, 20, 44)}</>),
  payment: (<>{R(18, 30, 64, 42)}{D("M18 42H82M26 60H44")}{R(110, 18, 34, 64)}{D("M110 28H144M110 72H144")}{D("M86 44H104")}{ARROW(105, 44, "r")}{D("M106 60H88")}{ARROW(87, 60, "l")}{Q(127, 94)}{Q(50, 94)}{D("M50 72V91M127 82V91")}</>),
  data: (<>{D("M24 96H148M24 96V14")}{R(36, 66, 16, 30)}{R(62, 52, 16, 44)}{R(88, 40, 16, 56)}{R(114, 24, 16, 72)}{D("M30 70L70 44L96 52L140 18")}{Q(70, 44)}{Q(96, 52)}{Q(140, 18)}</>),
  // ── software we publish
  product: (<>{C(84, 56, 36)}{C(84, 56, 28)}{D("M84 36L98 56L84 76L70 56Z")}{D("M24 56H44M124 56H144")}{ARROW(48, 56, "r")}{ARROW(120, 56, "l")}{Q(24, 56)}{Q(144, 56)}</>),
  licence: (<>{C(60, 56, 18)}{C(60, 56, 6)}{D("M78 56H140M122 56V70M134 56V66")}{hub(6, 28, 40, 60, 56)}</>),
  roadmap: (<>{D("M18 90C50 90 50 60 84 60C118 60 118 26 150 26")}{Q(18, 90)}{Q(51, 76)}{Q(84, 60)}{Q(117, 44)}{D("M150 26V8L162 14L150 20")}{D("M18 102H150")}</>),
  support: (<>{C(84, 56, 38)}{C(84, 56, 16)}{D("M73 45L57 29M95 45L111 29M73 67L57 83M95 67L111 83")}{Q(84, 18)}{Q(84, 94)}{Q(46, 56)}{Q(122, 56)}</>),
  // ── hardware & distribution
  laptop: (<>{R(42, 20, 84, 54)}{R(50, 28, 68, 38)}{D("M28 86H140L128 74H40Z")}{D("M76 80H92")}{Q(28, 86)}{Q(140, 86)}</>),
  server: (<>{R(44, 14, 80, 22)}{R(44, 44, 80, 22)}{R(44, 74, 80, 22)}{F(56, 25, 2)}{F(56, 55, 2)}{F(56, 85, 2)}{D("M88 25H114M88 55H114M88 85H114")}{D("M124 25H146V85H124")}{Q(146, 55)}</>),
  printer: (<>{R(36, 40, 96, 40)}{R(52, 16, 64, 24)}{R(52, 66, 64, 34)}{D("M62 78H106M62 88H96")}{F(120, 50, 2)}{Q(36, 40)}{Q(132, 40)}</>),
  warranty: (<>{D("M84 12L126 26V54C126 78 108 94 84 102C60 94 42 78 42 54V26Z")}{D("M66 56L80 70L104 44")}{Q(84, 12)}{Q(42, 26)}{Q(126, 26)}</>),
  // ── IT services
  helpdesk: (<>{R(22, 18, 70, 44)}{D("M38 62L34 78L54 62")}{R(76, 50, 70, 38)}{D("M130 88L134 102L116 88")}{D("M34 32H78M34 44H66M90 64H132M90 74H118")}{Q(22, 18)}{Q(146, 88)}</>),
  network: (<>{D("M44 46C66 24 102 24 124 46M56 60C72 46 96 46 112 60M68 74C78 66 90 66 100 74")}{F(84, 86, 3)}{Q(24, 30)}{Q(144, 30)}{Q(24, 96)}{Q(144, 96)}{D("M24 30L44 46M144 30L124 46M24 96L68 74M144 96L100 74")}</>),
  cloud: (<>{D("M48 74C30 74 26 52 44 48C44 30 70 24 80 38C88 26 112 28 114 46C132 46 136 74 116 74Z")}{D("M70 84V100M98 100V84")}{ARROW(70, 100, "d")}{ARROW(98, 84, "u")}{Q(70, 104)}{Q(98, 104)}</>),
  security: (<>{C(84, 56, 22)}{R(76, 52, 16, 14)}{D("M79 52V47C79 41 89 41 89 47V52")}{hub(8, 30, 46)}</>),
  // ── engagement models
  project: (<>{D("M20 86L52 54L84 70L116 34L148 34")}{Q(20, 86)}{Q(52, 54)}{Q(84, 70)}{Q(116, 34)}{D("M148 34V12L162 18L148 24")}{D("M20 100H148")}</>),
  retainer: (<>{D("M118 42C110 24 92 16 72 20C50 26 40 46 44 66")}{ARROW(118, 42, "d")}{D("M50 70C58 88 76 96 96 92C118 86 128 66 124 46")}{ARROW(50, 70, "u")}{C(84, 56, 14)}{D("M84 48V56L90 60")}{Q(30, 56)}{Q(138, 56)}</>),
  partner: (<>{C(66, 56, 30)}{C(102, 56, 30)}{D("M84 40L94 56L84 72L74 56Z")}{Q(36, 56)}{Q(132, 56)}{Q(84, 16)}{Q(84, 96)}{D("M84 22V30M84 82V90")}</>),
};

export default function LineArt({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 168 112" className={cn(s.art, className)} fill="none" overflow="visible" aria-hidden>
      {ART[name] ?? ART.system}
    </svg>
  );
}
