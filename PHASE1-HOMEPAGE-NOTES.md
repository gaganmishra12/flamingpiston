# FlamingPiston — Phase 1 homepage redesign (26 Nov 2026, v2: built to the "Homepage Build Prompt" brief)

Status: **built and browser-tested locally, waiting for your approval.** Nothing is committed, pushed or live. Built on branch `redesign/premium-editorial`, on top of `main` at 1b18b93 (25 Nov).

## 1. How to preview locally
1. Copy the files from this zip into your `flamingpiston` repo folder (same paths). Nothing needs deleting.
2. In that folder run `python3 -m http.server 8000` (Windows: `python -m http.server 8000`).
3. Open http://localhost:8000/ (it must be served — opening index.html as a file breaks the /-rooted links).

## 2. Codebase audit (summary)
- Static HTML/CSS/JS, deployed GitHub → Hostinger. 94 HTML pages; 73 dated articles (36 news, 13 reviews/briefs, 14 guides/explainers, 10 comparisons).
- Shared styling `assets/fp.css`, behaviour `assets/fp.js` (menu, search, hero carousel, filters, card dates). Self-hosted Familjen Grotesk / Inter / IBM Plex Mono in `assets/fonts/`. Logo SVGs in `assets/brand/`.
- Publishing scripts: `reindex.js` (search index, sitemap, RSS), `build-lists.js` (homepage + listing pages + author page, between `<!-- NAME:START/END -->` markers), `apply-shell.js` (head block, header, footer on every page), `make-thumbs.py`.
- Photography finding: almost every article's og:image / hero is a branded graphic with the headline baked in. Clean photos exist mainly as in-article section images. This is why the homepage now uses dedicated crops (section 5).
- No calculators, no Cars directory and no price database exist yet.

## 3. Files changed
Changed: `index.html`, `scripts/build-lists.js`, `scripts/apply-shell.js`, `scripts/reindex.js` (adds /tools.html to the sitemap), `sitemap.xml`
New: `tools.html`, `assets/fp-tools.js`, `assets/fp-home.css`, `assets/fp-home.js`, `assets/fonts/familjen-grotesk-latin-700-italic.woff2` (OFL, from Fontsource), `data/homepage.json`, `data/cars.json`, `data/home-images.json` (generated), `scripts/make-home-images.py`, `images/home/*.webp` (29 crops; only 1–3 load up front)
Not touched: every article page, listing pages, author page, about, feed.xml, search-index.json, fp.css, fp.js. Running all four scripts leaves them byte-identical.

## 4. What was built (in brief order)
1. **Header (homepage only for now):** one row. Logo with "Cars / Reviews / Buying Guides / Explainers" under it, centred nav (Home, News, Cars ▾, Reviews, Compare, Buying Guides, Tools ▾, Car Culture) with ember underline, search far right. No hamburger on desktop; below 1280px the nav folds into a menu drawer.
2. **Hero:** 67/33 grid, 360px. Lead = Thar Roxx 4x4 buyer's brief (pinned), then GLC Electric and Seltos briefs. Labelled "Buyer's Brief", not "First Drive". Dots + pause, arrow keys, swipe, pauses on hover/focus, never rotates with reduced motion. Three supporting stories on the right update automatically (newest News, newest Brief/Comparison, newest Guide).
3. **Find Your Next Car:** dark strip, inline budget/body/fuel filters + Find Cars. Searches the 13 cars with published buyer's briefs (`data/cars.json`), honest empty state, shareable filter links.
4. **Featured Cars:** Brezza, Kylaq, Seltos, Syros EV with dated price ranges from each brief.
5. **Featured Comparison + Latest News:** Sierra EV vs BE 6 (HTML over two clean crops, diagonal ember split) next to the 4 newest news stories.
6. **New & Upcoming Cars:** Denza D9 (launched at ₹90 lakh, 18 Nov 2026) and Hyundai Tucson (India launch expected in 2027, marked not confirmed). Both lines come from the linked FlamingPiston stories; set in `data/homepage.json` → `newUpcoming`.
7. **Latest Reviews:** newest buyer's brief not already shown that has a clean photo (now: Skoda Kylaq).
8. **Buying Tools:** four cards linking to the new **/tools.html**, which has working EMI, fuel cost, petrol vs CNG and five-year ownership cost calculators. They only do arithmetic on what the reader types; every box starts with a labelled example value, each tool shows its formula and what it leaves out (e.g. depreciation).
9. **Buying & Ownership Guides:** 3 newest guides with clean photos (now: safest cars under ₹10 lakh, Brezza petrol vs CNG, festive discounts).
10. **Car Culture banner:** links to /car-culture.html (image credited as AI illustration).
11. **Footer (homepage):** logo, one-line description, Instagram, four columns (Sections, Company, Editorial, Legal), copyright. Tools added to Sections.

