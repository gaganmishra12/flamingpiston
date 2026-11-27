# Homepage fix: research area dead space (27 Nov 2026, awaiting approval)

**Problem (live site).** Compare + New & Upcoming and Latest Reviews + Buying Tools were two separate rows, each with two columns. Each row was as tall as its taller column, so the shorter right-hand modules left visible empty space underneath them.

**Structural change.** The two rows are replaced by **one research area with two independent columns** (`.fp-research`):

| Left column (≈59%, editorial) | Right column (≈41%, utility) |
|---|---|
| Compare | New & Upcoming Cars: two stacked compact entries |
| Latest Reviews | Buying Tools: 2×2 tiles, each with an icon, the tool name and a one-line descriptor |

- Each column stacks its own modules from the top (40px apart), so the right column never waits for the left. Equal heights are not forced and there are no spacers.
- A 1px hairline separates the columns.
- Guides, Car Culture and the footer follow below.
- On tablet and mobile the area becomes one column in reading order: Compare, Latest Reviews, New & Upcoming, Buying Tools.

**Measured result (Chromium, column heights in px):**

| Viewport | Left | Right | Gap left under the shorter column |
|---|---|---|---|
| 1920 | 625 | 594 | 31 px |
| 1440 | 599 | 594 | 5 px |
| 1280 | 556 | 602 | 46 px under the left column |
| 1024 | 555 | 635 | 80 px under the left column |

The old row structure left a gap of roughly 70–150 px under each right-hand module.

**Unchanged:**
- Hero, Latest Stories, finder, Featured Cars, Guides, Car Culture, header and footer.
- Colours, type and spacing tokens.
- All links and the generator markers (COMPARE, UPCOMING, REVIEW).
- Publishing automation.

**Files changed:**
- `index.html`: static structure around the markers, and tool descriptors restored as visible text.
- `assets/fp-home.css`.
- `scripts/apply-shell.js`: `VH` → 20261127d.
- Docs: `DESIGN-SYSTEM.md`, `CLAUDE.md`, and this note.

**Tests:**
- 35/35 homepage functional checks.
- 40/40 publishing tests.
- Nine viewports with no overflow, missing files or console errors.
- `update-site.sh` is idempotent.

**After approval:** replace `docs/design-references/home-*.jpg` with the new screenshots, archiving the 27 Nov set first.
