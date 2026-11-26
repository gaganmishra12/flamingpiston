# Phase 2A — Shared Design Foundation: Implementation Report

*26 Nov 2026 · branch `redesign/premium-editorial` · **not committed, pushed or deployed** · awaiting Gagan's review*

## 1. Checkpoint

- Git: branch `redesign/premium-editorial`, base `main` 1b18b93 (25 Nov). GitHub `main` unchanged; **Phase 1 is not committed, pushed or deployed**.
- The approved Phase 1 build was verified intact (checksums identical to the approved build) and backed up in full before any change (`phase1-approved-20261126-1314.tgz`, outside the repo).
- Baselines captured before changes: homepage at 8 viewports (deterministic, re-run twice with 0 px difference), 17 other page types at 1440/768/390, and an SEO/content fingerprint of all 94 public pages.

## 2. What was implemented (approved tasks 1–11)

| # | Task | Implementation |
|---|---|---|
| 1 | Promote homepage colour tokens | `--ember-strong`, `--ember-label`, `--petrol-panel`, `--field` moved to `fp.css :root`; new tokens `--ember-strong-hover`, `--card-surface`, `--card-border`, `--on-dark-dek` replace the identical literals in `fp-home.css` |
| 2 | Shared 1440px width system | `--content-max-width`, `--page-gutter`, `--section-gap`, `--card-gap` and `.fp-container` in `fp.css`; `.wrap` now uses the same container (was 1280px + 4vw gutter); `--max` removed. Article 720px reading column, 1120px wide elements, calculator and policy widths unchanged |
| 3 | Masthead → global header | `header()` in `apply-shell.js` is the approved masthead for every page; CSS moved to `fp.css` §5b |
| 4 | Footer → global footer | `FOOTER` in `apply-shell.js` is the approved homepage footer for every page; its 300px description width and 1440px container moved to `fp.css` |
| 5 | `apply-shell.js` | One header + one footer for all 95 pages (94 public + template); active item from editorial type (`sectionOf()`), Tools dropdown marked on `tools.html`; homepage-only assets limited to the homepage; versions bumped to `20261126b` |
| 6 | JS to global layer | Dropdowns and drawer moved from `fp-home.js` to `fp.js` §1 (variables renamed to avoid a clash with the search code); `fp-home.js` keeps only the carousel and finder |
| 7 | Breakpoints | Masthead (drawer ≤1279px, 60px ≤767px) and footer use the homepage values on every page; `--nav-h` 60px moved from ≤899px to ≤767px to match the masthead. Content breakpoints left for 2B/2C |
| 8 | Tools page | Global shell applied; one style fix: removed the page's extra `scroll-margin-top` so `/tools.html#cng` etc. land just below the masthead (was 174px down, now 84px) |
| 9 | Legacy code | Removed after rule-level reference checks: 176 dead rules from `fp.css` (old header, previous homepage, previous hero carousel + `heroFill`, 3 leftovers), 1 from `fp-home.css`, old menu + old carousel + `#latestReviewsRow` sorter from `fp.js`, two dead selectors in the letterbox helper. Uncertain generic components kept and listed in `DESIGN-SYSTEM.md` §17 |
| 10 | Protect internal docs | `.htaccess`: `RedirectMatch 404` for `templates/`, `scripts/`, `docs/`, `data/`, `*.md`/`*.markdown`, `*.py`, `*.sh`, `*.log`, dot-files (except `/.well-known/`) |
| 11 | Testing | See §4 |

Also fixed while testing (behaviour only, no visual change): a hover-then-keyboard edge case in the dropdowns where ArrowDown within 0.6 s of a hover was ignored; ArrowDown on an open menu now moves into it.

## 3. Changed files (relative to the approved Phase 1 build)

| File | Change |
|---|---|
| `assets/fp.css` | Tokens, `.fp-container`/`.wrap`, masthead (§5b), global footer rules, `--nav-h` breakpoint; 176 dead rules removed (64.7 KB → 48.9 KB) |
| `assets/fp-home.css` | Tokens/container/masthead/footer moved out; literals → tokens; `.fp-head--rule` removed (27.3 KB → 22.9 KB) |
| `assets/fp.js` | Masthead dropdown + drawer added (§1/§1b); old menu, old carousel, `#latestReviewsRow` sorter removed; dropdown keyboard fix (14.9 KB → 13.3 KB) |
| `assets/fp-home.js` | Masthead code moved out (10.2 KB → 6.7 KB) |
| `scripts/apply-shell.js` | Global header/footer, content-type `sectionOf()`, Tools active state, versions |
| `.htaccess` | Internal-file 404 rules (existing redirects and `ErrorDocument` unchanged) |
| `tools.html` | Shell + `scroll-margin-top` removal |
| 94 other `.html` pages (incl. `templates/review-template.html`) | Generated shell only: head asset versions, masthead, footer, script versions |
| `CLAUDE.md`, `docs/DESIGN-SYSTEM.md`, `docs/SITE-ARCHITECTURE.md`, `docs/DEVELOPMENT-ROADMAP.md`, `docs/AUDIT-2026-11-26.md`, `docs/PHASE-2A-REPORT.md` | Documentation updates |

Not changed: `build-lists.js`, `reindex.js`, `make-home-images.py`, `make-thumbs.py`, all `data/*.json`, `images/`, `sitemap.xml`, `feed.xml`, `search-index.json`, `robots.txt`, `js/analytics.js`, fonts, brand assets.

