#!/usr/bin/env node
//
// build-lists.js — rebuilds two hand-maintained lists from the article pages:
//   1. Homepage "Latest" row (index.html, between LATEST markers): the 9 newest articles
//   2. Author page article list (author-gagan-mishra.html, between AUTHOR-LIST markers)
//
// Usage (from the site root, after publishing or editing an article):
//   node scripts/build-lists.js
//
// It reads each article's <h1>, meta description, og:image and JSON-LD
// datePublished, so those must be correct in the article itself.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LATEST_COUNT = 9;
const SKIP_DIRS = new Set(['site', 'templates', 'scripts', 'images', 'js', '.git', 'node_modules']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(rel.split('/')[0])) walk(full, out);
    } else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"')
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&middot;/g, '·').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Minimal image size reader (JPEG / PNG / WebP) so cards get width/height.
function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (chunk === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      if (chunk === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        i += 2 + b.readUInt16BE(i + 2);
      }
    }
  } catch (e) { /* missing image */ }
  return null;
}

function typeOf(rel, tag) {
  if (rel.startsWith('news-')) return 'News';
  if (rel.startsWith('guides/')) return 'Guide';
  if (rel.startsWith('articles/')) return 'Article';
  if (rel.startsWith('comparisons/')) return 'Comparison';
  const t = (tag || '').split('·')[0].trim();
  if (['Guide', 'Comparison', 'News', 'Article'].includes(t)) return t;
  return 'Buyer’s Brief';
}

