#!/usr/bin/env node
//
// build-lists.js — rebuilds every automatic list on the site from the article pages.
//
//   index.html          HERO     one static lead story, chosen editorially (data/homepage.json "hero" +
//                                data/articles.json priority; no supporting stories)
//                       STORIES  Latest Stories: filters All, News, Reviews, Compare, Guides, Car Culture;
//                                each = 1 lead story + 3 rows, newest first by original datePublished
//                       FEATURED featured cars (data/cars.json, ids in data/homepage.json)
//                       CARS-DATA  catalogue for the Find Your Next Car panel
//                       COMPARE  compact featured-comparison module (data/homepage.json "comparison")
//                       UPCOMING new launch + upcoming entries (data/homepage.json "newUpcoming")
//                       REVIEW   newest featurable buyer's brief not already on the page
//                       GUIDES   3 newest featurable guides not already on the page
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
const ED = require('./editorial.js');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['site', 'templates', 'scripts', 'images', 'js', 'assets', 'data', 'drafts', 'docs', '.git', 'node_modules', 'design-preview']);

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
const REG = ED.loadRegistry(); REG.articles = REG.articles || {};
const registered = [], notLive = [], blocked = [];
for (const rel of walk(ROOT)) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const iso = (html.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2}[^"]*)"/) || [])[1];
  if (!iso) continue;
  const date = iso.slice(0, 10);
  const updated = ((html.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2}[^"]*)"/) || [])[1]) || iso;
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
  // Editorial registry (data/articles.json): new articles are registered with safe defaults (priority 3).
  if (!REG.articles[url]) { REG.articles[url] = { id: ED.slugId(url), priority: 3, status: 'published' }; registered.push(url); }
  const ed = ED.entryFor(REG, url);
  if (!ED.isLive(ed, iso)) { notLive.push(`${url} (${ed.status !== 'published' ? ed.status : 'scheduled for ' + iso})`); blocked.push(url); continue; }
  articles.push({ rel, url, date, iso, ts: ED.publishedMs(iso), updated, title, desc, img: og, alt, cap, rt, tag, type: typeOf(rel, tag), ed });
}
// Newest first by ORIGINAL publication timestamp (editing an article never moves it up), then by URL.
articles.sort((a, b) => (b.ts - a.ts) || (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
if (ED.saveRegistry(REG) && registered.length) console.log(`Registered new article(s) in data/articles.json (priority 3; raise it there if it should be featured):\n  ${registered.join('\n  ')}`);

// ---- direct-URL protection for unpublished files -----------------------------------------------------
// A draft, a story in review or a scheduled story may sit at its final URL, but it must not be readable there before
// it is live. Every such URL gets a 404 rule in .htaccess between the FP:UNPUBLISHED markers (rewritten at every
// rebuild; a story goes live at the first rebuild after it is published / its publish time). drafts/ is blocked as a
// whole by a fixed rule above the markers.
{
  const hp = path.join(ROOT, '.htaccess');
  if (fs.existsSync(hp)) {
    const ht = fs.readFileSync(hp, 'utf-8');
    const re = /# FP:UNPUBLISHED:START[\s\S]*?# FP:UNPUBLISHED:END/;
    const body = `# FP:UNPUBLISHED:START (generated by scripts/build-lists.js: drafts, stories in review and scheduled stories)\n${blocked.slice().sort().map(ED.blockRule).join('\n')}${blocked.length ? '\n' : ''}# FP:UNPUBLISHED:END`;
    if (!re.test(ht)) console.warn('WARN: .htaccess has no FP:UNPUBLISHED markers; unpublished articles are not protected by URL');
    else { const out = ht.replace(re, body); if (out !== ht) fs.writeFileSync(hp, out, 'utf-8'); }
  }
  if (notLive.length) console.log(`Not public (blocked by URL, not listed anywhere):\n  ${notLive.slice().sort().join('\n  ')}`);
}
// Pending revisions: a reworked version of a published article waits in drafts/<same path> until approved. The public
// page stays the approved version. To publish the revision, copy it over the public file and rebuild.
const pendingRevisions = [];
(function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir)) {
    const full = path.join(dir, n);
    if (fs.statSync(full).isDirectory()) { scan(full); continue; }
    if (!n.endsWith('.html')) continue;
    const rel = path.relative(path.join(ROOT, 'drafts'), full).split(path.sep).join('/');
    const url = rel.replace(/(^|\/)index\.html$/, '$1');
    pendingRevisions.push(fs.existsSync(path.join(ROOT, rel)) ? `${url} (revision of a published article)` : `${url} (new draft)`);
  }
})(path.join(ROOT, 'drafts'));
if (pendingRevisions.length) console.log(`Waiting in drafts/ for approval (not public):\n  ${pendingRevisions.sort().join('\n  ')}`);
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
function card(a, extra = '', label = eyebrow(a)) {
  const storyCrop = 'images/home/' + path.parse(a.url.replace(/\/$/, '')).name + '-story-16x9.webp';
  const photo = fs.existsSync(path.join(ROOT, storyCrop)) ? '/' + storyCrop : thumb(a);
  return `        <article class="card"${extra} data-date="${a.date}">
          <a href="${href(a)}" class="card-media" tabindex="-1" aria-hidden="true"><span class="tag">${esc(a.type)}</span><img src="${photo}" alt="${esc(a.alt)}" loading="lazy"${dims(a)}></a>
          <div class="card-body"><p class="eyebrow">${label}<time datetime="${a.date}">${fmtShort(a.date)}</time></p><h3><a href="${href(a)}">${esc(a.title)}</a></h3><p>${esc(a.desc)}</p><div class="card-foot"><a class="read-link" href="${href(a)}">Read →</a></div></div>
        </article>`;
}

