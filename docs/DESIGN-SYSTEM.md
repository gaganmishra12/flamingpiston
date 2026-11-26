# FlamingPiston — Design System

*Derived from the approved homepage (`index.html`, `assets/fp-home.css`, `assets/fp-home.js`) and the site stylesheet (`assets/fp.css`). First written 26 Nov 2026; **updated after Phase 2A (shared design foundation, 26 Nov 2026)**. This documents what exists; it does not invent new rules. Visual references: `docs/design-references/`.*

**Phase 2A in one line:** the homepage's tokens, 1440px width system, masthead and footer now live in `fp.css` / `fp.js` / `apply-shell.js` and are used by every page; page *content* layouts (listings, articles, info pages) keep their earlier styling until Phases 2B, 2C and 5.

**The approved homepage is the visual source of truth.** Where the homepage and older site pages differ, the homepage wins and the older page is a Phase 2 redesign candidate.

---

## 1. Files

| File | Scope | Size |
|---|---|---|
| `assets/fp.css` | Whole site: fonts, **all tokens**, base, **`.fp-container` width system**, **global masthead (§5b)**, search overlay, buttons, cards, listings, articles, info pages, **global footer (§14)** | 49 KB |
| `assets/fp-home.css` | Homepage sections only (loaded after `fp.css`): hero, finder, cards, banners, section headings, italic headline font | 23 KB |
| `assets/fp.js` | Whole site: **masthead dropdowns + drawer (§1)**, back-to-top, card dates/"New", letterboxing, table scroll, listing filters, FAQ/note detection, search overlay | 13 KB |
| `assets/fp-home.js` | Homepage only: car finder (the lead story is static) | 7 KB |
| `assets/fp-tools.js` | `/tools.html` only: four calculators | 4 KB |

Cache-busting query strings are set by `scripts/apply-shell.js`: `V = '20261126b'` (fp.css / fp.js) and `VH = '20261126b'` (fp-home.css / fp-home.js). Bump the relevant one whenever a file changes.

## 2. Colour tokens

### Approved palette (`fp.css :root`)

| Token | Value | Use |
|---|---|---|
| `--petrol` | **#11252E** | Deep petrol: header, hero band, finder, dark cards, footer; main text colour on ivory (`--ink`) |
| `--petrol-2` | **#274650** | Secondary petrol: tile gradients, tool icons |
| `--teal` | **#89B4B5** | Muted teal: focus rings, hover borders, divider ticks, footer column headings |
| `--ember` | **#B85C50** | Ember: brand accent (logo slashes, tiles, kicker `//`, card "New" marker, default focus ring) |
| `--ivory` | **#F2EFE8** | Warm ivory: page background, light text on petrol |

### Derived tints (`fp.css`)

| Token | Value | Use |
|---|---|---|
| `--ivory-2` | #E8E3D9 | Recessed panels, image placeholders |
| `--paper` | #F8F6F1 | Raised surfaces on ivory (finder results, tool sections) |
| `--petrol-3` | #1A3440 | Card surface on petrol; dropdown hover |
| `--rule` | rgba(17,37,46,.16) | Hairlines on ivory |
| `--rule-strong` | rgba(17,37,46,.38) | Stronger dividers, badge borders, card hover border |
| `--rule-dark` | rgba(137,180,181,.22) | Hairlines on petrol |
| `--ink` | = `--petrol` | Primary text on ivory |
| `--ink-2` | #3D5660 | Secondary text on ivory (7.0:1) |
| `--ink-3` | #4F6268 | Metadata on ivory (5.6:1) |
| `--on-dark` | = `--ivory` | Primary text on petrol |
| `--on-dark-2` | #B9C6C6 | Secondary text on petrol (9.2:1) |
| `--ember-text` | #9C473C | Ember for small text on ivory (5.3:1): "View all" links, labels on ivory |

### Approved homepage tokens — shared since Phase 2A (`fp.css :root`)

| Token | Value | Use |
|---|---|---|
| `--ember-strong` | #C4513F | Interactive ember: primary buttons, nav underline, label chips, VS ring (4.9:1 with white) |
| `--ember-strong-hover` | #A9432F | Hover for `--ember-strong` buttons |
| `--ember-label` | #E0715F | Small ember labels/links on petrol (5.0:1) |
| `--petrol-panel` | #16303A | Middle stop of finder / comparison gradients |
| `--field` | #1D3944 | Finder select background |
| `--card-surface` | #FAF8F3 | Light card surface (featured, review, tool, guide cards) |
| `--card-border` | #DEDAD2 | Light card border (the brief's "subtle border") |
| `--on-dark-dek` | #D6DEDD | Descriptive text on petrol (hero, comparison, new & upcoming, culture) |

