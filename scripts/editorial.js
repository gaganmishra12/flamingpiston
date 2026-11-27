// editorial.js — shared editorial rules for the publishing scripts (build-lists.js, reindex.js).
//
// data/articles.json is the editorial registry: one entry per article URL (as in the sitemap, no leading slash)
// holding the fields that are not in the article HTML:
//
//   id        permanent article ID (set once; never change it, even if the URL ever changes)
//   priority  1 = major editorial feature (may lead the homepage)
//             2 = featured story (supporting stories and featured modules)
//             3 = regular story (feeds and category pages) — the default
//   hero      true / false: may this story be the homepage lead? Default: true for priority 1, else false
//   status    publication status (who may read it):
//             "published" (default) = approved and public
//             "draft"     = work in progress: not public
//             "review"    = written, waiting for fact-check / Gagan's approval: not public ("unverified" = same)
//             Homepage promotion is separate: a published story can be kept off the homepage with
//             data/homepage.json "exclude" (and its priority decides what it may be featured as).
//   category  optional editorial category override: "News" | "Reviews" | "Comparisons" | "Buying Guides" | "Car Culture"
//   subtype   optional, e.g. "launch", "report", "explainer", "ownership"
//   vehicles  optional list of vehicle IDs from data/cars.json
//
// Everything else (title, dates, description, images, credit) is read from the article HTML itself, so the
// article stays the single source of truth for what readers and search engines see.
//
// An article is LIVE (eligible to appear anywhere) only when it is published, not noindex, not 301-redirected,
// and its JSON-LD datePublished is not in the future at build time. Any article file that sits at a public URL but is
// not live gets a 404 rule in .htaccess (build-lists.js writes the FP:UNPUBLISHED block), so it cannot be opened by
// its direct URL either. Pending revisions of published articles live in drafts/ (blocked as a whole). Build time is now, or FP_BUILD_DATE if set
// (used by the tests to simulate a later rebuild). Static pages change only when the site is rebuilt and deployed.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'data', 'articles.json');

const buildNow = () => (process.env.FP_BUILD_DATE ? new Date(process.env.FP_BUILD_DATE) : new Date());
// Calendar date in India for "start"/"end" comparisons (YYYY-MM-DD).
const istDate = (d = buildNow()) => new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);

function loadRegistry() {
  try { return JSON.parse(fs.readFileSync(REGISTRY, 'utf-8')); } catch (e) { return { articles: {} }; }
}
function saveRegistry(reg) {
  // One article per line, sorted by URL, so the file stays easy to read and to diff.
  const keys = Object.keys(reg.articles).sort();
  const head = Object.entries(reg).filter(([k]) => k !== 'articles').map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  const rows = keys.map((k, i) => `    ${JSON.stringify(k)}: ${JSON.stringify(reg.articles[k]).replace(/":/g, '": ').replace(/,"/g, ', "')}${i < keys.length - 1 ? ',' : ''}`);
  const text = `{\n${head.join('\n')}\n  "articles": {\n${rows.join('\n')}\n  }\n}\n`;
  const old = fs.existsSync(REGISTRY) ? fs.readFileSync(REGISTRY, 'utf-8') : '';
  if (old !== text) fs.writeFileSync(REGISTRY, text, 'utf-8');
  return old !== text;
}

const slugId = (url) => url.replace(/\/$/, '').replace(/\.html$/, '').split('/').pop();

function entryFor(reg, url) {
  const e = reg.articles[url] || {};
  const priority = [1, 2, 3].includes(e.priority) ? e.priority : 3;
  return {
    id: e.id || slugId(url),
    priority,
    hero: typeof e.hero === 'boolean' ? e.hero : priority === 1,
    status: e.status === 'unverified' ? 'review' : (e.status || 'published'),
    category: e.category || '',
    subtype: e.subtype || '',
    vehicles: e.vehicles || [],
  };
}

// published timestamp (ms) from a JSON-LD datePublished; date-only values count as midnight IST.
function publishedMs(iso) {
  if (!iso) return NaN;
  return Date.parse(/T/.test(iso) ? iso : `${iso}T00:00:00+05:30`);
}

function isLive(entry, iso, now = buildNow()) {
  return entry.status === 'published' && publishedMs(iso) <= now.getTime();
}

// .htaccess rule that answers 404 for an article URL (as in the sitemap: "news-x.html" or "reviews/x/").
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&');
function blockRule(url) {
  return url.endsWith('/') ? `RedirectMatch 404 ^/${reEsc(url.slice(0, -1))}(/|/index\\.html)?$` : `RedirectMatch 404 ^/${reEsc(url)}$`;
}

module.exports = { ROOT, loadRegistry, saveRegistry, entryFor, slugId, publishedMs, isLive, buildNow, istDate, blockRule };
