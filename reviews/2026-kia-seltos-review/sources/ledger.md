# Claims ledger: reviews/2026-kia-seltos-review (template re-verification)

Research 21 November 2026. Purpose: re-verify every figure for the Slavia-template rebuild of the Kia Seltos review (live page dated 23 Oct 2026).

## Sources
### Tier 1: official
- **KS** = Kia India Seltos showroom page, HTTP 200, read 21 Nov 2026: https://www.kia.com/in/our-vehicles/seltos/showroom.html (`official/kia-seltos-showroom.html/.txt`)
- **KP** = Kia India Seltos specs/compare-trims page, HTTP 200, read 21 Nov 2026: https://www.kia.com/in/our-vehicles/seltos/specs.html (`official/kia-seltos-specs.html/.txt`). Trim-entry prices taken from the trim tabs' `data-price` attributes.
- **KB** = Kia India Seltos brochure 2026 (desktop PDF, 11 pages), read in full 21 Nov 2026: https://www.kia.com/content/dam/kia2/in/en/our-vehicles/new-seltos/showroom/brochure/Kia_Seltos_Brochure_2026_Desktop.pdf (`official/kia-seltos-brochure-2026.pdf/.txt`)
- **KF** = Bharat NCAP fact sheet as hosted by Kia India, read 21 Nov 2026: https://www.kia.com/content/dam/kia2/in/en/our-vehicles/new-seltos/All-New-Seltos-BNCAP-Fact-Sheet.pdf (`official/kia-seltos-bncap-fact-sheet.pdf/.txt`)
- **BN** = Bharat NCAP vehicle page, HTTP 200, read 21 Nov 2026: https://www.bncap.in/vehicle/kia-seltos/ (`official/bncap-kia-seltos.html/.txt`)
- **BNL** = Bharat NCAP ratings list, read 21 Nov 2026: https://www.bncap.in/vehicle-safety-ratings/ (`official/bncap-vehicle-safety-ratings.html/.txt`)

### Tier 2: independent
- **AIR** = Autocar India review, 23 Dec 2025 (Sergius Barretto): https://www.autocarindia.com/car-reviews/2026-kia-seltos-review-revolution-or-evolution-440290 (`press/autocarindia-review.txt`)
- **AIB** = Autocar India, BNCAP result, 30 Mar 2026 (Glenn Noronha): https://www.autocarindia.com/car-news/kia-seltos-scores-5-star-safety-rating-in-bncap-crash-tests-439318 (`press/autocarindia-bncap.txt`)
- **APB** = Autocar Professional, 30 Mar 2026 (Arunima Pal): https://www.autocarpro.in/news/kia-seltos-tops-bharat-ncap-rankings-among-ice-vehicles-131870 (`press/autocarpro-bncap.txt`)
- **AIG** = Autocar India, GTX(O)/X-Line(O) launch, 1 Jul 2026 (Viraaj Bhatnagar): https://www.autocarindia.com/car-news/kia-seltos-gtxo-x-lineo-variants-launched-at-rs-2157-lakh-439350 (`press/autocarindia-gtxo.txt`)
- **AIV** = Autocar India, variants explained, 10 Dec 2025 (Uday Singh): https://www.autocarindia.com/auto-features/new-kia-seltos-variants-and-features-explained-439635 (`press/autocarindia-variants.txt`). Launch prices, superseded; used for history only.
- **RL** = Rushlane, ARAI figures, 22 Apr 2026: https://www.rushlane.com/new-kia-seltos-arai-mileage-figures-revealed-up-to-19-4-km-l-12544794.html (`press/rushlane-arai.txt`)
- **NW** = 91Wheels, ARAI figures, 23 Apr 2026: https://www.91wheels.com/news/new-kia-seltos-mileage-figures-out-diesel-leads-turbo-petrol-surprises (`press/91wheels-arai.txt`)
- **CWI** = CarWale, iMT variants removed, 20 Nov 2026 09:06 IST (Jay Shah): https://www.carwale.com/news/four-variants-of-kia-seltos-removed-from-the-line-up/ (`press/carwale-imt-removed.txt`)
- **CWL** = CarWale Seltos model page, read 21 Nov 2026: https://www.carwale.com/kia-cars/seltos/ (`press/carwale-seltos.txt`)
- **CDL** = CarDekho Seltos model page, read 21 Nov 2026: https://www.cardekho.com/kia/seltos (`press/cardekho-seltos.txt`)
- **CWF** = CarWale first drive, 23 Dec 2025: https://www.carwale.com/kia-cars/new-seltos/expert-reviews/new-kia-seltos-first-drive-review/ (`press/carwale-firstdrive.txt`)

### Could not use / not used
- Kia India has published no ARAI fuel-efficiency figures on KS, KP or KB. Efficiency comes from RL + NW (two independent Tier 2 outlets that agree); labelled "ARAI-certified, as reported".
- Kia has made no official announcement of the iMT removal (CWI says so). The removal is supported by KB's powertrain table (turbo-petrol 7DCT only) + CWI + CDL.
- Top-of-range price: CDL lists ₹21.82 lakh and CWL lists up to ₹22.02 lakh. They disagree, so **no single top price is quoted**. Kia's highest trim-entry price is used instead.
- Euro NCAP result (mentioned in a Cartoq search snippet) is for the European car. Not used.

