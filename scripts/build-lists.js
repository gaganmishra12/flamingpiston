#!/usr/bin/env node
//
// build-lists.js — rebuilds every automatic list on the site from the article pages.
//
//   index.html          HERO     lead slides (data/homepage.json "hero") + 3 supporting stories
//                       FEATURED featured cars (data/cars.json, ids in data/homepage.json)
//                       CARS-DATA  catalogue for the Find Your Next Car panel
//                       COMPARE  comparison banner (data/homepage.json "comparison")
//                       NEWS     4 newest news stories not shown above
//                       UPCOMING new launch + upcoming cards (data/homepage.json "newUpcoming")
//                       REVIEW   newest buyer's brief not shown above, with a clean photo
//                       GUIDES   3 newest guides not shown above, with clean photos
//                       CULTURE  Car Culture banner (data/homepage.json "carCulture")
//                       Photos only from clean crops (scripts/make-home-images.py).
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
// Layout (Phase 1 redesign): HERO (lead slides + three supporting stories), FEATURED cars,
// COMPARE banner + NEWS column, then text-led rows: VS, BRIEFS, GUIDES, PERF.
// Photography comes ONLY from the clean crops in data/home-images.json (made by
// scripts/make-home-images.py from data/homepage.json), never from branded social graphics.
const readJSON = (p, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8')); } catch (e) { return fallback; } };
const HOME = readJSON('data/homepage.json', {});
const CROPS = readJSON('data/home-images.json', {});
const CARS = (readJSON('data/cars.json', {}).cars || []);
const noClean = new Set();
const shown = new Set(((HOME.exclude && HOME.exclude.urls) || []));
const ICON_ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const label = (a) => a.type === 'News' ? `News · ${newsKind(a)}` : (a.type === 'Article' ? 'Explainer' : a.type);
const cta = (a) => ({ 'Buyer’s Brief': 'Read the brief', Comparison: 'Read the comparison', Guide: 'Read the guide', Article: 'Read the explainer', News: 'Read the story' })[a.type] || 'Read more';
const crop = (key) => CROPS[key] || null;
// <img> for a clean crop. 'box' is the aspect ratio of the frame it sits in; if the crop is
// much narrower than the frame it is letterboxed (object-fit: contain) on its own edge colour.
function cropImg(c, alt, box, attrs = 'loading="lazy" decoding="async"', pos) {
  const ratio = c.w / c.h, contain = ratio < box * 0.78;
  const style = [contain ? `background:${c.bg}` : '', pos ? `object-position:${pos}` : ''].filter(Boolean).join(';');
  return `<img src="/${c.file}" alt="${esc(alt)}" width="${c.w}" height="${c.h}"${contain ? ' class="is-contain"' : ''}${style ? ` style="${style}"` : ''} ${attrs}>`;
}
const tile = (a) => `<span class="fp-tile" aria-hidden="true"><span>${esc(a.type === 'Article' ? 'Explainer' : a.type)}</span></span>`;
const thumbFor = (a) => crop(`${a.url}#thumb`);
function shortDek(a, max = 96) {
  const s = (a.desc.match(/^.+?[.!?](?=\s|$)/) || [a.desc])[0].trim();
  return s.length <= max ? s : '';
}

// Lead slides: pinned first, then the newest articles that have a clean hero crop.
const heroMax = (HOME.hero && HOME.hero.max) || 3;
const heroList = [];
for (const u of ((HOME.hero && HOME.hero.pinned) || [])) { const a = byUrl.get(u); if (a && crop(`${u}#hero`)) heroList.push(a); else console.warn(`WARN: pinned hero ${u} not found or has no hero crop`); }
for (const a of articles) { if (heroList.length >= heroMax) break; if (!heroList.includes(a) && crop(`${a.url}#hero`)) heroList.push(a); }
heroList.forEach((a) => shown.add(a.url));
const cmpA = HOME.comparison && byUrl.get(HOME.comparison.url);
if (cmpA) shown.add(cmpA.url);

// Three supporting stories: the newest News, Brief/Comparison and Guide not already shown.
const lanes = [(a) => a.type === 'News', (a) => a.type === 'Buyer’s Brief' || a.type === 'Comparison', (a) => a.type === 'Guide' || a.type === 'Article'];
const stories = lanes.map((ok) => { const a = articles.find((x) => ok(x) && !shown.has(x.url)); if (a) shown.add(a.url); return a; }).filter(Boolean);
const news = articles.filter((a) => a.type === 'News' && !shown.has(a.url)).slice(0, 4);
news.forEach((a) => shown.add(a.url));

function heroSlide(a, i, n) {
  const c = crop(`${a.url}#hero`), spec = HOME.images[a.url].hero;
  const first = i === 0;
  const img = cropImg(c, a.alt, 1.72, first ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"', spec.pos);
  return `        <article class="hl-slide${first ? ' is-active' : ''}" id="hlSlide${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${n}"${first ? '' : ' aria-hidden="true"'}>
          <a class="hl-media" href="${href(a)}" tabindex="-1" aria-hidden="true">${img}</a>
          <div class="hl-text">
            <p class="fp-label">${esc(label(a))}</p>
            <h2><a href="${href(a)}"${first ? '' : ' tabindex="-1"'}>${esc(a.title)}</a></h2>
            <p class="hl-dek">${esc(a.desc)}</p>
            <a class="fp-btn" href="${href(a)}"${first ? '' : ' tabindex="-1"'}>${cta(a)}${ICON_ARROW}</a>
          </div>
          ${a.cap ? `<p class="hl-credit">${esc(a.cap)}</p>` : ''}
        </article>`;
}
function storyRow(a) {
  const c = thumbFor(a); if (!c) noClean.add(a.url);
  // Long headlines: the part before the colon is the headline, the rest becomes the short description.
  const i = a.title.indexOf(':'), split = i >= 18 && a.title.length > 62;
  const head = split ? a.title.slice(0, i) : a.title;
  const dek = split ? a.title.slice(i + 1).trim() : shortDek(a, 80);
  return `        <article class="hs-item">
          <a class="hs-media" href="${href(a)}" tabindex="-1" aria-hidden="true">${c ? cropImg(c, a.alt, 2) : tile(a)}</a>
          <div class="hs-text"><p class="fp-label">${esc(label(a))}</p><h3><a href="${href(a)}"${split ? ` title="${esc(a.title)}"` : ''}>${esc(head)}</a></h3>${dek ? `<p>${esc(dek)}</p>` : ''}</div>
        </article>`;
}
const dots = heroList.length > 1 ? `
        <div class="hl-controls">
          <div class="hl-dots" role="tablist" aria-label="Choose a lead story">${heroList.map((a, i) => `<button type="button" role="tab" id="hlDot${i}" aria-controls="hlSlide${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-label="${esc(a.title)}"></button>`).join('')}</div>
          <button class="hl-pause" type="button" id="hlPause" aria-pressed="false" aria-label="Pause rotation"><svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg><svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></button>
        </div>` : '';
between('index.html', 'HERO', `      <div class="hl" id="fpLead" aria-roledescription="carousel" aria-label="Lead stories" data-interval="8000">
        <div class="hl-slides">
${heroList.map((a, i) => heroSlide(a, i, heroList.length)).join('\n')}
        </div>${dots}
      </div>
      <div class="hs" aria-label="More top stories">
${stories.map(storyRow).join('\n')}
      </div>`);

// Featured cars (from data/cars.json; prices are the dated ranges stated in each brief)
const lakh = (n) => n.toFixed(2);
const priceText = (c) => c.min === c.max ? `₹${lakh(c.min)} Lakh` : `₹${lakh(c.min)} – ${lakh(c.max)} Lakh`;
const checked = (d) => { const [y, m, dd] = d.split('-'); return `${dd ? +dd + ' ' : ''}${MONTHS[+m - 1]} ${y}`; };
const BODY = { suv: 'SUV', hatchback: 'Hatchback', sedan: 'Sedan', mpv: 'MPV', pickup: 'Pickup' };
const featured = (HOME.featuredCars || []).map((id) => CARS.find((c) => c.id === id)).filter(Boolean);
between('index.html', 'FEATURED', featured.map((car) => {
  const c = crop(`car:${car.id}`);
  if (!c) console.warn(`WARN: featured car ${car.id} has no clean image (add "image" in data/cars.json, run make-home-images.py)`);
  return `        <a class="fc" href="${car.url}" title="Ex-showroom, ${esc(car.source)}; checked ${checked(car.checked)}">
          <span class="fc-media">${c ? cropImg(c, `${car.name} exterior`, 2.4) : `<span class="fp-tile" aria-hidden="true"></span>`}</span>
          <span class="fc-info"><span class="fc-name">${esc(car.name)}</span><span class="fc-badge">${BODY[car.body] || esc(car.body)}</span><span class="fc-price">${priceText(car)}*${car.note ? ` <span class="fc-note">${esc(car.note)}</span>` : ''}</span></span>
        </a>`;
}).join('\n'));
const latestCheck = featured.map((c) => c.checked).sort().pop();
pages['index.html'] = read('index.html').replace(/(<p class="fc-foot" data-fp-checked>)[\s\S]*?(<\/p>)/, (m, a, b) =>
  `${a}*Ex-showroom price ranges as stated in each FlamingPiston buyer’s brief, last checked ${latestCheck ? checked(latestCheck) : ''}. Prices change often, so confirm with a dealer.${b}`);

// Finder data: the same catalogue, embedded so the finder works without extra requests
between('index.html', 'CARS-DATA', `  <script type="application/json" id="fpCars">${JSON.stringify(CARS.map((c) => ({ n: c.name, u: c.url, b: c.body, f: c.fuels, lo: c.min, hi: c.max, note: c.note || '', d: checked(c.checked) }))).replace(/</g, '\\u003c')}</script>`);

// Comparison banner
if (cmpA) {
  const cm = HOME.comparison, L = crop('comparison#left'), R = crop('comparison#right');
  const head = cm.headline || cmpA.title.split(':')[0];
  between('index.html', 'COMPARE', `      <article class="cmp">
        <div class="cmp-media" aria-hidden="true">
          <span class="cmp-car cmp-l">${L ? cropImg(L, '', 1, 'loading="lazy" decoding="async"', cm.left.pos) : ''}</span>
          <span class="cmp-car cmp-r">${R ? cropImg(R, '', 1, 'loading="lazy" decoding="async"', cm.right.pos) : ''}</span>
          <span class="cmp-vs">VS</span>
        </div>
        <div class="cmp-text">
          <p class="fp-label">Compare</p>
          <h2><a href="${href(cmpA)}">${esc(head)}</a></h2>
          <p>${esc(cm.dek || cmpA.desc)}</p>
          <a class="fp-btn" href="${href(cmpA)}">Read the comparison${ICON_ARROW}</a>
        </div>
        ${cm.credit ? `<p class="cmp-credit">${esc(cm.credit)}</p>` : ''}
      </article>`);
} else { console.warn('WARN: data/homepage.json comparison.url not found'); between('index.html', 'COMPARE', ''); }

// Latest News column
between('index.html', 'NEWS', news.map((a) => {
  const c = thumbFor(a); if (!c) noClean.add(a.url);
  return `          <li><a class="ln-item" href="${href(a)}"><span class="ln-media">${c ? cropImg(c, a.alt, 2.3) : tile(a)}</span><span class="ln-text"><span class="ln-title">${esc(a.title)}</span><span class="ln-meta">${newsKind(a)} · <time datetime="${a.date}">${fmt(a.date)}</time></span></span></a></li>`;
}).join('\n'));

// New & Upcoming (curated in data/homepage.json: every line comes from the linked story)
const upItems = ((HOME.newUpcoming && HOME.newUpcoming.items) || []).filter((it) => { if (!byUrl.has(it.url)) { console.warn(`WARN: newUpcoming ${it.url} not found`); return false; } return true; });
between('index.html', 'UPCOMING', upItems.map((it) => {
  const a = byUrl.get(it.url), c = crop(`upcoming#${it.url}`);
  return `        <a class="nu-card" href="${href(a)}">
          <span class="nu-media">${c ? cropImg(c, a.alt, 1.4, 'loading="lazy" decoding="async"', it.image && it.image.pos) : ''}</span>
          <span class="nu-text"><span class="fp-label nu-tag">${esc(it.label)}</span><span class="nu-name">${esc(it.name)}</span><span class="nu-status">${esc(it.status)}</span><span class="nu-link">${esc(it.link || 'Read more')}${ICON_ARROW}</span></span>
        </a>`;
}).join('\n'));

