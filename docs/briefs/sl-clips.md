# Recreating Sharplink's 3D clips for Linse — shared brief

The client compared our inner pages with sharplink.com and said the 3D animations are "completely different". Sharplink's
inner pages use pre-rendered, transparent, NEUTRAL CHROME clips (all colour comes from the page gradient behind them).
Your job: recreate specific Sharplink clips shot for shot, replacing the Ethereum gem and the Sharplink logo with the
Linse LS mark. Fidelity is judged frame by frame against the originals.

## References (in the repo, durable)
- Originals: web/docs/reference/sharplink/clips/shrp_<name>_chrome.webm (VP9 with alpha, 30 fps).
- Frame sheets: web/docs/reference/sharplink/sheets/sheet_<name>.jpg (12 or 8 evenly spaced frames, alpha shown over grey).
- Make finer sheets yourself: `PW=/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright node web/tools/ref/frames.js <video> <n> <out.jpg> [cols] [bg]`
  (Playwright lives in that scratchpad; if it was wiped, `npm i playwright@1.64.1` in a new scratchpad folder and point PW at it.)
- Study each original before modelling: object scale and position in frame, camera angle and lens, motion beats and timing,
  how highlights fall on the chrome, where the thin white blueprint rectangles and dotted connector lines appear.

## Look (match Sharplink)
- Neutral silver chrome / brushed metal: base colour ~#e6e6e6, metallic 1, roughness mix 0.08–0.35 (polished faces, satin
  sides, bevelled edges catching light). No green or blue tint in the materials.
- Lighting: studio HDRI web/public/hdr/studio.hdr plus large soft area lights so surfaces read bright silver with dark
  reflection bands, like the originals. Transparent film (alpha), straight alpha in the PNG frames.
- Baked overlays like theirs: thin white 1px rectangles and dotted connector lines around the hero object at the moments
  they appear in the original.
- The LS mark: two outlines in web/src/components/ui/Logo.tsx (LOGO_PATHS); web/tools/blender/common.py has bm_logo /
  bm_logo_mark (extrude + bevel) — read it. Where Sharplink shows the faceted ETH gem, make the LS mark read as a solid,
  bevelled/faceted chrome object of the same size and placement.
- Composition must match the original's framing (object size and position in frame, same aspect ratio). Our pages put a
  recoloured copy of Sharplink's hero overlay mask over the hero clips (web/public/bg/hero-overlay-*.webp), designed around
  their composition, so a different framing would break the page.

## Pipeline
- Blender 5.2: /Applications/Blender.app/Contents/MacOS/Blender (EEVEE on Metal, M1 Pro 16 GB). Helpers in
  web/tools/blender/common.py (setup_render, render_frames, contact_sheet, materials, bm_* builders) — import it, do not edit
  it. Do not edit other scripts in tools/blender (hero.py, stack.py, about_*.py, services_*.py, encode.py). Create your own
  `sl_<clip>.py` per clip and copy about_encode.py to your own `sl_encode.py` (shared by the three clip agents: create it
  only if it doesn't exist yet; add your clip names to its SPEC table — coordinate by reading it fresh before editing).
- Always preview first (12 frames at 25 %) and compare against the reference sheet at the same times; iterate until they
  read as the same shot. Then render final frames (run the render with run_in_background and wait for the completion
  notification; keep each final render under ~25 minutes; three agents share one GPU, so expect slower renders).
- Deliverables per clip in web/public/clips/: `<name>_chrome.webm` (VP9 + alpha), `<name>_safari.mp4` (HEVC + alpha via
  web/tools/blender/hevc_alpha/hevc_alpha <in_4444.mov> <out.mp4> <gop> 0.8), `<name>_poster.png` (first frame),
  `<name>_sheet.jpg` (12-frame sheet). GOP ≤ 15. Hero-size clips ≤ 5 MB WebM. Delete big intermediate .mov files after.
- Seamless loops where the original loops (last frame flows into the first).
- Final check: a side-by-side sheet of the original and yours at the same 12 times: web/docs/compare/clip-<name>.jpg.

## Report
What the original does (beats with times), what you built, render time, files, and any remaining difference.
