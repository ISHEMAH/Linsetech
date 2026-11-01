// node recording-sheet.js <dir> <out-prefix> [cols=5] [rows=4] [tileW=400] [from=0] [to=all] [every=1]
// Contact sheets of <dir>/frames/*.jpg written=1 rows from frames.csv, each tile labelled with frame index and time.
const sharp = require(require('path').join(__dirname, '../../node_modules/sharp'));
const fs = require('fs');
const path = require('path');
const [dir, prefix, cols = 5, rows = 4, tileW = 400, from = 0, to = 1e9, every = 1] = process.argv.slice(2).map((v, i) => (i < 2 ? v : +v));
const csv = fs.readFileSync(path.join(dir, 'frames.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(',')).map(([i, t, d, w]) => ({ i: +i, t: +t, d: +d, w: +w }));
const list = csv.filter((r) => r.w && r.i >= from && r.i <= to).filter((_, k) => k % every === 0);
(async () => {
  const meta = await sharp(path.join(dir, 'frames', `${String(list[0].i).padStart(5, '0')}.jpg`)).metadata();
  const tileH = Math.round((meta.height / meta.width) * tileW);
  const per = cols * rows;
  for (let s = 0; s * per < list.length; s++) {
    const chunk = list.slice(s * per, (s + 1) * per);
    const comps = [];
    for (let k = 0; k < chunk.length; k++) {
      const r = chunk[k];
      const x = (k % cols) * (tileW + 4), y = Math.floor(k / cols) * (tileH + 22);
      comps.push({ input: await sharp(path.join(dir, 'frames', `${String(r.i).padStart(5, '0')}.jpg`)).resize(tileW).toBuffer(), left: x, top: y + 20 });
      comps.push({ input: Buffer.from(`<svg width="${tileW}" height="20"><text x="3" y="15" fill="#ff0" font-size="14" font-family="Menlo">#${r.i}  t=${r.t.toFixed(2)}s  d=${r.d.toFixed(1)}</text></svg>`), left: x, top: y });
    }
    const out = `${prefix}_${String(s).padStart(2, '0')}.jpg`;
    await sharp({ create: { width: cols * (tileW + 4), height: Math.ceil(chunk.length / cols) * (tileH + 22), channels: 3, background: '#111' } }).composite(comps).jpeg({ quality: 78 }).toFile(out);
    console.log(out, chunk[0].t.toFixed(2), '→', chunk.at(-1).t.toFixed(2));
  }
})();
