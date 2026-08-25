#!/usr/bin/env node
//
// reindex.js — Scans all article HTML files, extracts metadata,
// and regenerates sitemap.xml, search-index.json, and feed.xml.
//
// Usage:  node scripts/reindex.js
// Run from the site root (the folder containing index.html).

const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://flamingpiston.com';

// ─── Helpers ───

function readFile(rel) {
  return fs.readFileSync(path.join(SITE_ROOT, rel), 'utf-8');
}

function writeFile(rel, content) {
  fs.writeFileSync(path.join(SITE_ROOT, rel), content, 'utf-8');
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractOG(html, prop) {
  const re = new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*FlamingPiston$/i, '').trim() : null;
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

function hasNoIndex(html) {
  return /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try { blocks.push(JSON.parse(m[1])); } catch {}
  }
  return blocks;
}

function findSchema(blocks, type) {
  return blocks.find(b => b['@type'] === type) || null;
}

// ─── Discover all article files ───

function discoverArticles() {
  const articles = [];

  // News articles: news-*.html in root (skip review-template, skip noindex stubs)
  const rootFiles = fs.readdirSync(SITE_ROOT);
  for (const f of rootFiles) {
    if (!f.startsWith('news-') || !f.endsWith('.html')) continue;
    const html = readFile(f);
    if (hasNoIndex(html)) continue;
    const canonical = extractCanonical(html);
    if (!canonical) continue;
    articles.push({ file: f, html, canonical, kind: 'news' });
  }

  // Reviews/comparisons/guides: reviews/*/index.html
  const reviewsDir = path.join(SITE_ROOT, 'reviews');
  if (fs.existsSync(reviewsDir)) {
    for (const slug of fs.readdirSync(reviewsDir)) {
      const indexPath = path.join('reviews', slug, 'index.html');
      const fullPath = path.join(SITE_ROOT, indexPath);
      if (!fs.existsSync(fullPath)) continue;
      const html = readFile(indexPath);
      if (hasNoIndex(html)) continue;
      const canonical = extractCanonical(html);
      if (!canonical) continue;

      let kind = 'review';
      if (slug.includes('-vs-')) kind = 'comparison';
      else if (slug.includes('mileage') || slug.includes('variants') || slug.includes('automatic') || slug.includes('cng')) kind = 'guide';

      articles.push({ file: indexPath, html, canonical, kind });
    }
  }

  return articles;
}

// ─── Extract article metadata ───

function parseArticle(art) {
  const { html, canonical, kind } = art;
  const schemas = extractJsonLd(html);

  const articleSchema = findSchema(schemas, 'NewsArticle') || findSchema(schemas, 'Article');
  const reviewSchema = findSchema(schemas, 'Review');

  const title = extractTitle(html);
  const description = extractMeta(html, 'description');
  const ogImage = extractOG(html, 'og:image');
  const datePublished = articleSchema?.datePublished || null;
  const dateModified = articleSchema?.dateModified || datePublished;

  // Car name: prefer Review schema itemReviewed, else derive from title
  let car = reviewSchema?.itemReviewed?.name || null;
  if (!car && title) {
    // Try to extract car name from title patterns like "Brand Model ..."
    // For news: "Genesis GV90 Revealed: ..." → "Genesis GV90"
    // For comparisons: "X vs Y: ..." → "X, Y"
    if (kind === 'comparison' && title.includes(' vs ')) {
      const beforeColon = title.split(':')[0];
      car = beforeColon.split(/\s+vs\s+/i).map(s => s.replace(/^\d{4}\s+/, '').trim()).join(', ');
    } else {
      const beforeColon = title.split(':')[0];
      car = beforeColon
        .replace(/^\d{4}\s+/, '')
        .replace(/\s+(Review|Revealed|Launched|Unveiled|Confirmed|Pre-Bookings|Real-World|Variants|Automatic|CNG).*$/i, '')
        .replace(/\s+(Facelift|Second Batch|TDI|LWB)$/i, (m) => m)
        .trim();
    }
  }

  // Tags: derive from car name + slug words
  const tags = [];
  if (car) {
    car.split(/,\s*/).forEach(c => {
      c.split(/\s+/).forEach(w => {
        const lw = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (lw && lw.length > 1 && !tags.includes(lw)) tags.push(lw);
      });
    });
  }

  // URL path relative to site root
  const urlPath = canonical.replace(BASE_URL, '');

  return {
    title,
    description,
    canonical,
    urlPath,
    ogImage,
    datePublished: datePublished ? datePublished.split('T')[0] : null,
    dateModified: dateModified ? dateModified.split('T')[0] : null,
    datePublishedFull: datePublished,
    kind,
    car,
    tags,
  };
}