### Literal values still in `fp-home.css` (homepage-only, deliberately not tokens)

| Value | Where |
|---|---|
| #1C3A45, #21434E | End stops of the finder / comparison gradients |
| rgba(242,239,232,.55) | Finder field border |
| rgba(242,239,232,.7–.75) | Photo credits on images |
| #fff | Text on ember buttons and label chips |

Rules: no pure black backgrounds; no neon; no glassmorphism; gradients only as subtle tonal depth inside petrol panels and as photo fades.

## 3. Typography

### Families (self-hosted WOFF2, `assets/fonts/`, latin + ₹ subset; `-ext` files cover extended latin)

| Token | Stack | Role |
|---|---|---|
| `--f-head` | "Familjen Grotesk", system-ui, sans-serif | Headlines, section titles, card titles, car names |
| `--f-body` | "Inter", system-ui, -apple-system, "Segoe UI", sans-serif | Navigation, body, controls, prices, descriptions, labels |
| `--f-mono` | "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace | Metadata (dates, read time), photo credits, footer headings, technical data |

### Declared weights (`@font-face`, all `font-display:swap`)

- Familjen Grotesk: 500, 600, 700 normal; **700 italic** (declared in `fp-home.css`, file `familjen-grotesk-latin-700-italic.woff2`, OFL via Fontsource — homepage only).
- Inter: 400, 400 italic, 500, 600–700.
- IBM Plex Mono: 400, 500–600.

Preloaded on every page: Familjen Grotesk 700 and Inter 400. Homepage also preloads Familjen Grotesk 700 italic.

### Italic rule

Bold italic Familjen Grotesk (`.fp-italic`, or `font:700 italic …`) is used **only** for section titles and feature names on the homepage: Find Your Next Car, Featured Cars, Latest News, New & Upcoming Cars, Latest Reviews, Buying Tools, Buying & Ownership Guides, Car Culture, the comparison headline, the New & Upcoming car names and the VS mark. Hero and article headlines stay **upright**.

### Homepage type scale (desktop values from `fp-home.css`)

| Element | Font | Size / line-height | Notes |
|---|---|---|---|
| Lead headline (`.hl-text h2`) | Head 700 | clamp(28px → 38px) / 1.08, -0.025em | fills the 36% text column, `text-wrap:balance`; 26–32px ≤1199px |
| Lead dek | Body 400 | 15px / 1.5 (14.5px mobile) | #D6DEDD; shown at every width |
| Comparison headline | Head 700 italic | clamp(28px → 38px) / 1.05 | |
| Car Culture title | Head 700 italic | clamp(28px → 38px) / 1.05 | |
| Finder title | Head 700 italic | clamp(24px → 30px) / 1 | |
| Section heading (`.fp-head h2`) | Head 700 (italic where listed) | clamp(24px → 28px) / 1.1, -0.02em | |
| New & Upcoming car name | Head 700 italic | 24px / 1.1 (21px mobile) | |
| Review card title | Head 700 | 19px / 1.2 | |
| Car name (featured) | Head 700 | 17px / 1.2 (15.5px mobile) | |
| Supporting story title | Head 700 | 16px / 1.2 | |
| Tool title | Head 700 | 15.5px / 1.2 | |
| News / guide title | Head 700 | 15px / 1.25 · 15px / 1.22 | |
| Navigation | Body 600 | 14.5px / 1 | |
| Buttons | Body 600 | 14px (finder button 15px) | |
| "View all" links | Body 600 | 14px | `--ember-text` |
| Descriptions / deks | Body 400 | 12.5–14.5px / 1.35–1.45 | |
| Price | Body 400 | 13.5px / 1.35 | |
| Category label (`.fp-label`) | Body 700 | 11px / 1.2, +0.08em, uppercase | `--ember-text` on ivory, `--ember-label` on petrol; chip version white on `--ember-strong` |
| Header descriptor | Body 500 | `--logo-w` × 0.0385 (≈7.7–10px), +0.12em, uppercase | `--teal` at 86%; slashes at 60% of that. See §6 brand lockup |
| Metadata | Mono 400 | 11.5px / 1–1.3 | `--ink-3` |
| Photo credit | Mono 400 | 10–10.5px | ivory at ~72% |

