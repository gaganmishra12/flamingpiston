#!/usr/bin/env node
//
// build-lists.js — rebuilds every automatic list on the site from the article pages.
//
//   index.html          HERO     5 newest articles (rotating hero)
//                       LATEST   the next 9
//                       GUIDES   4 newest buying guides / explainers not already shown above
//                       PERF     Global Performance: newest stories from data/car-culture.json
//                       VS       3 newest comparisons not already shown above
//   news.html, reviews.html, guides.html, comparisons.html
//                       every card between CARDS markers, newest first, plus the article count
//                       (news.html also gets Launch / Reveal / Report / Preview / Archive labels and filters)
//   car-culture.html    every story listed in data/car-culture.json
//   author-gagan-mishra.html   full article list
//
// Usage (from the site root, after publishing or editing an article):
//   node scripts/build-lists.js
//
// It reads each article's <h1>, meta description, og:image, photo caption, read time and
// JSON-LD datePublished, so those must be correct in the article itself.
// Pages that .htaccess 301-redirects, or that are noindex, are never listed.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HERO_COUNT = 5, LATEST_COUNT = 9, GUIDE_COUNT = 4, VS_COUNT = 3;
const SKIP_DIRS = new Set(['site', 'templates', 'scripts', 'images', 'js', 'assets', 'data', '.git', 'node_modules', 'design-preview']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) { if (!SKIP_DIRS.has(rel.split('/')[0])) walk(full, out); }
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"')
  .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&middot;/g, '·').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d));
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = (t) => decode(t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

// Minimal image size reader (JPEG / PNG / WebP) so cards get width/height (no layout shift).
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

// ---- pages that must never be listed: 301-redirected in .htaccess -----------------------
const redirected = new Set();
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.htaccess'), 'utf-8').split('\n')) {
    const m = line.match(/^\s*Redirect\s+301\s+\/(\S*)/i);
    if (m) redirected.add(m[1].replace(/index\.html$/, ''));
  }
} catch (e) { /* no .htaccess */ }