// Latest Reviews: the newest buyer's brief not shown above that has a clean photo
const review = articles.find((a) => a.type === 'Buyer’s Brief' && !shown.has(a.url) && thumbFor(a));
if (review) shown.add(review.url);
between('index.html', 'REVIEW', review ? `        <article class="lr-card">
          <a class="lr-media" href="${href(review)}" tabindex="-1" aria-hidden="true">${cropImg(thumbFor(review), review.alt, 1.5)}</a>
          <div class="lr-text">
            <p class="fp-label">${esc(label(review))}</p>
            <h3><a href="${href(review)}">${esc(review.title)}</a></h3>
            <p class="lr-dek">${esc(review.desc)}</p>
            <p class="lr-meta"><time datetime="${review.date}">${fmt(review.date)}</time>${review.rt ? ` · ${review.rt} min read` : ''}</p>
            <a class="fp-textlink" href="${href(review)}">Read the brief${ICON_ARROW}</a>
          </div>
        </article>` : '');

// Buying & Ownership Guides: 3 newest guides not shown above that have a clean photo
const guides = articles.filter((a) => (a.type === 'Guide' || a.type === 'Article') && !shown.has(a.url) && thumbFor(a)).slice(0, 3);
guides.forEach((a) => shown.add(a.url));
between('index.html', 'GUIDES', guides.map((a) => `        <a class="gd-card" href="${href(a)}">
          <span class="gd-media">${cropImg(thumbFor(a), a.alt, 1.9)}</span>
          <span class="gd-text"><span class="gd-title">${esc(a.title)}</span><span class="gd-dek">${esc(shortDek(a, 110) || a.desc)}</span></span>
        </a>`).join('\n'));

