# Sharplink background system — how every inner page must be built (measured from sharplink.com, 31 Oct 2026)

The client rejected the inner pages because (1) the gradients did not follow Sharplink's structure, (2) every hero faded to
white at the bottom, (3) the 3D was different. Sharplink builds every inner page from the same few pieces; they are now
ported into this codebase. Use ONLY these pieces for backgrounds — no hand-made linear/radial section gradients, no mint
fades, no `bg-body`/`bg-hero`/`bg-sweep` on inner pages.

## The pieces (already in the code)
1. **Fixed light backdrop** — `LightBackdrop` (rendered once in `src/app/[locale]/layout.tsx`, fixed, behind everything):
   Sharplink's `.gradient-bg-light` (`radial-gradient(ellipse 100% 130% at 50% -30%, #c4d5e7 45%, #fdfbf7 85%, #f7f7f5)`)
   mapped to green (`#c6d9c8`). LIGHT SECTIONS ARE TRANSPARENT and show it (no background colour on light sections).
2. **Dark gradient edge** — `DarkGradient` (`src/components/backdrop/DarkGradient.tsx`), a port of SiteGradientBgDark:
   their `gradient-dark-transparent.png` recoloured to green (`public/bg/gradient-dark.webp`: black at the top → deep green
   → saturated green → transparent arc), absolutely positioned inside a `relative` section, `width: calc(100% + 200px)`,
   `height` per section (below), `position="top"` (black at the section top fading into the light page below; scaleY
   1.3 → 0.5 on scroll) or `position="bottom"` (flipped: light page → arc → green → black at the section bottom; scaleY
   1.3 → 2.1). It is longer than its section on purpose: its arc spills into the neighbouring transparent light section.
3. **Dark sections** — solid `bg-black` (Sharplink uses #000). A dark block is always entered and left through a
   DarkGradient edge (never a hard cut, never a CSS fade).
4. **Hero** — `PageHero` (`src/components/sections/PageHero.tsx`), a port of their InvestorsHero/AboutHero/EthereumHero:
   `clip` (fixed full-window transparent chrome video), `overlay` ("investors" | "about": their hero overlay mask recoloured,
   `public/bg/hero-overlay-*.webp`), `gradientHeight` (the hero's own top DarkGradient), `title`, `sub` (19px description),
   children (CTA buttons), `cards` (columns 9–12). Clip + overlay fade out (power2.in) between "top top" and "bottom 50%".
   No white fade anywhere: under the clip is the hero's own black → green → arc gradient.
5. **Footer** — the shared footer already carries the flipped gradient rising out of the page (calibrated to Sharplink's
   end-of-page state). Therefore THE LAST SECTION OF EVERY PAGE MUST BE A TRANSPARENT LIGHT SECTION (no dark CTA banner at
   the end — Sharplink's inner pages have none; remove `<CTA />` from the end of inner pages).

## Stacking rules (or the fixed/absolute layers will cover your text)
- Every section: `relative z-[2]` (the hero is z-2 and contains fixed layers; later sections must paint above it).
- Inside a section with a DarkGradient: content wrapper `relative z-[1]` (the gradient is z-0).
- `main` is `relative z-[1]` (layout) so page content paints above the footer gradient.
- Header theme: keep `data-theme="dark"`/`"light"` on each section according to what is under the header.

## Per-page placements (Sharplink's own, measured; map our content onto them)
Heights are the CSS heights Sharplink gives each gradient element (desktop ≥ 800px; mobile in brackets).
- **/investors → our /careers and /support**: hero `gradientHeight="120%"`, `overlay="investors"`, cards in columns 9–12;
  light band (their Nasdaq block) → press-releases section: `DarkGradient position="bottom" height="100%"` (light at its
  top → black at its bottom; rows are dark-theme text) → governance: `bg-black` (people grid, board, additional documents)
  → documents section: `DarkGradient position="top" height="130%"` (black → green → arc into the light page) → SEC filings,
  coverage, contacts: transparent light → footer. Sticky left rail across the long part (dark theme until pinned, then
  follows the header theme).
- **/about → our /about**: hero `gradientHeight="130%"` (150% mobile), `overlay="about"` → long-form text: transparent
  light → quote section: `DarkGradient position="bottom" height="115%"` (130% mobile) → people blurb + leadership grid:
  `bg-black` → board grid: `DarkGradient position="top" height="180%"` (220% mobile) → light, the looping chrome logo clip
  centred → footer.
- **/ethereum-opportunity → our /services (and the six sub-pages)**: hero `gradientHeight="130%"` (150% mobile),
  `overlay="about"` (they reuse the about overlay) → scrolling text: transparent light → breakthrough (light, sphere clip)
  → transformation: its head has `DarkGradient position="bottom" height="100%"`, then items + stats on `bg-black` →
  commodity: head `bg-black`, content `DarkGradient position="top" height="calc(100% + 500px)"` (mobile: height 20%,
  top 90%) → supercycle (light, watch clip) → runway (light; coins clip; values row) → framework: head
  `DarkGradient position="bottom" height="calc(100% + 250px)"` (mobile calc(120% + 450px)), content `bg-black`, role
  block (logo clip + two-tone paragraphs) with `DarkGradient position="top" height="200%"` (z 1) → light → footer.
- **/news → our /news**: hero heading: `DarkGradient position="bottom" height="1000px"` (900px mobile) whose black end
  meets the black content → featured + most recent on `bg-black` → newsletter band (black) → all-articles section
  `bg-black` → press releases: `DarkGradient position="top" height="200%"` (black → light) → footer.
- **/news/<article>, /contact, /privacy, /terms**: transparent light over the fixed backdrop → footer.
- **404**: light, plus `DarkGradient position="bottom" height="70%"` (60% mobile) pulled down with `bottom: -50px`; no
  footer.

## Clips (new Sharplink-style chrome clips being rendered now — public/clips/<name>_{chrome.webm,safari.mp4,poster.png})
- `sl_coin_careers`, `sl_coin_support` — investors coin-on-rail (careers, support heroes).
- `sl_chain` — about gem chain with the LS mark (about hero).
- `sl_press` — pick-and-place machine over a PCB with the LS mark (services hero; systems-and-integration sub-page).
- `sl_sphere` — chrome sphere bursting open around the LS mark (services breakthrough; design sub-page).
- `sl_watch` — chrome watch with the LS mark in the dial (services supercycle; it-services sub-page).
- `sl_coins` — five LS coins landing in a row, plays once (services runway; software-we-publish sub-page).
- `about_logo` (exists) — looping chrome LS mark, 280px (about end, services framework role block).
Until a clip file exists, reference it anyway through `src/content/clips.ts` entries with a fallback to an existing clip;
the lead flips the fallbacks off when the renders land. Section clips (sphere, watch, coins, logo) play inline with
`LoopVideo` (src/components/backdrop/LoopVideo.tsx) at Sharplink's sizes (sphere/watch max 356px square in columns 6–12;
coins 886×473 at the right; logo 280px).