// ---- read every article -------------------------------------------------------------------
const articles = [];
for (const rel of walk(ROOT)) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const date = (html.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})/) || [])[1];
  if (!date) continue;
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (!h1) continue;
  const url = rel.replace(/(^|\/)index\.html$/, '$1');
  if (redirected.has(url) || redirected.has(url.replace(/\/$/, ''))) continue;
  const title = strip(h1);
  const desc = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] || '');
  let og = (html.match(/<meta\s+property="og:image"\s+content="https?:\/\/[^/]+\/([^"]+)"/) || [])[1] || '';
  // No og:image? fall back to the article's own hero image so the card is never blank.
  if (!og) og = ((html.match(/<img[^>]*class="hero-image"[^>]*src="\/?([^"]+)"/) || html.match(/<img[^>]*src="\/?([^"]+)"[^>]*class="hero-image"/) || [])[1]) || '';
  if (og && !fs.existsSync(path.join(ROOT, og))) og = '';
  const tag = decode(((html.match(/<main[\s\S]*?<span class="tag">([^<]+)<\/span>/) || [])[1]) || '').trim();
  const alt = decode((html.match(new RegExp('<img[^>]+src="[^"]*' + og.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*alt="([^"]*)"')) || [])[1] || title);
  const cap = strip((html.match(/<div class="photo-caption">([\s\S]*?)<\/div>/) || [])[1] || '');
  const rt = (html.match(/class="read-time"><strong>(\d+)/) || [])[1] || '';
  articles.push({ rel, url, date, title, desc, img: og, alt, cap, rt, tag, type: typeOf(rel, tag) });
}
articles.sort((a, b) => (b.date.localeCompare(a.date)) || a.title.localeCompare(b.title));
const byUrl = new Map(articles.map((a) => [a.url, a]));

// ---- labels ----------------------------------------------------------------------------------
// News label comes only from the story's own headline wording.
const NEWS_KINDS = [['Archive', /\barchived?\b/i], ['Preview', /\bpreview\b/i],
  ['Reveal', /\b(teased|revealed|unveil(s|ed)?|confirmed for|debut|takes flight)\b/i],
  ['Launch', /(india launch:|priced from|\blaunched|\blaunches|now on sale|arrives|listed in india|price list is out|second batch|prices start)/i]];
const newsKind = (a) => (NEWS_KINDS.find(([, re]) => re.test(a.title)) || ['Report'])[0];
const segment = (a) => (['Buyer’s Brief', 'Guide', 'Comparison', 'News', 'Article', ''].includes(a.tag) || /^News/.test(a.tag)) ? '' : a.tag;
const seg = (t) => (t ? `<span class="seg">${esc(t)}</span>` : '');
function eyebrow(a) {
  if (a.type === 'News') return `News${seg(newsKind(a))}${/\bUS\b/.test(a.tag) ? seg('US market') : ''}`;
  const s = segment(a);
  return esc(a.type) + (s && s !== a.type ? seg(s) : '');
}
const kicker = (a) => `${esc(a.type)} · ${a.type === 'News' ? newsKind(a) : esc(segment(a) || 'Latest')}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (d) => { const [y, m, dd] = d.split('-'); return `${MONTHS[+m - 1]} ${+dd}, ${y}`; };
const fmtShort = (d) => { const [y, m, dd] = d.split('-'); return `${+dd} ${MONTHS[+m - 1]} ${y}`; };
const href = (a) => '/' + a.url;
const src = (a) => a.img ? '/' + a.img : '/images/logo.png';
// Cards use the small WebP from images/thumbs/ (made by scripts/make-thumbs.py) when it exists.
const missingThumbs = new Set();
function thumb(a) {
  if (!a.img) return src(a);
  const t = 'images/thumbs/' + path.basename(a.img).replace(/\.[^.]+$/, '') + '.webp';
  if (fs.existsSync(path.join(ROOT, t))) return '/' + t;
  const sz = imageSize(path.join(ROOT, a.img));
  if (sz && sz[0] >= 900) missingThumbs.add(a.img);   // make-thumbs.py skips small images on purpose
  return src(a);
}
function dims(a) { const s = a.img ? imageSize(path.join(ROOT, a.img)) : null; return s ? ` width="${s[0]}" height="${s[1]}"` : ''; }

// ---- markup ----------------------------------------------------------------------------------
function card(a, extra = '') {
  return `        <article class="card"${extra} data-date="${a.date}">
          <a href="${href(a)}" class="card-media" tabindex="-1" aria-hidden="true"><span class="tag">${esc(a.type)}</span><img src="${thumb(a)}" alt="${esc(a.alt)}" loading="lazy"${dims(a)}></a>
          <div class="card-body"><p class="eyebrow">${eyebrow(a)}</p><h3><a href="${href(a)}">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><div class="card-foot"><a class="read-link" href="${href(a)}">Read →</a></div></div>
        </article>`;
}
function heroSlide(a, i, n) {
  // Only the first slide's image loads with the page; fp.js loads the others just before they are shown.
  const img = i === 0 ? 'fetchpriority="high"' : 'decoding="async"';
  const srcAttr = i === 0 ? 'src' : 'data-src';
  return `      <article class="lead-story hero-slide${i === 0 ? ' is-active' : ''}" id="heroSlide${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}"${i === 0 ? '' : ' aria-hidden="true"'}>
        <div class="lead-text">
          <p class="kicker">${kicker(a)}</p>
          <h2><a href="${href(a)}"${i === 0 ? '' : ' tabindex="-1"'}>${esc(a.title)}</a></h2>
          <p class="dek">${esc(a.desc)}</p>
          <div class="lead-meta"><span class="by">Gagan Mishra</span><time datetime="${a.date}">${fmtShort(a.date)}</time>${a.rt ? `<span>${a.rt} min read</span>` : ''}</div>
        </div>
        <div><a class="lead-media" href="${href(a)}" tabindex="-1" aria-hidden="true"><img ${srcAttr}="${src(a)}"${thumb(a) !== src(a) ? ` ${i === 0 ? 'srcset' : 'data-srcset'}="${thumb(a)} 800w, ${src(a)} ${(imageSize(path.join(ROOT, a.img)) || [1600])[0]}w" sizes="(max-width: 860px) 100vw, 60vw"` : ''} alt="${esc(a.alt)}"${dims(a)} ${img}></a>
        <p class="caption">${esc(a.cap)}</p></div>
      </article>`;
}
function heroBlock(list) {
  const tabs = list.map((a, i) => `<button class="hero-tab${i === 0 ? ' is-active' : ''}" type="button" role="tab" id="heroTab${i}" aria-controls="heroSlide${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="ht-bar" aria-hidden="true"><span></span></span><span class="ht-kicker">${kicker(a)}</span><span class="ht-title">${esc(a.title)}</span></button>`).join('');
  return `      <div class="hero-slides" aria-live="off">
${list.map((a, i) => heroSlide(a, i, list.length)).join('\n')}
      </div>
      <div class="hero-controls">
        <div class="hero-tabs" role="tablist" aria-label="Choose a top story">${tabs}</div>
        <button class="hero-pause" type="button" id="heroPause" aria-pressed="false" aria-label="Pause rotation"><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>
      </div>`;
}
function guideCard(a) {
  return `        <article class="gcard">
          <a class="g-media" href="${href(a)}" tabindex="-1" aria-hidden="true"><img src="${thumb(a)}" alt="${esc(a.alt)}" loading="lazy"${dims(a)}></a>
          <div class="g-body"><p class="eyebrow">${a.type === 'Article' ? 'Explainer' : esc(a.type)}</p><h3><a href="${href(a)}">${esc(a.title)}</a></h3>
          <p class="meta">${fmtShort(a.date)}${a.rt ? ` · ${a.rt} min read` : ''}</p></div>
        </article>`;
}
function vsCard(a) {
  const [head, ...rest] = a.title.split(':');
  const parts = head.replace(/^\d{4}\s+/, '').split(/\s+vs\s+/i);
  const names = parts.map(esc).join('&nbsp;<span class="vs">vs</span> ');
  return `        <article class="vs-card">
          <a class="card-media" href="${href(a)}" tabindex="-1" aria-hidden="true"><img src="${thumb(a)}" alt="${esc(a.alt)}" loading="lazy"${dims(a)}></a>
          <p class="eyebrow">Comparison</p>
          <h3 class="vs-names"><a href="${href(a)}">${names}</a></h3>
          <p class="vs-q">${esc(rest.join(':').trim())}</p>
          <p class="meta">${fmtShort(a.date)}</p>
        </article>`;
}

