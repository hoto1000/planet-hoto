// Optional browser check (not part of `npm test`): needs Playwright and a running preview.
//   node serve.js docs 8766 &   then   NODE_PATH=$(npm root -g) node tests/e2e/customize.e2e.js [outDir]
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8766';
const OUT = process.argv[2] || null;
const PAGES = fs.readdirSync('docs').filter(f => f.endsWith('.html')).sort().map(f => '/' + f);
const THEMES = ['auto', 'light', 'dark', 'contrast', 'calm'];
const SIZES = ['100', '150'];
const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log('FAIL', msg); } };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  for (const vp of [{ w: 390, h: 800, n: 'mobile' }, { w: 1280, h: 900, n: 'desktop' }]) {
    for (const page of PAGES) {
      for (const theme of THEMES) {
        for (const size of SIZES) {
          const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: 'light' });
          await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());   // fonts etc. are not needed offline
          await ctx.addInitScript(([t, s]) => {
            if (t !== 'auto' || s !== '100') localStorage.setItem('ph-customize', JSON.stringify({ theme: t, size: s }));
          }, [theme, size]);
          const p = await ctx.newPage();
          await p.goto(BASE + page);
          const tag = `${page.slice(1, -5)}-${vp.n}-${theme}-${size}`;
          const first = await p.evaluate(() => { const f = document.querySelector('a[href], button, select, input'); return f && f.className; });
          check(first === 'skip', `${tag}: skip link is first focusable (got ${first})`);
          const order = await p.evaluate(() => {
            const c = document.querySelector('.crisis'), h = document.querySelector('header'), pn = document.getElementById('phPanel'), m = document.querySelector('main');
            const pos = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
            return pos(c, h) && pos(h, pn) && pos(pn, m);
          });
          check(order, `${tag}: crisis bar precedes header, panel, main`);
          const cr = await p.evaluate(() => { const r = document.querySelector('.crisis').getBoundingClientRect(); return { top: r.top, h: r.height, txt: document.querySelector('.crisis').innerText }; });
          check(cr.top >= 0 && cr.top < 5 && cr.h > 20, `${tag}: crisis bar at top of page and visible`);
          check(/988/.test(cr.txt) && /911/.test(cr.txt), `${tag}: crisis bar shows 988 and 911`);
          const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          check(ov <= 1, `${tag}: no horizontal overflow (${ov}px)`);
          if (OUT && size === '150' || OUT && theme !== 'auto' && size === '100') { fs.mkdirSync(OUT, { recursive: true }); await p.screenshot({ path: `${OUT}/${tag}.png` }); }
          await ctx.close();
        }
      }
    }
  }
  // Everything on at once, at the largest text size: the 988/911 bar must stay on top, readable and unclipped.
  const MAX = { theme: 'contrast', size: '150', font: 'dyslexia', spacing: 'loose', density: 'roomy', accent: 'rose', links: 'underline', width: 'narrow', radius: 'round', columns: 'single', focus: 'thick', ruler: 'on', letter: 'wider', word: 'wider', para: 'wide', motion: 'reduce', sound: 'on' };
  for (const vp of [{ w: 320, h: 700 }, { w: 390, h: 800 }, { w: 1280, h: 900 }]) {
    for (const page of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      await ctx.addInitScript(v => localStorage.setItem('ph-customize', JSON.stringify(v)), MAX);
      const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
      await p.goto(BASE + page);
      const tag = `max ${page} ${vp.w}px`;
      const m = await p.evaluate(() => { const c = document.querySelector('.crisis'), r = c.getBoundingClientRect(); return { top: r.top, h: r.height, sw: document.documentElement.scrollWidth - document.documentElement.clientWidth, clipped: c.scrollWidth > c.clientWidth + 1, txt: c.innerText, ruler: !!document.querySelector('.ph-ruler') }; });
      check(m.top >= 0 && m.top < 5 && m.h > 20 && /988/.test(m.txt) && /911/.test(m.txt), `${tag}: crisis bar on top with 988 and 911`);
      check(m.sw <= 1 && !m.clipped, `${tag}: no overflow or clipping (${m.sw}px)`);
      check(m.ruler, `${tag}: ruler present`);
      if (OUT) { fs.mkdirSync(OUT, { recursive: true }); await p.screenshot({ path: `${OUT}/max-${page.slice(1, -5)}-${vp.w}.png` }); }
      await ctx.close();
    }
  }
  // Settings file: export then import in a fresh context
  {
    const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 390, height: 800 } });
    const p = await ctx.newPage(); await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await p.goto(BASE + PAGES[0]); await p.click('#phOpen');
    await p.evaluate(() => document.querySelectorAll('#phPanel details').forEach(d => { d.open = true; }));
    await p.click('label[for="ph-accent-blue"]'); await p.click('label[for="ph-width-wide"]');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#phExport')]);
    const file = await dl.path();
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    check(saved.app === 'planet-hoto' && saved.settings.accent === 'blue', 'export file has the settings');
    await p.click('#phReset');
    check(await p.evaluate(() => document.documentElement.dataset.phAccent) === undefined, 'reset before import');
    await p.setInputFiles('#phFile', file);
    await p.waitForFunction(() => document.documentElement.dataset.phAccent === 'blue');
    check(await p.evaluate(() => document.documentElement.dataset.phWidth) === 'wide', 'import restored settings');
    await p.setInputFiles('#phFile', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await p.waitForFunction(() => /not a Project Hoto/.test(document.getElementById('phStatus').textContent));
    await ctx.close();
  }
  // Panel behaviour, persistence, reset, no network
  for (const page of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const reqs = [];
    const p = await ctx.newPage();
    await p.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await p.goto(BASE + page);
    p.on('request', r => { if (/^https?:\/\/localhost/.test(r.url())) reqs.push(r.url()); });
    await p.click('#phOpen');
    check(await p.getAttribute('#phOpen', 'aria-expanded') === 'true', `${page}: button expanded`);
    check(await p.evaluate(() => document.activeElement.id) === 'phTitle', `${page}: focus moves to panel heading`);
    await p.evaluate(() => document.querySelectorAll('#phPanel details').forEach(d => { d.open = true; }));
    check(await p.evaluate(() => document.querySelectorAll('#phPanel fieldset legend').length) === 17, `${page}: 17 labelled groups`);
    await p.click('label[for="ph-theme-contrast"]');
    await p.click('label[for="ph-size-130"]');
    await p.click('label[for="ph-font-dyslexia"]');
    await p.click('label[for="ph-sound-on"]');
    const html = await p.evaluate(() => { const d = document.documentElement; return [d.dataset.phTheme, d.dataset.phFont, d.dataset.phSound, d.style.getPropertyValue('--ph-ts')]; });
    check(html.join() === 'contrast,dyslexia,on,1.3', `${page}: attributes applied (${html})`);
    await p.reload();
    check(await p.evaluate(() => document.documentElement.dataset.phTheme) === 'contrast', `${page}: persisted after reload`);
    await p.click('#phOpen');
    check(await p.isChecked('#ph-theme-contrast'), `${page}: radio reflects saved theme`);
    await p.click('#phReset');
    const after = await p.evaluate(() => [localStorage.getItem('ph-customize'), document.documentElement.getAttribute('data-ph-theme'), document.documentElement.getAttribute('style')]);
    check(after[0] === null && after[1] === null && !after[2], `${page}: reset clears storage and attributes (${after})`);
    check(await p.evaluate(() => document.activeElement.id) === 'phReset', `${page}: focus stays on reset after rebuild`);
    await p.keyboard.press('Escape');
    check(await p.getAttribute('#phOpen', 'aria-expanded') === 'false' && await p.evaluate(() => document.activeElement.id) === 'phOpen', `${page}: Escape closes and returns focus`);
    const cookies = await ctx.cookies();
    check(cookies.length === 0, `${page}: no cookies set`);
    check(reqs.every(u => /\.(html|css|js)$/.test(u) || /\/assets\/fonts\/[a-z0-9-]+\.woff2$/.test(u) || /\/assets\/art\/[a-z0-9-]+\.svg$/.test(u) || /\/assets\/audio\/[a-z0-9-]+\.m4a$/.test(u) || u.endsWith('/')), `${page}: only static page files requested after load (${reqs.join(' ')})`);
    // system dark default + reduced motion default
    await ctx.close();
    const c2 = await browser.newContext({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const p2 = await c2.newPage(); await p2.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await p2.goto(BASE + page);
    const bg = await p2.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(/^rgb\((14|16|23), /.test(bg), `${page}: follows prefers-color-scheme: dark by default (${bg})`);
    await c2.close();
  }
  await browser.close();
  console.log(fails.length ? `${fails.length} failure(s)` : 'e2e: all checks passed');
  process.exit(fails.length ? 1 : 0);
})();
