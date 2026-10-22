// WCAG 2.x contrast helpers, shared by the tests. No dependencies.
function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function parse(hex) {
  var h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
  return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); });
}
function lum(hex) { var c = parse(hex); return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
module.exports = { ratio: ratio };
