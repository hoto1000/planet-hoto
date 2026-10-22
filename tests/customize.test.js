// Run with: npm test   (Node's built-in test runner, no dependencies)
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { ratio } = require('./contrast.js');
const C = require('../docs/customize.js');

const read = f => fs.readFileSync(path.join(__dirname, '..', 'docs', f), 'utf8');
const fakeStorage = (init) => {
  const m = Object.assign({}, init);
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m };
};
const fakeRoot = () => {
  const attrs = {}, vars = {};
  return {
    attrs, vars,
    setAttribute: (k, v) => { attrs[k] = String(v); }, removeAttribute: k => { delete attrs[k]; },
    style: { setProperty: (k, v) => { vars[k] = v; }, removeProperty: k => { delete vars[k]; } }
  };
};

/* ---------- Storage ---------- */
test('defaults follow the device and keep everything at standard', () => {
  assert.deepStrictEqual(C.defaults(), { theme: 'auto', size: '100', font: 'default', spacing: 'normal', motion: 'auto', density: 'comfortable', sound: 'off' });
});

test('save then load round-trips, using only the ph-customize key', () => {
  const s = fakeStorage();
  const prefs = Object.assign(C.defaults(), { theme: 'calm', size: '130', sound: 'on' });
  assert.strictEqual(C.save(s, prefs), true);
  assert.deepStrictEqual(Object.keys(s._m), ['ph-customize']);
  assert.deepStrictEqual(C.load(s), prefs);
});

test('saving all-default choices stores nothing', () => {
  const s = fakeStorage({ 'ph-customize': '{"theme":"dark"}' });
  C.save(s, C.defaults());
  assert.deepStrictEqual(s._m, {});
});

test('other keys (language, country) are never touched', () => {
  const s = fakeStorage({ 'ph-lang': 'es', 'ph-country': 'mx' });
  C.save(s, Object.assign(C.defaults(), { theme: 'dark' }));
  C.reset(s);
  assert.deepStrictEqual(s._m, { 'ph-lang': 'es', 'ph-country': 'mx' });
});

test('bad, hostile or hand-edited stored values fall back to defaults', () => {
  for (const raw of ['not json', '[]', 'null', '{"theme":"neon"}', '{"size":"9999"}', '{"theme":["dark"]}', '{"__proto__":{"theme":"dark"}}', '"dark"']) {
    assert.deepStrictEqual(C.load(fakeStorage({ 'ph-customize': raw })), C.defaults(), raw);
  }
  assert.strictEqual(C.load(fakeStorage({ 'ph-customize': '{"theme":"dark","size":"9999"}' })).theme, 'dark');
});

test('blocked storage never throws and reports that nothing was saved', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  assert.deepStrictEqual(C.load(blocked), C.defaults());
  assert.strictEqual(C.save(blocked, Object.assign(C.defaults(), { theme: 'dark' })), false);
  assert.deepStrictEqual(C.reset(blocked), C.defaults());
  assert.deepStrictEqual(C.load(null), C.defaults());
});

/* ---------- Reset ---------- */
test('reset clears storage and returns the defaults', () => {
  const s = fakeStorage();
  C.save(s, Object.assign(C.defaults(), { theme: 'contrast', font: 'dyslexia', size: '150', sound: 'on', motion: 'reduce' }));
  assert.ok(s.getItem('ph-customize'));
  const out = C.reset(s);
  assert.strictEqual(s.getItem('ph-customize'), null);
  assert.deepStrictEqual(out, C.defaults());
  assert.deepStrictEqual(C.load(s), C.defaults());
});

test('applying the defaults removes every attribute and variable, so the device preferences rule again', () => {
  const r = fakeRoot();
  C.apply(r, Object.assign(C.defaults(), { theme: 'dark', font: 'system', spacing: 'loose', motion: 'reduce', density: 'compact', sound: 'on', size: '150' }));
  assert.ok(Object.keys(r.attrs).length >= 6);
  C.apply(r, C.reset(fakeStorage()));
  assert.deepStrictEqual(r.attrs, {});
  assert.deepStrictEqual(r.vars, {});
});

