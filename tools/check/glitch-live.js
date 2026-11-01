// node glitch-live.js [path] : wheel-scroll a page in Chrome like a visitor (Lenis smoothing on) while recording the
// browser's own frame stream (CDP screencast), then flag flashes (a frame unlike both neighbours that are alike) and
// jumps (a change far above the local level). Writes OUT/live<path>/ (frames, events.json, one sheet per event).
// Env: PW, OUT, BASE (default http://localhost:3000), SPEED (px per wheel tick, default 60), TICK (ms, default 40),
// W / H (viewport, default 1440×900), FROM / TO (scroll range, default whole page), MOBILE=1 (phone emulation), MAXS (time cap in s, default 240), DIR=up (scroll back up).
const PW = process.env.PW || 'playwright';
const { chromium } = require(PW);
const sharp = require(require('path').join(__dirname, '../../node_modules/sharp'));
const fs = require('fs');
const path = require('path');

const page = process.argv[2] || '/';
const BASE = process.env.BASE || 'http://localhost:3000';
const SPEED = +(process.env.SPEED || 60);
const TICK = +(process.env.TICK || 40);
const W = +(process.env.W || 1440);
const H = +(process.env.H || 900);
const out = path.join(process.env.OUT || path.join(process.cwd(), 'glitch'), `live${page.replace(/\//g, '_')}-${W}${process.env.DIR === 'up' ? '-up' : ''}`);
fs.mkdirSync(path.join(out, 'frames'), { recursive: true });

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  // MOBILE=1: phone emulation (touch, mobile viewport); the wheel still drives native scrolling there
  const ctx = await b.newContext(process.env.MOBILE ? { viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' } : { viewport: { width: W, height: H } });
  await ctx.addCookies([{ name: 'linse_cookie_consent', value: 'true', domain: new URL(BASE).hostname, path: '/' }]);
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    const s = document.createElement('style');
    s.textContent = 'nextjs-portal{display:none!important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  await p.goto(BASE + page, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4500);
  const maxY = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const from = +(process.env.FROM || 0);
  const to = Math.min(maxY, +(process.env.TO || maxY));
  // DIR=up: start at the bottom of the range and scroll back up (reverse transitions)
  const up = process.env.DIR === 'up';
  const startAt = up ? to : from;
  if (startAt > 0) {
    for (let y = 0; y <= startAt; y += 400) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(20); }
    await p.evaluate((y) => window.scrollTo(0, y), startAt);
    await p.waitForTimeout(1500);
  }

  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp, y: Math.round(f.metadata.scrollOffsetY) });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 720, maxHeight: 720, everyNthFrame: 1 });
  await p.mouse.move(W / 2, H / 2);
  const t0 = Date.now();
  for (;;) {
    await p.mouse.wheel(0, up ? -SPEED : SPEED);
    await p.waitForTimeout(TICK);
    const y = await p.evaluate(() => scrollY);
    if ((up ? y <= from + 2 : y >= to - 2) || Date.now() - t0 > +(process.env.MAXS || 240) * 1000) break;
  }
  await p.waitForTimeout(1500);
  await cdp.send('Page.stopScreencast');
  await b.close();

  // thumbnails and diffs
  const th = [];
  for (let i = 0; i < frames.length; i++) {
    const buf = Buffer.from(frames[i].data, 'base64');
    fs.writeFileSync(path.join(out, 'frames', `${String(i).padStart(5, '0')}.jpg`), buf);
    th.push(await sharp(buf).resize(96, 60, { fit: 'fill' }).greyscale().raw().toBuffer());
  }
  const diff = (a, c) => { let d = 0; for (let k = 0; k < a.length; k++) d += Math.abs(a[k] - c[k]); return d / a.length; };
  const d = th.map((t, i) => (i ? diff(th[i - 1], t) : 0));
  const events = [];
  for (let i = 1; i < th.length - 1; i++) {
    const across = diff(th[i - 1], th[i + 1]);
    const flash = Math.min(d[i], d[i + 1]) - across; // A-B-A: the middle frame is the odd one out
    const win = d.slice(Math.max(1, i - 10), i + 11).sort((x, y) => x - y);
    const med = win[Math.floor(win.length / 2)] || 0;
    const jump = (d[i] - med) / (med + 2);
    if (flash > 4) events.push({ kind: 'flash', i, y: frames[i].y, score: +flash.toFixed(2) });
    else if (jump > 2.2) events.push({ kind: 'jump', i, y: frames[i].y, score: +jump.toFixed(2) });
  }
  events.sort((a, c) => c.score - a.score);
  const top = events.slice(0, 40);
  fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify({ frames: frames.length, seconds: (frames.at(-1).t - frames[0].t).toFixed(1), events }, null, 1));
  fs.writeFileSync(path.join(out, 'frames.json'), JSON.stringify(frames.map((f, i) => ({ i, t: +(f.t - frames[0].t).toFixed(3), y: f.y }))));
  for (const e of top) {
    const ids = [e.i - 2, e.i - 1, e.i, e.i + 1, e.i + 2].filter((k) => k >= 0 && k < frames.length);
    const tiles = ids.map((k) => path.join(out, 'frames', `${String(k).padStart(5, '0')}.jpg`));
    const meta = await sharp(tiles[0]).metadata();
    const tw = 360, thh = Math.round((meta.height / meta.width) * tw);
    const resized = await Promise.all(tiles.map((t) => sharp(t).resize(tw).toBuffer()));
    await sharp({ create: { width: (tw + 6) * resized.length, height: thh + 22, channels: 3, background: '#222' } })
      .composite([
        ...resized.map((r, k) => ({ input: r, left: k * (tw + 6), top: 22 })),
        { input: Buffer.from(`<svg width="${(tw + 6) * resized.length}" height="20"><text x="4" y="15" fill="#fff" font-size="13" font-family="sans-serif">${e.kind} · frame ${e.i} · y ${e.y} · score ${e.score} · frames ${ids.join(', ')} (middle = flagged)</text></svg>`), left: 0, top: 0 },
      ])
      .jpeg({ quality: 72 })
      .toFile(path.join(out, `${e.kind}_${String(e.i).padStart(5, '0')}.jpg`));
  }
  console.log(`${path.basename(out)}: ${frames.length} frames over ${(frames.at(-1).t - frames[0].t).toFixed(1)}s, ${events.length} events (${events.filter((e) => e.kind === 'flash').length} flashes)`);
  for (const e of top.sort((a, c) => a.i - c.i)) console.log(`  ${e.kind.padEnd(5)} frame ${e.i} y=${e.y} score=${e.score}`);
})();
