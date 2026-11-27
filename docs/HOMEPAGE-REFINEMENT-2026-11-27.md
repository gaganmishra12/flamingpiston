# Homepage editorial refinement — 27 Nov 2026 (approved as part of the consolidated build, 27 Nov 2026)

> **Superseded in part by `docs/CONSOLIDATION-2026-11-27.md`:** the refinement was merged with the editorial-system package the same day. The design described here is unchanged; the selection rules (lead story, registry, eligibility) now follow `docs/PUBLISHING.md`, and the file counts below refer to the refinement alone.

**Status:** built and tested locally. Nothing has been committed, pushed or deployed. The approved 26 Nov homepage stays recoverable (git `main` 0a8ec64 plus `docs/design-references/pre-refinement-2026-11-27/`). The approved reference screenshots in `docs/design-references/` have not been replaced.

**Built on:** `D:\flamingpiston`, branch `main` at 0a8ec64 (= `origin/main`, the live site). Working tree clean against the git index before work began. Gagan chose to build on this version. **The unpushed `editorial-system-update` zip** (articles.json registry, editorial.js, its own Latest Stories, 90% desktop zoom, Hycross guide rewrite) **is not included.** If both are approved, merge them carefully, because both change `build-lists.js`, `index.html`, `fp-home.css` and `fp-home.js`.

## What changed on the page

