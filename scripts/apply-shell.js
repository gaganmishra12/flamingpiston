#!/usr/bin/env node
//
// apply-shell.js — puts the shared FlamingPiston design "shell" on every page:
//   <head>: one stylesheet (/assets/fp.css), font preloads, SVG favicon, theme colour
//           (removes Google Fonts, style.css and site-search.css links)
//   <body>: header + navigation, search overlay, footer, back-to-top button, /assets/fp.js
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
const V = '20261120c';                       // bump to bust caches after editing assets
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
function sectionOf(rel, html) {
  const tag = ((html.match(/<main[\s\S]*?<span class="tag">([^<]+)<\/span>/) || [])[1] || '').split('·')[0].trim();
  if (rel === 'index.html') return 'home';
  if (rel === 'news.html' || rel.startsWith('news-')) return 'news';
  if (rel === 'comparisons.html' || rel.startsWith('comparisons/') || /-vs-/.test(rel)) return 'comparisons';
  if (rel === 'guides.html' || rel.startsWith('guides/') || rel.startsWith('articles/') || (rel.startsWith('reviews/') && /^(Guide|Article)$/.test(tag))) return 'guides';
  if (rel === 'reviews.html' || rel.startsWith('reviews/')) return 'reviews';
  if (rel === 'car-culture.html') return 'culture';
  if (rel === 'about.html') return 'about';
  return '';
}

// ---- shell pieces ---------------------------------------------------------------
const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="M20.5 20.5 16.4 16.4"/></svg>';
const NAV = [['News', '/news.html', 'news'], ['Reviews', '/reviews.html', 'reviews'], ['Buying Guides', '/guides.html', 'guides'],
  ['Comparisons', '/comparisons.html', 'comparisons'], ['Car Culture', '/car-culture.html', 'culture'], ['About', '/about.html', 'about']];

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

function header(cur) {
  const items = NAV.map(([n, u, k]) => `<li><a href="${u}"${k === cur ? ' class="active" aria-current="page"' : ''}>${n}</a></li>`).join('');
  return `<header class="site-header">
    <div class="wrap navbar">
      <a href="/" class="logo" aria-label="FlamingPiston home"><img src="/assets/brand/flamingpiston_horizontal_cropped_light.svg" alt="FlamingPiston" width="249" height="20"></a>
      <nav class="main-nav" id="navCollapse" aria-label="Main">
        <ul><li class="mobile-only"><a href="/"${cur === 'home' ? ' class="active" aria-current="page"' : ''}>Home</a></li>${items}</ul>
        <div class="nav-secondary"><a href="/contact.html">Contact</a><a href="/editorial-policy.html">Editorial Policy</a><a href="/review-methodology.html">How We Assess Cars</a><a href="https://www.instagram.com/flamingpiston_in/" rel="noopener">Instagram</a></div>
      </nav>
      <div class="nav-tools">
        <button id="fpSearchTrigger" class="fp-search-trigger" type="button" aria-label="Search">${ICON_SEARCH}<span class="label">Search</span><kbd>/</kbd></button>
        <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navCollapse">
          <svg class="icon-menu" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/></svg><svg class="icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

const FOOTER = `<footer class="site-footer">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <a href="/" class="logo" aria-label="FlamingPiston home"><img src="/assets/brand/flamingpiston_horizontal_cropped_light.svg" alt="FlamingPiston" width="249" height="20" loading="lazy"></a>
          <p>Honest automotive reviews, practical buying advice, and maintenance guides — everything you need before buying your next vehicle.</p>
          <div class="foot-social"><a href="https://www.instagram.com/flamingpiston_in/" target="_blank" rel="noopener">Instagram @flamingpiston_in</a></div>
        </div>
        <div><h3 class="f-h">Sections</h3><ul><li><a href="/news.html">News</a></li><li><a href="/reviews.html">Reviews</a></li><li><a href="/guides.html">Buying Guides</a></li><li><a href="/comparisons.html">Comparisons</a></li><li><a href="/car-culture.html">Car Culture</a></li></ul></div>
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
    'editorial-policy.html', 'fact-checking-policy.html', 'corrections-policy.html', 'review-methodology.html', 'author-gagan-mishra.html', 'sitemap.html'];
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
  if (!/<header class="site-header">/.test(h) || !/<footer class="site-footer"/.test(h)) return 'SKIP (no header/footer)';
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
  h = h.replace(/\s*<\/head>/, `\n  ${head}\n</head>`);

  // body class
  const cls = bodyClass(rel, sec);
  h = h.replace(/<body([^>]*)>/, (m, attrs) => `<body${attrs.replace(/\s*class="[^"]*"/, '')} class="${cls}">`);

  // header, search overlay, footer, back-to-top
  let ok;
  [h] = replaceElement(h, /<div id="fpSearchOverlay"[^>]*>/, 'div', '');
  [h, ok] = replaceElement(h, /<header class="site-header">/, 'header', header(sec));
  if (!ok) throw new Error('header not found');
  [h] = replaceElement(h, /<button class="back-to-top"[^>]*>/, 'button', '');
  [h, ok] = replaceElement(h, /<footer class="site-footer"[^>]*>/, 'footer', FOOTER);
  if (!ok) throw new Error('footer not found');
  h = h.replace(/\s*(<header class="site-header">)/, `\n\n  ${SEARCH}\n\n  $1`);
  if (!/class="skip-link"/.test(h)) h = h.replace(/(<body[^>]*>)/, '$1\n  <a href="#main" class="skip-link">Skip to content</a>');

  // scripts
  h = h.replace(/\s*<script>(?:(?!<\/script>)[\s\S])*?(?:getElementById\('menuBtn'\)|getElementById\('backToTop'\)|getElementById\("backToTop"\))[\s\S]*?<\/script>/g, '');
  h = h.replace(/\s*<script src="[^"]*(?:site-search|card-dates)\.js[^"]*"[^>]*><\/script>/g, '');
  h = h.replace(/\s*<script src="\/assets\/fp\.js[^"]*"[^>]*><\/script>/g, '');
  h = h.replace(/\s*<\/body>/, `\n  <script src="/assets/fp.js?v=${V}" defer></script>\n</body>`);

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