// News page: newsroom timeline (Phase 2B, design B, approved 27 Nov 2026). The newest story leads; the rest are
// grouped by publication day, newest first. Every story stays an <article class="card ..."> (placement reads them back).
// Images with a baked-in headline (registry "cardImage": "tile") show the plain brand tile instead.
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function newsMedia(a, lead) {
  if (a.ed.cardImage === 'tile') return `<a href="${href(a)}" class="card-media nw-tile" tabindex="-1" aria-hidden="true"><span>${newsKind(a)}</span></a>`;
  const storyCrop = 'images/home/' + path.parse(a.url.replace(/\/$/, '')).name + '-story-16x9.webp';
  const hasCrop = fs.existsSync(path.join(ROOT, storyCrop));
  const img = `<img src="${hasCrop ? '/' + storyCrop : thumb(a)}" alt="${esc(a.alt)}"${lead ? ' fetchpriority="high"' : ' loading="lazy"'}${hasCrop ? ' width="1600" height="900"' : dims(a)}>`;
  return `<a href="${href(a)}" class="card-media" tabindex="-1" aria-hidden="true">${img}</a>`;
}
function newsItem(a, catOf, lead) {
  const h = lead ? 'h2' : 'h3';
  return `        <article class="card${lead ? ' nw-lead' : ''}" data-category="${catOf(a)}" data-kind="${newsKind(a).toLowerCase()}" data-date="${a.date}">
          ${newsMedia(a, lead)}
          <div class="card-body"><p class="eyebrow">${newsKind(a)}<time datetime="${a.date}">${fmtShort(a.date)}</time></p><${h}><a href="${href(a)}">${esc(a.title)}</a></${h}><p class="nw-dek">${esc(a.desc)}</p></div>
        </article>`;
}
function newsWire(list, catOf) {
  const out = list.length ? [newsItem(list[0], catOf, true)] : []; let day = null, buf = [];
  const flush = () => {
    if (!buf.length) return; const [y, m, d] = day.split('-').map(Number);
    out.push(`        <section class="nw-day">
          <h2 class="nw-date"><time datetime="${day}"><b>${d} ${MONTHS[m - 1]}</b><span>${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} · ${y}</span></time></h2>
          <div class="nw-items">
${buf.join('\n')}
          </div>
        </section>`); buf = [];
  };
  for (const a of list.slice(1)) { if (a.date !== day) { flush(); day = a.date; } buf.push(newsItem(a, catOf, false)); }
  flush();
  return out.join('\n');
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
  for (const c of block.match(/<article class="card[" ][\s\S]*?<\/article>/g) || []) {
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
  const catOf = (a) => esc(cats.has(a.url) ? cats.get(a.url) : chips(a));
  if (sec === 'news') { between(f, 'CARDS', newsWire(lists.news, catOf)); setCount(f, lists.news.length); continue; }
  const items = lists[sec].map((a) => card(a, ` data-category="${catOf(a)}"`, esc(a.type)));
  between(f, 'CARDS', items.join('\n'));
  setCount(f, items.length);
}
// news filters with counts
const kinds = {}; for (const a of lists.news) { const k = newsKind(a).toLowerCase(); kinds[k] = (kinds[k] || 0) + 1; }
const KN = { launch: 'Launches', reveal: 'Reveals', report: 'Reports', preview: 'Previews', archive: 'Archive' };
between('news.html', 'NEWS-FILTERS', `        <a class="chip is-active" href="#all" data-kind-filter="all">All<span class="n">${lists.news.length}</span></a>` +
  Object.keys(KN).filter((k) => kinds[k]).map((k) => `<a class="chip" href="#${k}" data-kind-filter="${k}">${KN[k]}<span class="n">${kinds[k]}</span></a>`).join(''));

