#!/usr/bin/env node
/*
 * article-images.js — clean, text-free photos on article pages (Phase 2C).
 *
 * 1. Hero: <img class="hero-image"> points at the clean "article" crop made by make-home-images.py
 *    (data/home-images.json "<url>#article", 16:9, up to 1800px) with a srcset, when that crop is
 *    sharp enough ("hero": true = at least 1000px wide or 90% of the source width).
 * 2. Read Next cards: the image inside each hand-picked card (<a class="card-media">) points at the
 *    linked article's clean 16:9 thumbnail ("#thumb@16x9", plus "#story" in the srcset).
 *
 * Only <img> attributes change; no text anywhere is added, removed or edited. The original image is
 * kept in data-original-src / data-original-size, so the change is reversible: when a crop is removed
 * or no longer qualifies, the next run puts the original back. Idempotent: a second run changes nothing.
 * Alt text: the crop spec's "alt" (data/homepage.json) when it has one, else the original alt is kept.
 *
 * Usage (site root):  node scripts/article-images.js     (run by scripts/update-site.sh)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CROPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/home-images.json'), 'utf8'));
const SPECS = (JSON.parse(fs.readFileSync(path.join(ROOT, 'data/homepage.json'), 'utf8')).images) || {};

const SKIP = new Set(['docs', 'drafts', 'templates', 'node_modules', 'scripts', 'data', 'assets', 'images', 'js', '.git']);
function pages(dir = ROOT, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) pages(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/'));
  }
  return out;
}

const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
function setAttr(tag, name, value) {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  if (value === null) return tag.replace(re, '');
  return re.test(tag) ? tag.replace(re, ` ${name}="${value}"`) : tag.replace(/\s*\/?>$/, m => ` ${name}="${value}"${m}`);
}
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* page path → site URL key used by the crop manifest ("reviews/x/", "news-y.html") */
const keyOf = rel => rel.replace(/(^|\/)index\.html$/, '$1');
function hrefKey(pageRel, href) {
  if (!href || /^(https?:|mailto:|#)/.test(href)) return null;
  const clean = href.split('#')[0].split('?')[0];
  const abs = clean.startsWith('/') ? clean.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(pageRel), clean));
  return keyOf(abs.replace(/^\.\//, '')) + (clean.endsWith('/') && !abs.endsWith('/') ? '/' : '');
}

/* rewrite one <img> to the clean crop (or back to its original when crop is null) */
function swap(tag, crop, srcset, sizes, alt, extra = {}) {
  const origSrc = attr(tag, 'data-original-src');
  if (!crop) {                                   // put the original back if this img was swapped before
    if (!origSrc) return tag;
    const [w, h] = (attr(tag, 'data-original-size') || 'x').split('x');
    let t = setAttr(tag, 'src', origSrc);
    t = setAttr(t, 'srcset', null); t = setAttr(t, 'sizes', null);
    if (w) t = setAttr(t, 'width', w); if (h) t = setAttr(t, 'height', h);
    const oa = attr(tag, 'data-original-alt'); if (oa !== null) t = setAttr(t, 'alt', oa);
    for (const k of ['data-original-src', 'data-original-size', 'data-original-alt']) t = setAttr(t, k, null);
    return t;
  }
  let t = tag;
  if (!origSrc) {                                // first swap: remember the original
    t = setAttr(t, 'data-original-src', attr(tag, 'src'));
    t = setAttr(t, 'data-original-size', `${attr(tag, 'width') || ''}x${attr(tag, 'height') || ''}`);
  }
  t = setAttr(t, 'src', '/' + crop.file);
  t = setAttr(t, 'srcset', srcset);
  t = setAttr(t, 'sizes', sizes);
  t = setAttr(t, 'width', String(crop.w));
  t = setAttr(t, 'height', String(crop.h));
  if (alt) {
    if (attr(t, 'data-original-alt') === null) t = setAttr(t, 'data-original-alt', attr(tag, 'alt') || '');
    t = setAttr(t, 'alt', esc(alt));
  } else if (attr(t, 'data-original-alt') !== null) {
    t = setAttr(setAttr(t, 'alt', attr(t, 'data-original-alt')), 'data-original-alt', null);
  }
  for (const [k, v] of Object.entries(extra)) t = setAttr(t, k, v);
  return t;
}

function srcsetOf(entries) {
  const seen = new Set();
  return entries.filter(Boolean).sort((a, b) => a.w - b.w)
    .filter(c => !seen.has(c.w) && seen.add(c.w)).map(c => `/${c.file} ${c.w}w`).join(', ');
}

let changed = 0, heroes = 0, cards = 0;
for (const rel of pages()) {
  const file = path.join(ROOT, rel);
  const before = fs.readFileSync(file, 'utf8');
  if (!/<body class="article"/.test(before)) continue;
  const key = keyOf(rel);
  let h = before;

  // 1. hero
  h = h.replace(/<img class="hero-image"[^>]*>/, tag => {
    const c = CROPS[`${key}#article`];
    const ok = c && c.hero;
    if (ok) heroes++;
    const alt = ((SPECS[key] || {}).thumb || {}).alt;
    return swap(tag, ok ? c : null,
      ok ? srcsetOf([CROPS[`${key}#thumb@16x9`], CROPS[`${key}#story`], c]) : null,
      '(max-width: 1180px) 100vw, 1140px', ok ? alt : null, ok ? { fetchpriority: 'high' } : {});
  });

  // 2. Read Next card images
  h = h.replace(/(<a\s[^>]*class="card-media"[^>]*>)([\s\S]*?)(<\/a>)/g, (m, open, inner, close) => {
    const k = hrefKey(rel, attr(open, 'href'));
    const c = k && CROPS[`${k}#thumb@16x9`];
    if (c) cards++;
    const alt = k && ((SPECS[k] || {}).thumb || {}).alt;
    const inner2 = inner.replace(/<img\b[^>]*>/, tag => swap(tag, c || null,
      c ? srcsetOf([c, CROPS[`${k}#story`]]) : null, '(max-width: 599px) 100vw, 360px', c ? alt : null));
    return open + inner2 + close;
  });

  if (h !== before) { fs.writeFileSync(file, h); changed++; }
}
console.log(`Article images: ${heroes} clean heroes, ${cards} clean Read Next cards; ${changed} pages updated.`);
