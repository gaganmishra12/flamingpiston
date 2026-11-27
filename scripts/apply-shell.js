#!/usr/bin/env node
//
// apply-shell.js — puts the shared FlamingPiston design "shell" on every page:
//   <head>: one stylesheet (/assets/fp.css), font preloads, SVG favicon, theme colour
//           (removes Google Fonts, style.css and site-search.css links)
//   <body>: global masthead + drawer, search overlay, global footer, back-to-top button, /assets/fp.js
//           (homepage also gets fp-home.css / fp-home.js; header + footer are identical on every page)
//           (removes the old per-page menu / back-to-top snippets, site-search.js, card-dates.js)
//
// It never touches titles, meta descriptions, canonicals, Open Graph, JSON-LD,
// analytics, or anything inside <main>. Safe to run again at any time.
//
// Usage (from the site root):
//   node scripts/apply-shell.js            apply to every page
//   node scripts/apply-shell.js --dry-run  list what would change, write nothing
//   node scripts/apply-shell.js news-x.html reviews/y/index.html   only these files

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V = '20261128w1140';                       // fp.css / fp.js — bump after editing them
const VH = '20261128lr2';                      // homepage-only assets (fp-home.css / fp-home.js)
const SKIP_DIRS = new Set(['site', 'scripts', 'images', 'js', 'assets', '.git', 'node_modules', 'design-preview']);
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const only = args.filter((a) => !a.startsWith('--'));

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (fs.statSync(full).isDirectory()) { if (!SKIP_DIRS.has(rel.split('/')[0])) walk(full, out); }
    else if (name.endsWith('.html')) out.push(rel);
  }
  return out;
}

