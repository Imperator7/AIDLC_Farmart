---
name: farmart-onboard
description: Get Farmart from a fresh clone to a seeded, running development setup - prerequisites, install, seeding the starting data into SQLite (npm run db:seed) and checking it against the reference data (npm run db:check), running the app, and the day-to-day data workflow (change seed data, restore, reset after a schema change). Use when someone is new to the repo, sets up a machine, asks how to start developing or what data the app should have, needs to seed, check, restore or reset the database, or setup fails. Not for UI design work (farmart-design-system) or API design (AGENTS.md › API Work).
---

# Farmart onboarding: seed the starting data and start developing

Farmart is a Next.js 16 grocery store with its backend in the same app: route handlers in `src/app/api/`, logic in `src/server/`, data in SQLite (`.data/farmart.sqlite`) through Node's built-in `node:sqlite`. There is no database server and no `.env` to set up.

Development starts from **one known set of data**: 8 categories, 16 products, 4 Top Saver deals, 6 banners and 5 settings. Pages, API examples and backend tests all assume it. The full list is in [references/seed-data.md](references/seed-data.md).

```
src/data/*.ts  ──npm run db:seed──▶  .data/farmart.sqlite  ──npm run db:check──▶  ✓ matches the reference
 (source, in git)                     (local copy, git-ignored)
```

Walk the person through the steps in order and run the commands for them when you can. Check each **Expect** line before moving on; if it doesn't match, see Common problems.

## 1. Prerequisites

- **Node.js 22.13 or newer**; Node 24 is what the project is developed on. `node:sqlite` doesn't exist in older versions.
  - Check: `node -v`.
- **npm** (comes with Node) and **git**.
- **Python 3.10–3.13** and **uv**, for graphify (the code knowledge graph Claude Code queries before reading files). The app runs without them; the graphify hooks stay silent until it's set up.
  - Check: `python --version` and `uv --version` (or `python -m uv --version`).
  - No uv? `pip install uv` (or `winget install astral-sh.uv`).
- Windows works (the repo is developed on it); use Git Bash or PowerShell.

## 2. Install

```bash
npm install
npx playwright install chromium
git config core.hooksPath .githooks
npm run graph:setup
npm run graph
```

