#!/usr/bin/env python3
"""Make small card thumbnails for FlamingPiston.

For every image in /images that is at least 900 px wide, writes an 800 px wide
WebP copy to /images/thumbs/<same-name>.webp (skips ones already made).
build-lists.js uses a thumbnail on cards when one exists and falls back to the
full image when it doesn't, so this step is optional but makes pages much lighter.

Run from the project folder:   python3 scripts/make-thumbs.py
Needs Pillow once:             pip install pillow
"""
import os, sys
try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT = os.path.join(SRC, "thumbs")
WIDTH, QUALITY = 800, 74
os.makedirs(OUT, exist_ok=True)
made = 0
for name in sorted(os.listdir(SRC)):
    base, ext = os.path.splitext(name)
    if ext.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        continue
    dest = os.path.join(OUT, base + ".webp")
    if os.path.exists(dest) and os.path.getmtime(dest) >= os.path.getmtime(os.path.join(SRC, name)):
        continue
    with Image.open(os.path.join(SRC, name)) as im:
        if im.width < 900:
            continue
        im = im.convert("RGB")
        h = round(im.height * WIDTH / im.width)
        im.resize((WIDTH, h), Image.LANCZOS).save(dest, "WEBP", quality=QUALITY, method=6)
        made += 1
print(f"Thumbnails: {made} new, {len(os.listdir(OUT))} total in images/thumbs/")