### Site type scale (`fp.css` tokens, used by listings and articles)

`--t-display` 36→60px · `--t-h1` 34→56px · `--t-article` 32→52px · `--t-h2` 26→38px · `--t-h3` 21→26px · `--t-card` 19→22px · `--t-card-lg` 22→32px · `--t-body` 16→17px · `--t-read` 17→18px (article body) · `--t-small` 15px · `--t-meta` 12px · `--t-micro` 11px. Base body: Inter 400, line-height 1.6. Headings default: Familjen Grotesk 600, 1.08, -0.015em, `text-wrap:balance`.

## 4. Layout and widths

### The shared width system (approved homepage system; site-wide since Phase 2A)

```css
--content-max-width: 1440px;
--page-gutter: clamp(16px, 2.6vw, 40px);
.fp-container { width:100%; max-width:calc(var(--content-max-width) + 2 * var(--page-gutter));
                margin-inline:auto; padding-inline:var(--page-gutter); }
```

- Usable content stops at **1440px** and centres. Verified: on 1920 and 2560 screens the hero, finder, cards and banners measure 1440–1520px including gutters.
- Full-width **backgrounds** are allowed (hero band, footer); full-width **content** is not. The lead hero image deliberately bleeds into the left gutter (`margin-left: calc(-1 * var(--page-gutter))`) but stays inside the container on the right.
- Never use `100vw` for content, `transform: scale` on the page, or fixed widths that overflow. Grid children get `min-width:0`.
- `body { overflow-x: clip }` exists in `fp.css` as a safety net; it must not be relied on to hide overflow — fix the source.
- `.wrap` (used by listing pages, info heads and the footer) is the **same outer container** as `.fp-container` (1440px + `--page-gutter`). The old `--max: 1280px` token was removed in Phase 2A.
- Verified edges of the header row and footer row on every page type: 37→1403px at 1440, 48→1488px at 1536, 240→1680px at 1920, 560→2000px at 2560, 27→997px at 1024, 16→374px at 390.

### Narrower inner widths (preserved on purpose)

The 1440px limit is an outer container, not a target width. Inside it:

| Content | Width | Where |
|---|---|---|
| Article body text | `--read` 720px column (named-line grid in `main.content`) | articles, policy/legal pages, sitemap |
| Article wide elements (images, tables) | `--wide` 1120px | articles |
| Article side gutters | `--gutter` clamp(16px, 4vw, 40px) — unchanged; aligning it with `--page-gutter` belongs to Phase 2C | articles |
| Info-page head | 720px + gutters (`.info-head .wrap`) | about/contact heads |
| Calculators | 1120px wrapper, two-column calculator | `/tools.html` |
| Listing intro (lede) | max 62–72ch | listing page heads |

### Spacing

