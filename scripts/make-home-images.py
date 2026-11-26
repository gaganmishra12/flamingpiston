#!/usr/bin/env python3
"""
make-home-images.py — makes the clean, text-free homepage crops.

Reads data/homepage.json ("images", "comparison") and data/cars.json (car "image"),
cuts each 'box' ([left, top, right, bottom] as fractions of the source image) out of
the source photo, resizes it (never upscales) and saves a WebP in images/home/.
It also writes data/home-images.json, which build-lists.js uses for width/height
and the letterbox colour.

Usage (from the site root, needs Pillow:  pip install pillow):
    python3 scripts/make-home-images.py
Then run:  node scripts/build-lists.js
Safe to run again: unchanged crops are skipped.
"""
import hashlib, json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'images', 'home')
WIDTH = {'hero': 1200, 'thumb': 520, 'car': 760, 'vs': 760, 'card': 760, 'banner': 1400}
QUALITY = 78

def load(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)

def slug(url):
    s = url.strip('/').replace('.html', '').replace('/', '-')
    return s or 'home'

jobs = []   # (key, role, spec)
home = load('data/homepage.json')
for url, roles in home.get('images', {}).items():
    if url.startswith('_'):
        continue
    for role, spec in roles.items():
        jobs.append((f'{url}#{role}', role, spec, f'{slug(url)}-{role}'))
cmp = home.get('comparison') or {}
for side in ('left', 'right'):
    if cmp.get(side):
        jobs.append((f'comparison#{side}', 'vs', cmp[side], f'{slug(cmp["url"])}-{side}'))
for i, item in enumerate((home.get('newUpcoming') or {}).get('items', [])):
    if item.get('image'):
        jobs.append((f'upcoming#{item["url"]}', 'card', item['image'], f'upcoming-{slug(item["url"])}'))
if (home.get('carCulture') or {}).get('image'):
    jobs.append(('culture#banner', 'banner', home['carCulture']['image'], 'car-culture-banner'))
for car in load('data/cars.json').get('cars', []):
    if car.get('image'):
        jobs.append((f'car:{car["id"]}', 'car', car['image'], f'car-{car["id"]}'))

os.makedirs(OUT, exist_ok=True)
manifest, made, kept, problems = {}, 0, 0, []
for key, role, spec, name in jobs:
    src = os.path.join(ROOT, spec['src'])
    if not os.path.exists(src):
        problems.append(f'missing source {spec["src"]} ({key})'); continue
    box = spec.get('box', [0, 0, 1, 1])
    sig = hashlib.md5(json.dumps([spec['src'], box, WIDTH[role], QUALITY, os.path.getmtime(src)]).encode()).hexdigest()[:10]
    rel = f'images/home/{name}.webp'
    dst = os.path.join(ROOT, rel)
    im = Image.open(src).convert('RGB')
    W, H = im.size
    crop = im.crop((round(box[0] * W), round(box[1] * H), round(box[2] * W), round(box[3] * H)))
    w = min(WIDTH[role], crop.width)
    h = round(crop.height * w / crop.width)
    # average colour of the left and right edges: used behind letterboxed ('contain') images
    edge = crop.crop((0, 0, 4, crop.height)).resize((1, 1)).getpixel((0, 0))
    edge2 = crop.crop((crop.width - 4, 0, crop.width, crop.height)).resize((1, 1)).getpixel((0, 0))
    bg = '#%02x%02x%02x' % tuple((a + b) // 2 for a, b in zip(edge, edge2))
    old = None
    try:
        old = load('data/home-images.json').get(key)
    except Exception:
        pass
    if old and old.get('sig') == sig and os.path.exists(dst):
        kept += 1
    else:
        crop.resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=QUALITY, method=6)
        made += 1
    manifest[key] = {'file': rel, 'w': w, 'h': h, 'bg': bg, 'sig': sig}

with open(os.path.join(ROOT, 'data', 'home-images.json'), 'w', encoding='utf-8') as f:
    json.dump(dict(sorted(manifest.items())), f, indent=1)
    f.write('\n')
used = {v['file'].split('/')[-1] for v in manifest.values()}
stale = [n for n in os.listdir(OUT) if n.endswith('.webp') and n not in used]
for n in stale:
    os.remove(os.path.join(OUT, n))
print(f'Homepage images: {made} made, {kept} unchanged, {len(stale)} old removed.')
for p in problems:
    print('WARN:', p)
sys.exit(1 if problems else 0)
