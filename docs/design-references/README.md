# Design references

Primary visual references for FlamingPiston: real Chromium screenshots (100% zoom, full page, reduced motion, cookies declined, images decoded).

**Approved homepage: the consolidated editorial homepage, approved by Gagan on 27 Nov 2026** (editorial refinement + editorial publishing system). Screenshots taken on 27 Nov 2026 from the approved build.

| File | Viewport |
|---|---|
| `home-2560x1440.jpg` | Large desktop (content capped at 1440px, centred) |
| `home-1920x1080.jpg` | Desktop |
| `home-1536x1024.jpg` | Laptop |
| `home-1440x900.jpg` | Laptop |
| `home-1280x800.jpg` | Small laptop (smallest width with the full nav) |
| `home-1024x768.jpg` | Tablet landscape (nav in drawer) |
| `home-768x1024.jpg` | Tablet portrait |
| `home-390x844.jpg`, `home-375x812.jpg` | Mobile |
| `tools-1280.jpg`, `tools-390.jpg` | Buying Tools page: functional reference only (taken before Phase 2A; header/footer are now the global ones) |

**Backups of earlier homepages (kept so they stay recoverable; do not use as the current reference):**

| Folder | What it shows |
|---|---|
| `archive-2026-11-26-approved/` | The previously approved reference set (26 Nov 2026), moved here unchanged when the new homepage was approved |
| `pre-refinement-2026-11-27/` | The homepage as live before the 27 Nov refinement (GitHub `main` 0a8ec64), at nine viewports |

The code of the previous homepage is in git history at 0a8ec64.

Rules:
- Do not regenerate, reinterpret or "improve" the homepage design from these images. They record what is approved.
- Every new page and any future reference image must inherit this visual language (see `../DESIGN-SYSTEM.md`).
- After changes to shared CSS/JS or the publishing scripts, re-screenshot the homepage at these viewports and compare. Content changes (new stories) are expected; layout changes are not.
- Replace these files only when Gagan approves a homepage change: move the current set into a dated `archive-…` folder first, and note the date here.