Homepage: `--section-gap: 24px` (defined), `--card-gap: 20px`. Sections use `.fp-row { margin-top: 36px }`; finder sits 12px below the hero band, Featured Cars 22px below the finder, comparison/news 26px below; last row has 48px bottom margin before the footer.
Site scale (`fp.css`): `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 · `--s-8` 64 · `--s-9` 96 · `--s-10` 128px.

### Grids on the homepage

| Row | Desktop | Ratio / columns |
|---|---|---|
| Hero | Static lead story + supporting stories | `67fr / 33fr`; lead = text (40%) over the blurred left edge of a right-anchored image (66%); height = taller of text and image; stories stretch to match in 3 equal rows |
| Finder | Title · intro · 3 selects · button | `auto · minmax(170px,1.1fr) · 3×1fr · auto`, min-height 84px |
| Featured Cars | 4 cards | `repeat(4, 1fr)`, gap 20px |
| Comparison + News | Banner + list | `65fr / 35fr`, gap 32px, rows stretch to equal height (banner min 250px) |
| New & Upcoming | 2 cards | `repeat(2, 1fr)`; each card `1fr / 1.2fr` text \| 16:9 image, height set by the image |
| Reviews + Tools | Review card + 2×2 tools | `58fr / 42fr`, gap 32px; the tools grid stretches (equal rows) so both columns end on the same line |
| Guides | 3 cards | `repeat(3, 1fr)` |
| Car Culture | Banner | 1 column, 240px tall, image right 62% |
| Footer | Brand + 4 columns | `4fr repeat(4, 2fr)`, gap 32px (from `fp.css`) |

## 5. Breakpoints (max-width)

**Site-wide since Phase 2A:** masthead and footer use these values on every page (nav → drawer at 1279px, 60px masthead at 767px). `--nav-h` (68px, 60px ≤767px) drives `scroll-padding-top` so anchors land below the sticky masthead.

**Homepage sections:**

| Range | Behaviour |
|---|---|
| ≥ 1440 | Full layout; content capped at 1440px |
| ≤ 1439 | Finder gap tightens; supporting-story deks hidden |
| ≤ 1279 | Nav moves into the drawer; hamburger appears; finder intro hidden; guide cards stack image over text |
| ≤ 1199 | Hero becomes one column: lead story full width (`44fr / 56fr` text \| image), supporting stories a 3-up row; comparison and Latest News stack (news becomes 2 columns); banner fixed 250px |
| ≤ 1023 | New & Upcoming one column (image column max 440px); finder 3 columns with full-width title/button; Featured Cars 2×2; Reviews and Tools stack |
| ≤ 767 | Mobile: 60px header; lead image on top (16:10) with text beneath, no overlap; stories as list; finder 2 columns (budget full width); comparison image below text (credit below the image); one-column news, guides; New & Upcoming image on top (16:9); tool cards stack icon over text; culture image on top |
| ≤ 389 | Featured Cars one column |

Page *content* in `fp.css` (listings, articles, info pages) still uses its earlier set (999/899/599/479 and the footer's 999/479). These are content breakpoints, left unchanged in Phase 2A on purpose; align them while redesigning those layouts in 2B/2C/5.

## 6. Header — global masthead (approved; site-wide since Phase 2A)

Markup: `header(cur)` in `scripts/apply-shell.js`, written into every page. CSS: `fp.css` §5b. Behaviour: `fp.js` §1 (no homepage-only JavaScript involved).

- **One row**, 68px (60px on mobile), deep petrol, 1px `--rule-dark` bottom border, `position: sticky`.
- **Layout:** brand lockup on the left edge of the shared container; **nav and search form one right-aligned group** (`.mh-nav{margin-left:auto}`; `.mh-row` has no gap and no flexible spacer between nav and search). Nav items and the search icon share the same vertical centre (34px in the 68px bar).
- **Brand lockup (left):** cropped light logo SVG (`/assets/brand/flamingpiston_horizontal_cropped_light.svg`) at `--logo-w: clamp(200px, 17vw, 260px)` (set on `.mh-brand`). Descriptor underneath reads exactly **"CARS / REVIEWS / BUYING GUIDES"**. Everything in the lockup is derived from `--logo-w`, so it scales with the logo and has no fixed-pixel offsets:
  - starts directly under the **F** of FLAMINGPISTON, not under the ember double-slash: `margin-left: calc(var(--logo-w) * .1509)` (the F's baseline-left corner is at x 180.5 of the SVG's 1196-wide viewBox);
  - stays inside the wordmark: font-size `calc(var(--logo-w) * .0385)` with +0.12em tracking ends the line just inside the wordmark's right edge; `max-width: calc(var(--logo-w) * .849)` as a guard;
  - gap below the wordmark `calc(var(--logo-w) * .026)` (5–7px);
  - colour muted teal (`--teal` at 86% opacity; the slashes at 60% of that), Inter 500, uppercase.
  - Do not change the SVG or its proportions; if the logo file changes, re-measure the F offset.
- **Nav (right group):** Home · News · Cars ▾ · Reviews · Compare · Buying Guides · Tools ▾ · Car Culture. Inter 600 14.5px, ivory. **26px between items.** `.mh-nav` has `padding-left: 24px` so it never touches the lockup.
- **Search:** `.mh-tools{margin-left:17px}`; with the 44px button's 11px inset this puts **28px** between the end of "Car Culture" and the search glyph. Below 1280px the nav is hidden and `.mh-tools` takes `margin-left:auto`.
- **Active / hover state:** 3px `--ember-strong` underline at the bottom of the bar, scaling in from 0 (0.2s).
- **Search button** (44×44) opens the shared search overlay; hamburger shown **only below 1280px**.
- **Dropdowns (Cars, Tools):** petrol panel, 2px ember top border, min-width 240px, shadow `0 12px 28px rgba(0,0,0,.25)`; items 14px `--on-dark-2`, hover `--petrol-3` + ivory. Open on click, hover (hover devices), ArrowDown; close on Esc, outside click, focus leaving. Chevron rotates 180° when open.
- **Drawer (<1280px):** right-side panel max 380px, petrol, overlay rgba(8,18,22,.55); main items Familjen 600 20px; Cars/Tools as grouped sub-lists; secondary links (About, Contact, Gagan Mishra, policies, methodology, Instagram). Focus moves to close button; Tab is trapped; Esc closes; body scroll locked.
- **Active state** comes from the page's editorial type, not its folder (`sectionOf()` in `apply-shell.js`): News stories → News; Buyer's Briefs (`/reviews/…`) → Reviews; comparisons (including those under `/reviews/`) → Compare; guides and explainers (including Brezza guides under `/reviews/` and "x-vs-y" guides) → Buying Guides; `tools.html` → the **Tools** dropdown button (class `is-active`, permanent ember underline, "(current section)" for screen readers); listing pages → their own item; about, contact, author, policies, legal, sitemap and 404 → none.
- The drawer repeats the current item (`aria-current="page"`, teal text).
- The old header (`.navbar`, `.main-nav`, `.menu-btn`, `.fp-search-trigger`) was retired in Phase 2A.

## 7. Footer — global (approved; site-wide since Phase 2A)

`FOOTER` in `apply-shell.js`, written into every page; styles in `fp.css` §14.

- Deep petrol; top padding clamp(36px, 4.5vw, 56px); inner width = the shared 1440px container on every page.
- Brand column: cropped light logo (20px tall), one-line description "Car news, buyer's briefs, comparisons and buying guides for India." (max-width 300px), Instagram @flamingpiston_in (mono 13px, underlined with `--rule-dark`).
- Four columns with mono 11px uppercase teal headings: **Sections** (News, Reviews, Buying Guides, Comparisons, Tools, Car Culture) · **Company** (About, Contact, Gagan Mishra, Sitemap) · **Editorial** (Editorial Policy, Review Methodology, Fact-Checking, Corrections) · **Legal** (Privacy, Cookie, Terms, Affiliate Disclosure, Disclaimer).
- Bottom bar: © 2026 FlamingPiston. All rights reserved. · New Delhi, India (mono 12px, `--rule-dark` top border).
- Responsive: ≤999px brand spans full width with 2 columns below; ≤479px 2 columns.
- Homepage-only spacing: `body.home .site-footer{margin-top:0}` (in `fp-home.css`). Other pages keep their existing space above the footer.

## 8. Buttons and links

| Component | Spec |
|---|---|
| Primary button `.fp-btn` | Height 38px, padding 0 16px, radius 3px, `--ember-strong` bg, white Inter 600 14px, trailing 14px chevron; hover #A9432F |
| Finder button `.finder-btn` | Height 46px, padding 0 26px, radius 4px, search icon, Inter 600 15px |
| "View all" link `.fp-more` | Inter 600 14px `--ember-text` + chevron; underline on hover (3px offset) |
| Text link `.fp-textlink` | Same as `.fp-more`, pushed to the bottom of a card |
| Site buttons (`fp.css`) | `.btn` 44px min, petrol fill, radius 2px; `.btn--ghost`; `.arrow-link` with "→" |

Mobile: `.fp-more` and `.fp-textlink` gain 13px vertical padding (negative margin) so touch targets reach 44px.

## 9. Form controls (car finder)

- Field: 48px tall, 1px border rgba(242,239,232,.55), radius 5px, background `--field`.
- Small label inside the top-left (Inter 400 11px, `--on-dark-2`) and the selected value below (Inter 600 14.5px, ivory).
- Native `<select>` with `appearance:none` and an ivory SVG chevron at right 14px.
- Hover: teal border. Focus-within: teal border + 2px rgba(137,180,181,.35) ring.
- Results panel: `--paper`, 1px `--rule`, radius 10px; list of matches with mono price; honest empty state and a "Clear filters" control.
- Calculator inputs (`tools.html`): 44px, 1px `--rule-strong`, radius 5px, white; focus 2px teal outline.

## 10. Search interface

Shared overlay from `fp.css` §6 and `fp.js`: full-screen dim (rgba(9,20,25,.72)), 720px ivory panel, 64px Familjen input, results with mono type tag, ember left bar on the active result, keyboard shortcut `/`, Esc closes; full-screen on ≤599px. Data: `search-index.json` (73 entries, regenerated by `reindex.js`). No separate search-results page exists.

## 11. Cards and components

All homepage cards are whole-card links (or carry a clear link), use hover underline on the title, and keep focus-visible outlines.

| Component | Class | Spec |
|---|---|---|
| Lead story | `article.hl` | **Static, one story, no carousel.** A purpose-made 2.4:1 banner image (car in the right 55%, dark empty left 40%, no text) runs the full width of the lead area, bleeding into the left gutter, at its own aspect ratio, so the car is never cropped on desktop. The headline (36% wide; 37% ≤1199px) sits over the image's empty left side on a petrol gradient (solid → 0 by 46%); soft top/bottom/right fades; no box, no blur. Mobile: image on top (16:10, right-anchored) fading into the text below. Credit from `hero.credit` (falls back to the article caption). Story = `hero.pinned[0]`. |
| Supporting story | `.hs-item` | Image 42% (16:10, radius 4px) + label/title/short dek; 1px `--rule-dark` dividers; no outlined cards |
| Vehicle card | `.fc` | 1px #DEDAD2, radius 9px, #FAF8F3; image 16:9 (whole car with breathing room); name + outlined body-type badge (10.5px uppercase, radius 4px) + price with `*`; dated footnote under the grid; hover: stronger border + soft shadow + 2.5% image zoom |
| Comparison banner | `.cmp` | Radius 11px. Full-bleed 2.4:1 face-off image (both cars head-on in the right 60%, no text), right-anchored, petrol gradient on the left under the text (max 36% wide). When the banner is wider than 2.4:1 the image covers; when it is taller (desktop, stretched to the news column) the image keeps its full width on the bottom and its top fades into the banner, so no car is trimmed (`@container` on `.cmp-media`). A 2px ember line and the 46px "VS" badge sit in the gap between the cars, positioned from `--s` (gap x, 0–1, `comparison.image.split`) and `--r` (image ratio). ≤1199px: banner fixed at 2.4:1. Mobile: image on top (16:10), text below. Credit on a dark chip, bottom-right. |
| News item | `.ln-item` | 148px thumb (2:1, radius 4px) + title + mono "Kind · date"; 1px `--rule` dividers |
| New & Upcoming card | `.nu-card` | Petrol, radius 10px; grid: text left, 16:9 image right (7% left-edge fade), no text over the image; label chip ("New launch"/"Upcoming"), italic name, status line, ember link |
| Review card | `.lr-card` | Light card, radius 10px; image left (≈51%, 16:10 crop), text right: label, title 19px, dek, mono date/read time, "Read the brief" |
| Tool card | `.tl-card` | Light card, radius 10px, min-height 104px; 44px circular outlined icon + title + one-line description |
| Guide card | `.gd-card` | Light card, radius 10px, 10px padding; image 40% (16:10, radius 6px) + title + dek |
| Culture banner | `.cc-banner` | Petrol, radius 12px, 240px; image right 62% with a 20% left fade (frame ≈3.5:1 so the whole car stays in view; 16:9 image on top on mobile); italic title, dek, primary button, credit |
| Fallback tile | `.fp-tile` | Petrol-2 → petrol gradient with two ember slashes and a mono type label; used when an article has no clean image |
| Category label | `.fp-label` | See §3; chip form on images and dark cards |
| Site article card | `.card` (fp.css §9) | 16:9 image, eyebrow, title, 3-line dek, mono date; used on listing pages and Read Next — to be restyled in Phase 2B |

### Corner radii

2px (site `--radius`, label chips) · 3px (primary button) · 4px (small thumbnails, finder button, badges, icon buttons) · 5px (inputs) · 6px (guide thumbnails) · 9–10px (light cards, New & Upcoming) · 11–13px (comparison banner, culture banner, finder panel).

### Borders and shadows

Light cards: 1px #DEDAD2; hover 1px `--rule-strong` + `0 6px 18px rgba(17,37,46,.08)`. Dropdown: `0 12px 28px rgba(0,0,0,.25)`. No other shadows.

## 12. Images

- **Only clean, text-free crops on the homepage.** Branded social graphics with baked-in headlines are never shown uncropped. Crops are defined in `data/homepage.json` (and `data/cars.json` for cars) and generated by `scripts/make-home-images.py` into `images/home/*.webp` with `data/home-images.json` (width, height, edge colour, `contain` flag).
- **Two ways to define a crop:** `box` = an exact `[left, top, right, bottom]` crop (used for the lead image, comparison pair and culture banner); `subject` = the car's bounding box, from which the script frames the car itself at every slot ratio it can appear in, with the whole car inside the frame, ~7% side and ~9% top/bottom breathing room and the car slightly below centre. `area` keeps the frame away from baked-in headlines; `erase` paints headline text off a plain studio wall (opencv, used only on XEV 9S, Sierra EV, Yangwang Altior and Denza D9 news graphics). New articles: add a `thumb` with a `subject`.
- **One ratio per slot, and the crop is cut at that ratio** (so `cover` never re-crops the car): lead banner 2.4:1 at its own ratio, never re-cropped on desktop · supporting stories 16:10 · Latest Review 16:10 · guide cards 16:10 · Latest News 2:1 · New & Upcoming 16:9 · Featured Cars 16:9 (was 2.4:1; too shallow for SUVs, cars touched the edges) · comparison banner 2.4:1 (cover / full-width, see §11) · Car Culture banner ≈3.5:1 desktop / 16:9 mobile.
- **Fit:** `object-fit: cover` only when the crop matches its frame; when the car cannot fit a slot's ratio inside its `area` the script marks the crop `contain` and the page letterboxes it on its own edge colour instead of cutting the car (`cropImg()` also letterboxes any crop <78% or >130% of its frame ratio). Never `object-fit: fill`; never distort. The Nov 2026 audit (`image-framing-audit-*.png` in the refinement screenshots) checked every homepage image at 1440 and 390px.
- **Loading:** lead image `fetchpriority="high"`; everything else `loading="lazy" decoding="async"`; width/height attributes always set (CLS measured 0).
- **Provenance:** AI images carry "AI illustration: FlamingPiston" on the image (hero, comparison, culture). Credits come from the article's own photo caption.
- **Fallback:** `.fp-tile` when no clean image exists; `build-lists.js` prints which stories need one.

## 13. Interaction, focus and motion

- Focus: `:focus-visible` 2px outline — ember on ivory (site default), **teal** inside the header, footer, dark panels and homepage cards (offset 2–3px).
- Hover: title underline (3–5px offset), card border/shadow lift, image zoom 2.5–3% over 0.4s, button darkening.
- No carousel: the lead story is static (removed in the Nov 2026 refinement). All transitions are disabled with `prefers-reduced-motion` (`fp.css` §16).
- Easing: `--ease: cubic-bezier(.2,.7,.2,1)`.

## 14. Accessibility requirements

- Contrast: all text tokens above meet WCAG AA at their sizes (ratios noted in §2). Ember text on ivory must use `--ember-text`; ember on petrol uses `--ember-label`; white on ember uses `--ember-strong`.
- One `<h1>` per page (homepage: visually hidden).
- Semantic landmarks; skip link to `#main`; dropdowns use `aria-expanded`/`aria-controls`; drawer is `role=dialog aria-modal=true`.
- Touch targets ≥ 44px (icon buttons, nav, fields, mobile "View all" links). Tiny inline links (Instagram in the footer) are the known exception.
- Alt text on every content image; decorative images inside links that duplicate a headline are `aria-hidden` and `tabindex=-1`.
- No horizontal overflow at any viewport (checked programmatically at 2560, 1920, 1536, 1440, 1280, 1024, 768 and 390px).

## 15. How each component adapts

| Component | Desktop ≥1280 | Laptop 1024–1279 | Tablet 768–1023 | Mobile <768 |
|---|---|---|---|---|
| Header | Logo left; nav + search right-aligned group | Drawer + search | Drawer + search | 60px, logo 200px |
| Hero | 67/33; lead 40/60 text \| image | Lead full width (44/56) <1200, stories 3-up | Lead full width, stories 3-up | Image on top, text below, stories list |
| Finder | One row | Title + 3 selects + button, intro hidden | 3 columns, title/button full width | 2 columns, budget full width |
| Featured Cars | 4-up | 4-up | 2×2 | 2×2 (1-up ≤389) |
| Comparison + News | Side by side, equal height | Stacked <1200, news 2 columns | Stacked | Image under text; news 1 column |
| New & Upcoming | 2-up | 2-up | 1-up, text \| image | 1-up, image on top |
| Reviews + Tools | 58/42 | 58/42 | Stacked | Review image on top; tools 2×2 stacked icons |
| Guides | 3-up, image beside text | 3-up, image above text | 3-up | 1-up, image beside text |
| Car Culture | Banner | Banner | Banner | Image on top, text below |
| Footer | Brand + 4 columns | Brand + 4 | Brand full width + 2 columns | 2 columns |

## 16. Shared JavaScript (Phase 2A)

| Behaviour | File | Notes |
|---|---|---|
| Masthead dropdowns (Cars, Tools) | `fp.js` §1 | Click, hover (hover devices), ArrowDown/ArrowUp, Esc returns focus to the button, closes on outside click or focus leaving; hover and keyboard no longer interfere |
| Masthead drawer (≤1279px) | `fp.js` §1b | Opens from `#fpMenuBtn`; focus to close button; Tab/Shift+Tab trapped; Esc closes and returns focus; body scroll locked (`body.drawer-open`); links close it |
| Search overlay | `fp.js` §7 | `#fpSearchTrigger` (masthead icon) and the `/` key on every page |
| Back-to-top, card dates, letterboxing, tables, listing filters, article helpers | `fp.js` §2–6b | unchanged |
| Car finder | `fp-home.js` | homepage only |
| Calculators | `fp-tools.js` | tools page only |

Retired in Phase 2A (confirmed unreferenced by every page, template, script and data file): the old mobile menu (`#menuBtn` / `#navCollapse`), the previous homepage hero carousel (`#heroCarousel`) and the `#latestReviewsRow` sorter.

## 17. Retired CSS (Phase 2A) and what was kept

Removed from `fp.css` after a rule-by-rule reference check (a rule was removed only if every selector in it needs a class or id that appears in no HTML page, template, publishing script, JavaScript or data file): 176 rules (≈15 KB) — the old header (`.navbar`, `.main-nav`, `.menu-btn`, `.nav-tools`, `.mobile-only`, `.nav-secondary`, `.fp-search-trigger`), the previous homepage sections (lead block, latest grid, guide cards, performance band, head-to-head cards, standards, Instagram block), the previous hero carousel and its `heroFill` animation, and three leftovers (`.band--deep`, `.band--deep .ig-block`, `.vs-names .vs`). One unused rule (`.fp-head--rule`) was removed from `fp-home.css`.

**Kept on purpose** (unreferenced today, but generic components that may be meant for Phases 2B/2C/5 — decide then): `.mono`, `.arrow-link` family, `.band--tight`, `.band--ivory2`, `.band--petrol2`, `.sec-head` family, `.card--row` / `.list-rail` card variants, `.listing-note`, `.review-meta`, `.rating-badge`, `.info-head`, `.about-sec`, `.contact-card .mail`, `.concept-note`, and `.answer` (the word appears in article text, so it cannot be ruled out statically). The `.logo` rules stay: the footer logo uses them.

## 18. Remaining page-specific design differences (after Phase 2A)

| Area | Difference from the homepage language | Phase |
|---|---|---|
| Listing pages | Old page head, text-tab filters and 16:9 `.card` grid (now aligned to the 1440px container) | 2B |
| Articles | Old article typography/blocks; `--gutter` (4vw) instead of `--page-gutter` (2.6vw); text-baked hero graphics | 2C |
| Info, legal, author, sitemap, 404 | Old info-page styling; 404 uses old `.btn` buttons | 5 |
| Tools page | Own calculator styling (petrol result panels) inside the global shell | 4/5 |
| Section headings | Homepage uses `.fp-head` (italic titles, "View all"); other pages use `.page-head` / article headings | 2B/2C |
| Buttons | Homepage `.fp-btn` (ember) vs site `.btn` (petrol) | 2B/2C |

## 19. Homepage banner images (made for the layout, chosen automatically)

Five spots use a purpose-made banner: lead story (`hero`, 2.4:1), comparison (`compare`, 2.4:1), New & Upcoming launch and upcoming cards (`launch` / `upcoming`, 3:1) and the Car Culture banner (`culture`, 4:1). Car on the right, dark empty left side, no baked-in text. Each spot shows the **newest story of its type with a banner** (`pickBanner()` in `build-lists.js`; `pinned` overrides); a story without one never displaces a good banner, and the build lists newer stories missing one. `make-home-images.py` checks each banner's ratio, that the car starts right of the text zone, and the required `split` / `status`. The full-bleed layouts: `.hl` (§11), `.cmp` (§11), `.nu-card--bleed` and `.cc-banner--bleed` (end of `fp-home.css`): image at its own ratio in one grid cell with the text over a petrol gradient (solid → 0 by ~46%); on phones the image goes on top (16:9 or 16:10, right-anchored) fading into the text. Until a `launch` / `upcoming` / `culture` banner exists, those spots use the older split card / banner. Sizes, data fields, workflow and the five prompt templates: **`docs/HOMEPAGE-BANNERS.md`**.
