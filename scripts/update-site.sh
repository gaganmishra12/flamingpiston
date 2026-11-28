#!/bin/sh
# update-site.sh — run after adding or editing any article (from the site root):  sh scripts/update-site.sh
# 1. homepage image crops and banners   2. sitemap, RSS feed, search index
# 3. listing pages + homepage sections   4. shared header/footer on every page
# Homepage sections and listings then show the newest stories (rules: docs/PUBLISHING.md). New articles are
# registered in data/articles.json as Priority 3. Read the Registered / WARN / NOTE / Tip lines it prints.
# FP_BUILD_DATE=2026-12-01T09:00:00+05:30 sh scripts/update-site.sh  simulates a later rebuild (tests only).
set -e
cd "$(dirname "$0")/.."
python3 scripts/make-home-images.py || true
node scripts/reindex.js
node scripts/build-lists.js
node scripts/apply-shell.js
