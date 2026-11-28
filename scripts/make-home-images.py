"""
make-home-images.py — makes the clean, text-free homepage crops.

Reads data/homepage.json ("images", "comparison", "newUpcoming", "carCulture") and
data/cars.json (car "image"), cuts a crop out of each source photo, resizes it (never
upscales) and saves a WebP in images/home/. It also writes data/home-images.json, which
build-lists.js uses for width/height, the letterbox colour and the file name.

Two ways to describe a crop (fractions of the source image, [left, top, right, bottom]):

  "box":     an exact crop. Used as it is.
  "subject": the car's bounding box. The script frames it itself, at the aspect ratio of
             every homepage slot the image can appear in (see RATIOS), keeping the whole
             car inside the frame with breathing room around it and the car slightly below
             centre. Optional "area" limits where the frame may go (for example to keep a
             baked-in headline out); default is the whole image. If the car cannot fit at a
             ratio inside the area, the frame is made as wide as the car needs and the
             manifest marks it "contain", so the page letterboxes it on its edge colour
             instead of cutting the car.

  "erase":   optional list of boxes that contain baked-in headline text next to the car.
             Bright text pixels inside them are painted out (needs opencv-python; skipped
             with a warning if it is not installed). Use only on plain studio walls.
  "eraseAll": true with "erase": also paints out coloured headline text (red, orange, blue…) and
             logos, with a stronger fill; for posters with big titles. The car is never painted:
             "keep" (list of boxes, default [subject]) marks what must stay untouched.
             "clear" (list of boxes) is painted out whole, not just its bright pixels: for faint
             outlines, icon frames and thin watermarks on a plain dark backdrop.
  "fill":    true: when the car does not fit the ratio inside the area, the frame is still built
             around the whole car and the few missing pixels at its edges are filled by stretching
             the photo's own edge, softly blurred, instead of letterboxing. The photo then fills
             the card (Phase 2B listings). Use with "erase" on the full image rather than a narrow area.

Homepage slot ratios (keep in step with assets/fp-home.css):
  hero  box          lead story: 2.4:1 banner, car on the right, dark empty left for the headline
  thumb 1.6  (16:10)  latest review, guide cards
  thumb 2.0  (2:1)    (Latest News list until the 27 Nov 2026 refinement; kept so old crops are not deleted)
  thumb 1.78 (16:9)   Latest Stories rows (560px)
  story 1.78 (16:9)   Latest Stories lead story (1200px, same "thumb" spec)
  card  1.78 (16:9)   New & Upcoming (older split cards, newUpcoming.items)
  tall  0.86 (6:7)    Latest Reviews, optional: a squarish photo that fills the card's full height (desktop)
  bthumb             compact thumbnails cut from a homepage banner's "subject": comparison pair 16:10,
                     New & Upcoming launch / upcoming 16:9 (27 Nov 2026 refinement: no full-bleed banners there)
  car   1.78 (16:9)   Featured Cars (2.4:1 until Nov 2026: too shallow for SUVs)
  feature            homepage banners ("banners" in homepage.json): used whole, checked against
                     their kind (hero/compare 2.4:1, launch/upcoming 3:1, culture ≈4.4:1 after a vertical 'box' crop)
  banner              Car Culture banner ("box" crop, cover)

Usage (from the site root, needs Pillow:  pip install pillow):
    python3 scripts/make-home-images.py
Then run:  node scripts/build-lists.js
Safe to run again: unchanged crops are skipped.
"""
import hashlib, json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'images', 'home')
WIDTH = {'hero': 1600, 'thumb': 560, 'tall': 720, 'story': 1200, 'bthumb': 760, 'car': 760, 'vs': 1600, 'card': 900, 'banner': 1400, 'feature': 1600}
# Homepage banners (data/homepage.json "banners"): expected ratio, the furthest left the car may start, output width
BANNER = {'hero': (2.4, 0.38, 1600), 'compare': (2.4, 0.33, 1600), 'launch': (3.0, 0.40, 1400), 'upcoming': (3.0, 0.40, 1400), 'culture': (4.4, 0.45, 2000)}
RATIOS = {'hero': [1.6], 'tall': [6 / 7], 'thumb': [1.6, 2.0, 16 / 9], 'story': [16 / 9], 'card': [16 / 9], 'car': [16 / 9]}
BTHUMB = {'compare': 1.6, 'launch': 16 / 9, 'upcoming': 16 / 9}   # banner kind -> compact thumbnail ratio
SUFFIX = {1.6: '16x10', 2.0: '2x1', 16 / 9: '16x9', 2.4: '12x5', 6 / 7: '6x7'}
PAD_X, PAD_Y = 0.07, 0.09     # breathing room around the car, as a share of the frame
PADS = {'car': (0.09, 0.13)}  # Featured Cars: a little more air, the car is the whole card
LOWER = 0.04                  # put the car this much (share of frame height) below centre
QUALITY = 80
VERSION = 3                   # bump to force every crop to be remade

