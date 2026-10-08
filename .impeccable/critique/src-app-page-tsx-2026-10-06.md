---
target: "homepage"
resolved_target: "src/app/page.tsx"
date: 2026-10-06
total_score: 21
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 3
method: "dual-agent; CLI detector unavailable (engine binary not run); written by hand because critique-storage needs the engine"
---

# Critique: Farmart homepage (src/app/page.tsx)

Mode: Operate. Constraint for fixes: keep the theme (Harvest Amber, red for urgency only, Geist, white plates on gray floor, reference layout).

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Header not sticky, so cart total and count leave the screen; active tab shown by weight only |
| 2 | Match System / Real World | 3 | "All Offers ›" on Featured Brands; "sign up at the first time"; "Expires in :" |
| 3 | User Control and Freedom | 3 | Card trash at qty 1 removes instantly, no undo |
| 4 | Consistency and Standards | 2 | Two different steppers; arbitrary featured card; dead controls look live |
| 5 | Error Prevention | 2 | Unvalidated password form; search is type=button |
| 6 | Recognition Rather Than Recall | 3 | No search under 768px; icon-only account and wishlist |
| 7 | Flexibility and Efficiency | 1 | Search, arrows, Recently Viewed dead; no reorder |
| 8 | Aesthetic and Minimalist Design | 3 | Flat hierarchy: six equal sections, 6 "All x" links, 8 arrow pairs |
| 9 | Error Recovery | 1 | No error states; filtered tab leaves a blank slab |
| 10 | Help and Documentation | 1 | No footer; no delivery terms, returns or contact |
| Total | | 21/40 | Acceptable |

## Design Specificity Verdict
Mostly category-interchangeable. Authored: the amber = buy / red = urgency rule and the shelf-label card density. Template: section skeletons, placeholder brands, no delivery promise. Scan: 40/113 interactive elements are dead (25 `#` links, 15 handler-less buttons); `+`/`−` text glyphs in the Add and stepper pills break DESIGN.md's icon rule; 4 off-token hex colors in the logo SVG (header.tsx:26-61); featured card has both a border and a shadow. Contrast: 0 failures (192 desktop and 181 mobile text nodes).

## Priority Issues
1. [P1] Dead affordances (35% of controls): make arrows scroll rows or remove them, give Shop Now and All x real targets, make search submit, render unbuilt nav items as text. `harden`, `distill`
2. [P1] No delivery terms or trust, no footer: a benefit strip (free over $50 · slots · freshness) using benefit-list, plus a white footer. `clarify`, `onboard`
3. [P1] Cart feedback is lost after scrolling: compact sticky header with cart total, or an amber "Added" toast that opens the drawer. `harden`, `animate`
4. [P2] Mobile: no search under 768px, Top Saver header fragments, tabs wrap to 2 rows, hero fills the first screen. `adapt`
5. [P2] Mixed signals: arbitrary featured card, two stepper behaviors, `+`/`−` glyphs, active tab bold only. `clarify`, `polish`

## Persona Red Flags
- Alex (power user): search does nothing; no reorder; Recently Viewed dead; drawer steppers fiddly.
- Jordan (first-timer): no delivery area, time or cost; password asked twice in broken English; "Just Landing" unclear.
- Casey (mobile): no search; hero with no price; fragmented Top Saver header; cart total lost on a ~5,400px page; ~20px drawer steppers.

## Minor Observations
"All Brands ›"; countdown format "02:11:35"; hide zero count badges; 2-line names in the drawer; drawer counts units not lines; no hero price; h1 is a product name and "20% OFF" is an h2; Top Saver cards float on white; "SUMMER FRESH" eyebrow is kept because it's in the reference.

## Questions to Consider
1. What would a shopper know about Farmart after the first screen that they wouldn't know about any other grocer?
2. Why does the free-delivery progress live behind a click?
3. Are the 8 arrow pairs and 6 "All x" links there for shoppers or for the reference?
