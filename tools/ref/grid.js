// node grid.js <out.jpg> <cols> <img...> : compose images into a labelled grid
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright'); const fs = require('fs'); const path = require('path');
const [out, cols, ...imgs] = process.argv.slice(2);
(async () => {
  const cells = imgs.map((f) => `<figure><img src="file://${path.resolve(f)}"><figcaption>${path.basename(path.dirname(f))}/${path.basename(f)}</figcaption></figure>`).join('');
  const html = path.resolve(out + '.html');
  fs.writeFileSync(html, `<html><body style="margin:0;background:#111;color:#bbb;font:11px -apple-system"><style>.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}figure{margin:0}img{width:100%;display:block}</style><div class=g>${cells}</div></body></html>`);
  const b = await chromium.launch({ channel: 'chrome', headless: true }); const p = await b.newPage({ viewport: { width: 1800, height: 900 } });
  await p.goto('file://' + html); await p.waitForTimeout(800);
  await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 78 }); await b.close(); fs.unlinkSync(html); console.log('ok');
})();
