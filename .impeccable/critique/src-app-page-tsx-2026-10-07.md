---
target: "homepage"
resolved_target: "src/app/page.tsx"
date: 2026-10-07
total_score: 27
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 0
scope: "UI/UX only (ignore.md applied); run 1 also counted functionality, so 21 -> 27 is not like-for-like"
method: "dual-agent with live verification; CLI detector unavailable (engine binary not run); written by hand because critique-storage needs the engine"
---

# Critique #2: Farmart homepage (src/app/page.tsx)

Mode: Operate. Constraint: keep the theme.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Add feedback is strong; the featured lift moves on every tab switch and is never explained |
| 2 | Match System / Real World | 3 | The hero is the only unpriced product |
| 3 | User Control and Freedom | 3 | Mobile MENU ignores Escape and outside clicks; tapping the toast pins it |
| 4 | Consistency and Standards | 3 | Two shelf treatments; two remove controls in the drawer |
| 5 | Error Prevention | 3 | 3 of 12 tabs lead to empty shelves |
| 6 | Recognition Rather Than Recall | 3 | Icon-only Account and Wishlist |
| 7 | Flexibility and Efficiency | 2 | Tabs are the only filter |
| 8 | Aesthetic and Minimalist Design | 3 | Support phone louder than the cart total; red overload in Top Saver |
| 9 | Error Recovery | 2 | Empty tab state has no next step |
| 10 | Help and Documentation | 2 | Trust strip and footer; little contextual help |
| Total | | 27/40 | Acceptable |

## Design Specificity Verdict
The composition is a template on purpose (reference). The specificity is in behavior: in-place stepper, trash at 1, a toast that does the free-delivery math, the shared stepper, strict amber/red/green semantics.

Scan: 0 contrast failures (189 desktop and 178 mobile text nodes), no overflow.
True positives:
- Mobile tab focus ring clipped by `overflow-x-auto` (product-tabs-section.tsx:22, confirmed with real Tab focus).
- Toast ring plus shadow double elevation (cart-toast.tsx:60).
- Desktop search button is 48x16 (header.tsx:81).
- `aria-label="Cart"` hides the visible total (header.tsx:107, WCAG 2.5.3).
- Nested live regions (cart-toast.tsx).
- Dialog scale has no reduced-motion path (dialog.tsx:106).
- MENU chevron rotation has no reduced-motion path.
- `--foreground: #171717` is off-token.

False positive: "›" in text links (allowed by DESIGN.md).

## Priority Issues
1. [P2] Tabs offer empty shelves and don't match the store's categories (3/12 empty, wine reachable only under All, 655px tab row with no scroll cue, clipped focus ring). Fix: build tabs per row from its categories, "Show all" in the empty state, edge fade, `py-1` on the container. `harden`, `adapt`
2. [P2] Mobile first screen holds no product: header plus trust strip is 259px, categories at y=1061, first Add at y=2265. The mobile toast is 134px and covers the next row's Add buttons. Fix: one trust item below 640px, a compact mobile hero or collapsible promo, a ~56px one-line mobile toast. `adapt`
3. [P2] The resting "+ Add" is the faintest element on the card (1px amber-400, 1.7:1). Fix: amber-50 fill with a 1.5-2px border; solid fill stays "in basket". Update DESIGN.md first. `bolder`
4. [P2] The sign-up card competes in Top Saver: 30px "15% OFF" is the largest type; at 768-1023px the card is 853px wide with 805px inputs. Fix: 24px headline, `max-w-sm` below lg, chip before the arrows. `quieter`, `layout`
5. [P2] Drawer details: "(1 items)" and "All 1 items", a 44x16 duplicate Remove, Tab not trapped (Known Gap). Fix: plurals, drop Remove or pad it, `inert` page while open. `harden`, `clarify`

## Persona Red Flags
- Casey (mobile): no product on the first screen; 30px tabs with no scroll cue; the toast covers the next row's Add buttons.
- Riley (stress tester): empty tabs; "1 items"; the featured lift moves; MENU ignores Escape.
- Jordan (first-timer): SHOP BY CATEGORY vs MENU ambiguity; unexplained featured lift.

## Minor Observations
Support phone louder than the cart total; alternating page floor; rounded featured card in a square grid; sign-up input borders about 1.2:1 on orange-50 (use control-border); 11px stars; off-token --foreground; hero has no price.

## Questions to Consider
1. Why is the resting buy control the palest amber on the page?
2. Would the member offer convert better after the first add?
3. What does an unpriced single-juice hero do that the deal row doesn't?
