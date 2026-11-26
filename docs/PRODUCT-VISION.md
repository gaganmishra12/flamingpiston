# FlamingPiston — Product Vision

*Permanent reference. Last verified against the repository: 26 Nov 2026.*
*Read this before any major feature work. Where this file and the code disagree about what exists, the code wins; fix this file.*

## 1. Identity

| | |
|---|---|
| Brand | FlamingPiston (one word; double-slash symbol + wordmark logo) |
| Website | https://flamingpiston.com (no www) |
| Market | Indian car buyers and owners, plus international developments that matter to them |
| Platform type | Independent automotive editorial, vehicle research and consumer decision-making platform |
| Byline | Gagan Mishra |
| Operator | Solo founder (see §11) |
| Tagline | **None.** "Know Your Machine" is retired. Do not add a slogan without explicit approval. |

## 2. Mission and vision

**Mission.** Make automotive information easier to understand, more transparent and more useful. Cut through manufacturer marketing, variant sprawl, conflicting specifications, changing prices, safety and mileage claims, unclear ownership costs, EV technology and promotional content dressed as advice.

**Vision.** Become one of India's most useful, credible and visually distinctive independent automotive platforms: a place people return to across the whole ownership lifecycle, not only before purchase.

**Guiding principle.** A successful visit is one where the reader leaves with a clearer understanding or a better decision.

## 3. Unique selling proposition

> **Independent, evidence-led automotive intelligence that connects vehicle information with real-world buying and ownership decisions.**

Every platform publishes news, specs, prices, reviews and comparisons. FlamingPiston's difference is how it *connects* them into practical answers:

- Is this car good value? Which variant makes sense? Which powertrain suits which driving?
- Which features are genuinely useful? What are the compromises?
- What will it cost to own? How does it compare with similarly priced rivals?
- Should I buy now or wait?

Every page should answer at least one of: *What happened? Why does it matter? How does it work? How does it compare? Is it worth buying? What will it cost me to own? What should I consider before deciding?*

## 4. Competitive positioning

We borrow strengths, not identities.

| Platform | What we admire | What we adopt |
|---|---|---|
| V3Cars | Variant analysis, spec comparisons, price data, buying tools | Structured data and decision-making functionality |
| RushLane | Timely launches, industry news, sales, EV coverage, frequent publishing | Editorial relevance and recurring readership |
| Autocar India | Editorial authority, reviews, photography, technical expertise | Credibility and premium presentation |

FlamingPiston keeps its own visual identity (Petrol Blue + Ember; see `DESIGN-SYSTEM.md`) and its own methodology.

## 5. Target audience

- **First-time buyers** — need plain explanations, budget guidance, safety, practical advice.
- **Family buyers** — safety, space, comfort, reliability, running costs.
- **Value-conscious buyers** — variants, features, fuel options, long-term cost.
- **Enthusiasts** — performance, engineering, design, news, car culture.
- **EV buyers** — range, charging, running cost, warranty, battery rental (BaaS).
- **Existing owners** — maintenance, ownership advice, technical explainers, industry news.

Pages must work for different knowledge levels without becoming simplistic or needlessly technical.

## 6. Five product pillars

| Pillar | What it covers | Status today |
|---|---|---|
| 1. Automotive journalism | Launches, facelifts, price changes, upcoming cars, industry, sales, EVs, safety, policy, international news | **Live** — 36 news stories, news listing with type filters (Launch / Reveal / Report / Preview / Archive) |
| 2. Vehicle intelligence | Structured per-model data: variants, prices, specs, mileage/range, safety, warranty, photos, sources and dates | **Starter only** — `data/cars.json` holds 13 models (dated ex-showroom ranges, body, fuels). No model pages yet. |
| 3. Buying intelligence | Discovery, budget filtering, comparisons, variant verdicts, buyer's briefs, buy-now-or-wait | **Partly live** — 14 buyer's briefs, 9 comparisons, homepage car finder over `data/cars.json`. No interactive comparison engine. |
| 4. Ownership intelligence | EMI, fuel, petrol vs CNG, petrol vs EV, 5-year cost, maintenance, insurance, warranty, BaaS, depreciation | **Partly live** — `/tools.html` (EMI, fuel cost, petrol vs CNG, ownership cost); cost guides (Brezza maintenance, Brezza petrol vs CNG break-even, BaaS vs buying). No petrol-vs-EV calculator, no depreciation data. |
| 5. Knowledge and culture | Engineering explainers, safety, EV/hybrid tech, design, performance, motorsport, classics, history | **Live but thin** — Car Culture page (15 stories via `data/car-culture.json`), 1 explainer (`/articles/ev-claimed-vs-real-world-range/`). |

## 7. Consumer journey

**Discover → Research → Compare → Decide → Buy → Own → Upgrade**

| Stage | Today | Future |
|---|---|---|
| Discover | Homepage, news, search overlay, Instagram @flamingpiston_in | Upcoming-cars directory, newsletter |
| Research | Buyer's briefs and guides (per article) | Dedicated model pages (`/cars/<brand>/<model>/`) that gather everything about a car |
| Compare | Editorial comparison articles | Interactive spec and variant comparison |
| Decide | Verdicts, buyer-fit sections, scorecards in briefs | Variant Verdict format, suitability tools |
| Buy | Dated price ranges, finder, EMI calculator | Price history, offers tracking (sourced only) |
| Own | Maintenance and cost guides, calculators | Service schedules, ownership cost per model |
| Upgrade | — | Return-visit features (saved cars, alerts) only when justified |

