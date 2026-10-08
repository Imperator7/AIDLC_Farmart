<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

Farmart is an online grocery store built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.

## Project Structure & Module Organization

- `src/app/` holds the routes: `page.tsx` (home), `products/[id]/` (product detail), `search/` (search results and category listing), `api/` (route handlers), `design/` (the living design system), `overview/` (the UI flow map), `docs/` (Swagger UI for the API), `database-er-diagram/` (serves the Mermaid ERD), `test-report/` (readable test results) and `on-boarding/` (the newcomer dashboard: live setup status, the data pipeline and every feature's flow from click to data).
- `src/components/` holds UI. Shared primitives are in `ui.tsx` (`Button`, `DiscountBadge`, `CountBadge`), and cart state is in `cart-context.tsx`.
- `src/server/` is the backend: `db/` (SQLite via built-in `node:sqlite`: schema and connection; it only reads data and never seeds), `catalog.ts` (queries shared by route handlers and pages), `validation.ts` (zod query schemas) and `http.ts` (`api()` wrapper, `Problem` errors).
- `src/data/` holds the seed data and shared types. It is the source of the database's starting data (see Data Work) and also feeds stories and `/design` specimens. The product page still reads it directly.
- `src/server/db/mermaid.html` is the database ER diagram (Mermaid), served at `/database-er-diagram`. Update it with every schema change; `er-diagram.test.ts` fails when they drift.
- The database is `.data/farmart.sqlite` (git-ignored). Only `npm run db:seed` creates and fills it. Until then the app fails with ``DatabaseNotReadyError: … Run `npm run db:seed` ``, and so does `npm run build`. `FARMART_DB` points elsewhere.
- `scripts/seed/` is the seed, separate from the backend: `seed.ts` (all the logic: validate `src/data`, write it, compare with it), `cli.ts` (the `db:seed`/`db:check`/`db:reset` commands; flags and output only) and `__tests__/`. The pipeline is `src/data/*.ts` → `scripts/seed/seed.ts` → `.data/farmart.sqlite` → `src/server/` → pages and `/api`; `/on-boarding` draws it with live status. App code must never import from `scripts/`.
- `src/lib/design-md.ts` parses `DESIGN.md`.
- `DESIGN.md` is the design system spec and the single source of truth. `openapi.yaml` is the API contract (OpenAPI 3.1), rendered at `/docs` and served as `/docs/openapi.json`. `PLAN.md` holds the epics and backlog.

## Build, Test, and Development Commands

New to the repo or setting up a machine? Load the `farmart-onboard` skill, and open http://localhost:3000/on-boarding once the dev server runs (it works before seeding). It goes from install to seeded, checked data and a running app in order: `npm install` → `npm run db:seed` → `npm run db:check` → `npm run dev`.

- `npm run dev` starts the dev server at http://localhost:3000. Next allows one dev server per project folder.
- `npm run db:seed` loads the starting data from `src/data/` into SQLite. It's the setup step, and it also restores the data; it's safe while the dev server runs.
- `npm run db:check` compares the database with that data, read-only, and lists every difference.
- `npm run db:reset` deletes the file and rebuilds it. Stop the dev server first.
- All three exit with code 1 on failure.
- `npm run build` creates the production build and pre-renders every product and design page.
- `npm run lint` / `npm run lint:fix` run ESLint and auto-fix what they can.
- `npx tsc --noEmit` type-checks. After adding a route, run `npx next typegen` first.
- `npm run smoke` runs the production smoke test (after `npm run build`): every route with the database seeded and missing, nothing leaked.
- `npm run storybook` opens component stories at http://localhost:6006. `npx vitest --run --project=storybook` renders every story as a test.
- `npm run test:unit` runs backend unit tests (pure functions, no database). `npm run test:integration` runs route handler → SQLite tests and the OpenAPI contract test. `npm run test:backend` runs both with coverage.
- `npm run test:report` runs every test (unit, integration, stories) with coverage and writes `reports/` (git-ignored). Read it at http://localhost:3000/test-report; it reloads from the files, so rerun the command and refresh.
- `npm audit --omit=dev` must report 0 vulnerabilities. A plain `npm install` reports high-severity findings in dev-only tools (the ESLint chain). Never run `npm audit fix --force`: it downgrades `eslint-config-next` and breaks linting.

## Coding Style & Naming Conventions

- Use 2-space indentation, double quotes and semicolons.
- File names are kebab-case (`cart-drawer.tsx`). Components are PascalCase.
- Components are Server Components by default. Add `"use client"` only to interactive leaves.
- Server code stays on the server: never import `src/server/` (or `node:sqlite`) from a `"use client"` module; helpers both sides need go in `src/lib/`. Server Components and pages call `src/server/` functions directly, never `fetch` your own `/api`; client components use `/api`.
- Style with Tailwind utilities, and reuse `ui.tsx` primitives instead of repeating class strings.
- Load images with `next/image`. New remote hosts must be added to `images.remotePatterns` and the CSP in `next.config.ts`.

## UI Work

For any UI change (components, pages, styling, stories, `DESIGN.md`, `/design`, `/overview`), load the `farmart-design-system` skill first. It holds the design-system workflow and rules.

## API and Backend Work

For any endpoint, table or backend change (`src/app/api`, `src/server`, `schema.ts`, `openapi.yaml`), load the `farmart-backend-feature` skill first. It holds the workflows (endpoint, table, moving a page onto SQLite), the rules (spec-first, thin handlers, money in cents), code templates and the "done" checklist.

## Data Work

`src/data/*.ts` is the source of the starting data and `.data/farmart.sqlite` is only a local copy: change data in `src/data`, never in SQLite. Pages, API examples and backend tests assume that data (listed in `farmart-onboard/references/seed-data.md`). Seeding, checking, restoring or changing the seed data: `farmart-onboard` › Working with the data. A new table or column: `farmart-backend-feature` › Workflow B.

## Testing Guidelines

Components: each has a `<name>.stories.tsx` file next to it. Backend tests live in `src/server/__tests__/`, and tests for the seed in `scripts/seed/__tests__/` (same `unit/` and `integration/` split, same Vitest projects):

- `unit/`: validation, `http.ts`, search helpers, dates, and the ERD-vs-schema check. No database.
- `integration/`: the repository and every route handler against a freshly seeded in-memory SQLite (one per test file, seeded by `setup-db.ts` because the backend never seeds), the connection's behaviour (creates tables, refuses a missing, empty or outdated database) and schema constraints, and `contract.test.ts`, which validates real responses against `openapi.yaml` (undocumented fields fail) and checks that every route is in the spec and marked ✓.
- Keep backend coverage at 100% of lines (`farmart-backend-feature` covers what a new endpoint or table needs).
- Before committing or opening a PR, load the `farmart-verify` skill: the gate (lint, tsc, every test, build, audit, db:check), a look at affected pages at desktop and 375px, and `npm run smoke` (production, database seeded and missing) before a deploy.

## Commit & Pull Request Guidelines

Use Conventional Commits (`feat(api): add product detail endpoint`), one concern per commit, and commit only when asked. `farmart-verify` › Commit and Pull request hold the scopes, what never to commit, how to split a large change, and the PR template.

## Agent-Specific Instructions

- On this Windows machine, edit files with the Edit tool, not PowerShell `Get-Content`/`Set-Content`. PowerShell 5.1 reads UTF-8 as the Thai codepage (874) and garbles `·`, `→` and Thai text.
- If `src/data` stops seeding or tests suddenly fail on data, check whether `src/data/*.ts` was edited (for example an emptied list) before changing code. Report the edit; don't silently revert someone's change.
- To test setup, onboarding or a skill, use a fresh copy of the repo (tracked plus untracked, non-ignored files) in the scratchpad, never the working copy. Delete it afterwards. If the copy links `node_modules` to the real one (a junction, to skip `npm install`), Turbopack refuses it ("points out of the filesystem root"): run that copy with `npx next dev --webpack`, and remove the junction with `rmdir` before deleting the copy so the real `node_modules` is never touched.
- When you stop a dev server you started, confirm the port is down. If the database must be copied or inspected as a single file, run `PRAGMA wal_checkpoint(TRUNCATE)` after the server is stopped.
