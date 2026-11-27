#!/usr/bin/env node
//
// reindex.js — Scans all article HTML files, extracts metadata,
// and regenerates sitemap.xml, search-index.json, and feed.xml.
//
// Usage:  node scripts/reindex.js
// Run from the site root (the folder containing index.html).

const fs = require('fs');
const path = require('path');
const ED = require('./editorial.js');

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

// Drafts (data/articles.json status "draft") and articles whose datePublished is still in the future are
// left out of the sitemap, feed and search index until a rebuild after their publish time.
const REG = ED.loadRegistry();
function isLiveArticle(url, html) {
  const iso = (html.match(/"datePublished":\s*"(\d{4}-\d{2}-\d{2}[^"]*)"/) || [])[1];
  if (!iso) return true;   // pages without a publish date keep their existing behaviour
  return ED.isLive(ED.entryFor(REG, url), iso);
}

function discoverArticles() {
  const articles = [];

  const redirected = new Set();
  try {
    for (const line of readFile('.htaccess').split('\n')) {
      const m = line.match(/^\s*Redirect\s+301\s+(\S+)/i);
      if (m) redirected.add(m[1]);
    }
  } catch {}

  // News articles: news-*.html in root (skip review-template, skip noindex stubs)
  const rootFiles = fs.readdirSync(SITE_ROOT);
  for (const f of rootFiles) {
    if (!f.startsWith('news-') || !f.endsWith('.html')) continue;
    if (redirected.has(`/${f}`)) continue;
    const html = readFile(f);
    if (hasNoIndex(html)) continue;
    const canonical = extractCanonical(html);
    if (!canonical) continue;
    if (!isLiveArticle(f, html)) continue;
    articles.push({ file: f, html, canonical, kind: 'news' });
  }

  // Folder articles: reviews/*, guides/*, comparisons/*, articles/* (each slug/index.html).
  // Any URL that .htaccess 301-redirects elsewhere is skipped, so leftover
  // duplicate folders can never be re-listed in the sitemap, feed or search.
  for (const section of ['reviews', 'guides', 'comparisons', 'articles']) {
    const sectionDir = path.join(SITE_ROOT, section);
    if (!fs.existsSync(sectionDir)) continue;
    for (const slug of fs.readdirSync(sectionDir)) {
      if (redirected.has(`/${section}/${slug}/`)) continue;
      const indexPath = path.join(section, slug, 'index.html');
      const fullPath = path.join(SITE_ROOT, indexPath);
      if (!fs.existsSync(fullPath)) continue;
      const html = readFile(indexPath);
      if (hasNoIndex(html)) continue;
      const canonical = extractCanonical(html);
      if (!canonical) continue;
      if (!isLiveArticle(`${section}/${slug}/`, html)) continue;

      let kind = 'review';
      if (section === 'comparisons' || slug.includes('-vs-')) kind = 'comparison';
      else if (section === 'guides' || section === 'articles') kind = 'guide';
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
    dateModifiedFull: dateModified,
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

// Newest publish/update date across live articles: used for the listing pages' <lastmod> and the feed's
// lastBuildDate, so re-running the scripts without content changes produces identical files.
function latestChange(articles) {
  return articles.map(a => a.dateModified || a.datePublished).filter(Boolean).sort().pop() || '2026-01-01';
}

// ─── Generate sitemap.xml ───

function generateSitemap(articles) {
  // Static pages with fixed priorities
  const staticPages = [
    { loc: '/', lastmod: latestChange(articles), freq: 'daily', priority: '1.0' },
    { loc: '/guides.html', lastmod: latestChange(articles), freq: 'weekly', priority: '0.8' },
    { loc: '/comparisons.html', lastmod: latestChange(articles), freq: 'weekly', priority: '0.8' },
    { loc: '/reviews.html', lastmod: latestChange(articles), freq: 'daily', priority: '0.9' },
    { loc: '/news.html', lastmod: latestChange(articles), freq: 'daily', priority: '0.7' },
    { loc: '/car-culture.html', lastmod: latestChange(articles), freq: 'weekly', priority: '0.6' },
    { loc: '/tools.html', lastmod: '2026-11-26', freq: 'monthly', priority: '0.6' },
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
    { loc: '/sitemap.html', lastmod: latestChange(articles), freq: 'monthly', priority: '0.2' },
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

  const typeMap = { review: 'brief', news: 'news', comparison: 'comparison', guide: 'guide' };

  return articles.map(a => {
    const existing = existingByUrl[a.urlPath];
    return {
      title: decodeEntities(a.title),
      url: a.urlPath,
      // manual type in the existing index wins — folder path alone can't tell
      // a guide living under /reviews/ from an actual road test
      type: existing?.type || typeMap[a.kind] || a.kind,
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
    .sort((a, b) => (Date.parse(b.datePublishedFull || b.datePublished) - Date.parse(a.datePublishedFull || a.datePublished)) || a.canonical.localeCompare(b.canonical))
    .slice(0, 20);

  const buildDate = new Date(articles.map(a => a.dateModifiedFull || a.dateModified || a.datePublished).filter(Boolean).sort((x, y) => Date.parse(x) - Date.parse(y)).pop() || '2026-01-01').toUTCString();

  const items = sorted.map(a => {
    const pubDate = new Date(a.datePublishedFull || a.datePublished).toUTCString();
    const desc = a.description ? `    <description>${escapeXml(a.description)}</description>\n` : '';
    return `    <item>\n      <title>${escapeXml(a.title)}</title>\n      <link>${a.canonical}</link>\n      <guid>${a.canonical}</guid>\n      <pubDate>${pubDate}</pubDate>\n${desc}    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>FlamingPiston</title>\n    <link>${BASE_URL}/</link>\n    <description>Honest automotive reviews, practical buying advice, and maintenance guides.</description>\n    <language>en-in</language>\n    <lastBuildDate>${buildDate}</lastBuildDate>\n\n${items.join('\n\n')}\n  </channel>\n</rss>\n`;
}

function decodeEntities(s) {
  // Titles and descriptions are scraped out of HTML, so they may already carry
  // entities. Decode first, otherwise escapeXml turns &amp; into &amp;amp;.
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

function escapeXml(s) {
  return decodeEntities(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

  console.log('\nDone. All index files regenerated.');
}

main();
