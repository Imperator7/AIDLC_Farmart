---
name: farmart-verify
description: Check that a Farmart change is ready, then commit it - the gate (lint, types, every test with coverage, production build, audit, data check) in a fixed order, a look at the changed pages at desktop and 375px, an optional production smoke test (npm run smoke - database seeded and missing), and a Conventional Commit plus PR description. Use when a change is finished, before committing or opening a PR, before a deploy or demo, when asked "is it ready?", "check everything", "run the checks" or "commit this", or after a big refactor. Not for writing the change itself (farmart-backend-feature, farmart-design-system) or first-time setup (farmart-onboard).
---

# Farmart verify: is it ready to ship?

Run the steps in order. **Stop at the first failure**, fix it, and rerun from that step: later steps assume the earlier ones passed (a build after a type error only adds noise). Report each step's result to the person as you go, with the command's real output when something fails.

## 1. The gate

| # | Command | Passes when | When it fails |
|---|---|---|---|
| 1 | `npm run lint` | no output after the `eslint` line | `npm run lint:fix`, then fix the rest by hand |
| 2 | `npx tsc --noEmit` | no output | Added or moved a route? Run `npx next typegen` first (it writes the `PageProps`/`RouteContext` types), then rerun |
| 3 | `npm run test:report` | `Test Files N passed`, no `failed`, and `All files` lines at **100** | Read the failures at http://localhost:3000/test-report. Below 100% lines means a missing test or dead code |
| 4 | `npm run build` | `✓ Compiled successfully`, all static pages generated, **no new warnings** | See "Reading the build" below |
| 5 | `npm audit --omit=dev` | `found 0 vulnerabilities` | A production dependency is vulnerable; update it. Never run `npm audit fix --force` |
| 6 | `npm run db:check` | `✓ … matches the seed data` | Unintended: `npm run db:seed`. Intended (you changed `src/data`): see `farmart-onboard` › Working with the data |

Run these too when the change touched them:
- **`openapi.yaml` changed:** `npx @redocly/cli lint openapi.yaml`. It must say "valid"; compare the warning count with before.
- **`DESIGN.md` or a component changed:** open http://localhost:3000/design. It must show no "out of sync" warning.

### Reading the build

`npm run build` needs a seeded database: it pre-renders the home page and every product page from SQLite. A `DatabaseNotReadyError` here means `npm run db:seed`, not a code bug.

Compare the warnings with the known ones below. Anything new is a finding, even if the build "succeeded":
- `Dynamic filesystem access causes tracing of the whole project`: a runtime file path in server code. Mark `process.cwd()` with `/* turbopackIgnore: true */` (see `src/server/db/client.ts`).
- A route that used to be `○` (static) is now `ƒ` (dynamic), or the other way round. Check that was intended: static pages keep working without a database, dynamic ones don't.

## 2. Look at it

For every page the change affects, using the dev server (`npm run dev`) in the browser pane:

1. **Desktop width:** the page renders, the changed part looks right, and the console has no errors.
2. **375px** (mobile preset): no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), nothing cut off, touch targets usable.
3. **API change:** `curl -i` the endpoint once. Check the status, the `X-Request-Id` header, and one bad request returning a `Problem`.
4. Reset the viewport afterwards.

Visit each page directly. The app's CSP sets `frame-ancestors 'none'`, so a page can't be loaded inside an iframe to check several at once (that's intended). Console errors stay in the log across navigations: reload the page and read the console again before reporting an error, because it may be left over from earlier (for example from before the database was seeded).

Backend-only changes skip 1–2.

## 3. Production smoke test (before a deploy or demo, or after touching errors, routing or the database layer)

```bash
npm run build
npm run smoke
```

`npm run smoke` (`scripts/smoke.mjs`) starts `next start` on port 3001 twice, requests 20 routes each time, and stops the server itself:

| Run | Database | Expected |
|---|---|---|
| `healthy` | `.data/farmart.sqlite` | Everything 200, except the deliberate 404s (unknown product page, unknown product id, unknown `/api` path) and 422 (bad input) |
| `missing` | a file that doesn't exist | Static pages still 200. Search and every database-backed `/api` route 500: the Farmart error page, or a `Problem` `INTERNAL_ERROR` with `X-Request-Id`. The server log names the real error |

A row fails on a wrong status, or if error text or source code (`DatabaseNotReadyError`, `client.ts`, a stack trace) reaches the browser. `/on-boarding` and `/test-report` are skipped by that check because they name files on purpose.

- **New route?** Add it to the `routes` list in `scripts/smoke.mjs` with the status expected in each run.
- `--only healthy` or `--only missing` runs one mode; `--port 3005` uses another port.
- **"Port 3001 is already in use":** a server is still running there, often a leftover `next start`. On Windows, stopping `npx` doesn't stop the server underneath, so stop it by port: `Get-NetTCPConnection -LocalPort 3001 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`.

## 4. Commit

1. **Look before staging:** `git status` and `git diff --stat`. Never commit:
   - `.data/`, `reports/`, `.next/` (ignored already), any `.env*` (ignored);
   - `.claude/settings.local.json` (personal settings; not in `.gitignore`, so check by eye);
   - scratch files.
2. **Check for edits you didn't make.** Files changed outside the task (especially `src/data/*.ts`) belong to someone else: mention them and leave them unstaged unless the person says otherwise.
3. **Branch:** the repo works on `master` and has no remote yet. Commit there unless the person asks for a branch. Once a remote exists, branch first (`feat/<short-name>`) and open a PR instead of pushing to `master`.
4. **Message:** [Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary` in the imperative, under 72 characters.
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `perf`.
   - Scopes: `api`, `db`, `seed`, `search`, `cart`, `pdp`, `home`, `design`, `overview`, `onboarding`, `test-report`, `skills`.
   - The body says **why**, and lists notable side effects (schema version bump, new env var, changed seed data).
   - Add the attribution lines your session's instructions ask for.
5. **One concern per commit.** For a big working tree, propose a split to the person before committing, for example:
   - `chore: tooling` (configs, package.json)
   - `feat(api): …`
   - `feat(design): …`
   - `test: …`
   - `docs: …`

   Each commit should still pass the gate on its own when that's practical.
6. **Commit only when asked.** Show the planned commits (files + messages) and wait for a yes; never push without being asked.

## 5. Pull request (when a remote exists)

Title = the main commit's summary. Body:

```markdown
## What
One paragraph: the change and why.

## Story
PLAN.md › <epic / story id>

## How it was checked
- Gate: lint, tsc, test:report (N tests, 100% lines), build, audit, db:check
- Smoke: healthy + missing (if run)
- Pages checked at desktop and 375px: /…, /…

## Screenshots
<before / after for UI changes>

## Notes
DESIGN.md / openapi.yaml / schema version changes, new env vars, follow-ups
```

## Known noise (not failures)

- `next build`: `⚠ Warning: Next.js ignored package-lock.json in C:\Users\…`. A stray lockfile in a parent folder; harmless.
- `npx @redocly/cli lint`: 6 warnings in the current spec. Only a *new* warning is a finding.
- `npm install`: high-severity findings in dev tools (the ESLint chain). `npm audit --omit=dev` is the check that counts.
- `ExperimentalWarning: SQLite is an experimental feature` on some Node versions.
- `npm run test:report` prints `No story files found for the specified pattern: src\**\*.mdx`. There are no MDX docs; harmless.

## Clean up

- Stop every server you started (`npm run smoke` stops its own) and confirm the port is down. Leave the person's own dev server running.
- Reset any browser viewport you changed.