// ─── Load existing search-index for manual car/tags overrides ───

function loadExistingSearchIndex() {
  try {
    return JSON.parse(readFile('search-index.json'));
  } catch { return []; }
}

// ─── Generate sitemap.xml ───

function generateSitemap(articles) {
  // Static pages with fixed priorities
  const staticPages = [
    { loc: '/', lastmod: new Date().toISOString().split('T')[0], freq: 'daily', priority: '1.0' },
    { loc: '/guides.html', lastmod: new Date().toISOString().split('T')[0], freq: 'weekly', priority: '0.8' },
    { loc: '/comparisons.html', lastmod: new Date().toISOString().split('T')[0], freq: 'weekly', priority: '0.8' },
    { loc: '/reviews.html', lastmod: new Date().toISOString().split('T')[0], freq: 'daily', priority: '0.9' },
    { loc: '/news.html', lastmod: new Date().toISOString().split('T')[0], freq: 'daily', priority: '0.7' },
    { loc: '/about.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.5' },
    { loc: '/contact.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.4' },
    { loc: '/editorial-policy.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/review-methodology.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/fact-checking-policy.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/corrections-policy.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/privacy-policy.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/cookie-policy.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/terms.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/affiliate-disclosure.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/disclaimer.html', lastmod: '2026-08-04', freq: 'yearly', priority: '0.3' },
    { loc: '/author-gagan-mishra.html', lastmod: '2026-08-05', freq: 'monthly', priority: '0.5' },
    { loc: '/sitemap.html', lastmod: new Date().toISOString().split('T')[0], freq: 'monthly', priority: '0.2' },
  ];

  // Sort articles: reviews first (higher priority), then news
  const reviewArticles = articles.filter(a => a.kind === 'review');
  const guideArticles = articles.filter(a => a.kind === 'guide');
  const compArticles = articles.filter(a => a.kind === 'comparison');
  const newsArticles = articles.filter(a => a.kind === 'news');

  function urlEntry(loc, lastmod, freq, priority) {
    return `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  }

  const entries = [];
  for (const p of staticPages) entries.push(urlEntry(p.loc, p.lastmod, p.freq, p.priority));
  for (const a of reviewArticles) entries.push(urlEntry(a.urlPath, a.dateModified || a.datePublished, 'monthly', '0.8'));
  for (const a of guideArticles) entries.push(urlEntry(a.urlPath, a.dateModified || a.datePublished, 'monthly', '0.7'));
  for (const a of compArticles) entries.push(urlEntry(a.urlPath, a.dateModified || a.datePublished, 'monthly', '0.7'));
  for (const a of newsArticles) entries.push(urlEntry(a.urlPath, a.dateModified || a.datePublished, 'weekly', '0.6'));

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

// ─── Generate search-index.json ───

function generateSearchIndex(articles, existingIndex) {
  const existingByUrl = {};
  for (const e of existingIndex) existingByUrl[e.url] = e;

  const typeMap = { review: 'review', news: 'news', comparison: 'comparison', guide: 'guide' };

  return articles.map(a => {
    const existing = existingByUrl[a.urlPath];
    return {
      title: a.title,
      url: a.urlPath,
      type: typeMap[a.kind] || a.kind,
      car: existing?.car || a.car || '',
      tags: existing?.tags || a.tags || [],
    };
  });
}

// ─── Generate feed.xml ───

function generateFeed(articles) {
  // Sort by date descending, take the 20 most recent
  const sorted = [...articles]
    .filter(a => a.datePublished)
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
    .slice(0, 20);

  const now = new Date();
  const buildDate = now.toUTCString();

  const items = sorted.map(a => {
    const pubDate = new Date(a.datePublishedFull || a.datePublished).toUTCString();
    const desc = a.description ? `    <description>${escapeXml(a.description)}</description>\n` : '';
    return `    <item>\n      <title>${escapeXml(a.title)}</title>\n      <link>${a.canonical}</link>\n      <guid>${a.canonical}</guid>\n      <pubDate>${pubDate}</pubDate>\n${desc}    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>FlamingPiston</title>\n    <link>${BASE_URL}/</link>\n    <description>Honest automotive reviews, practical buying advice, and maintenance guides.</description>\n    <language>en-in</language>\n    <lastBuildDate>${buildDate}</lastBuildDate>\n\n${items.join('\n\n')}\n  </channel>\n</rss>\n`;
}

// ─── Generate sitemap.html (human-readable) ───

// Turn a full <title> into a short sitemap label.
// Strips the "| FlamingPiston" / "- FlamingPiston" suffix and trims to the
// part before the first colon, then re-adds a "(2026)" year tag if the title had one.
function deriveSitemapLabel(a) {
  let t = (a.title || a.urlPath).replace(/\s*[|\-–]\s*FlamingPiston\s*$/i, '').trim();
  return t;
}

// Read the current sitemap.html (if present) and map urlPath -> existing <li> label,
// so hand-curated link text is preserved and only new URLs get an auto-derived label.
function loadExistingSitemapLabels() {
  const map = {};
  try {
    const html = readFile('sitemap.html');
    const re = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      map[m[1]] = m[2];
    }
  } catch { /* no existing sitemap.html yet */ }
  return map;
}

function generateSitemapHtml(articles) {
  const existingLabels = loadExistingSitemapLabels();

  // Bucket articles by section. Reviews section holds both reviews and guides
  // (matching the existing sitemap.html layout); comparisons and news separate.
  const reviews = [];
  const comparisons = [];
  const news = [];
  for (const a of articles) {
    if (a.kind === 'comparison') comparisons.push(a);
    else if (a.kind === 'news') news.push(a);
    else reviews.push(a); // review + guide
  }

  // Newest first within each section (by publish date, falling back to title)
  const byDateDesc = (a, b) =>
    (b.datePublished || '').localeCompare(a.datePublished || '') ||
    (a.title || '').localeCompare(b.title || '');
  reviews.sort(byDateDesc);
  comparisons.sort(byDateDesc);
  news.sort(byDateDesc);

  // Build a <li> using the curated label if one exists for this URL, else derive.
  const li = (a) => {
    // sitemap.html uses root-relative paths WITHOUT a leading slash for reviews
    // (e.g. "reviews/slug/") and bare filenames for news (e.g. "news-x.html").
    const href = a.urlPath.replace(/^\//, '');
    const label = existingLabels[href] || escapeHtml(deriveSitemapLabel(a));
    return `      <li><a href="${href}">${label}</a></li>`;
  };

  const reviewsList = reviews.map(li).join('\n');
  const comparisonsList = comparisons.map(li).join('\n');
  const newsList = news.map(li).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="images/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="images/apple-touch-icon.png">
  <link rel="icon" href="favicon.ico">
  <title>Sitemap - FlamingPiston</title>
  <script async src="/js/analytics.js"></script>
  <meta name="description" content="A full list of pages on FlamingPiston.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css?v=9">
  <link rel="canonical" href="https://flamingpiston.com/sitemap.html">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Sitemap - FlamingPiston">
  <meta property="og:description" content="A full list of pages on FlamingPiston.">
  <meta property="og:url" content="https://flamingpiston.com/sitemap.html">
  <meta property="og:image" content="https://flamingpiston.com/images/logo.png">
  <meta property="og:site_name" content="FlamingPiston">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Sitemap - FlamingPiston">
  <meta name="twitter:description" content="A full list of pages on FlamingPiston.">
  <meta name="twitter:image" content="https://flamingpiston.com/images/logo.png">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://flamingpiston.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Sitemap",
      "item": "https://flamingpiston.com/sitemap.html"
    }
  ]
}
  </script>
  <link rel="stylesheet" href="site-search.css">
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  <div id="fpSearchOverlay" class="fp-search-overlay">
    <div class="fp-search-panel">
      <div class="fp-search-input-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input id="fpSearchInput" class="fp-search-input" type="text" placeholder="Search by car name..." autocomplete="off">
        <button id="fpSearchClose" class="fp-search-close">ESC</button>
      </div>
      <div id="fpSearchResults" class="fp-search-results"></div>
    </div>
  </div>



  <header class="site-header">
    <div class="wrap navbar">
      <a href="/" class="logo">
        <img src="images/logo.png" alt="FlamingPiston" class="logo-full">
      </a>
      <div class="nav-collapse" id="navCollapse">
        <nav class="main-nav">
        <ul>
        <li><a href="/">Home</a></li>
        <li><a href="reviews.html">Reviews</a></li>
        <li><a href="news.html">News</a></li>
        <li><a href="guides.html">Guides</a></li>
        <li><a href="comparisons.html">Comparisons</a></li>
        <li><a href="about.html">About</a></li>
        </ul>
      </nav>
      </div>
            <button id="fpSearchTrigger" class="fp-search-trigger" aria-label="Search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
      <button class="menu-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false" aria-controls="navCollapse">
        <svg class="icon-menu" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#18140F" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg><svg class="icon-close" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#18140F" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  </header>

  <main class="content" id="main">
    <h1>Sitemap</h1>

    <h2>Main</h2>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="reviews.html">Reviews</a></li>
      <li><a href="news.html">News</a></li>
        <li><a href="guides.html">Guides</a></li>
        <li><a href="comparisons.html">Comparisons</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>

    <h2>Reviews</h2>
    <ul>
${reviewsList}
    </ul>

    <h2>Comparisons</h2>
    <ul>
${comparisonsList}
    </ul>

    <h2>News</h2>
    <ul>
${newsList}
    </ul>

    <h2>Authors</h2>
    <ul>
      <li><a href="author-gagan-mishra.html">Gagan Mishra</a></li>
    </ul>

    <h2>Trust & Editorial</h2>
    <ul>
      <li><a href="editorial-policy.html">Editorial Policy</a></li>
      <li><a href="review-methodology.html">Review Methodology</a></li>
      <li><a href="fact-checking-policy.html">Fact-Checking Policy</a></li>
      <li><a href="corrections-policy.html">Corrections Policy</a></li>
    </ul>

    <h2>Legal</h2>
    <ul>
      <li><a href="privacy-policy.html">Privacy Policy</a></li>
      <li><a href="cookie-policy.html">Cookie Policy</a></li>
      <li><a href="terms.html">Terms of Use</a></li>
      <li><a href="affiliate-disclosure.html">Affiliate Disclosure</a></li>
      <li><a href="disclaimer.html">Disclaimer</a></li>
    </ul>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <a href="/" class="logo footer-logo">
            <img src="images/logo-footer.png" alt="FlamingPiston" class="logo-full">
          </a>
          <p>Honest automotive reviews, practical buying advice, and maintenance guides — everything you need before buying your next vehicle.</p>
          <div class="foot-social">
            <a href="https://www.instagram.com/flamingpiston_in/" target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="sitemap.html">Sitemap</a></li>
          </ul>
        </div>

        <div>
          <h4>Editorial</h4>
          <ul>
            <li><a href="editorial-policy.html">Editorial Policy</a></li>
            <li><a href="review-methodology.html">Review Methodology</a></li>
            <li><a href="fact-checking-policy.html">Fact-Checking Policy</a></li>
            <li><a href="corrections-policy.html">Corrections Policy</a></li>
          </ul>
        </div>

        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="privacy-policy.html">Privacy Policy</a></li>
            <li><a href="cookie-policy.html">Cookie Policy</a></li>
            <li><a href="terms.html">Terms of Use</a></li>
            <li><a href="affiliate-disclosure.html">Affiliate Disclosure</a></li>
            <li><a href="disclaimer.html">Disclaimer</a></li>
          </ul>
        </div>
      </div>

      <div class="foot-bottom">
        <span>&copy; 2026 FlamingPiston. All rights reserved.</span>
        <span><a href="sitemap.html">Sitemap</a></span>
      </div>
    </div>
  </footer>


  <button class="back-to-top" id="backToTop" aria-label="Back to top">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
  </button>

  <script>
    (function(){
      var btn = document.getElementById('menuBtn');
      var nav = document.getElementById('navCollapse');
      if(!btn || !nav) return;
      btn.addEventListener('click', function(){
        var open = nav.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.classList.toggle('is-active', open);
      });
      nav.querySelectorAll('a').forEach(function(a){
        a.addEventListener('click', function(){
          nav.classList.remove('is-open');
          btn.setAttribute('aria-expanded','false');
          btn.classList.remove('is-active');
        });
      });
    })();
  </script>
  <script>
    (function(){
      var topBtn = document.getElementById('backToTop');
      if(!topBtn) return;
      window.addEventListener('scroll', function(){
        topBtn.classList.toggle('is-visible', window.scrollY > 500);
      });
      topBtn.addEventListener('click', function(){
        window.scrollTo({top:0, behavior:'smooth'});
      });
    })();
  </script>
  <script src="site-search.js"></script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Main ───

function main() {
  console.log('Scanning article files...');
  const rawArticles = discoverArticles();
  console.log(`Found ${rawArticles.length} articles.`);

  const articles = rawArticles.map(parseArticle);

  // Load existing search-index to preserve manually-set car/tags
  const existingIndex = loadExistingSearchIndex();

  // Generate outputs
  const sitemap = generateSitemap(articles);
  const searchIndex = generateSearchIndex(articles, existingIndex);
  const feed = generateFeed(articles);

  writeFile('sitemap.xml', sitemap);
  console.log(`  sitemap.xml — ${articles.length} article URLs + static pages`);

  writeFile('search-index.json', JSON.stringify(searchIndex, null, 2) + '\n');
  console.log(`  search-index.json — ${searchIndex.length} entries`);

  writeFile('feed.xml', feed);
  console.log(`  feed.xml — ${Math.min(articles.length, 20)} most recent items`);

  const sitemapHtml = generateSitemapHtml(articles);
  writeFile('sitemap.html', sitemapHtml);
  console.log(`  sitemap.html — ${articles.length} article links (human-readable)`);

  console.log('\nDone. All index files regenerated.');
}

main();