// Car Culture banner (section entry point, links to /car-culture.html)
const cc = HOME.carCulture || {}, ccImg = crop('culture#banner');
between('index.html', 'CULTURE', `      <section class="cc-banner" aria-labelledby="cultureTitle">
        ${ccImg ? `<span class="cc-media" aria-hidden="true">${cropImg(ccImg, '', 2.6, 'loading="lazy" decoding="async"', cc.image && cc.image.pos)}</span>` : ''}
        <div class="cc-text">
          <h2 class="fp-italic" id="cultureTitle">${esc(cc.title || 'Car Culture')}</h2>
          <p>${esc(cc.dek || '')}</p>
          <a class="fp-btn" href="${cc.url || '/car-culture.html'}">Explore Stories${ICON_ARROW}</a>
        </div>
        ${cc.credit ? `<p class="cc-credit">${esc(cc.credit)}</p>` : ''}
      </section>`);

let cultureUrls = [];
try { cultureUrls = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/car-culture.json'), 'utf-8')).urls || []; } catch (e) { console.warn('WARN: data/car-culture.json missing or invalid'); }
const culture = cultureUrls.map((u) => byUrl.get(u.replace(/^\//, ''))).filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
const missingCulture = cultureUrls.filter((u) => !byUrl.has(u.replace(/^\//, '')));
const hero = heroList, latest = news;

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
console.log(`Homepage: lead ${hero.length}, stories ${stories.length}, featured cars ${featured.length}, news ${latest.length}, new & upcoming ${upItems.length}, review ${review ? 1 : 0}, guides ${guides.length}.`);
if (noClean.size) console.log(`Tip: no clean homepage image for:\n  ${[...noClean].join('\n  ')}\n  (they show a plain brand tile; add a "thumb" crop in data/homepage.json, run python3 scripts/make-home-images.py, then this script again)`);
console.log(`Sections: news ${lists.news.length}, reviews ${lists.reviews.length}, guides ${lists.guides.length}, comparisons ${lists.comparisons.length}. Car Culture ${culture.length}. Author page ${articles.length}.`);
if (missingThumbs.size) console.log(`Tip: ${missingThumbs.size} image(s) have no thumbnail yet; run  python3 scripts/make-thumbs.py  then this script again.`);
if (added.length) console.log(`Newly added to sections:\n  ${added.join('\n  ')}`);
if (missingCulture.length) console.warn(`WARN: in data/car-culture.json but not found (deleted, redirected or noindex):\n  ${missingCulture.join('\n  ')}`);