The homepage serves **Discover**. Internal pages serve depth. *Homepage = Discovery. Internal pages = Depth.*

## 8. Editorial principles

1. **Accuracy.** Verify important claims against reliable sources — manufacturer sites, official releases, brochures, regulators/NCAP — and cross-check with at least two independent sources where possible.
2. **Transparency.** Disclose sources, assumptions, limitations and conflicts. Articles carry a Sources block where possible (now on 38 of 73 articles; news is the gap).
3. **Independence.** Commercial relationships never decide recommendations. Label sponsored and affiliate content. (There are no active affiliate links today.)
4. **Evidence-led analysis.** Separate fact ("The manufacturer claims 18.2 km/l") from editorial view ("For city use we'd pick the automatic").
5. **Honest methodology.** Never claim a drive or ownership experience that didn't happen. Specification-led assessments are labelled **Buyer's Brief** and say so.
6. **Image integrity.** AI-generated images are never presented as real events, prototypes, crash tests or road tests. Label them "AI illustration". Prefer licensed or manufacturer-permitted photography.
7. **Corrections.** Follow `/corrections-policy.html`; update the original and note what changed.
8. **Data freshness.** Prices, specs and variants carry a source and a last-checked date. Pre-launch pieces are rewritten around confirmed facts once a launch happens (accuracy gate).
9. **Never invent** prices, mileage, performance, features, dates, sales, ratings, quotes, opinions, test-drive impressions or ownership experiences — not even to fill a layout.

## 9. Signature content formats

| Format | Purpose | Status |
|---|---|---|
| **Buyer's Brief** | Structured, specification-led assessment: offer, strengths, compromises, pricing/equipment, who it suits, alternatives, ownership, evidence-led verdict | **Live** — 14 briefs, 8-category score breakdown, buyer-fit, FAQ, sources |
| **Variant Verdict** | Which variant balances features and price; never defaults to the top trim | **Partial** — exists inside briefs and the Brezza "Variants Explained" guide; no standalone format yet |
| **Safety Decoded** | Beyond star ratings: protocol, AOP/COP, tested variant, structure, equipment, limits | **Partial** — Brezza safety guide, Bharat NCAP news and "5-star cars under ₹10 lakh" guide |
| **The Real Cost** | Purchase, finance, fuel/charging, service, insurance, depreciation, BaaS — with stated assumptions | **Partial** — Brezza maintenance cost, petrol vs CNG break-even, BaaS vs buying; calculators on `/tools.html` |
| **Engineering Explained** | Technologies explained with pros and cons (TC vs DCT, turbo vs NA, strong vs mild hybrid, battery chemistry, ADAS limits) | **Planned** — one explainer exists (EV claimed vs real-world range) |
| **Buy Now or Wait?** | Facelifts, replacements, offers, availability — verified vs speculative clearly separated | **Partial** — Innova Hycross piece exists but is pre-launch and needs the accuracy-gate rewrite before it is promoted again |

## 10. Future monetization (not current requirements)

Display advertising; accessory affiliates; clearly labelled sponsored content; insurance and finance referrals; dealer enquiries; brand advertising; research products / premium market intelligence.

Rules: no ad clutter before there is real audience value; commercial content always distinguishable from independent recommendations; nothing that compromises editorial independence.

## 11. Solo-founder constraints

FlamingPiston is built and run by one person.

- Prefer simple, maintainable architecture: static HTML/CSS/vanilla JS, Node + Python helper scripts, GitHub → Hostinger auto-deploy.
- Avoid paid services and unnecessary dependencies.
- Reuse what exists; automate where it improves reliability (`reindex.js`, `build-lists.js`, `apply-shell.js`, image scripts).
- Keep data verification small enough for one person (a starter catalogue before a database).
- Document decisions; ship incrementally; never design for a team that doesn't exist.

## 12. Long-term platform objectives

1. A centralized vehicle data layer (brands → models → generations → variants → powertrains, prices with history, safety, media, sources, verification dates) that powers model pages, the finder, featured cars, comparisons, calculators and related-article modules. Start from `data/cars.json`; add Supabase or similar **only when the platform needs it**.
2. Dedicated model pages that connect every article about a car (topic clusters: e.g. the 12-page Brezza cluster linking to a future `/cars/maruti-suzuki/brezza/`).
3. Interactive research: advanced filters, spec and variant comparison, ownership calculators per model.
4. A private admin workflow for prices, sources, images and publishing — later, and only if manual JSON/HTML editing stops being workable.
5. Audience features (newsletter, saved cars, price alerts) when justified by traffic.
6. Organic growth through useful evergreen and timely content, not thin pages at scale.

## 13. Success metrics

Organic impressions and clicks (Search Console), repeat visitors, model-page engagement (future), finder/comparison/calculator usage, internal navigation, accuracy and freshness of vehicle data, performance and mobile usability. GA4 (`G-QE7WZ5DCC6`, consent mode v2) is installed via `/js/analytics.js`.
