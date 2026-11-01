// node peek.js <chrome|webkit> <desk|phone> <path> <y1,y2,...> <name> : viewport shots at scroll positions -> one sheet (SETTLE env ms)
// PW = path to a Playwright module (like tools/ref/*.js), e.g. a scratch install
const PW = process.env.PW || 'playwright';
const { webkit, chromium, devices } = require(PW);
const fs = require('fs'), path = require('path');
const [engine, mode, u, ys, name] = process.argv.slice(2);
(async () => {
  const b = await (engine === 'webkit' ? webkit : chromium).launch(engine === 'webkit' ? { headless: true } : { channel: 'chrome', headless: true });
  const ctx = await b.newContext(mode === 'phone' ? { ...devices['iPhone 15 Pro'] } : { viewport: { width: 1800, height: 1000 } });
  await ctx.addCookies([{ name: 'linse_cookie_consent', value: 'true', domain: 'localhost', path: '/' }]);
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000' + u, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(3500);
  const out = process.env.OUT || path.join(process.cwd(), 'peek'); fs.mkdirSync(out, { recursive: true });
  const cells = [];
  for (const y of ys.split(',').map(Number)) {
    const from = await p.evaluate(() => scrollY);
    for (let k = 1; k <= 8; k++) { await p.evaluate((yy) => scrollTo(0, yy), from + ((y - from) * k) / 8); await p.waitForTimeout(40); }
    await p.waitForTimeout(+(process.env.SETTLE || 700));
    const nav = await p.evaluate(() => document.documentElement.dataset.nav);
    const f = `${name}_${y}.png`; await p.screenshot({ path: path.join(out, f) });
    cells.push(`<figure><img src="${f}"><figcaption>${y} nav=${nav}</figcaption></figure>`);
  }
  const w = mode === 'phone' ? 260 : 600;
  fs.writeFileSync(path.join(out, name + '.html'), `<style>body{margin:0;background:#888;font:14px sans-serif;display:flex;flex-wrap:wrap;gap:8px;padding:8px}figure{margin:0}img{width:${w}px;display:block}figcaption{background:#000;color:#fff;padding:2px 4px}</style>${cells.join('')}`);
  const s = await (await b.newContext({ viewport: { width: mode === 'phone' ? 1400 : 1850, height: 800 } })).newPage();
  await s.goto('file://' + path.join(out, name + '.html')); await s.waitForTimeout(400);
  await s.screenshot({ path: path.join(out, name + '.jpg'), fullPage: true, type: 'jpeg', quality: 70 });
  await b.close();
  console.log(path.join(out, name + '.jpg'));
})();