/* ---------- Apply ---------- */
test('apply maps choices to attributes and the text-size variable', () => {
  const r = fakeRoot();
  C.apply(r, { theme: 'contrast', size: '130', font: 'dyslexia', spacing: 'relaxed', motion: 'reduce', density: 'roomy', sound: 'on' });
  assert.deepStrictEqual(r.attrs, {
    'data-theme': 'dark', 'data-ph-theme': 'contrast', 'data-ph-font': 'dyslexia', 'data-ph-spacing': 'relaxed',
    'data-ph-motion': 'reduce', 'data-ph-density': 'roomy', 'data-ph-sound': 'on'
  });
  assert.strictEqual(r.vars['--ph-ts'], '1.3');
});

test('every explicit theme pins data-theme so prefers-color-scheme cannot override it; auto leaves it unset', () => {
  const expect = { light: 'light', dark: 'dark', contrast: 'dark', calm: 'light' };
  for (const t of Object.keys(expect)) { const r = fakeRoot(); C.apply(r, { theme: t }); assert.strictEqual(r.attrs['data-theme'], expect[t], t); }
  const r = fakeRoot(); C.apply(r, { theme: 'auto' });
  assert.strictEqual(r.attrs['data-theme'], undefined);
});

/* ---------- Privacy and scope ---------- */
test('customize.js makes no network calls and sets no cookies', () => {
  const src = read('customize.js');
  for (const bad of [/document\.cookie/, /\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /new\s+Image\b/, /https?:\/\//, /\bindexedDB\b/, /sessionStorage/]) {
    assert.ok(!bad.test(src), 'found ' + bad);
  }
  assert.ok(!/url\(/.test(read('customize.css')), 'customize.css loads no assets');
});

test('every language has every panel string', () => {
  const en = Object.keys(C.strings.en);
  for (const l of Object.keys(C.strings)) assert.deepStrictEqual(Object.keys(C.strings[l]).sort(), en.slice().sort(), l);
  for (const k of Object.keys(C.OPTIONS)) {
    assert.ok(C.strings.en[k], 'group label ' + k);
    for (const v of C.OPTIONS[k]) assert.ok(C.strings.en[k + '_' + v], 'option label ' + k + '_' + v);
  }
});

/* ---------- Pages ---------- */
const PAGES = ['index.html', 'avoid-scientology.html'];

test('both pages load the settings script in <head> (no flash) and the stylesheet', () => {
  for (const p of PAGES) {
    const html = read(p);
    const head = html.slice(0, html.indexOf('</head>') > 0 ? html.indexOf('</head>') : 4000);
    assert.match(head, /<script src="customize\.js"><\/script>/, p);
    assert.ok(!/<script[^>]*customize\.js[^>]*(defer|async)/.test(html), p + ' script must be blocking');
    assert.match(html, /<link rel="stylesheet" href="customize\.css">/, p);
  }
});

test('skip link is first, then the 988/911 bar, then header, panel, main', () => {
  for (const p of PAGES) {
    const html = read(p);
    const at = s => { const i = html.indexOf(s); assert.ok(i > -1, p + ': missing ' + s); return i; };
    const body = html.indexOf('<body');
    const skip = at('class="skip"'), crisis = at('class="crisis"'), header = at('<header'), panel = at('id="phPanel"'), main = at('<main');
    assert.ok(body < skip && skip < crisis && crisis < header && header < panel && panel < main, p + ' order');
    assert.match(html.slice(crisis, header), /988/, p);
    assert.match(html.slice(crisis, header), /911/, p);
    assert.match(html.slice(header, panel), /id="phOpen"[^>]*aria-expanded="false"[^>]*aria-controls="phPanel"/, p);
    assert.match(html, /id="phPanel" role="region" aria-labelledby="phTitle" hidden/, p);
  }
});

test('every pixel font size on the pages is scaled by the text-size variable', () => {
  for (const p of PAGES) {
    const css = read(p).match(/<style>[\s\S]*?<\/style>/g).join('\n');
    const bare = css.match(/font-size:\s*(?!calc)(?:clamp\([^;]*\)|\d+(?:\.\d+)?px)/g);
    assert.strictEqual(bare, null, p + ' has unscaled px font sizes: ' + bare);
  }
  assert.match(read('customize.css'), /html \{ font-size: calc\(100% \* var\(--ph-ts, 1\)\); \}/);
});

test('the crisis bar is not hidden, clipped or reordered by any customize rule', () => {
  const css = read('customize.css');
  assert.ok(!/\.crisis[^{]*\{[^}]*(display:\s*none|visibility|height:|max-height|overflow:\s*hidden|order:|position:\s*(absolute|fixed))/.test(css));
  assert.ok(!/(^|\})\s*(\*|body|main)[^{]*\{[^}]*display:\s*none/.test(css));
});

/* ---------- Contrast (WCAG AA) ---------- */
function vars(css, selector) {
  const i = css.indexOf(selector + ' {');
  assert.ok(i > -1, 'selector ' + selector);
  const block = css.slice(i, css.indexOf('}', i));
  const out = {};
  for (const m of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,6})/g)) out[m[1]] = m[2];
  return out;
}
const idx = read('index.html'), sci = read('avoid-scientology.html'), cz = read('customize.css');
const home = {
  light: vars(idx, ':root'),
  dark: Object.assign({}, vars(idx, ':root'), vars(idx, ':root[data-theme="dark"]')),
  contrast: vars(cz, 'html:root[data-ph-theme="contrast"]'),
  calm: vars(cz, 'html:root[data-ph-theme="calm"]')
};
const sciT = {
  light: vars(sci, '  :root'.trim()),
  dark: Object.assign({}, vars(sci, ':root'), vars(sci, ':root[data-theme="dark"]')),
  contrast: home.contrast,
  calm: home.calm
};
const AA = 4.5;
for (const t of Object.keys(home)) {
  test(`home page, ${t} theme: text, links, buttons and the crisis bar pass WCAG AA`, () => {
    const v = home[t];
    const pairs = [['fg', 'bg'], ['fg', 'surface'], ['muted', 'bg'], ['muted', 'surface'], ['muted', 'soft'], ['accent', 'bg'], ['accent', 'surface'], ['accent', 'soft'],
      ['accent-fg', 'accent'], ['signal', 'signal-bg'], ['fg', 'signal-bg'], ['fg', 'soft']];
    for (const [a, b] of pairs) assert.ok(ratio(v[a], v[b]) >= AA, `${t}: ${a} ${v[a]} on ${b} ${v[b]} = ${ratio(v[a], v[b]).toFixed(2)}`);
  });
  test(`Scientology page, ${t} theme: text, hazard buttons, top bar and the crisis bar pass WCAG AA`, () => {
    const v = sciT[t];
    const g = k => v[k] || v[{ paper: 'surface', rule: 'line' }[k]];
    const pairs = [['fg', 'bg'], ['fg', 'paper'], ['muted', 'bg'], ['muted', 'paper'], ['hazard-ink', 'hazard'], ['danger', 'paper'], ['danger', 'signal-bg'], ['fg', 'signal-bg'], ['bg', 'fg']];
    for (const [a, b] of pairs) assert.ok(ratio(g(a), g(b)) >= AA, `${t}: ${a} ${g(a)} on ${b} ${g(b)} = ${ratio(g(a), g(b)).toFixed(2)}`);
  });
}
test('Scientology top bar brand word stays readable on the inverted bar in every theme', () => {
  // light/calm: yellow-ish word on the dark bar; dark/contrast: dark amber (#7a5200, set by the page and customize.css) on the light bar
  assert.ok(ratio(sciT.light.hazard, sciT.light.fg) >= AA);
  assert.ok(ratio(sciT.calm.hazard, sciT.calm.fg) >= AA);
  assert.ok(ratio('#7a5200', sciT.dark.fg) >= AA);
  assert.ok(ratio('#7a5200', sciT.contrast.fg) >= AA);
});
