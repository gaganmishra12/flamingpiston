# FlamingPiston redesign — how it works now (20 November 2026)

## Going live
1. Unzip the update and copy everything into your `flamingpiston` repo folder, replacing files when asked.
2. Delete the files listed in `DELETE-THESE.txt`.
3. Open GitHub Desktop and look through the changes (about 220 files: 119 new, 101 changed, plus the deletions).
4. Commit with a message such as "Site redesign", then **Push origin**. Hostinger deploys it automatically.
5. Open flamingpiston.com in a private window and press Ctrl+F5 once (on a phone, pull to refresh) so the old styles are not served from cache.

Nothing goes live until you push.

## What changed
- **Design.** All styling now lives in one file, `assets/fp.css`. All behaviour (menu, search, hero rotation, news filters, card dates) lives in `assets/fp.js`. The old `style.css`, `site-search.*` and `card-dates.js` are retired.
- **Fonts.** Familjen Grotesk (headings), Inter (text) and IBM Plex Mono (labels) are now served from `assets/fonts/` on your own site instead of from Google Fonts.
- **Logo and favicons.** These come from the brand pack, in `assets/brand/`.
  - `images/logo.png` is now the new logo, so Google's article data shows it automatically.
  - There is no tagline anywhere.
- **Pages.**
  - New homepage.
  - Compact News, Reviews, Guides and Comparisons pages.
  - News has filter chips.
  - New Car Culture page (`car-culture.html`).
  - Custom error page (`404.html`, switched on in `.htaccess`).
  - New-look About and Contact pages.
- **Article pages.** The text inside every article is byte-for-byte the same. Only the header, footer and styling around it changed.
- **Unchanged.** URLs, titles, descriptions, canonicals, structured data, analytics, sitemap, RSS and search all work as before.

## After publishing a new article
Run these from the repo folder:

```
python3 scripts/make-thumbs.py      # small card images (optional; on Windows type "python" instead of "python3"; needs: pip install pillow)
node scripts/reindex.js             # search index, sitemap, RSS (as before)
node scripts/build-lists.js         # homepage hero + lists, section pages, news filters, author page
```

- If you copied an article from an **old** page or template, also run `node scripts/apply-shell.js`. It puts the new header and footer on any page still using the old ones. It is safe to run any time, because it only changes what needs changing.
- `build-lists.js` builds the cards from each article's `<h1>`, meta description, `og:image` and date.
  - Every article needs those, as before.
  - Make sure the new page is not redirected in `.htaccess`.
  - It does not need `noindex`.
- If `build-lists.js` prints a "Tip" about thumbnails, run `make-thumbs.py` and then `build-lists.js` again. Without thumbnails the cards still work; they just load the full-size photo.

## Car Culture and "Global Performance"
- The Car Culture page and the homepage's Global Performance row both read from `data/car-culture.json`.
- To add a story, add its URL to the list in that file and run `node scripts/build-lists.js`. Newest stories come first automatically.

## Homepage hero
- The hero always shows the 5 newest articles and rotates every 7 seconds.
- Rotation pauses on hover or keyboard focus, and has a pause button.
- It never auto-plays for visitors who have reduced motion switched on.
