# Publishing on FlamingPiston — how new articles reach the homepage

FlamingPiston is a static site: pages change only when the site is **rebuilt and deployed**. One command rebuilds everything that depends on the articles; after that, every homepage section and listing page shows the newest stories automatically. The **main lead story** is the one deliberate exception: it is chosen editorially, never just because a story is newest.

## 1. Publish a new article (the everyday routine)

1. **Write the article** as usual (checklist: `PUBLISHING-CHECKLIST.md` in the project). It must have a JSON-LD `datePublished` with a time, e.g. `"2026-11-27T10:30:00+05:30"`. That timestamp decides where it sorts, for ever.
2. **Add its clean homepage thumbnail** (the newest story becomes the large Latest Stories photo, so this matters) under `"images"` in `data/homepage.json`:
   `"news-example.html": { "thumb": { "src": "images/news-example.jpg", "subject": [0.2, 0.25, 0.9, 0.85] } }`
   (`subject` = the car's box as fractions of the image; optional `"area"` keeps a baked-in headline out of the frame, `"erase"` paints headline text off a plain studio wall). Without a thumbnail the story still appears everywhere, with a plain FlamingPiston tile.
   News listing: if a story's image has a headline printed on it, add `"cardImage": "tile"` to its entry in `data/articles.json` so the News page shows the plain FlamingPiston tile instead.
   Reviews listing: a Buyer's Brief shows its price, body and fuel only if `data/cars.json` has an entry whose `url` is the brief's URL (with `source` and `checked`), and its Spec Score only if the brief has a "Spec Score (average)" table row. Its card photo is the clean `thumb` crop above (add `"alt"` to the thumb spec to describe it; otherwise the car's name is used).
3. **Run, from the site root:**
   ```
   sh scripts/update-site.sh
   ```
   It makes the homepage image crops, regenerates `sitemap.xml`, `feed.xml` and `search-index.json`, rebuilds the listing pages and every homepage section, and applies the shared header and footer. The first run after a new article **registers it in `data/articles.json` with Priority 3** (a regular story).
4. **Read what it prints.** `Registered new article(s)`, `WARN`, `NOTE` and `Tip` lines name anything that needs attention (a missing thumbnail or banner, an expired lead, a draft).
5. **Raise the priority if it deserves it** (section 3), run the command again, then deploy: copy the changed files into the GitHub Desktop folder, **replace, never delete folders**, commit, push.

That is all. You never edit `index.html` or a listing page by hand.

### Where a new article appears (homepage layout of 27 Nov 2026)

| Section | Shows | Picked automatically? |
|---|---|---|
| **Main lead story** | one story; see section 2 | **Editorial** (choice or Priority 1, never just newest) |
| Latest Stories (under the lead) | **every** live story, newest first by original publish time; tabs All · News · Reviews · Compare · Guides · Car Culture; each tab shows 1 large story + 3 rows | Yes, always |
| Category pages (news, reviews, comparisons, guides, car culture) | every story of that category, newest first | Yes, always |
| Compare | newest comparison with a `compare` banner (compact module: pair photo, title, one line) | Yes; `comparison.article` chooses by hand |
| New & Upcoming | the two stories in `newUpcoming.launch` / `.upcoming` (verified launch information only) | No, curated |
| Latest Reviews | newest featurable Buyer's Brief not already on the page | Yes |
| Buying & Ownership Guides | 3 newest featurable guides / explainers not already on the page | Yes |
| Car Culture band | newest culture story with a `culture` banner | Yes; `carCulture.article` chooses by hand |
| Featured Cars | the cars in `featuredCars` | No, curated |
| Buying Tools | fixed | No |

"Featurable" = live (published and due) and not in `exclude`. Featuring a story somewhere never removes it from Latest Stories: that feed is complete. Latest Reviews and Guides skip stories already visible in the lead, the Compare / New & Upcoming / Car Culture spots or the default (All) Latest Stories tab, so the same story is not repeated on screen when another is available.

**Latest Stories tabs** use the story's **editorial category**: `category` in `data/articles.json` if set, otherwise the listing page the story is on (news, reviews, comparisons, guides), otherwise its type. Car Culture = stories in `data/car-culture.json` or with category `Car Culture`. The "View all" link follows the tab.

**Editing** an old article (new `dateModified`) never makes it "new": every list sorts by the **original** `datePublished`. Ties are broken by URL, so the order is always the same.

## 2. Choose or replace the main lead story

The lead is static (one story, no carousel, no supporting stories). It can be **any kind of story**: important news, a major launch, a significant comparison, a buying guide or a Buyer's Brief. It is chosen in this order at every rebuild:

1. **Your choice**, in `data/homepage.json`:
   ```json
   "hero": { "article": "news-denza-d9-z9-gt-india-launch.html", "start": "2026-11-27", "end": "2026-12-03" }
   ```
   `start` and `end` are optional (India dates, both inclusive). The chosen story must be live (published and due), not excluded, and have a `hero` banner.
2. **Otherwise** (nothing chosen, or the dates have passed): the **newest Priority 1, hero-eligible story with a `hero` banner**.
3. **Otherwise** the current lead stays, if it is still valid.
4. **Last resort**: the newest Priority 1–2 story with a hero banner.

A Priority 3 story never leads. If the chosen story is outside its dates or not ready, the build prints `WARN: Lead story … choosing automatically` and says why.

**To feature a story as the lead:** it must be published and have a dedicated hero image (section 6). Give it a hero banner (`docs/HOMEPAGE-BANNERS.md`: make the image, save it in `images/banners/`, add its entry to `"banners"`), then either put its URL in `hero.article` or make it Priority 1. Run the command and deploy. **To stop featuring it:** clear `hero.article` (or let `end` pass and rebuild).

> Expiry dates are checked **when the site is rebuilt**. A lead whose `end` date passes stays on the live site until the next rebuild and deploy.

## 3. The editorial registry: `data/articles.json`

One line per article, keyed by its URL (as in the sitemap, no leading slash):

```json
"reviews/2026-kia-seltos-review/": {"id": "2026-kia-seltos-review", "priority": 2, "status": "published", "vehicles": ["kia-seltos"]}
```

| Field | Meaning |
|---|---|
| `id` | permanent article ID; set once, never change |
| `priority` | **1** major feature (launches that matter, comprehensive briefs, important comparisons, original research): may lead · **2** featured story: preferred for the featured modules; may lead only as a last resort · **3** regular (default): Latest Stories and category pages |
| `hero` | `false` keeps a Priority 1 story out of the lead; default `true` for Priority 1 |
| `status` | **publication** status: `published` (default; approved and public) · `draft` (work in progress) · `review` (written, waiting for fact-check and Gagan's approval; `unverified` means the same). `draft` and `review` are **not public**: never listed (homepage, listings, sitemap, RSS, search) and their URL answers 404. Homepage **promotion** is separate (`exclude`, `priority`, `hero`). See section 5. |
| `category` | optional override: `News`, `Reviews`, `Comparisons`, `Buying Guides`, `Car Culture` (a culture story can also be listed in `data/car-culture.json`) |
| `subtype` | optional, e.g. `launch`, `report`, `explainer`, `ownership` |
| `vehicles` | optional vehicle IDs from `data/cars.json` (for the future vehicle catalogue) |

Everything readers and search engines see (title, description, dates, images, credit) stays in the article HTML. A future publish time hides an article until a rebuild after that time.

`data/article-catalog.json` is **generated** at every rebuild: one consistent record per live article (ID, title, URL, category, subtype, publish and update timestamps, description, featured image, clean thumbnail, focal box, image credit, banner, vehicles, priority, hero eligibility, status and where it appears on the homepage). Never edit it by hand.

`data/`, `docs/` and `scripts/` are blocked from the public by `.htaccess`.

## 4. Curated sections

- **New & Upcoming:** `newUpcoming.launch` and `newUpcoming.upcoming` in `data/homepage.json`, each with a `launch` / `upcoming` banner carrying a dated `status` line copied from the story. Say "expected" unless a date is confirmed.
- **Featured Cars:** `featuredCars` (car IDs from `data/cars.json`).
- **Compare / Car Culture:** `comparison.article` / `carCulture.article` choose one by hand; empty = newest with a banner. A compare banner may carry `"short"`: the one line under the title in the Compare module (default: the first sentence of its `dek`).
- **Keep a live story off the homepage entirely** (Latest Stories included): add it to `exclude.urls`. It stays on its listing page, the sitemap, RSS and search. Used for the Hycross teaser and guide (pre-launch pieces whose rewrites wait in `drafts/`).

## 5. Publication status and approvals (who can read what)

Two separate questions decide where a story appears:

1. **Is it public?** (`status` in `data/articles.json` + its `datePublished`). Only `published` stories whose publish time has passed are public.
2. **Is it promoted on the homepage?** (`exclude` in `data/homepage.json`, `priority`, `hero`). A public story can be kept off the homepage; a story that is not public is never anywhere.

| Situation | Where the file lives | Registry | Public URL | Listings, sitemap, RSS, search | Homepage |
|---|---|---|---|---|---|
| **Draft** (new article, being written) | `drafts/<final path>` (recommended) or its final path | `draft` (added automatically as Priority 3 once at its final path) | **404** | no | no |
| **Needs verification** (written, waiting for fact-check / approval) | its final path, or `drafts/` | `review` | **404** | no | no |
| **Scheduled** (approved, future `datePublished`) | its final path | `published` | **404 until the first rebuild after its publish time**, then 200 | from that rebuild | from that rebuild |
| **Approved and published** | its final path | `published` | 200 | yes | Latest Stories; featured spots by priority |
| **Published, kept off the homepage** (e.g. a pre-launch story overtaken by the launch) | its final path | `published` | 200 | yes | no (`exclude.urls`) |
| **Pending revision of a published article** | approved version stays at its final path; the rewrite waits in `drafts/<same path>` | unchanged | 200, **approved version** | approved version | unchanged |

**How URLs are protected (static site, no backend):**
- `drafts/` is blocked as a whole by a fixed `.htaccess` rule (404), like `docs/`, `data/` and `scripts/`.
- Every article file at a public path that is `draft`, `review` or still scheduled gets its own 404 rule. `build-lists.js` writes these into `.htaccess` between `# FP:UNPUBLISHED:START` and `# FP:UNPUBLISHED:END` at every rebuild and removes them once the story is live.
- Hostinger deploys the whole repository, so these rules (not `robots.txt` or `noindex`) are what keep unpublished files private.
- **Always rebuild before deploying.** A story's 404 rule is removed only by a rebuild after it becomes public.

**Workflows:**
- **New article:** write it in `drafts/` (or at its final path with `status: "draft"`). For the fact-check, set `"review"`. To publish, move it to its final path if needed, set `status` to `published` (or remove the field), run `sh scripts/update-site.sh` and deploy.
- **Revising a published article** (e.g. a pre-launch piece after the launch): copy the public file to `drafts/<same path>` and edit only that copy. The public page, listings, sitemap, RSS and search keep the approved version. The build prints `Waiting in drafts/ for approval` and the catalogue marks `revisionPending`. **After approval:** copy the revision over the public file, delete the copy in `drafts/`, update `dateModified`, rebuild and deploy. Never change the article's URL.
- **Keep a published story off the homepage:** add its URL to `exclude.urls`; remove it to promote it again.

**Current state (27 Nov 2026):** the rewritten Innova Hycross guide and the teaser's launch update are **pending revisions** in `drafts/`. Their public pages remain the approved pre-launch versions, and both stay in `exclude`.

## 6. Hero images for Priority 1 stories

A Priority 1 story may lead the homepage only with a **dedicated hero banner** (`kind: "hero"` in `"banners"`). Give every Priority 1 story one before you promote it:

- **Image:** 2400 × 1000 (2.4:1), the whole car in the right ~55% with breathing room, a dark empty left side for the headline, **no text, logos, watermarks or baked-in headlines**, at least 1600 px wide after cropping, never stretched or distorted. Prompt templates and checks: `docs/HOMEPAGE-BANNERS.md`.
- **Provenance:** manufacturer images edited for the layout are credited ("Image: Mahindra, edited by FlamingPiston"). AI-generated images are credited "AI illustration: FlamingPiston" and never shown as a real launch, prototype, crash test or road test.
- **Checks:** `make-home-images.py` refuses wrong proportions and warns when the car starts too far left (under the text).
- **No suitable image:** don't promote the story. The build keeps the current valid lead and lists the story under `NOTE: … Lead story (Priority 1): <url>`. If `hero.article` names a story without a banner, the build warns (`has no "hero" banner yet; choosing automatically`) and keeps a valid lead. A missing image never produces an empty or badly framed lead.

## 7. Testing the rules

```
python3 scripts/test-publishing.py
```

The script copies the site to a temporary folder, runs every check below, and deletes the copy. Nothing it creates touches the real site. `scripts/` is blocked from the public by `.htaccess`.

- **Fixtures:** it adds stories of **every kind**: news, Buyer's Brief, comparison, buying guide and Car Culture. It also adds a draft, a story in review, a scheduled story, a Priority 1 news story, a chosen lead with an end date, and a **pending revision** of a published article.
- **Rebuilds:** it rebuilds at simulated dates (`FP_BUILD_DATE`).
- **Checks:**
  - registration, Latest Stories tabs and listing pages
  - sitemap, RSS, search and the article catalogue
  - lead choice and expiry, non-brief leads, `hero:false`, and the missing-banner fallback
  - exclusions, edited articles, approvals and idempotency
- **Apache:** if Apache is installed (`apache2`/`httpd`), it serves the copy with the real `.htaccess` and checks every direct URL: drafts, review, scheduled (before and after), `drafts/`, and internal files.

## 8. One rebuild, everything updated

`sh scripts/update-site.sh` runs, in order: `make-home-images.py` (clean crops) → `reindex.js` (sitemap, RSS, search index; drafts and scheduled stories left out) → `build-lists.js` (registry, listing pages, every homepage section, article catalogue) → `apply-shell.js` (shared head, header and footer). It is idempotent: a second run with no content change writes nothing (the RSS build date is the newest article date, not the clock).