## 5. New publishing step for homepage images
Homepage photos come only from `data/homepage.json` crops. After publishing:
```
python3 scripts/make-home-images.py   # only if you added/changed a crop
node scripts/reindex.js
node scripts/build-lists.js
```
`build-lists.js` prints a Tip naming any homepage story without a clean image; it shows a plain brand tile until you add a `"thumb"` crop (box = left, top, right, bottom as fractions of the photo).

## 6. Missing / unsuitable photography (please supply)
1. **Wide hero photos (≥1600×900, no text):** official Mahindra Thar Roxx photo with landscape and room on the left; same for any future lead story. Current hero crops come from FlamingPiston AI illustrations.
2. **Clean (text-free) versions of the news graphics:** XEV 9S, Sierra EV, Yangwang Altior, Honda City offers, Denza D9. Current homepage thumbs are tight crops of the branded graphics, so some trim a roof or nose.
3. **Featured-car photos composed for a 3:1 crop** (side-on or 3/4 with space around the car). Cards use 2.4:1 so no car gets cut.
4. **Provenance check:** the Kylaq and Seltos exterior photos and the Thar/Seltos/GLC hero art — please confirm which are official images and which are AI illustrations; the homepage currently labels AI where the article caption says so.

## 7. Deferred (not built)
Cars directory, model pages, a full upcoming-cars directory, interactive comparison engine, the new header/footer on the rest of the site (one switch in `apply-shell.js` — Phase 2; /tools.html still uses the current site header), backend/database.

## 8. Known visual differences from the reference
- Real logo/wordmark is used, so it is less slanted/condensed than the mock.
- Hero image is a crop faded into petrol on the left rather than a full-bleed photo (no suitable wide photo exists).
- Headlines and stories are real FlamingPiston content, so line counts and cars differ from the mock (Denza D9 instead of Tata Sierra, Kylaq review, real guides).
- Featured card images are 2.4:1 (reference ≈3:1) to avoid cutting cars.
- The finder shows inline results instead of jumping to a Cars directory (none exists yet).
- Between 1024 and 1279px the nav sits in the menu drawer (eight items plus the logo don't fit on one row there).

## 9. Browser testing (Chrome, 100% zoom)
- Viewports 2560, 1920, 1536, 1440, 1280, 1024, 768, 390: no horizontal overflow, no missing files, no JS errors (only the analytics request is blocked in the test sandbox).
- Content stops at 1440px and stays centred at 1920/2560.
- 24/24 interaction checks pass: dropdowns (click, hover, keyboard, Esc), search, no desktop hamburger, drawer (focus, Esc), carousel (dots, arrows, pause, reduced motion), finder (results, empty state, clear, shared link), calculators (EMI ₹8 lakh @ 9% for 60 months = ₹16,607; 0% case; fuel cost), every local link on the homepage and tools page returns 200.
- Homepage: CLS 0; LCP element is the hero image; ~0.9 MB loaded on desktop, ~0.8 MB on mobile.

## 10. URLs & SEO
All article URLs, canonicals, titles, descriptions, structured data, RSS, search index and analytics are unchanged. sitemap.xml only gains /tools.html (plus the usual lastmod dates reindex.js writes). The homepage `<head>` gains only the italic font preload and `fp-home.css`. The only SEO-visible homepage change is the hidden `<h1>` text, now "FlamingPiston: car news, buyer's briefs, comparisons and buying guides".

## 11. Excluded from the homepage
`data/homepage.json` → `exclude` keeps the Innova Hycross "buy now or wait" guide and teaser off the homepage: both were written before the 25 Nov launch and need the accuracy-gate rewrite first.
