# Checks (run against `npm run dev` on :3000)

Set `PW` to a Playwright module path (Chrome channel + WebKit installed), as with `tools/ref/*.js`.

- `node navcheck.js <chrome|webkit> <desk|phone>` — scrolls every page and compares the real pixels behind the header
  logo with the header theme (`html[data-nav]`); `PAGES=/a,/b` to limit. Content passing under the logo (cards, photos)
  shows up as a few isolated misses; runs of misses are real theme errors.
- `node peek.js <chrome|webkit> <desk|phone> <path> <y1,y2,…> <name>` — viewport shots at scroll positions → one sheet
  (`OUT` folder, `SETTLE` ms per stop).
- `node width.js` — horizontal overflow per page in Chrome 1800, WebKit 1800 and WebKit iPhone.
- `node glitch-live.js [path]` — wheel-scrolls a page in Chrome like a visitor (Lenis on) while recording the browser's
  frame stream; flags flashes (a frame unlike both neighbours) and jumps, saves every frame with its scroll position
  (`frames.json`) for per-transition sheets. `MOBILE=1 W=390 H=844` for a phone, `DIR=up` to scroll back up,
  `FROM`/`TO` for a range, `MAXS` time cap. Run with the GPU flags it sets (WebGL scenes render as in a real browser).
- `node glitch.js <chrome|webkit> <desk|phone> [path]` — the same idea with settled steps (every 40px): finds state
  jumps between scroll positions rather than motion glitches.

Note: if a CSS change does not show in `npm run dev`, restart it — its watcher can stop picking up `globals.css`.