// ---- homepage ----------------------------------------------------------------------------------
// Layout (editorial refinement, 27 Nov 2026): HERO (one lead story), Latest STORIES, finder, FEATURED cars,
// COMPARE + UPCOMING, REVIEW + tools, GUIDES, CULTURE banner. Editorial rules: docs/PUBLISHING.md.
// Photography comes ONLY from the clean crops in data/home-images.json (made by
// scripts/make-home-images.py from data/homepage.json), never from branded social graphics.
const readJSON = (p, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8')); } catch (e) { return fallback; } };
const HOME = readJSON('data/homepage.json', {});
const CROPS = readJSON('data/home-images.json', {});
const CARS = (readJSON('data/cars.json', {}).cars || []);
const noClean = new Set();
const ICON_ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const label = (a) => a.type === 'News' ? `News · ${newsKind(a)}` : (a.type === 'Article' ? 'Explainer' : a.type);
const cta = (a) => ({ 'Buyer’s Brief': 'Read the brief', Comparison: 'Read the comparison', Guide: 'Read the guide', Article: 'Read the explainer', News: 'Read the story' })[a.type] || 'Read more';
const crop = (key) => CROPS[key] || null;
// <img> for a clean crop. 'box' is the aspect ratio of the frame it sits in. Crops are cut at the
// frame's ratio by make-home-images.py; a crop it could not fit (marked "contain"), or one much
// narrower or wider than the frame, is letterboxed (object-fit: contain) on its own edge colour
// rather than cut.
function cropImg(c, alt, box, attrs = 'loading="lazy" decoding="async"', pos) {
  const ratio = c.w / c.h, contain = !!c.contain || ratio < box * 0.78 || ratio > box * 1.3;
  const style = [contain ? `background:${c.bg}` : '', pos ? `object-position:${pos}` : ''].filter(Boolean).join(';');
  return `<img src="/${c.file}" alt="${esc(alt)}" width="${c.w}" height="${c.h}"${contain ? ' class="is-contain"' : ''}${style ? ` style="${style}"` : ''} ${attrs}>`;
}
const tile = (a) => `<span class="fp-tile" aria-hidden="true"><span>${esc(a.type === 'Article' ? 'Explainer' : a.type)}</span></span>`;
// Thumbnail crops exist at three slot ratios: '16x10' (review, guides), '16x9' (Latest Stories) and '2x1' (old Latest News).
const thumbFor = (a, r = '16x10') => crop(`${a.url}#thumb@${r}`);
function shortDek(a, max = 96) {
  const s = (a.desc.match(/^.+?[.!?](?=\s|$)/) || [a.desc])[0].trim();
  return s.length <= max ? s : '';
}

// ---- Editorial selection -----------------------------------------------------------------------------------
// Rules (full explanation in docs/PUBLISHING.md):
//  * Only LIVE articles exist here (published, not draft, not scheduled; see scripts/editorial.js).
//  * FEATURABLE = live, not in homepage.json "exclude", and not status "unverified".
//  * Lead story: hero.article if set, inside its start/end dates and with a "hero" banner; otherwise the newest
//    Priority 1 hero-eligible story with a "hero" banner; otherwise keep the current lead; never a routine story
//    just because it is newest.
//  * Featured modules (Compare, New & Upcoming, Car Culture, Latest Reviews, guides) avoid the lead, each other and
//    other where an alternative exists. Latest Stories is a complete chronological feed and repeats freely.
//  * Banner spots need a banner made for the layout (data/homepage.json "banners"); stories without one are listed
//    as a NOTE and the spot keeps the newest story that has one, so a badly framed image never goes live.
const TODAY = ED.istDate();
const excluded = new Set(((HOME.exclude && HOME.exclude.urls) || []).map((u) => u.replace(/^\//, '')));
const featurable = (a) => !!a && !excluded.has(a.url);   // live = published and due; promotion = not excluded
const pick = (u) => (u ? byUrl.get(String(u).replace(/^\//, '')) : null);
const used = new Set();
const BANNERS = HOME.banners || {};
// A banner's 'kind' may be one kind or a list (one image can serve as the lead and as a New & Upcoming card).
const kindsOf = (b) => [].concat(b.kind || []);
const bannerOf = (a, kind) => { const b = a && BANNERS[a.url]; return b && kindsOf(b).includes(kind) && crop(`banner#${a.url}`) ? b : null; };
const missingBanner = [];
const manualOf = (cfg) => (cfg && (cfg.article || cfg.pinned)) || '';
const inWindow = (cfg) => (!cfg.start || TODAY >= cfg.start) && (!cfg.end || TODAY <= cfg.end);
function manualPick(cfg, kind, section) {
  const u = manualOf(cfg); if (!u) return null;
  const a = pick(u);
  const why = !inWindow(cfg) ? `is outside its dates (start ${cfg.start || '–'}, end ${cfg.end || '–'}; today ${TODAY})`
    : !a ? 'is not found, is a draft or is scheduled for later'
    : !featurable(a) ? 'is excluded or unverified'
    : kind && !bannerOf(a, kind) ? `has no "${kind}" banner yet` : '';
  if (why) { console.warn(`WARN: ${section}: ${u} ${why}; choosing automatically`); return null; }
  return a;
}
function pickBanner(kind, ok, cfg, section) {
  const m = manualPick(cfg, kind, section); if (m) return m;
  for (const a of articles) {
    if (!featurable(a) || !ok(a) || used.has(a.url)) continue;
    if (bannerOf(a, kind)) return a;
    if ((kind === 'compare' || kind === 'culture') && !BANNERS[a.url] && missingBanner.filter((x) => x.startsWith(section)).length < 3) missingBanner.push(`${section}: ${a.url}`);
  }
  return null;
}
let cultureUrls = [];
try { cultureUrls = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/car-culture.json'), 'utf-8')).urls || []; } catch (e) { console.warn('WARN: data/car-culture.json missing or invalid'); }
// Car Culture = stories listed in data/car-culture.json plus any registered with category "Car Culture".
const cultureSet = new Set(cultureUrls.map((u) => u.replace(/^\//, '')));
for (const a of articles) if (a.ed.category === 'Car Culture') cultureSet.add(a.url);
// Editorial category: the registry override (data/articles.json "category"), else the listing page the story is
// listed on (news / reviews / comparisons / guides), else its type. Used by Latest Stories and the article catalogue.
const SEC_CAT = { news: 'News', reviews: 'Reviews', comparisons: 'Comparisons', guides: 'Buying Guides' };
const secOf = new Map(); for (const [sec, arr] of Object.entries(lists)) for (const a of arr) secOf.set(a.url, sec);
const CATEGORY = (a) => a.ed.category || SEC_CAT[secOf.get(a.url)] || ({ News: 'News', 'Buyer’s Brief': 'Reviews', Comparison: 'Comparisons', Guide: 'Buying Guides', Article: 'Buying Guides' })[a.type];

// 1. Lead story (static, one only)
const HERO_CFG = HOME.hero || {};
const heroEligible = (a) => featurable(a) && a.ed.hero && a.ed.priority === 1;
let leadA = manualPick(HERO_CFG, 'hero', 'Lead story (hero.article)'), leadWhy = leadA ? 'chosen in data/homepage.json' : '';
if (!leadA) {
  for (const a of articles) {
    if (!heroEligible(a)) continue;
    if (bannerOf(a, 'hero')) { leadA = a; leadWhy = 'newest Priority 1 story with a hero banner'; break; }
    if (missingBanner.filter((x) => x.startsWith('Lead')).length < 3) missingBanner.push(`Lead story (Priority 1): ${a.url}`);
  }
}
if (!leadA) {   // keep the current lead if it is still valid
  const cur = pick(((read('index.html').match(/<h2 id="hlTitle"><a href="\/([^"]+)"/) || [])[1]) || '');
  if (featurable(cur) && bannerOf(cur, 'hero')) { leadA = cur; leadWhy = 'kept the current lead (no Priority 1 story has a hero banner)'; }
}
if (!leadA) {   // last resort: an approved featured story that already has a hero banner
  leadA = articles.find((a) => featurable(a) && a.ed.hero !== false && a.ed.priority <= 2 && bannerOf(a, 'hero')) || null;
  if (leadA) leadWhy = 'no Priority 1 story available; newest featured story with a hero banner';
}
if (!leadA) console.warn('WARN: no story can lead the homepage (needs Priority 1 in data/articles.json and a "hero" banner)');
const heroList = leadA ? [leadA] : [];
if (leadA) used.add(leadA.url);

// 2. Banner modules: comparison, Car Culture; New & Upcoming stays curated
const cmpA = pickBanner('compare', (a) => a.type === 'Comparison', HOME.comparison, 'Comparison');
if (cmpA) used.add(cmpA.url);
const cultureA = pickBanner('culture', (a) => cultureSet.has(a.url), HOME.carCulture, 'Car Culture');
if (cultureA) used.add(cultureA.url);
const NU = HOME.newUpcoming || {};
const launchA = pickBanner('launch', () => true, { article: NU.launch || (NU.pinned || {}).launch }, 'New launch');
if (launchA) used.add(launchA.url);
const upcomingA = pickBanner('upcoming', () => true, { article: NU.upcoming || (NU.pinned || {}).upcoming }, 'Upcoming');
if (upcomingA) used.add(upcomingA.url);


// Static lead story: one editorial hero. Text left (≈40%), the purpose-made 2.4:1 banner on the right at its own ratio,
// right-anchored inside the 1440px container so the whole car stays in view; the banner's dark left side fades into the
// petrol band behind the text, and the headline never sits on the car.
function leadStory(a) {
  const c = crop(`banner#${a.url}`), spec = BANNERS[a.url];
  const img = cropImg(c, a.alt, c.w / c.h, 'fetchpriority="high" decoding="async"', spec.pos || '100% 50%');
  return `      <article class="hl" aria-labelledby="hlTitle">
        <div class="hl-text">
          <p class="fp-label">${esc(label(a))}</p>
          <h2 id="hlTitle"><a href="${href(a)}">${esc(spec.headline || a.title)}</a></h2>
          <p class="hl-dek">${esc(spec.dek || a.desc)}</p>
          <a class="fp-btn" href="${href(a)}">${cta(a)}${ICON_ARROW}</a>
        </div>
        <figure class="hl-figure" style="--r:${(c.w / c.h).toFixed(3)}">
          <a class="hl-media" href="${href(a)}" tabindex="-1" aria-hidden="true">${img}</a>
          ${(spec.credit || a.cap) ? `<figcaption class="hl-credit">${esc(spec.credit || a.cap)}</figcaption>` : ''}
        </figure>
      </article>`;
}
between('index.html', 'HERO', heroList.length ? leadStory(heroList[0]) : '');

// Latest Stories: the newest published stories of every kind, newest first by their original datePublished (editing a
// story never promotes it). One filter per editorial category; each panel = 1 lead story + 3 rows. Stories shown
// elsewhere on the page still appear here; only homepage exclusions and non-live stories (drafts, scheduled) are skipped.
const eligible = articles.filter((a) => !excluded.has(a.url));   // live only (drafts and future-dated stories never reach 'articles')
const STORY_FILTERS = [
  ['all', 'All', () => true, null, null],
  ['news', 'News', (a) => CATEGORY(a) === 'News', '/news.html', 'View All News'],
  ['reviews', 'Reviews', (a) => CATEGORY(a) === 'Reviews', '/reviews.html', 'View All Reviews'],
  ['compare', 'Compare', (a) => CATEGORY(a) === 'Comparisons', '/comparisons.html', 'View All Comparisons'],
  ['guides', 'Guides', (a) => CATEGORY(a) === 'Buying Guides', '/guides.html', 'View All Guides'],
  ['culture', 'Car Culture', (a) => cultureSet.has(a.url), '/car-culture.html', 'View All Car Culture'],
];
const storyLabel = (a) => cultureSet.has(a.url) && a.type === 'News' ? `News · ${newsKind(a)}` : label(a);
const storyMeta = (a) => `<time datetime="${a.date}">${fmt(a.date)}</time>${a.rt ? ` · ${a.rt} min read` : ''}`;
function storyLead(a) {
  const big = crop(`${a.url}#story`), small = thumbFor(a, '16x9');
  if (!big && !small) noClean.add(a.url);
  let img = tile(a);
  if (big) {
    const c = big;
    img = cropImg(c, a.alt, 16 / 9).replace(/^<img /, `<img ${small ? `srcset="/${small.file} ${small.w}w, /${c.file} ${c.w}w" sizes="(min-width:1200px) 700px, (min-width:768px) 52vw, 100vw" ` : ''}`);
  } else if (small) img = cropImg(small, a.alt, 16 / 9);
  const dek = a.desc;
  return `          <article class="ls-lead">
            <a class="ls-lead-media" href="${href(a)}" tabindex="-1" aria-hidden="true">${img}</a>
            <div class="ls-lead-text">
              <p class="fp-label">${esc(storyLabel(a))}</p>
              <h3><a href="${href(a)}">${esc(a.title)}</a></h3>
              ${dek ? `<p class="ls-dek">${esc(dek)}</p>` : ''}
              <p class="ls-meta">${storyMeta(a)}</p>
            </div>
          </article>`;
}
function storyItem(a) {
  const c = thumbFor(a, '16x9'); if (!c) noClean.add(a.url);
  return `            <li><article class="ls-item">
              <a class="ls-media" href="${href(a)}" tabindex="-1" aria-hidden="true">${c ? cropImg(c, a.alt, 16 / 9) : tile(a)}</a>
              <div class="ls-text"><p class="fp-label">${esc(storyLabel(a))}</p><h3><a href="${href(a)}">${esc(a.title)}</a></h3><p class="ls-meta">${storyMeta(a)}</p></div>
            </article></li>`;
}
const panels = STORY_FILTERS.map(([id, name, ok, more, moreText]) => ({ id, name, more, moreText, items: eligible.filter(ok).slice(0, 4) })).filter((p) => p.items.length);
between('index.html', 'STORIES', `      <div class="ls-tabs" role="tablist" aria-label="Filter latest stories" hidden>
${panels.map((p, i) => `        <button class="ls-tab" type="button" role="tab" id="ls-tab-${p.id}" aria-controls="ls-${p.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}${p.more ? ` data-more="${p.more}" data-more-text="${esc(p.moreText)}"` : ''}>${esc(p.name)}</button>`).join('\n')}
      </div>
${panels.map((p, i) => `      <div class="ls-panel" id="ls-${p.id}" role="tabpanel" aria-labelledby="ls-tab-${p.id}"${i ? ' hidden' : ''}>
${storyLead(p.items[0])}
          <ul class="ls-list">
${p.items.slice(1).map(storyItem).join('\n')}
          </ul>
      </div>`).join('\n')}`);
// The default (All) panel is what every visitor sees, so the sections below skip those four stories.
const latestShown = panels.length ? panels[0].items : [];
latestShown.forEach((a) => used.add(a.url));

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
          <span class="fc-media">${c ? cropImg(c, `${car.name} exterior`, 16 / 9) : `<span class="fp-tile" aria-hidden="true"></span>`}</span>
          <span class="fc-info"><span class="fc-name">${esc(car.name)}</span><span class="fc-badge">${BODY[car.body] || esc(car.body)}</span><span class="fc-price">${priceText(car)}*${car.note ? ` <span class="fc-note">${esc(car.note)}</span>` : ''}</span></span>
        </a>`;
}).join('\n'));
const latestCheck = featured.map((c) => c.checked).sort().pop();
pages['index.html'] = read('index.html').replace(/(<p class="fc-foot" data-fp-checked>)[\s\S]*?(<\/p>)/, (m, a, b) =>
  `${a}*Ex-showroom price ranges as stated in each FlamingPiston buyer’s brief, last checked ${latestCheck ? checked(latestCheck) : ''}. Prices change often, so confirm with a dealer.${b}`);

// Finder data: the same catalogue, embedded so the finder works without extra requests
between('index.html', 'CARS-DATA', `  <script type="application/json" id="fpCars">${JSON.stringify(CARS.map((c) => ({ n: c.name, u: c.url, b: c.body, f: c.fuels, lo: c.min, hi: c.max, note: c.note || '', d: checked(c.checked) }))).replace(/</g, '\\u003c')}</script>`);

// Compare: the featured comparison as a compact research module (clean pair photo | title, one line, text link).
// The photo is a 16:10 crop of the comparison banner's "subject" (bthumb#, made by make-home-images.py).
if (cmpA) {
  const cm = BANNERS[cmpA.url], P = crop(`bthumb#${cmpA.url}`);
  if (!P) noClean.add(cmpA.url);
  const head = cm.headline || cmpA.title.split(':')[0];
  const line = cm.short || shortDek({ desc: cm.dek || cmpA.desc }, 110) || cmpA.desc;
  between('index.html', 'COMPARE', `        <article class="cm-card">
          <a class="cm-media" href="${href(cmpA)}" tabindex="-1" aria-hidden="true">${P ? cropImg(P, cmpA.alt, 1.6) : tile(cmpA)}</a>
          <div class="cm-text">
            <h3><a href="${href(cmpA)}">${esc(head)}</a></h3>
            <p>${esc(line)}</p>
            <a class="fp-textlink" href="${href(cmpA)}">Compare now${ICON_ARROW}</a>
          </div>
          ${cm.credit ? `<p class="cm-credit">${esc(cm.credit)}</p>` : ''}
        </article>`);
} else { console.warn('WARN: no Comparison has a "compare" banner; the Compare module is empty'); between('index.html', 'COMPARE', ''); }

// New & Upcoming: two compact entries — the newest 'launch' and 'upcoming' stories with a banner (pins override); a kind
// with no banner yet falls back to its curated item in homepage.json "newUpcoming.items". Thumbnails are 16:9 crops of
// the car (bthumb# from the banner, or the older upcoming# crop). Every line comes from the linked story.
const NU_DEFAULT = { launch: { label: 'New launch', link: 'Read the launch story' }, upcoming: { label: 'Upcoming', link: 'What we know' } };
const legacyItems = ((HOME.newUpcoming && HOME.newUpcoming.items) || []).filter((it) => byUrl.has(it.url));
function nuEntry(a, kind, it) {
  const b = it || BANNERS[a.url] || {}, d = NU_DEFAULT[kind];
  const c = it ? crop(`upcoming#${it.url}`) : (crop(`bthumb#${a.url}`) || crop(`upcoming#${a.url}`));
  if (!c) noClean.add(a.url);
  return `        <a class="nu-item" href="${href(a)}">
          <span class="nu-thumb">${c ? cropImg(c, a.alt, 16 / 9, 'loading="lazy" decoding="async"', it && it.image && it.image.pos) : tile(a)}</span>
          <span class="nu-body"><span class="fp-label">${esc(b.label || d.label)}</span><span class="nu-name">${esc(b.name || a.title.split(':')[0])}</span><span class="nu-status">${esc(b.status)}</span><span class="nu-link">${esc(b.link || d.link)}${ICON_ARROW}</span></span>
        </a>`;
}
const upItems = [];
for (const [kind, a, idx] of [['launch', launchA, 0], ['upcoming', upcomingA, 1]]) {
  if (a) { upItems.push(nuEntry(a, kind)); continue; }
  const it = legacyItems[idx];
  if (it) { upItems.push(nuEntry(byUrl.get(it.url), kind, it)); console.warn(`WARN: New & Upcoming: no "${kind}" banner yet; showing the curated item for ${it.url}`); }
}
between('index.html', 'UPCOMING', upItems.join('\n'));

// Latest Reviews: the newest featurable Buyer's Brief not already on the page (lead, banner modules or the default
// Latest Stories panel); if every brief is already shown, the newest one that is not the lead.
const isBrief = (a) => a.type === 'Buyer’s Brief';
const review = articles.find((a) => featurable(a) && isBrief(a) && !used.has(a.url)) || articles.find((a) => featurable(a) && isBrief(a) && a !== leadA);
if (review && !thumbFor(review)) noClean.add(review.url);
if (review) used.add(review.url);
// Optional "tall" photo (data/homepage.json images[url].tall, a 6:7 crop): fills the card's full height on desktop,
// so the dek can stay; its "credit" is shown under the card. Without one the 16:10 thumb is used.
const reviewTall = review && crop(`${review.url}#tall`);
const reviewTallSpec = review && HOME.images && HOME.images[review.url] && HOME.images[review.url].tall;
const reviewMedia = !review ? '' : reviewTall
  ? `<img src="/${reviewTall.file}" alt="${esc(reviewTallSpec.alt || review.alt)}" width="${reviewTall.w}" height="${reviewTall.h}" loading="lazy" decoding="async">`
  : (thumbFor(review) ? cropImg(thumbFor(review), review.alt, 1.6) : tile(review));
between('index.html', 'REVIEW', review ? `        <article class="lr-card${reviewTall ? ' lr-card--tall' : ''}">
          <a class="lr-media" href="${href(review)}" tabindex="-1" aria-hidden="true">${reviewMedia}</a>
          <div class="lr-text">
            <p class="fp-label">${esc(label(review))}</p>
            <h3><a href="${href(review)}">${esc(review.title)}</a></h3>
            <p class="lr-meta">${storyMeta(review)}</p>
            ${review.desc ? `<p class="lr-dek">${esc(shortDek(review, 130) || review.desc)}</p>` : ''}
            <a class="fp-textlink" href="${href(review)}">Read the Brief${ICON_ARROW}</a>
          </div>
        </article>${reviewTall && reviewTallSpec.credit ? `
        <p class="lr-credit">${esc(reviewTallSpec.credit)}</p>` : ''}` : '');

// Buying & Ownership Guides: the 3 newest featurable guides not already on the page; compact cards (image + label + headline)
const isGuide = (a) => a.type === 'Guide' || a.type === 'Article';
const guides = articles.filter((a) => featurable(a) && isGuide(a) && !used.has(a.url)).slice(0, 3);
if (guides.length < 3) guides.push(...articles.filter((a) => featurable(a) && isGuide(a) && a !== leadA && !guides.includes(a)).slice(0, 3 - guides.length));
guides.forEach((a) => { if (!thumbFor(a)) noClean.add(a.url); used.add(a.url); });
between('index.html', 'GUIDES', guides.map((a) => `        <a class="gd-card" href="${href(a)}">
          <span class="gd-media">${thumbFor(a) ? cropImg(thumbFor(a), a.alt, 1.6) : tile(a)}</span>
          <span class="gd-text"><span class="fp-label">${esc(label(a))}</span><span class="gd-title">${esc(a.title)}</span></span>
        </a>`).join('\n'));

// Car Culture banner (section entry point, links to /car-culture.html). Full-bleed image from the newest culture
// story that has a 'culture' banner; until one exists, the older image in carCulture.image.
const cc = HOME.carCulture || {};
if (cultureA) {
  const b = BANNERS[cultureA.url], c = crop(`banner#${cultureA.url}`);
  between('index.html', 'CULTURE', `      <section class="cc-banner cc-banner--bleed" aria-labelledby="cultureTitle" style="--r:${(c.w / c.h).toFixed(3)}">
        <span class="cc-media" aria-hidden="true">${cropImg(c, '', c.w / c.h, 'loading="lazy" decoding="async"', b.pos || '100% 50%')}</span>
        <div class="cc-text">
          <h2 class="fp-italic" id="cultureTitle">${esc(cc.title || 'Car Culture')}</h2>
          <p>${esc(cc.dek || '')}</p>
          <a class="fp-btn" href="${cc.url || '/car-culture.html'}">Explore Stories${ICON_ARROW}</a>
        </div>
        ${b.credit ? `<p class="cc-credit">${esc(b.credit)}</p>` : ''}
      </section>`);
} else {
  const ccImg = crop('culture#banner');
  between('index.html', 'CULTURE', `      <section class="cc-banner" aria-labelledby="cultureTitle">
        ${ccImg ? `<span class="cc-media" aria-hidden="true">${cropImg(ccImg, '', 2.6, 'loading="lazy" decoding="async"', cc.image && cc.image.pos)}</span>` : ''}
        <div class="cc-text">
          <h2 class="fp-italic" id="cultureTitle">${esc(cc.title || 'Car Culture')}</h2>
          <p>${esc(cc.dek || '')}</p>
          <a class="fp-btn" href="${cc.url || '/car-culture.html'}">Explore Stories${ICON_ARROW}</a>
        </div>
        ${cc.credit ? `<p class="cc-credit">${esc(cc.credit)}</p>` : ''}
      </section>`);
}
if (missingBanner.length) console.warn(`NOTE: newer stories without a homepage banner (sections kept the newest that has one):\n  ${missingBanner.join('\n  ')}`);

const culture = articles.filter((a) => cultureSet.has(a.url));   // already newest first
const missingCulture = cultureUrls.filter((u) => !byUrl.has(u.replace(/^\//, '')));
const hero = heroList;

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

// ---- article catalogue (generated, internal) -------------------------------------------------------
// data/article-catalog.json: one consistent record per live article, merged from the article HTML (title, dates,
// description, images, credit), data/articles.json (id, category, priority, hero, status, vehicles) and
// data/homepage.json (clean thumbnail, focal box, banner), plus where it appears on the homepage this build.
// For tooling and the future vehicle catalogue; /data is blocked from the public by .htaccess. Never edit by hand.
{
  const placed = new Map();
  const put = (a, where) => { if (a) placed.set(a.url, [...(placed.get(a.url) || []), where]); };
  put(leadA, 'lead'); put(cmpA, 'compare'); put(cultureA, 'car-culture');
  put(launchA, 'new-launch'); put(upcomingA, 'upcoming'); put(review, 'latest-review'); guides.forEach((a) => put(a, 'guides'));
  latestShown.forEach((a) => put(a, 'latest-stories'));
  const catalog = {
    _about: 'GENERATED by scripts/build-lists.js; do not edit. Edit the article HTML, data/articles.json or data/homepage.json instead.',
    articles: articles.map((a) => {
      const t = HOME.images && HOME.images[a.url] && HOME.images[a.url].thumb, b = BANNERS[a.url], c = thumbFor(a);
      return {
        id: a.ed.id, url: '/' + a.url, title: a.title, category: CATEGORY(a), subtype: a.ed.subtype || (a.type === 'News' ? newsKind(a).toLowerCase() : ''),
        published: a.iso, updated: a.updated, description: a.desc,
        image: a.img ? '/' + a.img : null, imageCredit: a.cap || null,
        thumbnail: c ? '/' + c.file : null, focal: t ? (t.subject || t.box || null) : null,
        banner: b ? { kind: b.kind, file: crop(`banner#${a.url}`) ? '/' + crop(`banner#${a.url}`).file : null, credit: b.credit || null } : null,
        vehicles: a.ed.vehicles, priority: a.ed.priority, heroEligible: a.ed.hero, status: a.ed.status,
        homepage: placed.get(a.url) || [],
        revisionPending: pendingRevisions.some((x) => x.startsWith(a.url + ' ')),
      };
    }),
    notLive: notLive.slice().sort(),
    drafts: pendingRevisions.slice().sort(),
  };
  const out = JSON.stringify(catalog, null, 1) + '\n', cp = path.join(ROOT, 'data', 'article-catalog.json');
  if (!fs.existsSync(cp) || fs.readFileSync(cp, 'utf-8') !== out) fs.writeFileSync(cp, out, 'utf-8');
}

for (const [f, html] of Object.entries(pages)) fs.writeFileSync(path.join(ROOT, f), html, 'utf-8');
console.log(`Homepage: lead ${hero.length ? hero[0].url + ' (' + leadWhy + ')' : 'none'}; latest stories ${panels.map((p) => `${p.id} ${p.items.length}`).join(' / ')}, featured cars ${featured.length}, new & upcoming ${upItems.length}, review ${review ? 1 : 0}, guides ${guides.length}.`);
if (noClean.size) console.log(`Tip: no clean homepage image for:\n  ${[...noClean].join('\n  ')}\n  (they show a plain brand tile; add a "thumb" crop in data/homepage.json, run python3 scripts/make-home-images.py, then this script again)`);
console.log(`Sections: news ${lists.news.length}, reviews ${lists.reviews.length}, guides ${lists.guides.length}, comparisons ${lists.comparisons.length}. Car Culture ${culture.length}. Author page ${articles.length}.`);
if (missingThumbs.size) console.log(`Tip: ${missingThumbs.size} image(s) have no thumbnail yet; run  python3 scripts/make-thumbs.py  then this script again.`);
if (added.length) console.log(`Newly added to sections:\n  ${added.join('\n  ')}`);
if (missingCulture.length) console.warn(`WARN: in data/car-culture.json but not found (deleted, redirected or noindex):\n  ${missingCulture.join('\n  ')}`);
