// node glitch.js <chrome|webkit> <desk|phone> [path] : scroll a page in small steps, keep every frame, and flag frames that
// change much more than their neighbours (jumps, flashes, pop-ins, overlaps). Writes OUT/<name>/frames/*.jpg, diffs.json and
// one sheet per flagged step (previous · flagged · next). Env: PW (Playwright module), OUT (folder), STEP (px, default 40),
// WAIT (ms per step, default 140), BASE (default http://localhost:3000).
const PW = process.env.PW || 'playwright';
const { webkit, chromium, devices } = require(PW);
const sharp = require(require('path').join(__dirname, '../../node_modules/sharp'));
const fs = require('fs');
const path = require('path');

const [engine = 'chrome', mode = 'desk', page = '/'] = process.argv.slice(2);
const STEP = +(process.env.STEP || 40);
const WAIT = +(process.env.WAIT || 140);
const BASE = process.env.BASE || 'http://localhost:3000';
const name = `${engine}-${mode}${page.replace(/\//g, '_')}`;
const out = path.join(process.env.OUT || path.join(process.cwd(), 'glitch'), name);
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });

(async () => {
  const b = await (engine === 'webkit' ? webkit : chromium).launch(engine === 'webkit' ? { headless: true } : { channel: 'chrome', headless: true });
  const ctx = await b.newContext(mode === 'phone' ? { ...devices['iPhone 15 Pro'] } : { viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: 'linse_cookie_consent', value: 'true', domain: new URL(BASE).hostname, path: '/' }]);
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    // the dev-tools badge would show in every frame
    const s = document.createElement('style');
    s.textContent = 'nextjs-portal{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  await p.goto(BASE + page, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const thumbs = [];
  const rows = [];
  for (let y = 0, i = 0; y <= H; y += STEP, i++) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(WAIT);
    const info = await p.evaluate(() => {
      const mid = innerHeight / 2;
      const sec = [...document.querySelectorAll('main section, main [data-chapter]')].find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      return { nav: document.documentElement.dataset.nav, sec: sec ? (sec.dataset.chapter || sec.className.split(' ').slice(0, 2).join('.')) : '-', y: Math.round(scrollY) };
    });
    const png = await p.screenshot({ type: 'png' });
    const img = sharp(png);
    await img.clone().resize(720).jpeg({ quality: 60 }).toFile(path.join(out, 'frames', `${String(i).padStart(4, '0')}.jpg`));
    const raw = await img.clone().resize(96, null).greyscale().raw().toBuffer();
    thumbs.push(raw);
    let d = 0;
    if (i > 0) { const a = thumbs[i - 1]; for (let k = 0; k < raw.length; k++) d += Math.abs(raw[k] - a[k]); d /= raw.length; }
    rows.push({ i, y: info.y, nav: info.nav, sec: info.sec, diff: +d.toFixed(2) });
  }
  // flag steps whose change stands out from the local level (median of the 15 steps around)
  const diffs = rows.map((r) => r.diff);
  rows.forEach((r, i) => {
    const win = diffs.slice(Math.max(1, i - 7), i + 8).sort((x, y) => x - y);
    const med = win[Math.floor(win.length / 2)] || 0;
    r.score = +((r.diff - med) / (med + 2)).toFixed(2);
  });
  fs.writeFileSync(path.join(out, 'diffs.json'), JSON.stringify(rows, null, 1));
  const flagged = rows.filter((r) => r.i > 0 && r.score > 1.6).sort((a, c) => c.score - a.score).slice(0, 40);
  for (const r of flagged) {
    const f = (k) => path.join(out, 'frames', `${String(Math.max(0, Math.min(rows.length - 1, k))).padStart(4, '0')}.jpg`);
    const tiles = [r.i - 1, r.i, r.i + 1].map(f);
    const meta = await sharp(tiles[0]).metadata();
    await sharp({ create: { width: meta.width * 3 + 16, height: meta.height + 24, channels: 3, background: '#222' } })
      .composite([
        ...tiles.map((t, k) => ({ input: t, left: k * (meta.width + 8), top: 24 })),
        { input: Buffer.from(`<svg width="${meta.width * 3}" height="22"><text x="4" y="16" fill="#fff" font-size="14" font-family="sans-serif">step ${r.i} · y ${r.y} · ${r.sec} · nav ${r.nav} · diff ${r.diff} · score ${r.score}  (prev · flagged · next)</text></svg>`), left: 0, top: 0 },
      ])
      .jpeg({ quality: 70 })
      .toFile(path.join(out, `flag_${String(r.i).padStart(4, '0')}.jpg`));
  }
  console.log(`${name}: ${rows.length} steps, ${flagged.length} flagged`);
  for (const r of flagged.sort((a, c) => a.i - c.i)) console.log(`  step ${r.i} y=${r.y} ${r.sec} nav=${r.nav} diff=${r.diff} score=${r.score}`);
  await b.close();
})();
