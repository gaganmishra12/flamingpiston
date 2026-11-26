#!/bin/sh
# update-site.sh — run after adding or editing any article (from the site root):  sh scripts/update-site.sh
# 1. homepage image crops and banners   2. sitemap, RSS feed, search index
# 3. listing pages + homepage sections   4. shared header/footer on every page
# Every homepage section then shows the newest article of its kind. Read the WARN / NOTE / Tip lines it prints:
# they name stories that still need a homepage banner or a clean thumbnail.
set -e
cd "$(dirname "$0")/.."
python3 scripts/make-home-images.py || true
node scripts/reindex.js
node scripts/build-lists.js
node scripts/apply-shell.js
