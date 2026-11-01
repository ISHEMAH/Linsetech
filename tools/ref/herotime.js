// node herotime.js <out.jpg> <refUrl> <ourUrl> <t1,t2,..> : both heroes at the same clip times (clips paused + seeked)
const { chromium } = require(process.env.PW); const fs = require('fs'); const path = require('path');
const [out, refUrl, ourUrl, ts] = process.argv.slice(2); const T = ts.split(',').map(Number);
const dir = out.replace(/\.jpg$/, '_frames'); fs.mkdirSync(dir, { recursive: true });
async function grab(b, url, tag) {
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  await p.addStyleTag({ content: '.cookie-banner{display:none!important}' }).catch(() => {});
  await p.waitForTimeout(3500);
  const files = [];
  for (const t of T) {
    await p.evaluate(async (tt) => { const v = [...document.querySelectorAll('video')].find((x) => x.getBoundingClientRect().height > 500) || document.querySelector('video'); if (!v) return; v.pause(); v.currentTime = Math.min(tt, (v.duration || 99) - 0.05); await new Promise((r) => v.addEventListener('seeked', r, { once: true })); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    const f = path.join(dir, `${tag}_${t}.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 72 }); files.push(f);
  }
  await p.close(); return files;
}
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const r = await grab(b, refUrl, 'ref'); const o = await grab(b, ourUrl, 'ours');
  const rows = r.map((f, i) => `<div class=r><div class=l>${T[i]} s</div><div class=p><img src="file://${f}"><img src="file://${o[i]}"></div></div>`).join('');
  const html = out + '.html'; fs.writeFileSync(html, `<html><body style="margin:0;background:#111;color:#9bd;font:12px -apple-system"><style>.r{padding:6px 10px}.p{display:grid;grid-template-columns:1fr 1fr;gap:8px}img{width:100%;display:block}</style><div style="padding:10px;color:#eee;font-size:15px">hero clip at the same second — reference (left) · Linse (right) · 1800×1000</div>${rows}</body></html>`);
  const s = await b.newPage({ viewport: { width: 1800, height: 1000 } }); await s.goto('file://' + html); await s.waitForTimeout(1200);
  await s.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 72 }); fs.unlinkSync(html); await b.close(); console.log('ok', out);
})();
