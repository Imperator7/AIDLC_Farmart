---
name: farmart-design-system
description: Farmart's design system workflow. Use before ANY UI change in this repo, such as adding or changing a component, page, overlay, color, spacing, copy on screen, or a story, and when touching DESIGN.md, /design, /overview, Storybook stories or the Impeccable skill. Not needed for API routes, data or other backend-only work.
---

# Farmart design system

`DESIGN.md` (repo root) is the single source of truth: YAML tokens (`colors`, `typography`, `rounded`, `spacing`, `components`) followed by prose (Overview, Colors, Typography, Layout, Elevation, Components, Overlays, Responsive Behavior, Known Gaps). `src/lib/design-md.ts` parses it at runtime, and `/design` renders from it. Read the sections you're touching before editing UI; don't copy values out of this skill.

## Workflow for any UI change

1. **Spec first.** Edit `DESIGN.md` (token, component YAML and its prose), then the code.
2. **Build with what exists.** Shared primitives are in `src/components/ui.tsx` (`Button` variants primary/dark/light/ghost/danger, `DiscountBadge`, `CountBadge`), icons in `src/components/icons.tsx`, and cart controls (`AddPill`, `QtyPill`, `CartControl`) in `product-card.tsx`. Reuse them rather than repeating class strings.
3. **New component checklist**, all four or `/design` reports drift:
   - a YAML entry under `components:` in `DESIGN.md`
   - a prose entry (`**\`name\`**: ...`) in the Components section
   - a specimen in `src/app/design/_components/registry.tsx` (add its key to a page's `keys`, or add a page)
   - a story `<name>.stories.tsx` next to the component. Titles mirror `/design` (`Components/…`, `Overlays/…`); page-only tools use `Tools/…`.
4. **Open `/design`.** It must show no "out of sync" warning.
5. **If a page, overlay or link changed**, update `src/app/overview/_components/flow-graph.ts` (and the `routes` list in `project-stats.ts` for a new route; for a new feature, its card in `src/app/on-boarding/_components/features.ts` too), then run `npm run overview:shots` (or `npm run overview:shots -- <id> …` for only the screens that changed; capture a new screen before `overview`, whose map shows it).
6. **Verify:** `npm run lint`, `npx tsc --noEmit`, `npx vitest --run --project=storybook`, `npm run build`, then look at the affected pages at desktop and 375px mobile in the browser.

## Rules that are easy to break

- **Color meaning:** amber = buy or selected, red = sale and urgency only (plus `button-danger`), green = delivery and success. Never add a new hue without a token.
- **Contrast floor:**
  - Text never uses gray-400 (`subtle` is non-text only); gray-500 is the lightest text, and on gray-100 use gray-600.
  - Amber text is amber-700, sale red is red-600 (`sale-soft` red-500 is for large text only), success green is emerald-700.
- **Icons:** drawn SVGs from `icons.tsx` (24px grid, currentColor, 2px stroke). No Unicode glyphs or emoji as icons; "›" inside text links is punctuation and is allowed.
- **Elevation:** declare it once, a border or a shadow, never both. Tiers are in `DESIGN.md` › Elevation.
- **Browser surfaces:** the ink `:focus-visible` ring, amber `::selection` and reduced-motion rules live in `src/app/globals.css`. Don't add `outline-none` without a replacement ring, and give new motion a `motion-reduce:` path.
- **Overlays** (`dialog`, `cart-drawer`) follow the behavior contract in `DESIGN.md` › Overlays: Escape, scrim click and an explicit button all close; focus moves in and back; the page is inert while open. `cart-toast` is not an overlay.
- **Touch targets:** 24px minimum everywhere; aim for 44px on mobile, except the documented 32px card steppers.
- **Copy:** controls name their action; plurals are correct ("1 item").
- **Server vs client:** components are Server Components by default. Shared constants that server code needs go in `src/data/` (for example `src/data/store.ts`), never in a `"use client"` module.

## /design (living design system)

- `src/app/design/layout.tsx`: sidebar plus the out-of-sync check (YAML component keys vs registry keys).
- `src/app/design/[slug]/page.tsx`: renders foundation pages from `DESIGN.md` and component pages from the registry.
- `src/app/design/_components/registry.tsx`: page definitions (`slug`, `section`, `keys`, `specimen`, `intro`).

## /overview (UI flow map)

- Built with React Flow (`@xyflow/react`). Screens and links are listed by hand in `src/app/overview/_components/flow-graph.ts`.
- Built screens show real screenshots from `public/overview/<id>.jpg`; unbuilt ones use dashed skeletons from `wireframes.tsx`. Each card links to its screen via `href` / `hrefLabel`.
- The "Project overview" card is a `summary` node. Its numbers are counted at build time by `project-stats.ts` from product data, `DESIGN.md`, story files and `package.json`, so never hard-code them.
- `npm run overview:shots` (Playwright) needs `npm run dev`, and `npm run storybook` for the Storybook shot.

## Storybook

- `npm run storybook` runs on :6006. `.storybook/preview.tsx` wraps every story in `CartProvider` with `CartDrawer` and `CartToast`, Geist fonts and `globals.css`.
- Seed cart state in `beforeEach` via `localStorage["farmart-cart"]`, not from a story effect (the provider's restore would overwrite it).
- `nextjs.appDirectory` is on, so `useRouter` from `next/navigation` works. There is no API in Storybook: components that call `/api` (the search bar) mock `window.fetch` in `beforeEach` and restore it in the returned cleanup.
- Components take their data as props (pages load it from `src/server/`); stories and `/design` specimens pass the mock data from `src/data/home.ts`. Pure helpers that both server and client need go in `src/lib/`, never in a `"use client"` file.
- If Storybook spins forever after moving or renaming a story file, restart it: the Windows watcher can miss deletions and report duplicate story ids.

## Impeccable (design critique and polish)

- Installed at `.claude/skills/impeccable`. Its `scripts/impeccable` launcher downloads and runs a binary from GitHub; it has not been run. Use the skill's documented fallback: read `DESIGN.md` directly and follow `reference/*.md`.
- Critique snapshots are written by hand to `.impeccable/critique/`. `.impeccable/critique/ignore.md` lists what the user excluded (unbuilt functionality, kept eyebrow labels).
- Keep the theme unless the user asks for a redesign: Harvest Amber, red for urgency, Geist, white plates on a gray floor, and the reference layout.