// ---- file helpers ----------------------------------------------------------------------------
const pages = {};
const read = (f) => (pages[f] = pages[f] || fs.readFileSync(path.join(ROOT, f), 'utf-8'));
function between(f, name, content) {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(read(f))) throw new Error(`Markers ${name}:START/END not found in ${f}`);
  pages[f] = read(f).replace(re, (m, a, b) => `${a}\n${content}\n${b}`);
}
const setCount = (f, n) => { pages[f] = read(f).replace(/(<span class="ph-count" data-fp-count="(\w+)">)[^<]*/, (m, a, w) => `${a}${n} ${w}`); };

// ---- section membership ------------------------------------------------------------------------
function sectionOf(a) {
  if (a.rel.startsWith('news-')) return 'news';
  if (a.rel.startsWith('comparisons/') || /-vs-/.test(a.url)) return 'comparisons';
  if (a.rel.startsWith('guides/') || a.rel.startsWith('articles/') || a.type === 'Guide' || a.type === 'Article') return 'guides';
  if (a.rel.startsWith('reviews/')) return 'reviews';
  return null;
}
function chips(a) {   // filter categories for articles not yet categorised by hand
  const t = (a.title + ' ' + a.desc).toLowerCase(); const c = [];
  if (/\b(ev|electric|battery|baas)\b/.test(t)) c.push('electric');
  if (/hybrid/.test(t)) c.push('hybrid');
  if (/hatchback|swift|altroz|baleno|glanza|punch/.test(t)) c.push('hatchback');
  if (/sedan|dzire|amaze|virtus|slavia|city/.test(t)) c.push('sedan');
  if (/suv|brezza|nexon|seltos|venue|kylaq|syros|3xo/.test(t)) c.push('suv', 'compact-suv');
  if (/pickup|hilux|v-cross/.test(t)) c.push('pickup');
  if (/luxury|mercedes|bmw|lexus|porsche|denza|range rover/.test(t)) c.push('luxury');
  return [...new Set(c)].join(' ');
}
const SECTIONS = { news: 'news.html', reviews: 'reviews.html', guides: 'guides.html', comparisons: 'comparisons.html' };
// Existing placement and hand-set categories win; new articles go to their natural section.
const placed = new Map(), cats = new Map();
for (const [sec, f] of Object.entries(SECTIONS)) {
  const block = (read(f).match(/<!-- CARDS:START -->([\s\S]*?)<!-- CARDS:END -->/) || [])[1];
  if (block === undefined) throw new Error(`CARDS markers not found in ${f}`);
  for (const c of block.match(/<article class="card"[\s\S]*?<\/article>/g) || []) {
    const u = (c.match(/href="\/?((?:\.\.\/)*)([^"]+)"/) || [])[2]; if (!u) continue;
    const cat = (c.match(/data-category="([^"]*)"/) || [])[1];
    if (!placed.has(u)) placed.set(u, sec);
    if (cat !== undefined) cats.set(u, cat);
  }
}
const lists = { news: [], reviews: [], guides: [], comparisons: [] }; const added = [];
for (const a of articles) {
  let sec = placed.get(a.url) || sectionOf(a); if (!sec) continue;
  if (!placed.has(a.url)) added.push(`${a.url} -> ${SECTIONS[sec]}`);
  lists[sec].push(a);
}
for (const [sec, f] of Object.entries(SECTIONS)) {
  const items = lists[sec].map((a) => {
    const cat = cats.has(a.url) ? cats.get(a.url) : chips(a);
    const kind = sec === 'news' ? ` data-kind="${newsKind(a).toLowerCase()}"` : '';
    return card(a, ` data-category="${esc(cat)}"${kind}`);
  });
  between(f, 'CARDS', items.join('\n'));
  setCount(f, items.length);
}
// news filters with counts
const kinds = {}; for (const a of lists.news) { const k = newsKind(a).toLowerCase(); kinds[k] = (kinds[k] || 0) + 1; }
const KN = { launch: 'Launches', reveal: 'Reveals', report: 'Reports', preview: 'Previews', archive: 'Archive' };
between('news.html', 'NEWS-FILTERS', `        <a class="chip is-active" href="#all" data-kind-filter="all">All<span class="n">${lists.news.length}</span></a>` +
  Object.keys(KN).filter((k) => kinds[k]).map((k) => `<a class="chip" href="#${k}" data-kind-filter="${k}">${KN[k]}<span class="n">${kinds[k]}</span></a>`).join(''));

