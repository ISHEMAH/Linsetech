// node shots.js <url> <outdir> <y1,y2,...> [w] [h] : progressive scroll, screenshot at each y (jpeg), cookie banner removed
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright'); const fs = require('fs'); const path = require('path');
const [url, out, ys, W = '1800', H = '1000'] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +W, height: +H } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  await p.addStyleTag({ content: '.cookie-banner{display:none!important}' }).catch(() => {});
  await p.waitForTimeout(3500);
  let cur = 0;
  for (const y of ys.split(',').map(Number)) {
    for (let s = cur; s < y; s += 250) { await p.evaluate((yy) => scrollTo(0, yy), s); await p.mouse.wheel(0, 1); await p.waitForTimeout(40); }
    await p.evaluate((yy) => scrollTo(0, yy), y); await p.mouse.wheel(0, 1); await p.waitForTimeout(1300); cur = y;
    await p.screenshot({ path: path.join(out, `y${String(y).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 72 });
  }
  await b.close(); console.log('ok', out);
})();