| # | Section | Before | After |
|---|---|---|---|
| 1 | Header | — | Unchanged. Markup is byte-identical to live. |
| 2 | Lead story | Static banner plus 3 supporting stories beside it | One static story, full width of the 1440px container. Text left (max 480px, ≈50px upright headline), banner right at its own 2.4:1 ratio, ≈440px tall. No carousel, dots or controls. Selection rules unchanged (`hero.pinned`, else newest Buyer's Brief with a `hero` banner). |
| 3 | Latest Stories | Did not exist (Latest News sat beside the comparison) | New, directly under the lead. Text tabs: All · News · Reviews · Compare · Guides · Car Culture. Each tab shows 1 large story and 3 rows, newest first by original `datePublished`. The "View all" link follows the tab. There is no all-stories page, so All shows no link. |
| 4 | Find Your Next Car | Gradient panel | Same function and size (84px). Flat petrol strip, no photography. Same inline results. |
| 5 | Featured Cars | 4 cards | Same 4 cards and data. Restyled: 8px radius, hairline badge, no hover shadow. Two columns now stay down to 360px (was 390px). |
| 6 | Compare + New & Upcoming | Full-bleed cinematic comparison banner (with VS badge) beside Latest News; separate row of two cinematic 3:1 cards | One ivory row, split 48/52 by a hairline. Compare: pair photo, "Sierra EV vs BE 6", one line, "Compare now". New & Upcoming: two compact entries (thumbnail, label, name, dated status, link). |
| 7 | Latest Reviews + Buying Tools | 58/42, cards with shadows | 55/45 split by a hairline. Review card: image, label, title, date, one sentence, "Read the Brief". Tools: four compact icon tiles, one row when the column allows, else 2×2. |
| 8 | Buying & Ownership Guides | 3 cards with long deks | 3 compact cards: image, label, title. No dek. |
| 9 | Car Culture | Cinematic band | Kept as the closing cinematic band (240px, AI-illustration credit). |
| 10 | Footer | — | Unchanged. Markup is byte-identical to live. |

Typography: only the finder and Car Culture titles stay italic. Every other heading is upright. Sizes: lead 50px · Latest Stories 32px · sections 26px · story lead 26px · rows 18px · metadata 11.5px mono. Colours: existing tokens only. Section rhythm: 44px between sections.

## How the automation behaves now

- `sh scripts/update-site.sh` works as before. Run it twice: the second run changes nothing except the RSS `lastBuildDate` (the known timestamp exception).
- **Latest Stories** lists every published story. It skips only `exclude` URLs (the Hycross teaser and Hycross guide stay off) and stories dated in the future. A story that appears elsewhere on the page still appears here. Editing an old story never moves it up, because ordering uses `datePublished`.
- **Latest Reviews / Guides** skip stories already visible in the lead story or the default (All) panel, so the same story does not repeat on screen. Today that means Latest Reviews shows the GLC Electric brief, and Guides show BaaS, 5-star cars and Brezza petrol vs CNG.
- **Compare / New & Upcoming** keep the banner-based selection and pins. The compact thumbnails are cut from each banner's `subject` box. An optional `"short"` field on a compare banner sets the one-line description; without it the first sentence of `dek` is used.
- **New thumbnail rule:** every new story needs a `thumb` in `data/homepage.json` `"images"`, because the newest story becomes the large Latest Stories photo. Without one it gets the brand tile, and the build's `Tip:` line names it.

## Changed files (103: 13 modified, 90 added, 0 deleted)

| File | Change |
|---|---|
| `index.html` | New section order. `STORIES` marker added (replaces `NEWS`). Upright headings. Compact tool tiles. Header, footer, `<head>`, SEO and JSON-LD unchanged. |
| `assets/fp-home.css` | Rewritten for the three-level hierarchy. Rules for retired homepage classes removed after a dependency check (see DESIGN-SYSTEM §17). |
| `assets/fp-home.js` | Latest Stories tabs (click, arrows, Home/End, no-JS fallback) added before the unchanged finder. |
| `scripts/build-lists.js` | HERO without supporting stories. New STORIES generator. Compact Compare / New & Upcoming. Review and Guides de-duplication. Latest News removed. |
| `scripts/make-home-images.py` | New crops: 16:9 thumbs, a large 16:9 `story` crop, and `bthumb` crops cut from compare/launch/upcoming banners. Existing crops untouched. No file is deleted. |
| `scripts/apply-shell.js` | `VH` cache version 20261126g → 20261127a. Only `index.html` was rewritten by it. |
| `data/homepage.json` | 7 new `thumb` crop entries (listed below). No other data changed. |
| `data/home-images.json` | 69 new crop entries. Existing entries unchanged. |
| `images/home/*.webp` | 69 new crops (Latest Stories 16:9 and story sizes, Compare/New & Upcoming thumbnails). |
| `docs/DESIGN-SYSTEM.md`, `docs/HOMEPAGE-BANNERS.md`, `docs/SITE-ARCHITECTURE.md`, `docs/DEVELOPMENT-ROADMAP.md`, `CLAUDE.md` | Updated for the new homepage. CLAUDE.md marks it pending approval. |
| `docs/HOMEPAGE-REFINEMENT-2026-11-27.md` | This report. |
| `docs/design-references/pre-refinement-2026-11-27/` | 9 screenshots of the live homepage before the change, plus README. |
| `docs/design-references/proposed-2026-11-27/` | 9 screenshots of the refinement (folder retired at approval; the final set is now in `docs/design-references/`). |

Not changed: `fp.css`, `fp.js`, every article and listing page, sitemap, RSS, search index, `.htaccess`, analytics, cookie consent, URLs, canonicals, dates, titles, descriptions, structured data.

## Image audit (every image on the homepage, all six tab panels)

All 34 homepage images load, are cut at their slot's ratio, are not distorted (no `object-fit: fill`), and are not upscaled past their pixel size at 1x. Seven stories had no clean crop and would have shown the brand tile. Crops were added for them from their own article images, with headlines kept out:

| Story | Source | Note |
|---|---|---|
| Tata Sierra EV vs Mahindra BE 6 (comparison) | `images/banners/tata-sierra-ev-vs-mahindra-be-6.jpg` | The article image has a baked-in headline, so the clean banner is used instead. |
| Mahindra BE 6 SPORTEQ brief | `mahindra-be6-sporteq-review-hero.jpg` | Text on the left kept out of the crop. |
| Glanza vs Baleno | `glanza-vs-baleno-comparison-hero.jpg` | Text above the cars kept out. The pair is too wide for 16:9 below the text, so it is letterboxed. |
| Brezza Turbo vs 1.5 Petrol | `brezza-turbo-vs-petrol-hero.jpg` | Clean photo. |
| Tesla Roadster | `tesla-roadster-news-hero.jpg` | Clean. This is an AI illustration; the Car Culture band labels it. |
| BMW 7 Series / i7 | `news-bmw-7-series-i7-facelift.jpg` | Text below the car kept out. |
| Porsche Cayenne Electric | `news-porsche-cayenne-electric.jpg` | Text below the car kept out. |

**Replacements needed** (nothing is broken, but these fall short of the brief):

1. **Featured Cars: Brezza, Kylaq, Seltos.** The Brezza photo has a dramatic mountain and sunset background. Kylaq and Seltos are AI illustrations (marked `illustration: true` in `cars.json`). The brief asks for neutral, consistently framed photos: plain studio or daylight three-quarter front shots, 16:9, whole car with room around it, no text. The Syros EV photo is the closest to the target.
2. **Sierra EV vs BE 6.** The same pair photo appears twice: as the large Latest Stories story and in the Compare module. Both come from the only clean image. A second clean photo (for example the two cars side-on) would remove the repetition.
3. **Brezza CNG vs XUV 3XO CNG and Glanza vs Baleno.** These are letterboxed (thin bars above and below) because the source images have text above the cars. Clean 16:9 photos of each pair are needed.
4. **Yangwang Altior.** A faint watermark remains in the bottom-right corner of the crop. Worth a cleaner source.
5. **Innova Hycross facelift guide.** Still excluded from the homepage. Its hero still says "Buy now or wait? 25 Nov". That rewrite is in the unpushed zip, not in this build.
6. Car Culture (Tesla Roadster, AI illustration) and the lead (Thar Roxx banner) are fine as cinematic features.

## Tests (Chromium, local server)

- **Viewports:** 2560×1440, 1920×1080, 1536×1024, 1440×900, 1280×800, 1024×768, 768×1024, 390×844 and 375×812, all inspected visually. No horizontal overflow, no missing files, no 4xx responses, no console errors at any of them.
- **Functional checks: 35/35 passed.**
  - Section order is correct. No supporting stories. No carousel controls. No full-bleed banners in secondary sections.
  - Hero is 439px tall at 1440, and the headline column ends before the car.
  - Each of the 6 tabs shows only its panel, 4 stories newest first, with the right "View all" target. Arrow keys, Home and End work.
  - Finder: matches, clear, and the honest empty state all work.
  - All 58 homepage links resolve. The 4 calculator links land on existing calculators. The 4 featured cars link to their briefs.
  - Every image in every panel loads. None is upscaled or distorted.
  - Header, footer and `<head>` (SEO, canonical, JSON-LD) markup is identical to live.
  - Without JavaScript, the tabs are hidden and the All panel shows.
  - Mobile drawer opens and closes with Esc. Cars dropdown and `/` search work.
- **Regression:** news, reviews, tools, about, a Buyer's Brief, a comparison, a guide and a news story at 1440 and 390 are pixel-identical to before. `apply-shell.js` rewrote only `index.html` (94 other pages unchanged).
- **Idempotency:** a second run of `update-site.sh` changes nothing except the RSS build date.

## To deploy (after approval)

Copy the files from the delivery zip into `D:\flamingpiston` (Replace) and commit through GitHub Desktop. No files or folders need deleting. Then check the live homepage. Once approved, move the `proposed-2026-11-27` screenshots into `docs/design-references/` as the new approved set.