// ---- homepage ----------------------------------------------------------------------------------
const hero = articles.slice(0, HERO_COUNT);
const latest = articles.slice(HERO_COUNT, HERO_COUNT + LATEST_COUNT);
const shown = new Set([...hero, ...latest].map((a) => a.url));
const guides = articles.filter((a) => !shown.has(a.url) && sectionOf(a) === 'guides').slice(0, GUIDE_COUNT);
guides.forEach((a) => shown.add(a.url));
const vs = articles.filter((a) => !shown.has(a.url) && sectionOf(a) === 'comparisons').slice(0, VS_COUNT);
vs.forEach((a) => shown.add(a.url));
let cultureUrls = [];
try { cultureUrls = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/car-culture.json'), 'utf-8')).urls || []; } catch (e) { console.warn('WARN: data/car-culture.json missing or invalid'); }
const culture = cultureUrls.map((u) => byUrl.get(u.replace(/^\//, ''))).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const missingCulture = cultureUrls.filter((u) => !byUrl.has(u.replace(/^\//, '')));
const perf = culture.filter((a) => !shown.has(a.url)).slice(0, 7);

between('index.html', 'HERO', heroBlock(hero));
between('index.html', 'LATEST', latest.map((a) => card(a)).join('\n'));
between('index.html', 'GUIDES', guides.map(guideCard).join('\n'));
between('index.html', 'VS', vs.map(vsCard).join('\n'));
between('index.html', 'PERF', perf.length ? `      <div class="perf-grid">
        <div class="perf-lead">
${card(perf[0])}
        </div>
        <div class="perf-side">
${perf.slice(1, 3).map((a) => card(a)).join('\n')}
        </div>
      </div>${perf.length > 3 ? `
      <div class="perf-row">
${perf.slice(3, 7).map((a) => card(a)).join('\n')}
      </div>` : ''}` : '');

// ---- car culture page ----------------------------------------------------------------------------
between('car-culture.html', 'CARDS', culture.map((a) => card(a)).join('\n'));
setCount('car-culture.html', culture.length);

// ---- about page "at a glance" numbers ----------------------------------------------------------
if (fs.existsSync(path.join(ROOT, 'about.html'))) {
  pages['about.html'] = read('about.html').replace(/(data-fp-stat="(\w+)"><b>)[^<]*/g, (m, a, k) => lists[k] ? a + lists[k].length : m);
}

// ---- author page ---------------------------------------------------------------------------------
between('author-gagan-mishra.html', 'AUTHOR-LIST', `    <p>${articles.length} articles, newest first.</p>
    <ul class="author-articles">
${articles.map((a) => `      <li><a href="${href(a)}">${esc(a.title)}</a> <span class="author-article-meta">${esc(a.type)} &middot; ${fmt(a.date)}</span></li>`).join('\n')}
    </ul>`);

for (const [f, html] of Object.entries(pages)) fs.writeFileSync(path.join(ROOT, f), html, 'utf-8');
console.log(`Homepage: hero ${hero.length}, latest ${latest.length}, guides ${guides.length}, global performance ${perf.length}, comparisons ${vs.length}.`);
console.log(`Sections: news ${lists.news.length}, reviews ${lists.reviews.length}, guides ${lists.guides.length}, comparisons ${lists.comparisons.length}. Car Culture ${culture.length}. Author page ${articles.length}.`);
if (missingThumbs.size) console.log(`Tip: ${missingThumbs.size} image(s) have no thumbnail yet; run  python3 scripts/make-thumbs.py  then this script again.`);
if (added.length) console.log(`Newly added to sections:\n  ${added.join('\n  ')}`);
if (missingCulture.length) console.warn(`WARN: in data/car-culture.json but not found (deleted, redirected or noindex):\n  ${missingCulture.join('\n  ')}`);
