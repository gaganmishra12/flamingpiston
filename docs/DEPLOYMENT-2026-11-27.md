# Deployment: approved consolidated homepage (27 Nov 2026)

**Approved by Gagan on 27 Nov 2026.** This is the final package for the consolidated editorial homepage and publishing system. Gagan deploys it through GitHub Desktop. Nobody else commits, pushes or deploys. Phase 2B has not started.

## Baseline

- `D:\flamingpiston` is on branch `main` at **0a8ec64**, the same commit as `origin/main` and the live site.
- The working tree matched the git index when work began.
- Re-checked at packaging: every file and the git metadata have unchanged timestamps and sizes. Nothing was written to the folder.
- The package is a set of files to copy over this baseline. **It deletes nothing.**

## Package contents

`flamingpiston-deploy-2026-11-27.zip` holds **134 files: 32 modified, 102 added**. The full list is in `deploy-changed-files.txt`.

| Group | Files |
|---|---|
| Homepage | `index.html`, `assets/fp-home.css`, `assets/fp-home.js` |
| Publishing system | `scripts/build-lists.js`, `editorial.js` (new), `reindex.js`, `make-home-images.py`, `apply-shell.js`, `update-site.sh`, `test-publishing.py` (new) |
| Data | `data/articles.json` (new registry), `data/article-catalog.json` (generated), `data/homepage.json`, `data/home-images.json` |
| Homepage crops | 69 new WebP files in `images/home/` |
| Generated pages and feeds | `news.html`, `reviews.html`, `guides.html`, `car-culture.html`, `author-gagan-mishra.html` (same stories as before; same-day ordering now by URL), `sitemap.xml`, `feed.xml` |
| Access control | `.htaccess`: `drafts/` blocked, plus the generated `FP:UNPUBLISHED` block (empty today) |
| Pending revisions (not public) | `drafts/guides/innova-hycross-facelift-buy-now-or-wait/index.html`, `drafts/news-toyota-innova-hycross-facelift-teaser.html` |
| Documentation | `CLAUDE.md`; `docs/` `DESIGN-SYSTEM`, `HOMEPAGE-BANNERS`, `SITE-ARCHITECTURE`, `DEVELOPMENT-ROADMAP`, `PUBLISHING` (new), `HOMEPAGE-REFINEMENT`, `CONSOLIDATION`, `FINAL-QA`, and this file |
| Visual references | `docs/design-references/home-*.jpg` replaced by the approved 27 Nov set (9 viewports) and its README updated. Earlier homepages backed up in `archive-2026-11-26-approved/` (the previous approved set, unchanged) and `pre-refinement-2026-11-27/` (the live homepage before this change) |

**Not included:** test fixtures (created and deleted inside a temporary copy), temporary files, logs, caches, the git folder, screenshots outside `docs/design-references/`, and any credentials. I scanned the file list and contents for these before packaging. Every article page and its URL, title, description, canonical, structured data and date is unchanged on the public site.

## Checks run on the final package

- `sh scripts/update-site.sh`, the complete publishing workflow: ran clean. A second run changed nothing (idempotent, RSS and `.htaccess` included).
- `python3 scripts/test-publishing.py`: **40/40 passed**. It covers all five story types, draft, review, scheduled and revision rules, direct-URL protection on Apache 2.4, lead choice, lead expiry and the missing-banner fallback, exclusions and idempotency. Its temporary copy was deleted.
- Homepage functional checks: **35/35 passed**.
- Full-page Chromium screenshots at 2560, 1920, 1536, 1440, 1280, 1024, 768, 390 and 375px: no horizontal overflow, no missing files, no 4xx responses, no console errors.

## How to deploy (GitHub Desktop)

1. **Optional backup:** copy `D:\flamingpiston` to another folder, or rely on git (0a8ec64).
2. Unzip `flamingpiston-deploy-2026-11-27.zip` and copy everything inside it into `D:\flamingpiston`. Choose **Replace** for existing files. **Do not delete any folders or files.**
3. In GitHub Desktop, check the change list. It should show 32 modified and 102 new files, with no deletions.
4. Commit to `main` (suggested message: *Approved consolidated editorial homepage and publishing system*), then **Push origin**.
5. **After Hostinger deploys,** check these:
   - `https://flamingpiston.com/` shows the new homepage. Hard-refresh once; the homepage CSS/JS version is `20261127c`.
   - The six Latest Stories tabs switch.
   - `https://flamingpiston.com/data/articles.json` and `https://flamingpiston.com/drafts/` both return **404**.
   - An existing article (for example the Thar Roxx brief) opens normally.

**First rebuild on your PC:** when you next run `sh scripts/update-site.sh`, GitHub Desktop may show `data/home-images.json` as changed. Only its internal `"sig"` values change, because the image script fingerprints files by their timestamps on your machine. The images themselves come out byte-identical (checked by applying this package to a copy of 0a8ec64 and rebuilding). Commit that change with your next update.

## Publishing from now on

`docs/PUBLISHING.md` is the single guide. In short:
1. Add the article. Drafts and revisions go in `drafts/`.
2. Add its `thumb` in `data/homepage.json`.
3. Run `sh scripts/update-site.sh` and read what it prints.
4. Set the priority in `data/articles.json`.
5. Run `sh scripts/update-site.sh` again, **always before deploying**.
6. Deploy as above.

The rewritten Hycross guide and the teaser's update wait in `drafts/` for your approval (see `docs/PUBLISHING.md` §5).