## Claims

| # | Claim (as it will appear) | Status | Tier 1 | Independent | Checked |
|---|---|---|---|---|---|
| 1 | Trim-entry ex-showroom prices: HTE ₹11,24,900; HTE(O) ₹12,41,900; HTK ₹13,41,900; HTK(O) ₹14,51,900; HTX ₹15,91,900; HTX(A) ₹17,01,900; GTX / X-Line ₹18,71,900; GTX(A) / X-Line(A) ₹19,81,900; GTX(O) / X-Line(O) ₹21,56,900 | VERIFIED | KP (data-price), KS FAQ (HTE ₹11,24,900, X-Line(O) ₹21,56,900) | CDL (HTE ₹11.25L, HTE(O) ₹12.42L), CWL (HTE from ₹11.25L, X-Line(O) from ₹21.57L) | 2026-11-21 |
| 2 | Range starts at ₹11.25 lakh ex-showroom (rounded) | VERIFIED | KS | CWI, CDL, CWL | 2026-11-21 |
| 3 | Diesel-automatic versions of the top trims cost more than the trim-entry price; check the exact configuration | VERIFIED (qualitative) | KP shows entry price only | CWL (X-Line(O) ₹21.57–21.82L), CDL | 2026-11-21 |
| 4 | 1 July 2026: GTX(O) and X-Line(O) added, with Level 2+ ADAS (28 features vs 21) | VERIFIED | KB (GTX(O) Hi-Tech Pack, "ADAS Level 2+ with 28 Autonomous Features") | AIG | 2026-11-21 |
| 5 | Turbo-petrol now sold only with the 7-speed DCT; the iMT versions have been removed (CarWale, 20 Nov 2026; no Kia announcement) | VERIFIED | KB powertrain table (T-GDi 7DCT only) | CWI, CDL ("November 19, 2026: Kia has discontinued the iMT") | 2026-11-21 |
| 6 | Cheapest turbo-petrol is now HTK(O) DCT at ₹16.62 lakh (CarWale) | SINGLE SOURCE, attribute to CarWale | — | CWI | 2026-11-21 |
| 7 | Length 4,460 mm, width 1,830 mm, height 1,635 mm (with R18 wheels and roof rails), wheelbase 2,690 mm | VERIFIED | KP, KB | AIR (4,460 mm, 2,690 mm) | 2026-11-21 |
| 8 | Length up 95 mm and wheelbase up 80 mm over the previous Seltos; longest in class; new K3 platform | VERIFIED (AIR claim) | KB ("longer wheelbase", K3 platform) | AIR | 2026-11-21 |
| 9 | Five seats | VERIFIED | KB | AIR | 2026-11-21 |
| 10 | Boot space 447 litres (VDA method) | VERIFIED | KB, KP FAQ | AIR | 2026-11-21 |
| 11 | Fuel tank 47 l (NA petrol, diesel), 50 l (turbo-petrol) | VERIFIED | KB, KP FAQ | — (spec detail; not needed in copy) | 2026-11-21 |
| 12 | 1.5 NA petrol (Smartstream G1.5): 1,497 cc, 84.4 kW (≈115 PS) / 144 Nm; 6MT or IVT | VERIFIED | KB | AIR (115hp), NW (113 bhp/144 Nm) | 2026-11-21 |
| 13 | 1.5 turbo-petrol (T-GDi): 1,482 cc, 117.5 kW (≈160 PS) / 253 Nm; 7DCT | VERIFIED | KB | AIR (160hp), NW (158 bhp/253 Nm), CWI | 2026-11-21 |
| 14 | 1.5 diesel (CRDi VGT): 1,493 cc, 85 kW (≈116 PS) / 250 Nm; 6MT or 6AT | VERIFIED | KB | AIR, NW (116 bhp/250 Nm) | 2026-11-21 |
| 15 | PS figures are FlamingPiston conversions from Kia's kW (1 kW = 1.3596 PS), rounded | DERIVED | KB | — | 2026-11-21 |
| 16 | ARAI-certified efficiency: NA petrol 16.5 km/l (MT and IVT); turbo-petrol DCT 17.5 km/l; diesel MT 19.4 km/l; diesel AT 17.8 km/l | VERIFIED (2× T2) | none published by Kia | RL, NW | 2026-11-21 |
| 17 | (Do not use) turbo iMT 15.6 km/l: that gearbox has been removed | DROPPED | — | RL, NW | 2026-11-21 |
| 18 | Bharat NCAP: five stars adult and child; AOP 31.70/32, COP 45.00/49 | VERIFIED | BN, BNL, KF p1 | AIB, APB | 2026-11-21 |
| 19 | Frontal offset 15.70/16; side barrier 16.00/16; side pole OK | VERIFIED | BN, KF p3 | AIB | 2026-11-21 |
| 20 | Tested: HTE(O) and GTX, 1.5 CRDi diesel 6AT; rating listed as "Base Rating", March 2026 onwards; applies to variants in the annexure | VERIFIED | BN, BNL, KF p1 | AIB ("ratings apply to all variants") | 2026-11-21 |
| 21 | Highest AOP score among ICE vehicles tested by Bharat NCAP so far (Kia's claim, as reported at the time) | VERIFIED as claim | KS ("5-star"); claim made by Kia | AIB, APB | 2026-11-21 |
| 22 | Standard: 6 airbags, ESC, VSM, hill-start assist, downhill brake control, all-wheel disc brakes, TPMS, ISOFIX, 3-point belts with reminders for all seats, rear occupant alert ("Robust 24 Standard Safety Pack") | VERIFIED | KB | AIB (lists 6 airbags, ESC, HAC, disc brakes, DBC, rear occupant alert, ISOFIX) | 2026-11-21 |
| 23 | Level 2 ADAS (21 features) + 360-degree camera from HTX(A); Level 2+ (28 features) on GTX(O)/X-Line(O) | VERIFIED | KB | AIG, AIV (HTX(A) adds Level 2 ADAS) | 2026-11-21 |
| 24 | Dual-pane panoramic sunroof from HTK(O); ventilated front seats on HTK(O) automatics and from HTX | VERIFIED | KB | AIR (panoramic sunroof, cooled front seats on test car) | 2026-11-21 |
| 25 | HTX adds 12.3-inch touchscreen, Bose 8-speaker audio, dual-zone climate with 5-inch screen, 64-colour ambient lighting | VERIFIED | KB | AIR (12.3-in screen, Bose, 5-in HVAC screen) | 2026-11-21 |
| 26 | Trinity panoramic display (12.3-in screen + 12.3-in cluster + 5-in climate screen) with the ADAS pack (HTX(A), GTX(A), GTX(O)) | VERIFIED | KB | AIR | 2026-11-21 |
| 27 | GTX(O) adds head-up display, digital key, front-and-rear dashcam, air purifier, rain-sensing wipers | VERIFIED | KB | AIG (rain-sensing wipers, Level 2+) | 2026-11-21 |
| 28 | 18-inch alloys on GTX/X-Line; 16-inch steel or 17-inch alloy wheels lower down | VERIFIED | KB | AIR (18-in on GT Line) | 2026-11-21 |
| 29 | Autocar India: cabin fit and finish very good; physical buttons retained for temperature and fan; 5-inch climate screen obscured by the steering wheel | VERIFIED (attributed opinion) | — | AIR | 2026-11-21 |
| 30 | Autocar India: ride tuned towards comfort without losing body control; CarWale: ride noticeably more compliant but still firm | VERIFIED (attributed opinion) | — | AIR, CWF | 2026-11-21 |
| 31 | Autocar India: turbo-petrol smooth and strong, DCT fumbles a bit at low speed; diesel refined but lacks punch, slow-shifting 6AT | VERIFIED (attributed opinion) | — | AIR | 2026-11-21 |
| 32 | Autocar India: rear legroom ample even for six-footers, headroom just about okay, short seat base for tall passengers, no "boss mode" | VERIFIED (attributed opinion) | — | AIR | 2026-11-21 |
| 33 | Autocar India: no air purifier (as tested, pre-GTX(O)) and no rear ventilated seats | PARTLY SUPERSEDED: GTX(O) now has an air purifier (KB). Use "rear ventilated seats are not offered" only | KB | AIR | 2026-11-21 |
| 34 | Autocar India: lane-centring felt busy on uneven Indian lane markings | VERIFIED (attributed opinion) | — | AIR | 2026-11-21 |
| 35 | Steering: tilt and telescopic adjustment from HTK | VERIFIED | KB | AIR | 2026-11-21 |
| 36 | Prices have risen since launch / since 1 July (HTE ₹11.00 lakh on 1 Jul per AIG → ₹11,24,900 now per KP; CarWale logs a hike of up to ₹32,500 on 12 Jul 2026) | VERIFIED | KP | AIG, CWL | 2026-11-21 |
| 37 | Three 1.5-litre engines carried over from the first-generation car | VERIFIED | KB (engine table) | AIR | 2026-11-21 |
| 38 | X-Line is a styling pack priced the same as the matching GTX trim | VERIFIED | KB (X-Line Styling Pack), KP (equal data-price) | AIG ("X-Line cosmetic package available at no extra cost") | 2026-11-21 |
| 39 | Design description: tall LED DRLs wrapping over the bonnet, square headlamps in a gloss-black grille, vertical tail-lamps joined by a light bar | VERIFIED | KB (Star Map DRLs, Ice Cube headlamps, connected tail lamps) | AIR | 2026-11-21 |

## Spec Score inputs (editorial)
Scores are FlamingPiston's editorial judgement on paper (methodology page), not a test. Changes from the 23 Oct page: Value 7.5 → 7.5 (unchanged despite the price rise, since the iMT removal raises the turbo entry price; noted in copy); Performance 8.0 (turbo DCT strong, diesel lacks punch per AIR). Average 8.1 unchanged.
