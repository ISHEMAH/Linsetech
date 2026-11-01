// node width.js : horizontal overflow per page in chrome-1800, webkit-1800 and webkit-iphone (scrolled through)
// PW = path to a Playwright module (like tools/ref/*.js), e.g. a scratch install
const PW = process.env.PW || 'playwright';
const { webkit, chromium, devices } = require(PW);
const PAGES = (process.env.PAGES || '/,/about,/services,/services/design,/careers,/support,/news,/news/linse-launches-new-website,/contact,/privacy,/terms,/work,/work/macyepay,/nope-404').split(',');
(async () => {
  for (const [name, launcher, opts] of [['chrome-1800', chromium, { viewport: { width: 1800, height: 1000 } }], ['webkit-1800', webkit, { viewport: { width: 1800, height: 1000 } }], ['webkit-iphone', webkit, { ...devices['iPhone 15 Pro'] }]]) {
    const b = await launcher.launch(launcher === chromium ? { channel: 'chrome', headless: true } : { headless: true });
    const bad = [];
    for (const u of PAGES) {
      const ctx = await b.newContext(opts); const p = await ctx.newPage();
      await p.goto('http://localhost:3000' + u, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
      await p.waitForTimeout(2500);
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      let worst = 0;
      for (let y = 0; y < H; y += 600) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(50); worst = Math.max(worst, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)); }
      if (worst > 0) bad.push(`${u}(+${worst}px)`);
      await ctx.close();
    }
    console.log(name, bad.length ? 'OVERFLOW ' + bad.join(' ') : 'all ok');
    await b.close();
  }
})();