**Verified:** for every changed HTML page, removing the generated head block, header, footer and script tags leaves the file byte-identical to Phase 1 (only exception: the intended `tools.html` style line).

## 4. Test results

**Homepage regression (real Chromium, 100% zoom, full page, reduced motion, cookies declined):** 0 changed pixels at 2560, 1920, 1536, 1440, 1280, 1024, 768 and 390px (16 screenshots, fold + full page), compared with the pre-change baseline.

**SEO and content:** title, meta description, canonical, robots, Open Graph, Twitter, JSON-LD, analytics tag and the full `<main>` element are identical on all 94 public pages.

**Shell consistency:** every page has exactly one masthead and one footer, no old-header markup, the search overlay, back-to-top and skip link. Header row and footer row share the same edges on all 18 representative pages at 2560 (560→2000), 1920 (240→1680), 1536 (48→1488), 1440 (37→1403), 1280 (33→1247), 1024 (27→997) and 390 (16→374).

**Active navigation (all 95 generated pages):** News 37 (36 stories + listing) · Reviews 15 (14 briefs + listing) · Compare 10 (9 comparisons, incl. 6 under `/reviews/`, + listing) · Buying Guides 15 (13 guides incl. "x-vs-y" guides and Brezza guides under `/reviews/`, the explainer, + listing) · Car Culture 1 · Tools 1 · Home 1 · none 15 (about, contact, author, 4 editorial policies, 5 legal pages, sitemap, 404, review template).

**Website-wide crawl:** 94 pages × 2 widths (1440, 390) = 188 loads — 0 horizontal overflow, 0 JavaScript errors, 0 failed local requests, 0 broken images, 0 duplicate IDs. Static check: 0 broken local links or asset references across all pages.

**Functional (50/50 pass):** desktop dropdowns (click, hover, Esc + focus return, ArrowDown, focus-out), desktop and mobile search (icon, `/` shortcut, results, Esc + focus return), drawer at 1024 and 390 (open, focus, Tab trap, Esc, current item, navigation, scroll lock), keyboard order (skip link → logo → Home), back-to-top, Reviews `#suv` and News `#launch` hash filters, Cars ▸ Pickups landing, homepage carousel and finder, all four calculators (EMI ₹16,607; fuel ₹6,333; CNG ₹3,400/28 months; ownership ₹17,41,401; live recalculation), tools anchors, cookie consent (shown, Accept stores consent, stays hidden after reload), header touch targets ≥24px.

**Idempotency:** `make-home-images.py`, `reindex.js`, `build-lists.js`, `apply-shell.js` run twice in a row: the second run changes nothing except `feed.xml`'s `lastBuildDate`, which `reindex.js` always rewrites (existing behaviour; `feed.xml` restored so it is not part of this change).

**Apache access test (Apache 2.4, the repo as document root, `AllowOverride All`):** `/CLAUDE.md`, `/claude.md`, `/README.md`, `/PHASE1-HOMEPAGE-NOTES.md`, `/REDESIGN-NOTES.md`, `/docs/`, `/docs/PRODUCT-VISION.md`, `/docs/design-references/home-1536x1024.jpg`, `/data/cars.json`, `/data/homepage.json`, `/templates/review-template.html`, `/scripts/apply-shell.js`, `/scripts/make-home-images.py`, `/.git/config` → **404 with the custom 404 page**; `/.htaccess` → 403. Public pages, `/assets/…`, `/images/home/…`, `/search-index.json`, `/sitemap.xml`, `/feed.xml`, `/robots.txt` → 200. Existing redirects unchanged (`/index.html`, `/reviews-toyota-hilux.html`, `/site/…`).

## 5. Known limitations and items for review

1. **Phase 1 is still not live.** Push the combined build (Phase 1 + docs + Phase 2A) after approving 2A.
2. **Production server.** Hostinger normally runs LiteSpeed, which reads `.htaccess` `RedirectMatch` like Apache, but the rules were tested on Apache, not LiteSpeed. After pushing, open `https://flamingpiston.com/CLAUDE.md` and `/docs/` and confirm both show the 404 page.
3. **Existing `/index.html` rule on stock Apache.** With Apache 2.4 the pre-existing `Redirect 301 /index.html /` makes `/` redirect to itself (it does the same with the original `.htaccess`). Production evidently does not loop (the site loads), so it was left unchanged. If it ever loops after a server change, replace it with `RewriteCond %{THE_REQUEST} \s/index\.html[\s?]` + `RewriteRule ^index\.html$ / [R=301,L]`.
4. **Deployment exclusion.** Hostinger's Git deploy cannot exclude folders, so internal files are uploaded but blocked. Fully keeping them off the server would need a separate private docs repository or a deploy branch without `docs/`; not done (keeps the solo workflow simple).
5. **Content layouts unchanged by design.** Listing grids are wider now (1440px container); article, policy and tools inner widths unchanged. Page content still uses the earlier visual language — Phases 2B, 2C, 5 (`DESIGN-SYSTEM.md` §18).
6. **Kept unused CSS.** A short list of generic, currently unreferenced components was kept for a decision in 2B/2C (`DESIGN-SYSTEM.md` §17).
7. **Logo link height on mobile** is ~30px (approved homepage design): above the WCAG AA 24px minimum, below the 44px comfort target.
8. **Article gutters** still use `--gutter` (4vw) instead of `--page-gutter` (2.6vw); article text is centred, so header and text don't share a left edge — aligning this is a 2C decision.
