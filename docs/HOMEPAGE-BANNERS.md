# Homepage banners — how the homepage updates itself

Five homepage spots use a **banner**: an image made for the layout, with the car on the right and a dark, empty left side for the text. Each spot automatically shows the **newest article of its type that has a banner**. You make one banner image when you publish the article, and the homepage changes on the next build.

| Spot | Shows the newest… | `kind` | Size | Car sits | Left side (text) |
|---|---|---|---|---|---|
| Lead story (hero) | Buyer's Brief | `hero` | 2400 × 1000 (2.4:1) | right 55%, 80–85% of height | left 40% dark |
| Comparison banner | Comparison | `compare` | 2400 × 1000 (2.4:1) | both cars head-on, right ~62% | left 35% dark |
| New & Upcoming: launch card | news story marked `launch` | `launch` | 2400 × 800 (3:1) | right 55%, ~80% of height | left 45% dark |
| New & Upcoming: upcoming card | news story marked `upcoming` | `upcoming` | 2400 × 800 (3:1) | right 55%, ~80% of height | left 45% dark |
| Car Culture banner | story listed in `data/car-culture.json` | `culture` | 2400 × 800 (3:1), then a vertical `box` crop to ≈4.4:1 | right 45%, between ~17% and ~76% of height | left 33% dark, warm scenery in the middle |

No text, logos or watermark in any banner. The page adds the headline, labels, "VS" badge and credit.

## Publishing a story with a banner (3 steps)

1. **Make the image** from the official manufacturer photo with the template below (Car Culture may be a fully AI illustration, credited as such).
2. **Save it** as `images/banners/<article-slug>.jpg` (full size; the build makes the compressed WebP).
3. **Add one entry** to `"banners"` in `data/homepage.json`, keyed by the article URL as in the sitemap (no leading slash):

```json
"reviews/2026-mahindra-thar-roxx-4x4-review/": {
  "kind": "hero",
  "src": "images/banners/2026-mahindra-thar-roxx-4x4-review.jpg",
  "subject": [0.42, 0.11, 0.97, 0.93],
  "credit": "Image: Mahindra, edited by FlamingPiston"
}
```

