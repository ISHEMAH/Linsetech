// node preload.js : the loading screen as a visitor sees it — a fresh visit, a repeat load, a client-side navigation (the
// curtain), reduced motion and a load with the scripts blocked (the CSS fallback), each as a frame sheet with checks.
// Env: PW (Playwright module), ENGINE=chrome|webkit, BASE (default http://localhost:3000), PAGE, W, H, MOBILE=1, OUT (file prefix)
const PW = process.env.PW || 'playwright';
const { chromium, webkit, devices } = require(PW);
const sharp = require(require('path').join(__dirname, '../../node_modules/sharp'));
const ENGINE = process.env.ENGINE || 'chrome';
const BASE = process.env.BASE || 'http://localhost:3000';
const PAGE = process.env.PAGE || '/';
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const OUT = process.env.OUT || ENGINE;

async function sheet(frames, name, cols = 6) {
  if (!frames.length) return console.log(name, 'no frames');
  const picks = frames.length > 24 ? Array.from({ length: 24 }, (_, k) => frames[Math.round((k * (frames.length - 1)) / 23)]) : frames;
  const tw = 300; const meta = await sharp(picks[0].buf).metadata(); const th = Math.round((meta.height / meta.width) * tw);
  const comps = [];
  for (let k = 0; k < picks.length; k++) {
    const x = (k % cols) * (tw + 4), y = Math.floor(k / cols) * (th + 18);
    comps.push({ input: await sharp(picks[k].buf).resize(tw).toBuffer(), left: x, top: y + 16 });
    comps.push({ input: Buffer.from(`<svg width="${tw}" height="16"><text x="2" y="12" fill="#ff0" font-size="11" font-family="Menlo">${picks[k].t.toFixed(2)}s</text></svg>`), left: x, top: y });
  }
  await sharp({ create: { width: cols * (tw + 4), height: Math.ceil(picks.length / cols) * (th + 18), channels: 3, background: '#111' } }).composite(comps).jpeg({ quality: 78 }).toFile(`${name}.jpg`);
  console.log(name + '.jpg', picks.length, 'of', frames.length, 'frames');
}

// frames of the first `secs` seconds of a navigation: CDP screencast in Chrome, a screenshot loop in WebKit
async function record(ctx, p, go, secs) {
  const frames = [];
  const t0 = Date.now();
  if (ENGINE === 'chrome') {
    const cdp = await ctx.newCDPSession(p);
    cdp.on('Page.screencastFrame', async (f) => { frames.push({ buf: Buffer.from(f.data, 'base64'), t: (Date.now() - t0) / 1000 }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {} });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 720, maxHeight: 720, everyNthFrame: 1 });
    await go();
    await p.waitForTimeout(secs * 1000);
    await cdp.send('Page.stopScreencast');
    await cdp.detach();
  } else {
    await go();
    while (Date.now() - t0 < secs * 1000) {
      const buf = await p.screenshot({ type: 'jpeg', quality: 60, scale: 'css' }).catch(() => null);
      if (buf) frames.push({ buf, t: (Date.now() - t0) / 1000 });
    }
  }
  return frames;
}

(async () => {
  const launch = () => (ENGINE === 'chrome' ? chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] }) : webkit.launch({ headless: true }));
  const b = await launch();
  const mk = (extra = {}) => b.newContext(process.env.MOBILE ? { ...devices['iPhone 15 Pro'], ...extra } : { viewport: { width: W, height: H }, ...extra });
  const cookie = (ctx) => ctx.addCookies([{ name: 'linse_cookie_consent', value: 'true', domain: new URL(BASE).hostname, path: '/' }]);

  // 1. fresh visit
  let ctx = await mk();
  await cookie(ctx);
  let p = await ctx.newPage();
  const log = [];
  await p.addInitScript(() => {
    const t0 = performance.now();
    const o = new MutationObserver(() => { const s = document.documentElement.dataset.pre; if (s && s !== window.__lastPre) { window.__lastPre = s; (window.__pre = window.__pre || []).push([Math.round(performance.now() - t0), s]); } });
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-pre'] });
  });
  let frames = await record(ctx, p, () => p.goto(BASE + PAGE, { waitUntil: 'commit' }), 5);
  await sheet(frames, `${OUT}-fresh`);
  console.log('data-pre timeline (ms, state):', JSON.stringify(await p.evaluate(() => window.__pre || [])), '| loader hidden:', await p.evaluate(() => document.querySelector('.preloader')?.hidden), '| html overflow:', await p.evaluate(() => getComputedStyle(document.documentElement).overflow), '| hero letters:', await p.evaluate(() => { const c = document.querySelector('.hero-title .ch, h1 .ch'); return c ? getComputedStyle(c).opacity : '-'; }), '| scrollable:', await p.evaluate(() => document.documentElement.scrollHeight > innerHeight));
  // 2. a repeat load in the same visit (seen)
  frames = await record(ctx, p, () => p.reload({ waitUntil: 'commit' }), 2.5);
  await sheet(frames, `${OUT}-seen`);
  console.log('seen: loader hidden at 2.5s:', await p.evaluate(() => document.querySelector('.preloader')?.hidden));
  // 3. a client-side navigation: the curtain
  frames = await record(ctx, p, async () => { if (process.env.MOBILE) { await p.click('[aria-controls="mobile-menu"]'); await p.waitForTimeout(700); await p.click('#mobile-menu a[href*="/about"]'); } else await p.click('header a[href*="/about"]'); }, 1.6);
  await sheet(frames, `${OUT}-nav`);
  console.log('after nav: path', await p.evaluate(() => location.pathname), '| curtain opacity', await p.evaluate(() => getComputedStyle(document.getElementById('page-transition')).opacity));
  await ctx.close();

  // 4. reduced motion
  ctx = await mk({ reducedMotion: 'reduce' });
  await cookie(ctx);
  p = await ctx.newPage();
  frames = await record(ctx, p, () => p.goto(BASE + PAGE, { waitUntil: 'commit' }), 3.5);
  await sheet(frames, `${OUT}-reduced`, 6);
  console.log('reduced: loader hidden at 3.5s:', await p.evaluate(() => document.querySelector('.preloader')?.hidden), '| hero letters:', await p.evaluate(() => { const c = document.querySelector('h1 .ch'); return c ? getComputedStyle(c).opacity : '-'; }));
  await ctx.close();

  // 5. no scripts at all: the CSS fallback
  ctx = await mk();
  await cookie(ctx);
  p = await ctx.newPage();
  await p.route(/\/_next\/static\/.*\.js/, (r) => r.abort());
  await p.goto(BASE + PAGE, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(6200);
  console.log('no-js at 6.2s: loader visibility', await p.evaluate(() => getComputedStyle(document.querySelector('.preloader')).visibility), '| data-pre', await p.evaluate(() => document.documentElement.dataset.pre), '| html overflow', await p.evaluate(() => getComputedStyle(document.documentElement).overflow));
  await p.screenshot({ path: `${OUT}-nojs.jpg`, type: 'jpeg', quality: 60 });
  await ctx.close();
  await b.close();
})();
