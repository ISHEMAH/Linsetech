// node dom.js <url> : list videos, and every element whose background (color/image) is visible and >= 60% viewport wide
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(4000);
  // scroll through once so lazy sections mount
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.mouse.wheel(0, 1); await p.waitForTimeout(60); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(1500);
  const out = await p.evaluate(() => {
    const vids = [...document.querySelectorAll('video')].map((v) => ({ src: v.currentSrc || v.src || [...v.querySelectorAll('source')].map((s) => s.src).join(' | '), cls: v.className, loop: v.loop, dur: v.duration, w: v.videoWidth, h: v.videoHeight, rect: (() => { const r = v.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; })(), pos: getComputedStyle(v).position, parentPos: getComputedStyle(v.parentElement).position, parentCls: v.parentElement.className }));
    const lottie = [...document.querySelectorAll('canvas, dotlottie-player, lottie-player')].map((c) => ({ tag: c.tagName, cls: c.className, src: c.getAttribute('src'), rect: (() => { const r = c.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; })() }));
    const bgs = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      if (r.width < innerWidth * 0.6 || r.height < 40) continue;
      const bi = cs.backgroundImage; const bc = cs.backgroundColor;
      const hasImg = bi && bi !== 'none'; const hasCol = bc && bc !== 'rgba(0, 0, 0, 0)' && bc !== 'transparent';
      if (!hasImg && !hasCol) continue;
      bgs.push({ tag: el.tagName.toLowerCase(), cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 90), top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width), pos: cs.position, z: cs.zIndex, op: cs.opacity, bc: hasCol ? bc : '', bi: hasImg ? bi.slice(0, 400) : '', size: hasImg ? cs.backgroundSize : '', bpos: hasImg ? cs.backgroundPosition : '', tf: cs.transform !== 'none' ? cs.transform : '' });
    }
    const imgs = [...document.querySelectorAll('img')].filter((i) => /gradient|glow|bg|background/i.test(i.src + i.className)).map((i) => ({ src: i.src, cls: i.className, rect: (() => { const r = i.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; })(), parentCls: i.parentElement.className.toString().slice(0, 80), tf: getComputedStyle(i).transform }));
    const sections = [...document.querySelectorAll('main section, main > div > section, section')].map((s) => ({ cls: s.className.toString().slice(0, 100), top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) }));
    return { H: document.documentElement.scrollHeight, html: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor, vids, lottie, imgs, sections, bgs };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