// ---- which nav item is active -------------------------------------------------
// Listing and tool pages by file; articles by their editorial type (the <span class="tag"> label in
// <main>, same rule as typeOf() in build-lists.js), never by URL folder alone: Brezza guides and
// several comparisons live under /reviews/, and "x-vs-y" guides are guides, not comparisons.
function sectionOf(rel, html) {
  rel = rel.replace(/^drafts\//, '');   // drafts/ mirrors the public paths (pending revisions, new drafts)
  if (rel === 'index.html') return 'home';
  const pages = { 'news.html': 'news', 'reviews.html': 'reviews', 'comparisons.html': 'comparisons', 'guides.html': 'guides',
    'car-culture.html': 'culture', 'tools.html': 'tools' };
  if (pages[rel]) return pages[rel];
  if (!/<main class="content"/.test(html) || !/<span class="tag">/.test(html)) return '';   // about, policies, author, sitemap, 404
  if (rel.startsWith('news-')) return 'news';
  if (rel.startsWith('guides/') || rel.startsWith('articles/')) return 'guides';
  if (rel.startsWith('comparisons/')) return 'comparisons';
  const tag = ((html.match(/<main[\s\S]*?<span class="tag">([^<]+)<\/span>/) || [])[1] || '').split('·')[0].trim();
  if (tag === 'News') return 'news';
  if (tag === 'Comparison') return 'comparisons';
  if (tag === 'Guide' || tag === 'Article') return 'guides';
  return rel.startsWith('reviews/') ? 'reviews' : '';                     // Buyer's Briefs live under /reviews/
}

// ---- shell pieces ---------------------------------------------------------------
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="M20.5 20.5 16.4 16.4"/></svg>';

const HEAD = `<!-- FP:HEAD -->
  <meta name="theme-color" content="#11252E">
  <link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="/assets/fonts/familjen-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/fp.css?v=${V}">
  <!-- /FP:HEAD -->`;

const SEARCH = `<div id="fpSearchOverlay" class="fp-search-overlay" role="dialog" aria-modal="true" aria-label="Search FlamingPiston" aria-hidden="true">
    <div class="fp-search-panel">
      <div class="fp-search-input-row">${ICON_SEARCH}
        <label for="fpSearchInput" class="sr-only">Search</label>
        <input id="fpSearchInput" class="fp-search-input" type="search" placeholder="Search cars, guides, comparisons" autocomplete="off">
        <button id="fpSearchClose" class="fp-search-close" type="button">ESC</button>
      </div>
      <div id="fpSearchResults" class="fp-search-results" aria-live="polite"></div>
      <div class="fp-search-foot"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></div>
    </div>
  </div>`;

// ---- global header: the approved homepage masthead (Phase 1 design, used on every page since Phase 2A) ----
// Cars and Tools are dropdowns; a page in one of those sections marks the dropdown button as active.
const CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DD = {
  cars: [['Featured cars', '/#featured-cars'], ['Find your next car', '/#fpFinder'], ['SUVs', '/reviews.html#suv'], ['Hatchbacks', '/reviews.html#hatchback'],
    ['Sedans', '/reviews.html#sedan'], ['Pickups', '/reviews.html#pickup'], ['Electric cars', '/reviews.html#electric']],
  tools: [['EMI calculator', '/tools.html#emi'], ['Fuel cost calculator', '/tools.html#fuel'], ['Petrol vs CNG calculator', '/tools.html#cng'],
    ['Ownership cost calculator', '/tools.html#ownership'], ['Car finder', '/#fpFinder']],
};
const HOME_NAV = [['Home', '/', 'home'], ['News', '/news.html', 'news'], ['Cars', 'cars'], ['Reviews', '/reviews.html', 'reviews'], ['Compare', '/comparisons.html', 'comparisons'],
  ['Buying Guides', '/guides.html', 'guides'], ['Tools', 'tools'], ['Car Culture', '/car-culture.html', 'culture']];
const SECONDARY = [['About', '/about.html'], ['Contact', '/contact.html'], ['Gagan Mishra', '/author-gagan-mishra.html'], ['Editorial Policy', '/editorial-policy.html'],
  ['Review Methodology', '/review-methodology.html'], ['Fact-Checking Policy', '/fact-checking-policy.html'], ['Corrections Policy', '/corrections-policy.html'], ['Instagram @flamingpiston_in', 'https://www.instagram.com/flamingpiston_in/']];
function header(cur) {
  const ddList = (k) => DD[k].map(([n, u]) => `<li><a href="${u}">${n}</a></li>`).join('');
  const items = HOME_NAV.map((it) => {
    if (DD[it[1]]) return `<li class="has-dd"><button type="button" class="mh-dd-btn${it[1] === cur ? ' is-active' : ''}" aria-expanded="false" aria-controls="dd-${it[1]}">${it[0]}${CHEV}${it[1] === cur ? '<span class="sr-only"> (current section)</span>' : ''}</button><ul class="mh-dd" id="dd-${it[1]}">${ddList(it[1])}</ul></li>`;
    const [n, u, k] = it;
    return `<li><a href="${u}"${k === cur ? ' class="active" aria-current="page"' : ''}>${n}</a></li>`;
  }).join('');
  const drawer = HOME_NAV.map((it) => DD[it[1]] ? `<li class="dr-group"><span${it[1] === cur ? ' class="is-active"' : ''}>${it[0]}</span><ul>${ddList(it[1])}</ul></li>` : `<li><a href="${it[1]}"${it[2] === cur ? ' aria-current="page"' : ''}>${it[0]}</a></li>`).join('');
  return `<header class="site-header fp-masthead">
    <div class="fp-container mh-row">
      <a href="/" class="mh-brand" aria-label="FlamingPiston home"><img src="/assets/brand/flamingpiston_horizontal_cropped_light.svg" alt="FlamingPiston" width="260" height="21"><span class="mh-desc" aria-hidden="true">Cars <span>/</span> Reviews <span>/</span> Buying Guides</span></a>
      <nav class="mh-nav" aria-label="Main"><ul>${items}</ul></nav>
      <div class="mh-tools">
        <button id="fpSearchTrigger" class="mh-icon" type="button" aria-label="Search (press /)">${ICON_SEARCH}</button>
        <button id="fpMenuBtn" class="mh-icon mh-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="fpDrawer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div>
    </div>
    <div class="mh-drawer" id="fpDrawer" hidden>
      <div class="mh-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <button class="mh-icon mh-close" type="button" id="fpMenuClose" aria-label="Close menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <ul class="dr-main">${drawer}</ul>
        <ul class="dr-secondary">${SECONDARY.map(([n, u]) => `<li><a href="${u}"${/^https/.test(u) ? ' rel="noopener"' : ''}>${n}</a></li>`).join('')}</ul>
      </div>
    </div>
  </header>`;
}



// ---- global footer: the approved homepage footer (brand + Sections / Company / Editorial / Legal) ----
const FOOTER = `<footer class="site-footer fp-footer">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <a href="/" class="logo" aria-label="FlamingPiston home"><img src="/assets/brand/flamingpiston_horizontal_cropped_light.svg" alt="FlamingPiston" width="249" height="20" loading="lazy"></a>
          <p>Car news, buyer’s briefs, comparisons and buying guides for India.</p>
          <div class="foot-social"><a href="https://www.instagram.com/flamingpiston_in/" target="_blank" rel="noopener">Instagram @flamingpiston_in</a></div>
        </div>
        <div><h3 class="f-h">Sections</h3><ul><li><a href="/news.html">News</a></li><li><a href="/reviews.html">Reviews</a></li><li><a href="/guides.html">Buying Guides</a></li><li><a href="/comparisons.html">Comparisons</a></li><li><a href="/tools.html">Tools</a></li><li><a href="/car-culture.html">Car Culture</a></li></ul></div>
        <div><h3 class="f-h">Company</h3><ul><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/author-gagan-mishra.html">Gagan Mishra</a></li><li><a href="/sitemap.html">Sitemap</a></li></ul></div>
        <div><h3 class="f-h">Editorial</h3><ul><li><a href="/editorial-policy.html">Editorial Policy</a></li><li><a href="/review-methodology.html">Review Methodology</a></li><li><a href="/fact-checking-policy.html">Fact-Checking Policy</a></li><li><a href="/corrections-policy.html">Corrections Policy</a></li></ul></div>
        <div><h3 class="f-h">Legal</h3><ul><li><a href="/privacy-policy.html">Privacy Policy</a></li><li><a href="/cookie-policy.html">Cookie Policy</a></li><li><a href="/terms.html">Terms of Use</a></li><li><a href="/affiliate-disclosure.html">Affiliate Disclosure</a></li><li><a href="/disclaimer.html">Disclaimer</a></li></ul></div>
      </div>
      <div class="foot-bottom"><span>&copy; 2026 FlamingPiston. All rights reserved.</span><span>New Delhi, India</span></div>
    </div>
  </footer>
  <button class="back-to-top" id="backToTop" type="button" aria-label="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>`;



// ---- helpers ---------------------------------------------------------------------
// Remove a <tag ...> element starting at index i, matching nested same-name tags.
function elementEnd(html, i, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = i; let depth = 0, m;
  while ((m = re.exec(html))) { depth += m[0][1] === '/' ? -1 : 1; if (depth === 0) return m.index + m[0].length; }
  throw new Error(`unclosed <${tag}>`);
}
function replaceElement(html, openRe, tag, replacement) {
  const m = html.match(openRe); if (!m) return [html, false];
  const end = elementEnd(html, m.index, tag);
  let start = m.index;
  if (replacement === '') while (start > 0 && /\s/.test(html[start - 1])) start--;   // removal takes its leading whitespace
  return [html.slice(0, start) + replacement + html.slice(end), true];
}

function bodyClass(rel, sec) {
  const info = ['about.html', 'contact.html', 'privacy-policy.html', 'cookie-policy.html', 'terms.html', 'affiliate-disclosure.html', 'disclaimer.html',
    'editorial-policy.html', 'fact-checking-policy.html', 'corrections-policy.html', 'review-methodology.html', 'author-gagan-mishra.html', 'sitemap.html', 'tools.html'];
  if (rel === 'index.html') return 'home';
  if (['news.html', 'reviews.html', 'guides.html', 'comparisons.html'].includes(rel)) return 'listing';
  if (rel === 'car-culture.html') return 'listing culture';
  if (rel === '404.html') return 'error';
  if (info.includes(rel)) return 'info' + (rel === 'sitemap.html' ? ' sitemap' : '') + (rel === 'about.html' ? ' about' : '') + (rel === 'contact.html' ? ' contact' : '');
  return 'article';
}

function apply(rel) {
  const file = path.join(ROOT, rel);
  let h = fs.readFileSync(file, 'utf-8');
  const before = h;
  if (/http-equiv="refresh"/i.test(h)) return null;                       // redirect stubs: leave alone
  if (!/<header class="site-header[^"]*">/.test(h) || !/<footer class="site-footer[^"]*"/.test(h)) return 'SKIP (no header/footer)';
  const sec = sectionOf(rel, h);

  // <head>
  h = h.replace(/\s*<!-- FP:HEAD -->[\s\S]*?<!-- \/FP:HEAD -->/, '');
  h = h.replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>/g, '');
  h = h.replace(/\s*<link[^>]+href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*>/g, '');
  h = h.replace(/\s*<link rel="stylesheet" href="[^"]*(?:style|site-search)\.css[^"]*">/g, '');
  h = h.replace(/\s*<meta name="theme-color"[^>]*>/g, '');
  // Author photo in every byline (the site has one author). Idempotent: only replaces the old letter avatar.
  h = h.replace(/<div class="author-avatar"( style="[^"]*")?>(?:G|\[First initial\])<\/div>/g, (m, st) => st
    ? '<div class="author-avatar author-avatar-lg"><img src="/images/gagan-mishra-v2.jpg" alt="Gagan Mishra" width="96" height="96"></div>'
    : '<div class="author-avatar"><img src="/images/gagan-mishra-avatar-v2.jpg" alt="Gagan Mishra" width="36" height="36"></div>');

  // Article lead photo: tell the browser to fetch it first (it is the largest thing on screen).
  let head = HEAD;
  const lead = (h.match(/<main[^>]*>[\s\S]*?<img[^>]*class="hero-image"[^>]*>/) || [''])[0].match(/<img[^>]*class="hero-image"[^>]*>/);
  const leadSrc = lead && (lead[0].match(/\ssrc="([^"]+)"/) || [])[1];
  if (leadSrc && !/^(https?:|data:)/.test(leadSrc) && !/\[/.test(leadSrc)) {
    const abs = leadSrc.startsWith('/') ? leadSrc : path.posix.normalize(path.posix.join('/', path.posix.dirname(rel.split(path.sep).join('/')), leadSrc));
    head = head.replace('<link rel="preload" href="/assets/fonts/', `<link rel="preload" href="${abs}" as="image" fetchpriority="high">\n  <link rel="preload" href="/assets/fonts/`);
  }
  if (rel === 'index.html') head = head.replace('<link rel="stylesheet" href="/assets/fp.css', `<link rel="preload" href="/assets/fonts/familjen-grotesk-latin-700-italic.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="stylesheet" href="/assets/fp.css`)
    .replace('  <!-- /FP:HEAD -->', `  <link rel="stylesheet" href="/assets/fp-home.css?v=${VH}">\n  <!-- /FP:HEAD -->`);
  if (['news.html', 'reviews.html', 'guides.html', 'comparisons.html', 'car-culture.html'].includes(rel)) {
    head = head.replace('  <!-- /FP:HEAD -->', '  <link rel="stylesheet" href="/assets/fp-listings.css?v=20261127p">\n  <!-- /FP:HEAD -->');
  }
  h = h.replace(/\s*<\/head>/, `\n  ${head}\n</head>`);

  // body class
  const cls = bodyClass(rel, sec);
  h = h.replace(/<body([^>]*)>/, (m, attrs) => `<body${attrs.replace(/\s*class="[^"]*"/, '')} class="${cls}">`);

  // header, search overlay, footer, back-to-top
  let ok;
  [h] = replaceElement(h, /<div id="fpSearchOverlay"[^>]*>/, 'div', '');
  [h, ok] = replaceElement(h, /<header class="site-header[^"]*">/, 'header', header(sec));
  if (!ok) throw new Error('header not found');
  [h] = replaceElement(h, /<button class="back-to-top"[^>]*>/, 'button', '');
  [h, ok] = replaceElement(h, /<footer class="site-footer[^"]*"[^>]*>/, 'footer', FOOTER);
  if (!ok) throw new Error('footer not found');
  h = h.replace(/\s*(<header class="site-header[^"]*">)/, `\n\n  ${SEARCH}\n\n  $1`);
  if (!/class="skip-link"/.test(h)) h = h.replace(/(<body[^>]*>)/, '$1\n  <a href="#main" class="skip-link">Skip to content</a>');

  // scripts
  h = h.replace(/\s*<script>(?:(?!<\/script>)[\s\S])*?(?:getElementById\('menuBtn'\)|getElementById\('backToTop'\)|getElementById\("backToTop"\))[\s\S]*?<\/script>/g, '');
  h = h.replace(/\s*<script src="[^"]*(?:site-search|card-dates)\.js[^"]*"[^>]*><\/script>/g, '');
  h = h.replace(/\s*<script src="\/assets\/fp(?:-home)?\.js[^"]*"[^>]*><\/script>/g, '');
  h = h.replace(/\s*<\/body>/, `\n  <script src="/assets/fp.js?v=${V}" defer></script>${rel === 'index.html' ? `\n  <script src="/assets/fp-home.js?v=${VH}" defer></script>` : ''}\n</body>`);

  if (h === before) return 'unchanged';
  if (!DRY) fs.writeFileSync(file, h, 'utf-8');
  return 'updated';
}

const files = only.length ? only : walk(ROOT);
const tally = {};
for (const rel of files) {
  const r = apply(rel); if (r === null) { tally['redirect stub, left alone'] = (tally['redirect stub, left alone'] || 0) + 1; continue; }
  tally[r] = (tally[r] || 0) + 1;
  if (r.startsWith('SKIP')) console.log(`  ${r}: ${rel}`);
}
console.log((DRY ? '[dry run] ' : '') + Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', '));