def load(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return json.load(f)

def slug(url):
    s = url.strip('/').replace('.html', '').replace('/', '-')
    return s or 'home'

def frame(W, H, subject, area, r, pad=(PAD_X, PAD_Y)):
    """Pixel crop box of ratio r around the subject, inside area. Returns (box, fits)."""
    sl, st, sr, sb = subject[0] * W, subject[1] * H, subject[2] * W, subject[3] * H
    al, at, ar, ab = area[0] * W, area[1] * H, area[2] * W, area[3] * H
    sw, sh = sr - sl, sb - st
    px, py = pad
    w = max(sw / (1 - 2 * px), sh / (1 - 2 * py) * r)
    w = min(w, ar - al, (ab - at) * r)          # largest frame the area allows
    h = w / r
    fits = w >= sw - 1 and h >= sh - 1
    if not fits:                                # car wider/taller than the frame: frame the car, page letterboxes it
        w, h = max(w, min(sw * 1.04, ar - al)), max(h, min(sh * 1.04, ab - at))
    cx, cy = (sl + sr) / 2, (st + sb) / 2 - LOWER * h
    l = min(max(cx - w / 2, al), ar - w)
    t = min(max(cy - h / 2, at), ab - h)
    return (round(l), round(t), round(l + w), round(t + h)), fits

_erased = {}
def source(spec, problems, key):
    path = os.path.join(ROOT, spec['src'])
    im = Image.open(path).convert('RGB')
    if not spec.get('erase'):
        return im
    sig = json.dumps([spec["src"], spec["erase"], spec.get("eraseAll"), spec.get("keep", [spec["subject"]]), spec.get("clear")])
    if sig in _erased:
        return _erased[sig].copy()
    try:
        import cv2, numpy as np
    except ImportError:
        problems.append(f'{key}: "erase" needs opencv-python (pip install opencv-python); headline text left in')
        return im
    a = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    H, W = a.shape[:2]
    mask = np.zeros((H, W), np.uint8)
    every = spec.get('eraseAll')    # also coloured (orange, blue…) headline text; for posters with big titles
    for l, t, r, b in spec['erase']:
        x0, y0, x1, y1 = int(l * W), int(t * H), int(r * W), int(b * H)
        hsv = cv2.cvtColor(a[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
        hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
        if every:                   # light or coloured pixels, or anything that stands out from its local backdrop
            g = cv2.cvtColor(a[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
            back = cv2.medianBlur(cv2.copyMakeBorder(g, 30, 30, 30, 30, cv2.BORDER_REFLECT), 61)[30:-30, 30:-30]
            text = ((vv > 120) & (ss < 80)) | ((ss > 110) & (vv > 110)) | (cv2.absdiff(g, back) > 18)
        else:
            text = ((vv > 150) & (ss < 70)) | (((hh < 12) | (hh > 165)) & (ss > 90) & (vv > 90))
        mask[y0:y1, x0:x1] = text.astype(np.uint8) * 255
    if every:
        for l, t, r, b in spec.get('clear', []):
            mask[int(t * H):int(b * H), int(l * W):int(r * W)] = 255
        # never paint over the car itself
        for s in spec.get('keep', [spec['subject']]):
            mask[int(s[1] * H):int(s[3] * H), int(s[0] * W):int(s[2] * W)] = 0
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=3)
        a = cv2.inpaint(a, mask, 15, cv2.INPAINT_NS)
    else:
        mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=2)
        a = cv2.inpaint(a, mask, 9, cv2.INPAINT_TELEA)
    out = Image.fromarray(cv2.cvtColor(a, cv2.COLOR_BGR2RGB))
    _erased[sig] = out
    return out.copy()

def filled(im, spec, r):
    """Frame of ratio r around the whole car when it is wider (or taller) than the area allows: the frame is taken
    from the area and any part outside it is filled by stretching the area's own edge pixels, softly blurred, so the
    photo fills the slot instead of being letterboxed. Used only with "fill": true (small gaps on plain backdrops)."""
    import cv2, numpy as np
    W, H = im.size
    al, at, ar, ab = [round(v * d) for v, d in zip(spec.get('area', [0, 0, 1, 1]), (W, H, W, H))]
    sl, st, sr, sb = [v * d for v, d in zip(spec['subject'], (W, H, W, H))]
    fw = max((sr - sl) * 1.04, (sb - st) * 1.08 * r)
    fw = max(fw, min(ar - al, (ab - at) * r))           # never smaller than the largest frame the area holds
    fh = fw / r
    cx, cy = (sl + sr) / 2, (st + sb) / 2
    l = cx - fw / 2 if fw > ar - al else min(max(cx - fw / 2, al), ar - fw)
    t = ab - fh if fh > ab - at else min(max(cy - fh / 2, at), ab - fh)   # too tall: pad the backdrop above, not the floor
    l, t, fw, fh = round(l), round(t), round(fw), round(fh)
    sub = cv2.cvtColor(np.array(im.crop((al, at, ar, ab))), cv2.COLOR_RGB2BGR)
    pl, pt, pr, pb = max(0, al - l), max(0, at - t), max(0, l + fw - ar), max(0, t + fh - ab)
    ext = cv2.copyMakeBorder(sub, pt, pb, pl, pr, cv2.BORDER_REPLICATE)
    blur = cv2.GaussianBlur(ext, (0, 0), max(6, fw * 0.02))
    m = np.zeros(ext.shape[:2], np.float32); m[pt:pt + sub.shape[0], pl:pl + sub.shape[1]] = 1
    m = cv2.GaussianBlur(m, (0, 0), max(3, fw * 0.006))[..., None]
    out = (ext * m + blur * (1 - m)).astype(np.uint8)
    x0, y0 = l - al + pl, t - at + pt
    out = out[y0:y0 + fh, x0:x0 + fw]
    return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))

jobs = []   # (key, role, spec, file-name, ratio or None)
def add(key, role, spec, name):
    if spec.get('subject'):
        for r in RATIOS[role]:
            k = key if len(RATIOS[role]) == 1 else f'{key}@{SUFFIX[r]}'
            jobs.append((k, role, spec, f'{name}-{SUFFIX[r]}', r))
    else:
        jobs.append((key, role, spec, name, None))

home = load('data/homepage.json')
for url, roles in home.get('images', {}).items():
    if url.startswith('_'):
        continue
    for role, spec in roles.items():
        add(f'{url}#{role}', role, spec, f'{slug(url)}-{role}')
        if role == 'thumb' and spec.get('subject'):      # large 16:9 crop for the Latest Stories lead
            add(f'{url}#story', 'story', spec, f'{slug(url)}-story')
cmp = home.get('comparison') or {}
if cmp.get('image'):
    add('comparison#image', 'vs', cmp['image'], f'{slug(cmp["url"])}-pair')
for item in (home.get('newUpcoming') or {}).get('items', []):
    if item.get('image'):
        add(f'upcoming#{item["url"]}', 'card', item['image'], f'upcoming-{slug(item["url"])}')
for url, spec in (home.get('banners') or {}).items():
    if url.startswith('_'):
        continue
    jobs.append((f'banner#{url}', 'feature', spec, f'banner-{slug(url)}', None))
    kinds = spec.get('kind') if isinstance(spec.get('kind'), list) else [spec.get('kind')]
    r = next((BTHUMB[k] for k in kinds if k in BTHUMB), None)
    if r and spec.get('subject'):                       # compact thumbnail of the car(s) for the Compare / New & Upcoming modules
        jobs.append((f'bthumb#{url}', 'bthumb', spec, f'bthumb-{slug(url)}-{SUFFIX[r]}', r))
if (home.get('carCulture') or {}).get('image'):
    add('culture#banner', 'banner', home['carCulture']['image'], 'car-culture-banner')
for car in load('data/cars.json').get('cars', []):
    if car.get('image'):
        add(f'car:{car["id"]}', 'car', car['image'], f'car-{car["id"]}')

try:
    old_manifest = load('data/home-images.json')
except Exception:
    old_manifest = {}
os.makedirs(OUT, exist_ok=True)
manifest, made, kept, problems = {}, 0, 0, []
for key, role, spec, name, ratio in jobs:
    src = os.path.join(ROOT, spec['src'])
    if not os.path.exists(src):
        problems.append(f'missing source {spec["src"]} ({key})'); continue
    rel = f'images/home/{name}.webp'
    dst = os.path.join(ROOT, rel)
    sig = hashlib.md5(json.dumps([VERSION, spec, ratio, WIDTH[role], str(spec.get('kind')), QUALITY, PADS.get(role, (PAD_X, PAD_Y)), LOWER, os.path.getmtime(src)], sort_keys=True).encode()).hexdigest()[:10]
    old = old_manifest.get(key)
    if old and old.get('sig') == sig and old.get('file') == rel and os.path.exists(dst):
        manifest[key] = old; kept += 1; continue
    im = source(spec, problems, key)
    W, H = im.size
    fits = True
    if ratio:
        box, fits = frame(W, H, spec['subject'], spec.get('area', [0, 0, 1, 1]), ratio, PADS.get(role, (PAD_X, PAD_Y)))
        if not fits and not spec.get('fill'):
            problems.append(f'{key}: car does not fit a {ratio:.2f} frame inside its area; letterboxed')
    else:
        b = spec.get('box', [0, 0, 1, 1])
        box = (round(b[0] * W), round(b[1] * H), round(b[2] * W), round(b[3] * H))
    if ratio and not fits and spec.get('fill'):
        crop, fits = filled(im, spec, ratio), True
    else:
        crop = im.crop(box)
    width = WIDTH[role]
    if role == 'feature':                       # homepage banner: check it was made for the layout
        kinds = spec.get('kind') if isinstance(spec.get('kind'), list) else [spec.get('kind')]
        if not kinds or any(k not in BANNER for k in kinds):
            problems.append(f'{key}: banner "kind" must be one of {", ".join(BANNER)} (or a list of them)'); continue
        kind = kinds[0]                         # the first kind sets the expected proportions
        want, min_left, width = BANNER[kind]
        r = crop.width / crop.height
        if abs(r - want) / want > 0.08:
            problems.append(f'{key}: banner is {crop.width}x{crop.height} ({r:.2f}:1); a {kind} banner should be {want}:1')
        sub = spec.get('subject')
        if not sub:
            problems.append(f'{key}: add "subject" (the car\'s box) so the layout can be checked')
        elif sub[0] < min_left - 0.03:
            problems.append(f'{key}: the car starts at {sub[0]:.2f} of the width; for a {kind} banner it must start right of {min_left:.2f} or the text will cover it')
        if 'compare' in kinds and not spec.get('split'):
            problems.append(f'{key}: compare banner needs "split" (x of the gap between the cars)')
        if any(k in ('launch', 'upcoming') for k in kinds) and not spec.get('status'):
            problems.append(f'{key}: a launch/upcoming banner needs "status" (one dated line from the story)')
    w = min(width, crop.width)
    h = round(crop.height * w / crop.width)
    # average colour of the left and right edges: used behind letterboxed ('contain') images
    edge = crop.crop((0, 0, 4, crop.height)).resize((1, 1)).getpixel((0, 0))
    edge2 = crop.crop((crop.width - 4, 0, crop.width, crop.height)).resize((1, 1)).getpixel((0, 0))
    bg = '#%02x%02x%02x' % tuple((a + b) // 2 for a, b in zip(edge, edge2))
    crop.resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=QUALITY, method=6)
    made += 1
    entry = {'file': rel, 'w': w, 'h': h, 'bg': bg, 'sig': sig}
    if not fits:
        entry['contain'] = True
    manifest[key] = entry

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
sys.exit(1 if [p for p in problems if p.startswith('missing')] else 0)