const articles = [];
for (const rel of walk(ROOT)) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const date = (html.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (!date) continue;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (!h1) continue;
  const title = decode(h1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  const desc = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] || '');
  const og = (html.match(/<meta\s+property="og:image"\s+content="https?:\/\/[^/]+\/([^"]+)"/) || [])[1] || '';
  const tag = decode(((html.match(/<main[\s\S]*?<span class="tag">([^<]+)<\/span>/) || [])[1]) || '');
  const url = rel.replace(/(^|\/)index\.html$/, '$1');
  const alt = decode((html.match(new RegExp('<img[^>]+src="[^"]*' + og.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*alt="([^"]*)"')) || [])[1] || title);
  articles.push({ rel, url, date, title, desc, img: og, alt, type: typeOf(rel, tag) });
}
articles.sort((a, b) => (b.date.localeCompare(a.date)) || a.title.localeCompare(b.title));

function card(a) {
  const size = a.img ? imageSize(path.join(ROOT, a.img)) : null;
  const dims = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  return `        <article class="card" data-date="${a.date}">
          <a href="${a.url}" class="card-media"><span class="tag">${esc(a.type)}</span><img src="${a.img}" alt="${esc(a.alt)}" loading="lazy"${dims}></a>
          <div class="card-body"><p class="eyebrow">${esc(a.type)}</p><h3><a href="${a.url}">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><div class="card-foot"><a class="read-link" href="${a.url}">Read →</a></div></div>
        </article>`;
}

function replaceBetween(file, start, end, content) {
  const p = path.join(ROOT, file);
  const html = fs.readFileSync(p, 'utf-8');
  const re = new RegExp(`(<!-- ${start} -->)[\\s\\S]*?(<!-- ${end} -->)`);
  if (!re.test(html)) throw new Error(`Markers ${start}/${end} not found in ${file}`);
  fs.writeFileSync(p, html.replace(re, (m, a, b) => `${a}\n${content}\n${b}`), 'utf-8');
}

replaceBetween('index.html', 'LATEST:START', 'LATEST:END', articles.slice(0, LATEST_COUNT).map(card).join('\n'));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (d) => { const [y, m, dd] = d.split('-'); return `${MONTHS[+m - 1]} ${+dd}, ${y}`; };
const list = `    <p>${articles.length} articles, newest first.</p>
    <ul class="author-articles">
${articles.map((a) => `      <li><a href="${a.url}">${esc(a.title)}</a> <span class="author-article-meta">${esc(a.type)} &middot; ${fmt(a.date)}</span></li>`).join('\n')}
    </ul>`;
replaceBetween('author-gagan-mishra.html', 'AUTHOR-LIST:START', 'AUTHOR-LIST:END', list);

console.log(`Homepage: ${Math.min(LATEST_COUNT, articles.length)} latest cards. Author page: ${articles.length} articles.`);

// ---------------------------------------------------------------------------
// 3. Section pages: every article must appear on its section page.
//    News -> news.html, comparisons (URL has "-vs-" or comparisons/) -> comparisons.html,
//    guides/ and articles/ -> guides.html, everything else in reviews/ -> reviews.html.
//    Articles already listed on ANY section page are left where they are (manual choice wins).
//    Missing ones are added to the top of the right section, and each section is kept newest first.
// ---------------------------------------------------------------------------
const SECTIONS = {
  news: { file: 'news.html', open: /(<section>\s*<div class="wrap">\s*<div class="card-grid">)/, label: 'News' },
  comparisons: { file: 'comparisons.html', open: /(<div class="review-row" id="comparisonGrid">)/, label: 'Comparison' },
  guides: { file: 'guides.html', open: /(<div class="review-row" id="guideGrid">)/, label: 'Guide' },
  reviews: { file: 'reviews.html', open: /(<div class="review-row" id="reviewGrid">)/, label: 'Buyer’s Brief' },
};
function sectionOf(a) {
  if (a.rel.startsWith('news-')) return 'news';
  if (a.rel.startsWith('comparisons/') || /-vs-/.test(a.url)) return 'comparisons';
  if (a.rel.startsWith('guides/') || a.rel.startsWith('articles/') || a.type === 'Guide' || a.type === 'Article') return 'guides';
  if (a.rel.startsWith('reviews/')) return 'reviews';
  return null;
}
function chips(a) {
  const t = (a.title + ' ' + a.desc).toLowerCase();
  const c = [];
  if (/\b(ev|electric|battery|baas)\b/.test(t)) c.push('electric');
  if (/hybrid/.test(t)) c.push('hybrid');
  if (/hatchback|swift|altroz|baleno|glanza|punch/.test(t)) c.push('hatchback');
  if (/sedan|dzire|amaze|virtus|slavia|city/.test(t)) c.push('sedan');
  if (/suv|brezza|nexon|seltos|venue|kylaq|syros|3xo/.test(t)) c.push('suv', 'compact-suv');
  if (/pickup|hilux|v-cross/.test(t)) c.push('pickup');
  if (/luxury|mercedes|bmw|lexus|porsche|denza|range rover/.test(t)) c.push('luxury');
  return [...new Set(c)].join(' ');
}
const gridOf = (html, open) => {
  const m = html.match(open); if (!m) return null;
  const start = m.index + m[0].length;
  // grid ends at the last </article> before the next </section>
  const secEnd = html.indexOf('</section>', start);
  const lastArt = html.lastIndexOf('</article>', secEnd);
  const end = lastArt > start ? lastArt + '</article>'.length : start;
  return { start, end, body: html.slice(start, end) };
};
const pagesHtml = {};
for (const [k, s] of Object.entries(SECTIONS)) pagesHtml[k] = fs.readFileSync(path.join(ROOT, s.file), 'utf-8');
const listedAnywhere = (url) => Object.entries(SECTIONS).some(([k, s]) => {
  const g = gridOf(pagesHtml[k], s.open); return g && g.body.includes(`href="${url}"`);
});
const added = [];
for (const a of articles) {
  const sec = sectionOf(a); if (!sec || listedAnywhere(a.url)) continue;
  const s = SECTIONS[sec]; const g = gridOf(pagesHtml[sec], s.open);
  if (!g) { console.warn(`WARN: grid not found in ${s.file}`); continue; }
  const label = a.type === 'Buyer’s Brief' && sec !== 'reviews' ? s.label : a.type;
  const size = a.img ? imageSize(path.join(ROOT, a.img)) : null;
  const dims = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  const c = `<article class="card" data-category="${chips(a)}" data-date="${a.date}">
          <a href="${a.url}" class="card-media"><span class="tag">${esc(label)}</span><img src="${a.img}" alt="${esc(a.alt)}" loading="lazy"${dims}></a>
          <div class="card-body"><p class="eyebrow">${esc(label)}</p><h3><a href="${a.url}">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><div class="card-foot"><a class="read-link" href="${a.url}">Read →</a></div></div>
        </article>`;
  pagesHtml[sec] = pagesHtml[sec].slice(0, g.start) + '\n' + c + pagesHtml[sec].slice(g.start);
  added.push(`${a.url} -> ${s.file}`);
}
// keep every section newest first
for (const [k, s] of Object.entries(SECTIONS)) {
  const g = gridOf(pagesHtml[k], s.open); if (!g) continue;
  const cards = g.body.match(/<article class="card"[\s\S]*?<\/article>/g) || [];
  const dated = cards.map((c, i) => ({ c, i, d: (c.match(/data-date="([^"]+)"/) || [, ''])[1] }));
  dated.sort((x, y) => y.d.localeCompare(x.d) || x.i - y.i);
  const sorted = '\n' + dated.map((x) => x.c).join('') ;
  pagesHtml[k] = pagesHtml[k].slice(0, g.start) + sorted + pagesHtml[k].slice(g.end);
  fs.writeFileSync(path.join(ROOT, s.file), pagesHtml[k], 'utf-8');
}
console.log(added.length ? `Added to sections:\n  ${added.join('\n  ')}` : 'Sections: every article is already listed.');