- `subject`: the car's box as fractions of the image `[left, top, right, bottom]`. A rough box is fine; it is used to check that the car stays clear of the text.
- `compare` also needs `"split"`: the x position (0–1) of the gap between the two cars, where the VS badge goes. Optional `"headline"` / `"dek"` (default: the article's title before the colon / its description).
- `launch` and `upcoming` also need `"status"`: one dated line taken from the story (say "expected" unless the date is confirmed), e.g. `"Launched at ₹90 lakh · 18 Nov 2026"`. Optional `"name"` (default: the title before the colon), `"label"`, `"link"`.
- Optional everywhere: `"credit"`, `"pos"` (object-position; default `"100% 50%"`, right-anchored).

Then run, from the site root:

```
python3 scripts/make-home-images.py
node scripts/build-lists.js
node scripts/apply-shell.js
```

## What the build does for you

- Picks the newest article with a banner for each spot and lays it out at every screen width (full-bleed image, text over the dark side on a gradient; on phones the image goes on top).
- **Checks every banner:** wrong proportions, a car that starts too far left (it would sit under the text), a missing `split` or `status` are printed as warnings.
- **Never shows a bad image:** if the newest story has no banner, the spot keeps the newest one that does, and the build prints which newer stories are missing one.
- **Pins:** to hold a chosen story, put its URL in `hero.pinned`, `comparison.pinned`, `newUpcoming.pinned.launch` / `.upcoming` or `carCulture.pinned`. Leave empty for automatic.
- **Fallbacks:** until a `launch` / `upcoming` banner exists, the card uses the older curated item in `newUpcoming.items`; until a `culture` banner exists, Car Culture uses `carCulture.image`.

## Image prompt templates

Attach the official photo(s), paste the template, replace the words in CAPITALS.

### Hero (`hero`, 2400 × 1000)

```
Edit the attached official MAKE MODEL photo into a cinematic wide banner image.
Size: 2400 × 1000 px (2.4:1 landscape).
Vehicle: keep the MODEL exactly as in the photo — same body, colour, grille, headlamps, badges, wheels and proportions. Do not redesign, restyle or add accessories.
Placement: put the vehicle in the RIGHT 55% of the frame, front three-quarter view, facing slightly left towards the centre. It should fill about 80–85% of the image height, with a small gap above the roof and below the tyres and about 4–5% space from the right edge. No part of the vehicle may be cut off.
Setting: SCENIC SETTING (e.g. rugged mountain pass / coastal highway / desert road) at golden hour, warm sunset sky, natural shadows under the car, soft warm rim light on the vehicle's edges.
Left side: the LEFT 40% of the frame must be dark and calm — shadowed landscape and dusky sky with very little detail, getting darker towards the left edge, so white headline text can sit on it.
Style: photorealistic, sharp focus on the vehicle, slight cinematic contrast, natural colours. No lens flare over the car.
Do NOT add any text, logos, watermark, badges, labels, borders or graphics anywhere in the image.
```

### Comparison (`compare`, 2400 × 1000)

```
Using the two attached official photos (MODEL A and MODEL B), create one cinematic wide comparison banner.
Size: 2400 × 1000 px (2.4:1 landscape).
Vehicles: keep both exactly as in their official photos — same body, colour, grille, lights, badges, wheels and proportions.
Placement: both vehicles HEAD-ON (front view), side by side in the RIGHT 62% of the frame: MODEL A centred around 52% of the image width, MODEL B centred around 82%. Leave a clear gap of about 6% of the image width between them. Each fills about 75–80% of the image height, same scale, same ground line, wheels fully visible, about 4% space from the right edge. Nothing cut off.
Setting: open road at dusk, dark mountains, sky from deep teal on the left to warm orange behind the cars, wet asphalt with soft reflections, matching lighting on both cars.
Left side: the LEFT 35% must be dark and calm — dark road and dusky teal sky, darkest at the left edge, for text.
Style: photorealistic, sharp, cinematic contrast.
Do NOT add any text, "VS", logos, watermark, labels, dividers, borders or graphics anywhere in the image.
```

### New launch (`launch`, 2400 × 800)

```
Edit the attached official MAKE MODEL photo into a cinematic wide banner image.
Size: 2400 × 800 px (3:1 landscape).
Vehicle: keep the MODEL exactly as in the photo — same body, colour, grille, lights, badges, wheels and proportions. Do not redesign or add accessories.
Placement: RIGHT 55% of the frame, front three-quarter view facing slightly left, about 80% of the image height, small gap above the roof and below the tyres, about 4% from the right edge. Nothing cut off.
Setting: upscale city or luxury hotel entrance at dusk, warm architectural lights, glossy wet stone ground with soft reflections.
Left side: the LEFT 45% must be dark and calm — deep shadow with very little detail, darkest at the left edge, for text.
Style: photorealistic, sharp focus on the vehicle, cinematic contrast.
Do NOT add any text, logos, watermark, labels, borders or graphics anywhere in the image.
```

### Upcoming (`upcoming`, 2400 × 800)

Same as **New launch**, with this setting: *"open highway at sunset, warm low sun behind the vehicle, distant city skyline, dark asphalt; a slightly mysterious, teaser mood."* Keep the car facing left in the right 55%.

### Car Culture (`culture`, 2400 × 800, cropped to ≈4.4:1)

The homepage band is slim (240px), so the build shows a horizontal strip of this image. Add `"box": [0, 0.12, 1, 0.79]` (adjust so the doors/roof and tyres stay inside) to the entry.

```
Using the attached image as the reference for the car, create a cinematic ultra-wide banner image.
Size: 2400 × 800 px (3:1 landscape). Keep the whole car between 15% and 78% of the image height (sky above, tarmac below).
Vehicle: keep the car's design exactly — body shape, colour, wheels, lights (and doors as in the reference).
Placement: RIGHT 45% of the frame, side three-quarter view, fully inside the frame, wheels fully visible, about 3% from the right edge. Nothing cut off.
Middle of the frame (35%–60% of the width): continue the scene towards the text — sunset glow, a distant lit building or landmark, long reflections on the wet ground — soft detail and warm light, not empty darkness.
Setting: DRAMATIC SETTING (e.g. empty airfield runway / black studio with light tubes / mountain road) at sunset or night, dramatic sky, wet ground with soft reflections.
Left side: only the LEFT 33% is dark and calm, darkest at the left edge, for the "Car Culture" title.
Style: photorealistic, sharp focus on the car, cinematic contrast.
Do NOT add any text, logos, watermark, labels, borders or graphics anywhere in the image.
```

## Before you save a generated banner

- No letters, logos or watermark crept in (number plates and the car's own badges are fine).
- Grille, lights and badges still match the real car.
- The car is fully inside the frame and on the right; the left side is dark and calm.
- Credit: `"Image: <Brand>, edited by FlamingPiston"`; fully generated images: `"AI illustration: FlamingPiston"`.
