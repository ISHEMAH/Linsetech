// node cssom.js <url> <regex> : CSS rules from the live page whose selector matches regex
const { chromium } = require(process.env.PW || '/private/tmp/claude-501/-Users-hugues-Documents-WORK-linsetech/23deac66-870e-42cc-8bb3-e60d5d2cc7df/scratchpad/pw/node_modules/playwright');
(async () => {
  const [url, re] = process.argv.slice(2);
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage({ viewport: { width: 1800, height: 1000 } });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const rules = await p.evaluate((src) => {
    const rx = new RegExp(src); const out = [];
    const walk = (list, media) => { for (const r of list) { if (r.cssRules && !r.selectorText) walk(r.cssRules, r.conditionText || r.media?.mediaText || media); else if (r.selectorText && rx.test(r.selectorText)) out.push((media ? '@' + media + ' ' : '') + r.cssText.slice(0, 700)); } };
    for (const s of document.styleSheets) { try { walk(s.cssRules, ''); } catch (e) {} }
    return [...new Set(out)];
  }, re);
  console.log(rules.join('\n'));
  await b.close();
})();
