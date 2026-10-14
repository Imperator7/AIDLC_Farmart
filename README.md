# Farmart

An online grocery store: browse fresh produce and pantry staples, search and filter the catalog, and fill a cart. Built
with **Next.js 16** (App Router), **React 19**, **TypeScript** and **Tailwind CSS 4**, with the backend in the same app:
route handlers under `/api` and data in **SQLite** through Node's built-in `node:sqlite`. There is no database server and
no `.env` to set up.

## Quick start

You need **Node.js 22.13 or newer** (the project is developed on Node 24), npm and git.

```bash
git clone https://github.com/Imperator7/AIDLC_Farmart.git
cd AIDLC_Farmart
npm install
npm run db:seed     # creates .data/farmart.sqlite from src/data
npm run db:check    # confirms the database matches that data
npm run dev         # http://localhost:3000
```

Turn on the pre-commit hook once per clone (it runs lint, types and every test before each commit):

```bash
git config core.hooksPath .githooks
```

New to the project? Open http://localhost:3000/on-boarding once the dev server runs. It shows the live setup status, the
data pipeline and how every feature gets its data, from the click to the database.

## What's in the app

| Page | What it shows |
|---|---|
| `/` | Home: hero banner, categories, Top Saver deals with a countdown, Best Seller and New Arrivals |
| `/search` | Search results and category listings, with sorting and pages |
| `/products/[id]` | Product detail |
| `/api/*` | The JSON API: products, search suggestions, categories, banners, store settings |

Developer pages, available in `npm run dev` and hidden (404) in production unless the server runs with
`FARMART_DEV_TOOLS=1`:

| Page | What it shows |
|---|---|
| `/on-boarding` | Newcomer dashboard: setup status, data pipeline, feature flows |
| `/design` | The living design system, generated from `DESIGN.md` |
| `/overview` | The UI flow map |
| `/docs` | Swagger UI for the API contract (`openapi.yaml`) |
| `/database-er-diagram` | The database ER diagram |
| `/test-report` | Unit, integration and story test results with coverage |
| `/e2e` | The Playwright end-to-end report, with a screenshot of every step |

## How the data flows

```
src/data/*.ts  →  scripts/seed/seed.ts  →  .data/farmart.sqlite  →  src/server/  →  pages and /api
 (seed data)        (npm run db:seed)        (local, git-ignored)     (queries)
```

`src/data` is the source of the starting data; the SQLite file is only a local copy. Change data in `src/data` and run
`npm run db:seed` again, never edit the database by hand. `npm run db:reset` rebuilds the file from scratch (stop the dev
server first).

## Project layout

```
src/app/          routes: pages, /api route handlers and the developer pages
src/components/   UI; shared primitives in ui.tsx, cart state in cart-context.tsx
src/server/       backend: db/ (schema, connection), catalog.ts (queries), validation.ts (zod), http.ts (api wrapper, errors)
src/lib/          helpers shared by server and client (cart sanitizing, DESIGN.md parser, dev-tool paths)
src/data/         seed data and shared types
scripts/seed/     the seed CLI (db:seed, db:check, db:reset)
e2e/              Playwright tests and the approved image baselines
DESIGN.md         design system spec, the single source of truth for UI
openapi.yaml      API contract (OpenAPI 3.1)
PLAN.md           epics, backlog and status
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server at http://localhost:3000 |
| `npm run build` / `npm start` | Production build (needs a seeded database) and server |
| `npm run lint` / `npx tsc --noEmit` | ESLint and type check |
| `npm run test:backend` | Backend unit and integration tests with coverage (kept at 100% of lines) |
| `npx vitest --run --project=storybook` | Renders every component story as a test |
| `npm run test:report` | Every Vitest test with coverage; read it at `/test-report` |
| `npm run test:e2e` | Playwright end-to-end tests against the production build (run `npm run build` first) |
| `npm run test:e2e:report` | Playwright's HTML report at http://localhost:9323 |
| `npm run smoke` | Production smoke test of every route, with the database seeded and missing |
| `npm run storybook` | Component stories at http://localhost:6006 |
| `npm run db:seed` / `db:check` / `db:reset` | Seed, compare or rebuild the database |

## Testing

- **Unit** (`src/server/__tests__/unit`): validation, HTTP helpers, search, dates. No database.
- **Integration** (`src/server/__tests__/integration`): every route handler against a freshly seeded in-memory SQLite,
  plus a contract test that checks real responses against `openapi.yaml`.
- **Stories**: every component story renders without errors.
- **End-to-end** (`e2e/`): user journeys in a real browser on the production build, at desktop width and 375px, with
  image comparisons against approved screenshots. Each run seeds its own database (`.data/e2e.sqlite`), so the results
  don't depend on your development data.

## Deploying to Vercel

The project deploys to [Vercel](https://vercel.com) as is; `vercel.json` holds what Vercel needs.

1. On https://vercel.com/new, import the GitHub repository `Imperator7/AIDLC_Farmart`. Keep the detected framework
   (Next.js) and the settings from `vercel.json`; no environment variables are needed.
2. Click **Deploy**. Every push to `main` then deploys to production, and every pull request gets a preview URL.

How the database works there:

- The build command is `npm run db:seed && npm run build`: the build seeds `.data/farmart.sqlite` from `src/data`
  first, because pre-rendering reads it.
- `next.config.ts` (`outputFileTracingIncludes`) ships that file with every server route.
- Vercel's deployed files are read-only, so on Vercel (`VERCEL` is set) the app copies the database to the temp folder
  once per instance and reads it there (`servedFile` in `src/server/db/client.ts`).
- The app only reads data, so this is enough for the catalog. Anything that writes and must last (accounts, orders)
  will need a hosted database instead of a file in the deployment.
- Developer pages stay hidden in production unless `FARMART_DEV_TOOLS=1` is set in the project's environment variables.

## Contributing

- `main` is the main branch. Work on a branch (`feat/…`, `fix/…`, `docs/…`) and open a pull request into `main`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org), for example
  `feat(api): add product detail endpoint`, one concern per commit.
- Before opening a PR, run lint, `tsc`, the tests and the build. The pre-commit hook refuses a commit with red lint,
  types or tests.
- UI changes follow `DESIGN.md`; API changes start in `openapi.yaml`.
- Contributor and AI-agent guidelines, in full: [`AGENTS.md`](AGENTS.md).
