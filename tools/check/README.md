# Checks (run against `npm run dev` on :3000)

Set `PW` to a Playwright module path (Chrome channel + WebKit installed), as with `tools/ref/*.js`.

- `node navcheck.js <chrome|webkit> <desk|phone>` — scrolls every page and compares the real pixels behind the header
  logo with the header theme (`html[data-nav]`); `PAGES=/a,/b` to limit. Content passing under the logo (cards, photos)
  shows up as a few isolated misses; runs of misses are real theme errors.
- `node peek.js <chrome|webkit> <desk|phone> <path> <y1,y2,…> <name>` — viewport shots at scroll positions → one sheet
  (`OUT` folder, `SETTLE` ms per stop).
- `node width.js` — horizontal overflow per page in Chrome 1800, WebKit 1800 and WebKit iPhone.