- The first line installs dependencies. The second downloads the headless Chromium for story tests; it's needed once per machine.
- `git config core.hooksPath .githooks` turns on the project's pre-commit hook: every commit first runs lint, the type check and every test (about 30 s) and is refused if any fail. Git doesn't run a repo's hooks until each clone opts in, so this is once per clone.
- `npm run graph:setup` installs graphify into `.venv/` inside the project, at the version pinned in `pyproject.toml`/`uv.lock` (the Python side's `npm install`). `npm run graph` builds `graphify-out/` (about 10 s, local, no AI cost). Nothing is installed globally.
- **Expect:** no errors.
  - `npm warn install-scripts …` lines are normal: this npm setup skips install scripts, and the project doesn't need them.
- **If `npm install` ends with "N high severity vulnerabilities … run `npm audit fix --force`", do not run it.**
  - Those findings are in dev-only tools (ESLint's dependency chain). What counts is `npm audit --omit=dev`, which must say `found 0 vulnerabilities`.
  - `--force` would downgrade `eslint-config-next` and break linting.

## 3. Seed the starting data (required)

```bash
npm run db:seed
```

- This creates `.data/farmart.sqlite` with the schema (`src/server/db/schema.ts`), then fills it from `src/data/` (`home.ts`, `product-details.ts`, `store.ts`) through `scripts/seed/seed.ts` (the command itself is `scripts/seed/cli.ts`). The seed is separate from the backend. To see the whole pipeline with live status, open http://localhost:3000/on-boarding.
- The write is one transaction: it all succeeds, or nothing changes.
- **Expect:** `Created and seeded .data\farmart.sqlite` (or `Re-seeded …` if it already existed), then this table:

  | table | rows |
  |---|---|
  | deals | 4 |
  | product_details | 16 |
  | products | 16 |
  | categories | 8 |
  | banners | 6 |
  | settings | 5 |

Then confirm the data is exactly the reference set:

```bash
npm run db:check
```

- **Expect:** `✓ .data\farmart.sqlite matches the seed data in src/data (…)`.
- `db:check` opens the database read-only, seeds a throwaway in-memory copy from `src/data`, and compares every row and column. It never changes anything.
- When something differs, it says exactly what, for example `products bs1: price_cents is 1, the seed has 195`, or `banners bnr_soda: missing`. Run `npm run db:seed` to restore.

**The app never seeds itself.** The backend (`src/server/`) only reads the database. Skip this step and every page and `/api` call fails with ``DatabaseNotReadyError: There is no database at .data\farmart.sqlite. Run `npm run db:seed` ``, and so does `npm run build`. Once you seed, the next request works; no restart needed. Backend tests are the exception: they seed their own in-memory copy and don't need this step.

## 4. Run the app and see the data

```bash
npm run dev
```

**Expect** (the full list is in [references/seed-data.md](references/seed-data.md) › Quick checks):

| Open | You should see |
|---|---|
| http://localhost:3000 | 8 category circles; Top Saver ts4 → ts1 → ts2 → ts3 with a countdown; Best Seller bs1–bs6; New Arrivals jl1–jl6 |
| http://localhost:3000/search?q=oat | 1 product: Homemade Oatmeal Cookies |
| http://localhost:3000/search | "All products": 16 products on 2 pages |
| http://localhost:3000/api/products?q=oat | the same product as JSON |

Dev tools:
- `/on-boarding`: **start here.** Live setup status, the data pipeline, and how every feature gets its data. It works even before seeding.
- `/docs`: API, Swagger.
- `/database-er-diagram`: tables and relationships.
- `/test-report`: test results.
- `/e2e`: a summary of the last Playwright end-to-end run, with a screenshot of every step (after `npm run build` and `npx playwright test`). Playwright's full HTML report: `npx playwright show-report`.
- `/design`: the design system.
- `/overview`: every page.

`npm run storybook` opens component stories at http://localhost:6006 (optional).

## 5. Verify the setup

```bash
npm run test:report
```

- Runs unit, integration and story tests with coverage. Backend tests use their own in-memory copy of the same seed data, so they don't touch your database.
- **Expect:** "Test Files N passed" and no "failed". Read the details at http://localhost:3000/test-report.

The setup is done: the data is seeded and checked, the app runs, and the tests pass. You can start developing.

## 6. Working with the data while developing

| You want to… | Do this |
|---|---|
| Undo data you changed by hand or while trying something | `npm run db:seed`. **Works while `npm run dev` is running.** |
| Know whether your database still matches the reference | `npm run db:check` |
| Change the starting data for everyone (add a product, change a price) | 1. Edit `src/data/*.ts`. 2. `npm run db:seed`. 3. `npm run db:check`. 4. `npm run test:integration`, and update the tests and [references/seed-data.md](references/seed-data.md) where the change is intended. |
| Change the schema (a table or column) | 1. Edit `schema.ts` and bump `SCHEMA_VERSION`. 2. Update `scripts/seed/seed.ts` (the inserts, and the `KEY` map for a new table). 3. Update `src/server/db/mermaid.html` (a test checks it against the schema). 4. Stop the dev server, then `npm run db:reset`. |
| Start over from an empty file | Stop the dev server, then `npm run db:reset` (deletes the file and rebuilds schema and data) |
| Use a scratch database | `npm run db:seed -- --file .data/scratch.sqlite` (or set `FARMART_DB`); `db:check` takes `--file` too |
| Look at the rows | DB Browser for SQLite or a VS Code SQLite viewer (read-only), or `node -e "const {DatabaseSync}=require('node:sqlite');console.table(new DatabaseSync('.data/farmart.sqlite',{readOnly:true}).prepare('SELECT id,name,price_cents FROM products').all())"` |

Rules to remember:
- **The SQLite file is a copy; `src/data/*.ts` is the source.** Editing the `.sqlite` file directly is lost on the next seed, and deleting it only resets the data.
- **Money is integer cents** in SQLite (`price_cents` 195 = $1.95); the API returns dollars.
- **After seeding,** `/search` and `/api/*` change right away. The home page is cached and catches up within 60 s.
- **The seed checks `src/data` before writing.** It catches no categories, a product in an unknown category, duplicate ids, a price of 0 or below, `oldPrice` not above `price`, and details or deals for a missing product. It stops with `SeedDataError` and a plain list, and writes nothing.
- **The dev server keeps changes in `farmart.sqlite-wal` while it runs.** Stop it before copying the database file, or the copy may miss recent data.

## 7. Where to read next

- `AGENTS.md`: structure, commands, coding style, API and testing rules.
- `PLAN.md`: epics and backlog.
- `openapi.yaml`: the API contract (✓ means implemented), shown at `/docs`.
- `DESIGN.md` and the `farmart-design-system` skill: before any UI change.

## Seed command reference

| Command | Effect | Safe while the dev server runs? |
|---|---|---|
| `npm run db:seed` | Empty every table, insert the seed data (creates the file if missing) | ✅ |
| `npm run db:check` | Compare with the seed data; list differences; read-only | ✅ |
| `npm run db:reset` | Delete the file (+ `-wal`/`-shm`), rebuild schema and data | ❌ stop it first |
| `… -- --file <path>` | Use another database file | |
| `npx tsx scripts/seed/cli.ts --help` | Show the options | |

All three exit with code 1 on failure, so they can run in CI.

## Common problems

- **`No such built-in module: node:sqlite`:** Node is older than 22.13. Upgrade Node.
- **`ExperimentalWarning: SQLite is an experimental feature`:** harmless on some Node versions.
- **`DatabaseNotReadyError: There is no database at …` or `… has no data`** (in the browser, the terminal running `npm run dev`, or `npm run build`): the database hasn't been seeded. Run `npm run db:seed`, then reload.
- **`DatabaseNotReadyError: … was built for schema version N`:** the schema changed since you seeded. Stop the dev server and run `npm run db:reset`.
- **`SeedDataError: The seed data in src/data has N problems`:** `src/data/*.ts` was edited into an inconsistent state, for example an emptied `categoryList`. Each line names the item and the file; fix them and run `npm run db:seed`. A bare `FOREIGN KEY constraint failed` comes from an older checkout without the check, and has the same cause.
- **`db:check` lists differences:** the database was changed after seeding, by hand, by a test against the real file, or by an older seed. `npm run db:seed` restores it. If the differences are intended, change `src/data` instead.
- **`db:check` says the file doesn't exist:** run `npm run db:seed` first.
- **`db:reset` says the file is in use:** stop `npm run dev`, Storybook and any test run, then retry. To restore data without stopping, use `npm run db:seed`.
- **The home page still shows old data after seeding:** it's cached for 60 s. Wait, or check `/search`, which isn't cached.
- **`⨯ Another next dev server is already running.`:** this project's dev server is already up (maybe in another terminal or the desktop app's preview). Open http://localhost:3000, or stop that one first. Changing the port doesn't help; Next allows one dev server per project folder.
- **`⚠ Port 3000 is in use by process …, using available port 3001 instead`:** a different program has port 3000. That's fine: use the URL Next prints (http://localhost:3001).
- **Story tests fail with "browserType.launch: Executable doesn't exist":** run `npx playwright install chromium`.
- **Storybook spins forever after renaming a story:** restart it (the Windows file watcher can miss deletions).
- **Garbled `·`, `→` or Thai text after editing in PowerShell:** PowerShell 5.1 reads UTF-8 as codepage 874. Use an editor or the Edit tool.
- **`next build` warns about a `package-lock.json` outside the repo:** a stray lockfile in a parent folder. Harmless; delete it, or set `turbopack.root`.
