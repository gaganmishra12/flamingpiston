# CLAUDE.md — working on FlamingPiston

Permanent instructions for every Claude session that touches this repository. Read this file first.

## Read before you build

1. `docs/PRODUCT-VISION.md` — before any major feature or content work.
2. `docs/DESIGN-SYSTEM.md` — before any visual change. Follow it; do not invent new styles.
3. `docs/SITE-ARCHITECTURE.md` — what exists, which URLs are permanent, how pages are generated.
4. `docs/DEVELOPMENT-ROADMAP.md` — which phase is approved. Work only inside the approved phase.
5. `docs/design-references/` — screenshots of the approved homepage. Every new page inherits this visual language.

If the documentation and the code disagree, trust the code, then fix the documentation.

## The homepage is locked

The approved homepage (26 Nov 2026) is final: masthead with descriptor under the logo, navigation, static lead story (text left, 16:10 image right; no carousel since the 26 Nov refinement), supporting stories, Find Your Next Car, Featured Cars, featured comparison, Latest News, New & Upcoming Cars, Latest Reviews, Buying Tools, Buying & Ownership Guides, Car Culture banner and footer.

- Do not redesign, restructure, restyle or add sections to it unless Gagan explicitly asks.
- Its content updates through `data/homepage.json`, `data/cars.json` and `scripts/build-lists.js`; editing that data is fine, changing its design is not.
- After any change to shared files (`fp.css`, `fp.js`, `apply-shell.js`, `build-lists.js`), re-screenshot the homepage and compare it with `docs/design-references/`. Use reduced motion, declined cookies, eager images and wait for image decoding so screenshots are deterministic; the Phase 2A standard was 0 changed pixels at all 8 viewports.

*Homepage = Discovery. Internal pages = Depth.*

## Architecture rules

- Keep the stack: static HTML, CSS, vanilla JavaScript, Node/Python helper scripts, GitHub → Hostinger. No framework, CMS, database or backend unless Gagan explicitly authorizes it (Supabase only when a phase justifies it).
- Do not add dependencies a solo founder would have to maintain. Prefer simple, affordable, maintainable solutions.
- Reuse existing components (see the component list in `docs/DESIGN-SYSTEM.md`) before writing new ones.
- Keep one width system: `.fp-container` (1440px + `--page-gutter`). Never use `100vw` for content, page-wide `transform: scale`, or fixed widths that overflow. Fix overflow at its source; never hide it with `overflow-x: hidden`.
- Never distort images. Use controlled aspect ratios, `object-fit: cover` with focal positions, or `contain` on a matching background when cropping would cut the car.

## Publishing automation must keep working

- Shared head, header, footer and search overlay come from `scripts/apply-shell.js`; listing cards and homepage sections from `scripts/build-lists.js`; sitemap/RSS/search index from `scripts/reindex.js`; homepage crops from `scripts/make-home-images.py`.
- Since Phase 2A there is **one global masthead and one global footer** (`header()` / `FOOTER` in `apply-shell.js`, CSS `fp.css` §5b and §14, JS `fp.js` §1). Never hand-edit them in pages, and never add homepage-only JavaScript to the shell. The active nav item comes from the article's editorial type (`sectionOf()`), not its folder.
- All tokens live in `fp.css :root`. Use them (`--ember-strong`, `--card-surface`, `--card-border`, `--on-dark-dek`…) instead of new hex values.
- Before deleting CSS/JS, check every HTML page, `templates/`, `scripts/`, `data/` and the JS files for each class/id (rule by rule); if in doubt, keep it and note it in `DESIGN-SYSTEM.md` §17.
- Change these generators instead of hand-editing generated markup. Keep them idempotent: run each twice and confirm the second run changes nothing.
- `build-lists.js` only writes between `<!-- NAME:START -->` / `<!-- NAME:END -->` markers. Don't remove markers.
- Bump the cache-busting version in `apply-shell.js` (`V` for fp.css/fp.js, `VH` for homepage assets) whenever those files change.

## SEO and URLs

- Never change existing article or page URLs, canonicals, publication dates, author data, titles, meta descriptions or structured data unless asked.
- Canonicals are `https://flamingpiston.com/...` (no www). Titles under 60 characters, descriptions under 155.
- Keep `.htaccess` redirects. New routes need Gagan's approval; never create routes just to fill the architecture.
- Internal files (`docs/`, `data/`, `templates/`, `scripts/`, `*.md`, `*.py`, dot-files) are blocked by `.htaccess` because Hostinger deploys the whole repository. Keep new internal material inside those locations or extensions, and keep the rules when editing `.htaccess`.
- Unfinished pages stay out of the sitemap and carry `noindex` until approved.

## Editorial integrity (non-negotiable)

- Never fabricate vehicle data, prices, specifications, mileage, launch dates, sales figures, safety ratings, quotes or news. Not even as placeholder content to make a layout look full.
- Every price shown outside an article needs a source and a last-checked date (see `data/cars.json`).
- Never claim firsthand driving or ownership. Specification-led assessments are **Buyer's Briefs** and say so.
- Separate confirmed facts from expectations: "expected", "reported", "not confirmed".
- Pre-launch articles must be rewritten around confirmed facts once the launch happens (accuracy gate). Keep them off the homepage until then (`exclude` in `data/homepage.json`).
- Label AI-generated images "AI illustration". Never present them as real launches, prototypes, crash tests or road tests.
- Use licensed or manufacturer-permitted photography and record provenance. On the homepage and in editorial cards, never use promotional graphics with baked-in headlines when a clean alternative exists; crop them clean or use the fallback tile.

## Working practice

1. Run `git status` and `git branch` first. Preserve unrelated local changes. Work on a branch, never directly on `main`.
2. Confirm you are on the latest build before editing (past fixes were lost by working on the wrong copy).
3. Work in the current approved phase only. Stop at the end of the phase and wait for approval.
4. Change the smallest sensible set of files. No unrelated refactors.
5. Verify in a real browser (Playwright/Chromium) at 2560, 1920, 1536, 1440, 1280, 1024, 768 and 390px: screenshots, no horizontal overflow (`scrollWidth > innerWidth`), no console errors, no missing files, working menus/search/forms, keyboard and reduced-motion behaviour.
6. Check links and images after batch edits; open two or three sample pages, not just the script output.
7. **Do not commit, push or deploy without Gagan's approval.** Deliver changed files plus screenshots and notes; Gagan pushes through GitHub Desktop.
8. If a bug is reported on the live site but the source is correct, suspect deployment lag (unpushed files, Hostinger deploy, cache) before changing code.

## Communication

Gagan prefers direct, plain-language answers and wants to see real browser screenshots of visual work. Report limitations, missing assets and anything you could not verify.
