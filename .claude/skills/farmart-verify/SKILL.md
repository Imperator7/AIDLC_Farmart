---
name: farmart-verify
description: Check that a Farmart change is ready, then commit it - the gate (lint, types, every test with coverage, production build, audit, data check) in a fixed order, a look at the changed pages at desktop and 375px, an optional production smoke test (npm run smoke - database seeded and missing), and a Conventional Commit plus PR description. Use when a change is finished, before committing or opening a PR, before a deploy or demo, when asked "is it ready?", "check everything", "run the checks" or "commit this", or after a big refactor. Not for writing the change itself (farmart-backend-feature, farmart-design-system) or first-time setup (farmart-onboard).
---

# Farmart verify: is it ready to ship?

Review the change for bugs, security risks and edge cases with `farmart-code-review` first; this skill checks it's ready and commits it. The git pre-commit hook (`.githooks/pre-commit`: lint, `tsc`, every test) runs again on `git commit` and refuses a red commit; it's a backstop, not a replacement for the gate.

Run the steps in order. **Stop at the first failure**, fix it, and rerun from that step: later steps assume the earlier ones passed (a build after a type error only adds noise). Report each step's result to the person as you go, with the command's real output when something fails.

## 1. The gate

| # | Command | Passes when | When it fails |
|---|---|---|---|
| 1 | `npm run lint` | no output after the `eslint` line | `npm run lint:fix`, then fix the rest by hand |
| 2 | `npx tsc --noEmit` | no output | Added or moved a route? Run `npx next typegen` first (it writes the `PageProps`/`RouteContext` types), then rerun |
| 3 | `npm run test:report` | `Test Files N passed`, no `failed`, and `All files` lines at **100** | Read the failures at http://localhost:3000/test-report. Below 100% lines means a missing test or dead code |
| 4 | `npm run build` | `✓ Compiled successfully`, all static pages generated, **no new warnings** | See "Reading the build" below |
| 4b | `npx playwright test` (after the build) | `N passed`, no `failed` | `npx playwright show-report` opens Playwright's HTML report (steps, trace, image diff); http://localhost:3000/e2e shows the same run's summary: each test's step screenshots, and for a failed image test the expected, actual and diff side by side. An intended UI change: `npm run test:e2e:update`, then **look at every changed image in `e2e/__screenshots__`** before committing it |
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

`npm run smoke` (`scripts/smoke.mjs`) starts `next start` on port 3001 twice, requests 25 routes each time, and stops the server itself:

| Run | Database | Expected |
|---|---|---|
| `healthy` | `.data/farmart.sqlite`, a plain production server | Store pages and the API 200, except the deliberate 404s (unknown product page, unknown product id, unknown `/api` path), 422s (bad input, control characters, a 65-character id) and 405 (`POST /api/products`). **Developer pages 404**: `src/proxy.ts` hides them in production |
| `missing` | a file that doesn't exist, with `FARMART_DEV_TOOLS=1` | Static pages still 200, and the developer pages 200. Search and every database-backed `/api` route 500: the Farmart error page, or a `Problem` `INTERNAL_ERROR` with `X-Request-Id`. The server log names the real error |

A row fails on a wrong status, or if error text or source code (`DatabaseNotReadyError`, `client.ts`, a stack trace) reaches the browser. `/on-boarding` and `/test-report` are skipped by that check because they name files on purpose.

- **New route?** Add it to the `routes` list in `scripts/smoke.mjs` with the status expected in each run (a developer page: 404 healthy, 200 missing; `method: "POST"` for a non-GET row).
- `--only healthy` or `--only missing` runs one mode; `--port 3005` uses another port.
- **"Port 3001 is already in use":** a server is still running there, often a leftover `next start`. On Windows, stopping `npx` doesn't stop the server underneath, so stop it by port: `Get-NetTCPConnection -LocalPort 3001 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`.

## 4. Commit

1. **Look before staging:** `git status` and `git diff --stat`. A new executable script (like `.githooks/pre-commit`) is staged with `git add --chmod=+x <file>`, or Mac and Linux clones won't run it. Never commit:
   - `.data/`, `reports/`, `.next/` (ignored already), any `.env*` (ignored);
   - `.claude/settings.local.json` (personal settings; not in `.gitignore`, so check by eye);
   - scratch files.
2. **Check for edits you didn't make.** Files changed outside the task (especially `src/data/*.ts`) belong to someone else: mention them and leave them unstaged unless the person says otherwise.
3. **Branch:** `main` is the main branch, on GitHub at `origin` (https://github.com/Imperator7/AIDLC_Farmart). Never commit or push to `main` directly: branch from it first (`feat/<short-name>`, `fix/…`, `docs/…`), push the branch and open a PR into `main`.
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

## 5. Pull request

Push the branch (`git push -u origin <branch>`), then open the PR into `main`: `gh pr create --base main` when the GitHub CLI is installed, otherwise https://github.com/Imperator7/AIDLC_Farmart/compare/main...<branch>.

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
- `npx @redocly/cli lint`: 7 warnings in the current spec (one is the `MethodNotAllowed` response, deliberately not listed on each operation). Only a *new* warning is a finding.
- `npm install`: high-severity findings in dev tools (the ESLint chain). `npm audit --omit=dev` is the check that counts.
- `ExperimentalWarning: SQLite is an experimental feature` on some Node versions.
- `npm run test:report` prints `No story files found for the specified pattern: src\**\*.mdx`. There are no MDX docs; harmless.
- `npm run test:e2e` prints `[WebServer] Error: Internal: NoFallbackError` once: Next logs it for `/products/unknown` (a product page that was never pre-rendered) while correctly answering 404.
- **Story tests say "no tests" with `listen EACCES`:** Windows reserved the port Vitest's browser server uses. `vitest.config.ts` pins it to 6106 for that reason; if 6106 is ever reserved too (`netsh interface ipv4 show excludedportrange protocol=tcp`), pick another port below 49152.

## Clean up

- Stop every server you started (`npm run smoke` stops its own) and confirm the port is down. Leave the person's own dev server running.
- Reset any browser viewport you changed.
