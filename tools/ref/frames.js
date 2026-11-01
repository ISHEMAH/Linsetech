// node frames.js <video> <n> <out.jpg> [cols] [bg] : n evenly spaced frames on a grid (alpha shown over bg)
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright'); const fs = require('fs'); const path = require('path');
const [vid, n = '12', out, cols = '4', bg = '#2a2f36'] = process.argv.slice(2);
(async () => {
  const html = path.resolve(path.dirname(out), '_frames_' + path.basename(out, '.jpg') + '.html');
  fs.writeFileSync(html, `<html><body style="margin:0;background:#111;color:#ddd;font:12px -apple-system"><video id=v src="file://${path.resolve(vid)}" muted preload=auto crossorigin=anonymous></video><div id=g style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;padding:4px"></div></body></html>`);
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto('file://' + html);
  const info = await p.evaluate(async ({ n, bg }) => {
    const v = document.getElementById('v'); const g = document.getElementById('g');
    await new Promise((r) => (v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, { once: true })));
    const N = +n; const d = v.duration;
    for (let i = 0; i < N; i++) {
      const t = Math.min(d - 0.02, (i / (N - 1)) * d);
      v.currentTime = t; await new Promise((r) => v.addEventListener('seeked', r, { once: true }));
      const c = document.createElement('canvas'); c.width = v.videoWidth / 2; c.height = v.videoHeight / 2;
      const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.drawImage(v, 0, 0, c.width, c.height);
      const w = document.createElement('div'); w.style.position = 'relative'; c.style.width = '100%'; c.style.display = 'block';
      const lab = document.createElement('div'); lab.textContent = t.toFixed(2) + 's'; lab.style.cssText = 'position:absolute;left:4px;top:2px;background:#000a;padding:1px 4px';
      w.appendChild(c); w.appendChild(lab); g.appendChild(w);
    }
    return { d, w: v.videoWidth, h: v.videoHeight };
  }, { n, bg });
  await p.waitForTimeout(300);
  await p.screenshot({ path: out, fullPage: true, type: 'jpeg', quality: 80 });
  console.log(path.basename(vid), JSON.stringify(info));
  await b.close();
})();
