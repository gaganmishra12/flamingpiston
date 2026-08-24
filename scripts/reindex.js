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
    const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
    return `  <url>\n    <loc>${BASE_URL}${loc}</loc>${lastmodLine}\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
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

  console.log('\nDone. All index files regenerated.');
}

main();
