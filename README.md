# Linse website

Next.js 16 (App Router) · TypeScript · Tailwind v4 · GSAP + Lenis · three.js / React Three Fiber · next-intl (EN / FR / RW) · Sanity.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

## Where things are

| Path | What |
| --- | --- |
| `src/app/[locale]/…` | Pages: home, about, work (+ detail), services (+ detail), news (+ article), careers, support, privacy, terms |
| `src/app/studio` | Embedded Sanity Studio (`/studio`) |
| `src/messages/{en,fr,rw}.json` | UI copy and Home copy in the three languages |
| `src/content/*.ts` | Typed content used until Sanity is configured (projects, services, news, company, hardware) |
| `src/sanity/` | Schemas, client and `data.ts` (reads Sanity when configured, else `src/content`) |
| `src/components/three/` | 3D: `LogoMark3D` (LS mark in five strokes), `HeroScene`, `AssembleScene`, `Tiles`, `WorkFloor`, `Env` |
| `src/components/sections/` | Page sections (Home H1–H12, Work chapter, FAQ, CTA, page blocks) |
| `src/components/layout/` | Nav, mobile menu, footer (animated LINSETECH word), smooth scroll, contact dialog, chapter badge |
| `src/app/globals.css` | Design tokens (greens, Archivo), gradients, utilities |
| `public/brand/logo-ls.svg` | Vector LS mark (exact polygons reconstructed from the bitmap) |

## Content & CMS

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SANITY_PROJECT_ID` to switch the site to Sanity. Until then every page reads the files in `src/content`.
Sample entries (two placeholder projects, team, hardware brands, numbers, press release) are marked as such in those files.

## Forms

`POST /api/contact` (contact drawer, `/contact`, careers "Apply") and `POST /api/newsletter` validate, rate-limit and send
through SMTP once `SMTP_URL` and `CONTACT_TO` are set (see `.env.example`). Without them every form still answers and asks
the visitor to write to the e-mail address instead.

## Deploy (Vercel)

Import the repository: Vercel detects Next.js and needs no settings (`npm install` reads `.npmrc` → `legacy-peer-deps`, which
`@react-three/postprocessing` needs). The site builds and runs with no environment variables — built-in content, forms in
"write to us" mode. Add the variables in `.env.example` to switch on Sanity, mail and the newsletter, and
`NEXT_PUBLIC_SITE_URL` for canonical URLs, the sitemap and share images.
