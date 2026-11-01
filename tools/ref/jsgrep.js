// node jsgrep.js <url> <needle> : download every script the page loads and print context around needle
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright');
(async () => {
  const [url, needle] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  const bodies = [];
  p.on('response', async (r) => { if (/\.js(\?|$)/.test(r.url())) { try { bodies.push([r.url(), await r.text()]); } catch (e) {} } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(80); }
  await p.waitForTimeout(1500);
  for (const [u, t] of bodies) {
    let i = t.indexOf(needle);
    let n = 0;
    while (i >= 0 && n < 4) { console.log('---', u.split('/').pop(), '@', i); console.log(t.slice(Math.max(0, i - 900), i + 900)); i = t.indexOf(needle, i + 1); n++; }
  }
  await b.close();
})();
