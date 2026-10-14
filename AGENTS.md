<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

Farmart is an online grocery store built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.

## Project Structure & Module Organization

- `src/app/` holds the routes: `page.tsx` (home), `products/[id]/` (product detail), `search/` (search results and category listing), `api/` (route handlers), `design/` (the living design system), `overview/` (the UI flow map), `docs/` (Swagger UI for the API), `database-er-diagram/` (serves the Mermaid ERD), `test-report/` (readable test results), `e2e/` (the Playwright E2E report, with screenshots) and `on-boarding/` (the newcomer dashboard: live setup status, the data pipeline and every feature's flow from click to data).
- `src/components/` holds UI. Shared primitives are in `ui.tsx` (`Button`, `DiscountBadge`, `CountBadge`), and cart state is in `cart-context.tsx`.
- `src/server/` is the backend: `db/` (SQLite via built-in `node:sqlite`: schema and connection; it only reads data and never seeds), `catalog.ts` (queries shared by route handlers and pages), `validation.ts` (zod query and path schemas) and `http.ts` (`api()` wrapper, `Problem` errors, `parseQuery`/`parsePath`, and `only("GET")`, which every route exports so other methods answer a 405 problem with `Allow`).
- `src/data/` holds the seed data and shared types. It is the source of the database's starting data (see Data Work) and also feeds stories and `/design` specimens. The product page still reads it directly.
- `src/server/db/mermaid.html` is the database ER diagram (Mermaid), served at `/database-er-diagram`. Update it with every schema change; `er-diagram.test.ts` fails when they drift.
- The database is `.data/farmart.sqlite` (git-ignored). Only `npm run db:seed` creates and fills it. Until then the app fails with ``DatabaseNotReadyError: … Run `npm run db:seed` ``, and so does `npm run build`. `FARMART_DB` points elsewhere.
- Deployment is Vercel (README › Deploying to Vercel): `vercel.json` seeds before building, `outputFileTracingIncludes` in `next.config.ts` ships the database with every server route, and `servedFile` in `src/server/db/client.ts` copies it to the writable temp folder when `VERCEL` is set, because deployed files are read-only.
- `scripts/seed/` is the seed, separate from the backend: `seed.ts` (all the logic: validate `src/data`, write it, compare with it), `cli.ts` (the `db:seed`/`db:check`/`db:reset` commands; flags and output only) and `__tests__/`. The pipeline is `src/data/*.ts` → `scripts/seed/seed.ts` → `.data/farmart.sqlite` → `src/server/` → pages and `/api`; `/on-boarding` draws it with live status. App code must never import from `scripts/`.
- `scripts/` also holds `smoke.mjs` (`npm run smoke`), `capture-overview.mjs` (`npm run overview:shots`) and `graphify.mjs` (runs the project's graphify from `.venv/`).
- Python dev tools (only graphify): `pyproject.toml` + `uv.lock` + `.python-version` pin them, `npm run graph:setup` installs them into `.venv/` (git-ignored), `.graphifyignore` keeps third-party skills out of the graph.
- `.claude/` is the Claude Code setup, committed: `skills/` (ours are `farmart-*`; third-party ones are pinned in `skills-lock.json`), `hooks/` (the command guard and its tests) and `settings.json` (registers the hooks).
- `src/lib/design-md.ts` parses `DESIGN.md`. `src/lib/cart.ts` checks the cart read back from `localStorage` (anyone can edit it): whole quantities 1–99, valid prices. Prices there can still be edited, so checkout must price orders on the server.
- `e2e/` holds the Playwright end-to-end regression tests (`*.spec.ts`, config in `playwright.config.ts`), their helpers (`helpers.ts`: `snap` for step screenshots, `matchesBaseline` for image tests) and the approved image baselines in `e2e/__screenshots__/` (committed; Windows names end in `-win32.png`).
- `src/proxy.ts` hides the developer pages (`/on-boarding`, `/test-report`, `/e2e`, `/overview`, `/design`, `/docs`, `/database-er-diagram`, `/api/hello`; list in `src/lib/dev-tools.ts`) in production: they answer 404 unless the server runs with `FARMART_DEV_TOOLS=1`. In `npm run dev` they always work. A new developer page goes in both lists (a test checks they match).
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
- `npm run graph:setup` installs graphify into `.venv/` (pinned in `pyproject.toml`/`uv.lock`; needs Python 3.10–3.13 and uv). `npm run graph` rebuilds the code knowledge graph in `graphify-out/` (git-ignored); `npm run graphify -- explain "<symbol>"`, `path` and `query` ask it. See `CLAUDE.md` › graphify.
- `node --test .claude/hooks/block-dangerous-commands.test.mjs` tests the command guard: recursive deletes (`rm -r`, `find -delete`, `Remove-Item -Recurse`, …) and force pushes are denied, quoted text is not.
- `npm run smoke` runs the production smoke test (after `npm run build`): every route with the database seeded (developer pages hidden) and missing (with `FARMART_DEV_TOOLS=1`), nothing leaked.
- `npm run storybook` opens component stories at http://localhost:6006. `npx vitest --run --project=storybook` renders every story as a test.
- `npm run test:unit` runs backend unit tests (pure functions, no database). `npm run test:integration` runs route handler → SQLite tests and the OpenAPI contract test. `npm run test:backend` runs both with coverage.
- `npm run test:report` runs every test (unit, integration, stories) with coverage and writes `reports/` (git-ignored). Read it at http://localhost:3000/test-report; it reloads from the files, so rerun the command and refresh.
- E2E with Playwright, the standard workflow: `npm run build`, then `npx playwright test` (or `npm run test:e2e`; it deletes and seeds its own database, `.data/e2e.sqlite`, then starts its own `next start` on port 3100 against it, so the development database is never read or changed. The home page's HTML is still pre-rendered by `npm run build` from the database the build saw.), then `npx playwright show-report` (or `npm run test:e2e:report`) for Playwright's HTML report at http://localhost:9323: every step, traces of failures and image diffs (`playwright-report/`, git-ignored). The same run feeds the app's own summary at http://localhost:3000/e2e (from `reports/e2e/`), with a screenshot of each step. Useful flags: `npx playwright test e2e/cart.spec.ts`, `--project=mobile`, `--ui`, `--debug`. `npm run test:e2e:update` re-approves the image baselines after an intended UI change; look at every changed image before committing it.
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
- `e2e/`: user journeys through a real browser on the production build: home, search (suggestions, results, sort, pages), product page, cart (add, change, remove, reload), the API's error handling, security headers, hidden developer pages, and every page at 375px. Image tests (`matchesBaseline`) compare pages and the cart drawer with approved screenshots; they caught the closed cart drawer's shadow leaking onto every page. A bug fixed in the UI gets a `regression:` test here. Image baselines are per platform (Windows today); a Mac or Linux machine creates its own on its first `npm run test:e2e:update`.
- Keep backend coverage at 100% of lines (`farmart-backend-feature` covers what a new endpoint or table needs).
- When a change is finished, load the `farmart-code-review` skill (also for `/code-review` and any "review", "find bugs", "security risks" or "edge cases" request): it scopes the diff, runs lint and the tests for what changed, walks the Farmart checklist (API contract, input limits, 405s, SQL, browser state, developer pages, headers, dependencies, docs drift), probes the app with hostile input and reports findings by severity.
- Before committing or opening a PR, load the `farmart-verify` skill: the gate (lint, tsc, every test, build, audit, db:check), a look at affected pages at desktop and 375px, and `npm run smoke` (production, database seeded and missing) before a deploy.

## Commit & Pull Request Guidelines

Use Conventional Commits (`feat(api): add product detail endpoint`), one concern per commit, and commit only when asked. `main` is the main branch (remote `origin`, https://github.com/Imperator7/AIDLC_Farmart): work on a branch and open a PR into `main`; never push to `main` directly. `farmart-verify` › Commit and Pull request hold the scopes, what never to commit, how to split a large change, and the PR template.

## Skills and Hooks

- **Project skills** (`.claude/skills/farmart-*`): `farmart-onboard`, `farmart-design-system`, `farmart-backend-feature`, `farmart-code-review`, `farmart-verify`, `farmart-docs` (the living map of what exists and where, kept in sync with the source by its Sync procedure). Load the one that matches the work (see the sections above).
- **Third-party skills**: `impeccable` (design critique), `graphify` (knowledge graph, see `CLAUDE.md`), `grill-me` and `grilling` (an interview, in rounds, that stress-tests a plan before building it; `/grill-me` only starts `grilling`), and the caveman voice skills (`caveman`, `ultracave`, `megacave`, `caveman-commit`, `caveman-review`, `caveman-compress`, `caveman-stats`, `caveman-help`). Update them with `npx skills update`, never by hand.
- **Caveman never applies to what is persisted.** Code, comments, docs, skills, commit messages and PR text stay in full prose. Commits follow `farmart-verify` › Commit (a body that says why), not `caveman-commit`'s one-line style. Don't run `/caveman-compress` on `AGENTS.md`, `CLAUDE.md` or a skill.
- **Git pre-commit hook** (`.githooks/pre-commit`): every `git commit` runs lint, `tsc` and every test (Vitest unit, integration and stories, plus the guard tests), about 30 s, and refuses the commit if anything fails. Each clone turns it on once with `git config core.hooksPath .githooks` (`farmart-onboard` › Install). Never bypass it with `--no-verify` unless the person asks.
- **Stop hook** (`.claude/hooks/lint-on-stop.mjs`): when Claude ends a turn with uncommitted code changes, ESLint checks the changed files (about 2 s) and sends Claude back to fix any error or warning. It lets the turn end on the second try, so it can't loop.
- **PreToolUse hooks** (`.claude/settings.json`):
  - The command guard (`.claude/hooks/block-dangerous-commands.mjs`) denies force pushes and recursive deletes: `rm -r`/`-rf` in any flag order, `find -delete`, `find -exec rm -r`, PowerShell `Remove-Item -Recurse` and its aliases, cmd `rmdir /s`/`del /s`. It also looks inside `bash -c`, `cmd /c`, `powershell -Command`, `eval`, `$(…)`, backticks, subshells and wrappers (`sudo`, `xargs`, `timeout`). It reads shell text only, so it can't see a delete made from inside a program (`node -e`, a Python script); that is what the rule below is for. If it can't read a tool call, it denies it. About 0.3 s per shell command.
  - graphify's hook nudges toward the graph before searches and file reads. `scripts/graphify.mjs` starts graphify (about 0.6 s) only for calls it could nudge: a search tool in the command, or a source or text file. Other calls cost about 0.3 s. It stays silent until `npm run graph:setup` has run.

## Agent-Specific Instructions

- **After every coding change, run lint and the tests before you report the work as done.** `npm run lint` (ESLint, already set up in `eslint.config.mjs`; `npm run lint:fix` for what it can fix), `npx tsc --noEmit`, and the tests for what you touched: `npm run test:backend` for `src/server`, `src/app/api`, `src/lib` or `scripts/seed`; `npx vitest --run --project=storybook` for components and stories, plus `npm run build` and `npm run test:e2e` when a page, the cart or routing changed; `node --test .claude/hooks/block-dangerous-commands.test.mjs` for the command guard. Fix what fails; don't hand back work with a red lint or test. Docs-only changes need neither.
- **Before every commit, review the change and run lint and every test, even for a one-line change.** Review it with `farmart-code-review`, then load `farmart-verify` and run its gate; never commit with lint errors or a failing test, and never skip or disable a test to get there. Two hooks back this up (see Skills and Hooks): the Stop hook lints changed files after each turn, and the git pre-commit hook refuses a commit with red lint, types or tests.
- **Never work around the command guard.** No `fs.rmSync`, `Remove-Item -Recurse`, `shutil.rmtree` or another route to the same result. Delete single files, remove an empty folder with `rmdir`, or ask the person to run the command. The guard reads shell text, so a heredoc that only *mentions* a blocked command can trip it: edit files with the Edit tool, not `cat <<EOF`.

- On this Windows machine, edit files with the Edit tool, not PowerShell `Get-Content`/`Set-Content`. PowerShell 5.1 reads UTF-8 as the Thai codepage (874) and garbles `·`, `→` and Thai text.
- If `src/data` stops seeding or tests suddenly fail on data, check whether `src/data/*.ts` was edited (for example an emptied list) before changing code. Report the edit; don't silently revert someone's change.
- To test setup, onboarding or a skill, use a fresh copy of the repo (tracked plus untracked, non-ignored files) in the scratchpad, never the working copy. Recursive deletes are blocked by the command guard (`.claude/hooks/`), so don't delete the copy yourself and don't work around the guard: tell the person its path when you're done and let them remove it (the scratchpad is temporary anyway). If the copy links `node_modules` to the real one (a junction, to skip `npm install`), Turbopack refuses it ("points out of the filesystem root"): run that copy with `npx next dev --webpack`, and remove the junction with `rmdir` (a link, not a recursive delete) before the copy is deleted, so the real `node_modules` is never touched.
- When you stop a dev server you started, confirm the port is down. If the database must be copied or inspected as a single file, run `PRAGMA wal_checkpoint(TRUNCATE)` after the server is stopped.
