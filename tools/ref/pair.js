// node pair.js <out.jpg> <refUrl> <refYs(comma)> <ourUrl> <ourYexprs(|-separated JS expressions)> [labels(|)]
// Captures both pages at matching moments (progressive scroll; ours resolved from DOM expressions) and composes a
// two-column sheet: reference left, ours right. Uses PW env for the Playwright module path.
const { chromium } = require(process.env.PW || 'playwright'); const fs = require('fs'); const path = require('path');
const [out, refUrl, refYs, ourUrl, ourExprs, labels = ''] = process.argv.slice(2);
const dir = out.replace(/\.jpg$/, '_frames'); fs.mkdirSync(dir, { recursive: true });
async function grab(b, url, ysFn, tag) {
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  await p.addStyleTag({ content: '.cookie-banner{display:none!important}' }).catch(() => {});
  await p.waitForTimeout(3500);
  const ys = await ysFn(p);
  const files = []; let cur = 0;
  for (let i = 0; i < ys.length; i++) {
    const y = Math.max(0, Math.round(ys[i]));
    await p.mouse.move(900, 500);
    // wheel-scroll so Lenis-driven pages follow; then settle
    let guard = 0;
    while (Math.abs((await p.evaluate(() => scrollY)) - y) > 30 && guard++ < 200) {
      const d = y - (await p.evaluate(() => scrollY));
      await p.mouse.wheel(0, Math.max(-500, Math.min(500, d)));
      await p.waitForTimeout(60);
    }
    await p.waitForTimeout(1400);
    const f = path.join(dir, `${tag}_${String(i).padStart(2, '0')}.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 70 }); files.push(f); cur = y;
  }
  await p.close(); return files;
}
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  const ref = await grab(b, refUrl, async () => refYs.split(',').map(Number), 'ref');
  const ours = await grab(b, ourUrl, async (p) => p.evaluate((ex) => ex.split('|').map((e) => { try { return eval(e); } catch (er) { return 0; } }), ourExprs), 'ours');
  const L = labels ? labels.split('|') : [];
  const rows = ref.map((f, i) => `<div class=r><div class=l>${L[i] || i}</div><div class=p><img src="file://${f}"><img src="file://${ours[i] || ''}"></div></div>`).join('');
  const html = out + '.html';
  fs.writeFileSync(html, `<html><body style="margin:0;background:#111;color:#9bd;font:12px -apple-system"><style>.r{padding:6px 10px}.l{margin:2px 0 4px}.p{display:grid;grid-template-columns:1fr 1fr;gap:8px}img{width:100%;display:block}</style><div style="padding:10px;color:#eee;font-size:15px">reference (left) · Linse (right) · 1800×1000</div>${rows}</body></html>`);
  const s = await b.newPage({ viewport: { width: 1800, height: 1000 } }); await s.goto('file://' + html); await s.waitForTimeout(1200);
  await s.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 72 }); fs.unlinkSync(html);
  await b.close(); console.log('ok', out);
})();
