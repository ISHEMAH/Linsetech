// node navcheck.js <chrome|webkit> <desk|phone> : scroll each page in steps; sample the real pixels behind the logo
// (the header hidden for the sample) and compare with the header theme (html[data-nav]).
// PW = path to a Playwright module (like tools/ref/*.js), e.g. a scratch install
const PW = process.env.PW || 'playwright';
const { webkit, chromium, devices } = require(PW);
const [engine = 'chrome', mode = 'desk'] = process.argv.slice(2);
const PAGES = (process.env.PAGES || '/,/about,/services,/services/design,/services/hardware-and-distribution,/careers,/support,/news,/news/linse-launches-new-website,/contact,/privacy,/terms,/work,/work/macyepay,/nope-404').split(',');
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
(async () => {
  const b = await (engine === 'webkit' ? webkit : chromium).launch(engine === 'webkit' ? { headless: true } : { channel: 'chrome', headless: true });
  const ctxOpts = mode === 'phone' ? { ...devices['iPhone 15 Pro'] } : { viewport: { width: 1800, height: 1000 } };
  let bad = 0, total = 0;
  for (const u of PAGES) {
    const ctx = await b.newContext(ctxOpts);
    await ctx.addCookies([{ name: 'linse_cookie_consent', value: 'true', domain: 'localhost', path: '/' }]);
    const p = await ctx.newPage();
    await p.goto('http://localhost:3000' + u, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
    await p.waitForTimeout(3500);
    const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const lb = await p.evaluate(() => { const r = document.querySelector('header a[aria-label]').getBoundingClientRect(); return { x: Math.round(r.left), w: Math.round(r.width) }; });
    const step = mode === 'phone' ? 160 : 250;
    const misses = [];
    for (let y = 0; y <= H; y += step) {
      await p.evaluate((yy) => window.scrollTo(0, yy), y);
      await p.waitForTimeout(260);
      const nav = await p.evaluate(() => document.documentElement.dataset.nav);
      await p.addStyleTag({ content: 'header{visibility:hidden!important} nextjs-portal{display:none!important}' }).catch(() => {});
      const buf = await p.screenshot({ clip: { x: lb.x, y: 36, width: lb.w, height: 8 }, type: 'png' });
      await p.evaluate(() => { const s = [...document.querySelectorAll('style')].pop(); if (s && s.textContent.includes('header{visibility:hidden')) s.remove(); });
      const avg = await p.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let r = 0, g = 0, bb = 0, n = d.length / 4; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bb += d[i + 2]; } return [r / n, g / n, bb / n]; }, buf.toString('base64'));
      const L = lum(...avg);
      const wrong = (nav === 'dark' && L > 0.3) || (nav === 'light' && L < 0.18);
      total++;
      if (wrong) { bad++; misses.push(`${y}:${nav}/L${L.toFixed(2)}`); }
    }
    console.log(`${engine}-${mode} ${u.padEnd(36)} ${misses.length ? 'MISMATCH ' + misses.slice(0, 8).join(' ') + (misses.length > 8 ? ` (+${misses.length - 8})` : '') : 'ok'}`);
    await ctx.close();
  }
  console.log(`${engine}-${mode}: ${bad}/${total} samples with a header that does not suit its background`);
  await b.close();
})();
