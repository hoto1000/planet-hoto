/* Ads for Hoto's Dissident Blog.
 *
 * Self-hosted and private: this file is the whole ad system. It makes no
 * network calls, sets no cookies, and records nothing about the reader.
 * It fits the site's Content-Security-Policy (script-src 'self'), so no
 * third-party ad network script is loaded.
 *
 * To change the ads, edit the ADS list below. Each ad needs:
 *   sponsor  who paid for or placed it (shown as "Ad · <sponsor>")
 *   title    short headline
 *   text     one or two sentences
 *   url      where the ad links (opens in a new tab, rel="sponsored")
 *   cta      button text
 * Optional:
 *   pages    "post", "index", or leave out for both
 *
 * One ad is chosen at random on each page load. If the list is empty,
 * nothing is rendered. Slots are placed at the end of a post, before
 * the sources, and under the post list on the index: never in the
 * middle of an argument.
 */
(function () {
  'use strict';

  var ADS = [
    {
      sponsor: 'Hotolosophy',
      title: 'Free, practical education. No paywall.',
      text: 'The sister site to Planet Hoto: plain-language resources on money, health care, work, and housing, free to read and free to share.',
      url: 'https://hotolosophy.com/',
      cta: 'Visit Hotolosophy'
    }
    // Example of a paid placement. Copy, fill in, and remove the slashes.
    // {
    //   sponsor: 'Example Co.',
    //   title: 'Headline up to about sixty characters',
    //   text: 'One or two plain sentences. No tracking pixels, no scripts.',
    //   url: 'https://example.com/?ref=hoto',
    //   cta: 'Learn more',
    //   pages: 'post'
    // }
  ];

  var CSS = [
    '.ad{margin:28px 0 8px;padding:16px 18px;border:1px solid var(--rule);border-left:4px solid var(--hazard);background:var(--surface);border-radius:4px;max-width:65ch}',
    '.ad .ad-label{font:500 .72rem var(--font-mono, ui-monospace, monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}',
    '.ad h2,.ad h3{font-size:1.15rem;line-height:1.25;margin:0 0 6px}',
    '.ad p{margin:0 0 10px;color:var(--fg)}',
    '.ad a.ad-cta{display:inline-block;min-height:44px;line-height:44px;padding:0 16px;background:var(--hazard);color:var(--hazard-ink);font-weight:700;text-decoration:none;border-radius:3px}',
    '.ad a.ad-cta:hover,.ad a.ad-cta:focus-visible{filter:brightness(1.08)}',
    '.ad .ad-why{font-size:.85rem;color:var(--muted);margin:10px 0 0}',
    '.ad .ad-why a{color:inherit}'
  ].join('\n');

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }

  function render(ad, headingTag) {
    var box = el('aside', { 'class': 'ad', 'aria-label': 'Advertisement' });
    box.appendChild(el('p', { 'class': 'ad-label' }, 'Ad · ' + ad.sponsor));
    box.appendChild(el(headingTag, {}, ad.title));
    box.appendChild(el('p', {}, ad.text));
    box.appendChild(el('a', { 'class': 'ad-cta', href: ad.url, rel: 'sponsored noopener', target: '_blank' }, ad.cta));
    var why = el('p', { 'class': 'ad-why' }, 'Served from this site. Nothing here tracks you. ');
    why.appendChild(el('a', { href: 'blog.html#ground-rules' }, 'How ads work here'));
    box.appendChild(why);
    return box;
  }

  function pick(page) {
    var pool = [];
    for (var i = 0; i < ADS.length; i++) {
      var a = ADS[i];
      if (a && a.url && a.title && (!a.pages || a.pages === page)) pool.push(a);
    }
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function mount() {
    var post = document.getElementById('post');
    var posts = document.getElementById('posts');
    var page = post ? 'post' : (posts ? 'index' : null);
    if (!page) return;
    var ad = pick(page);
    if (!ad) return;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    if (page === 'post') {
      // End of the essay, before the sources. Never inside the argument.
      post.appendChild(render(ad, 'h2'));
    } else {
      var list = posts.querySelector('.posts');
      var node = render(ad, 'h3');
      if (list && list.parentNode === posts) posts.insertBefore(node, list.nextSibling);
      else posts.appendChild(node);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
