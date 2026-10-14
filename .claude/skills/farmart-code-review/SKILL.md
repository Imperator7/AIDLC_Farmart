---
name: farmart-code-review
description: Review a Farmart change for bugs, security risks and edge cases before it is committed - scope the diff, run lint and the tests for what changed, walk the Farmart checklist (API contract, input limits, 405s, SQL, client-side trust, dev pages, headers, dependencies, docs drift), probe the running app with hostile input, and report findings ranked by severity with a concrete failure for each. Use when a change is finished, before a commit or PR, when asked to "review", "code review", "find bugs", "find security risks", "find edge cases" or "is this safe?", and when /code-review runs in this repo. Not for running the release gate or committing (farmart-verify), and not for writing the fix (farmart-backend-feature, farmart-design-system).
---

# Farmart code review

A review answers one question: **what will break, and for whom?** Every finding names a file and line, the input or state that triggers it, and what goes wrong. Style preferences aren't findings.

Work through the steps in order. Don't fix anything during the review; report first, then fix what the person agrees to (step 6).

## 1. Scope

- **What changed:** `git status --short`, `git diff HEAD --stat`, then `git diff HEAD` for the content. Untracked files count: read them whole.
- **Edits that aren't yours:** a changed `src/data/*.ts` you didn't touch belongs to someone else. Mention it; don't review it as part of the change or revert it.
- **Read the enclosing function** of each hunk, not only the changed lines: a bug in an untouched line of a touched function is in scope.
- **Find the callers** of every changed export (`npm run --silent graphify -- explain "<symbol>()"`, then Grep). A new precondition, return shape or exception can break a call site the diff never shows.

## 2. Automated checks first

Run the checks AGENTS.md requires after every coding change. A red result is the first finding; don't review further until you've reported it.

| Changed | Run |
|---|---|
| Anything with code | `npm run lint`, `npx tsc --noEmit` |
| `src/server`, `src/app/api`, `src/lib`, `scripts/seed`, `src/proxy.ts` | `npm run test:backend` (must stay at 100% of lines) |
| Components or stories | `npx vitest --run --project=storybook` |
| `openapi.yaml` | `npx @redocly/cli lint openapi.yaml` (valid; the warning count must not grow, 7 today) |
| `.claude/hooks/block-dangerous-commands.mjs` | `node --test .claude/hooks/block-dangerous-commands.test.mjs` |
| Routing, errors, the database layer, `src/proxy.ts`, `next.config.ts` | `npm run build`, then `npm run smoke` |
| A page, a component a page shows, the cart, search | `npm run build`, then `npx playwright test`; read failures with `npx playwright show-report` (trace, image diff) or at `/e2e` |

The hooks back this up but don't replace it: the Stop hook only lints changed files, and the git pre-commit hook (`.githooks/pre-commit`) runs lint, `tsc` and every test only at commit time.

## 3. The checklist

Walk the sections that match the diff. Each line is a question; a "no" is a candidate finding.

### API and backend (`src/app/api`, `src/server`, `openapi.yaml`)

- **Spec first.** Is the operation in `openapi.yaml`, with every status it can return? Any query parameter means a `422`; a lookup by id means a `404` with the specific code (`PRODUCT_NOT_FOUND`, not `NOT_FOUND`). Marked ✓ only once it is built.
- **Every input has a limit.** Strings have `.trim()` and `.max()`, numbers have `min` and `max` (`page ≤ 10000`, `limit ≤ 100`), path parameters go through `parsePath` with a zod schema (`productId` ≤ 64). Search text uses the `searchText` schema (control characters become spaces).
- **The spec and zod agree.** Defaults and limits in `validation.ts` equal the spec's.
- **Every route ends with `only(...)`** listing the methods it handles, and is in the "methods a route doesn't support" table in `routes.test.ts`.
- **Thin handler:** validate, then one `src/server/` call. SQL and rules live in `src/server/`.
- **SQL:** values are named parameters only, never interpolated; `ORDER BY` comes from the `ORDER_BY` whitelist; `LIKE` text goes through `likeEscape`; optional filters use `stripUnused`.
- **Money** is integer cents in SQL and dollars in responses.
- **Errors:** expected failures throw `ApiError` with a code from the spec's error table; nothing returns `null` for the handler to translate. A 500 must never carry the real message (`api()` logs it with the request id).
- **Tests:** an integration test per status, the exact `code` asserted, a `contract.test.ts` row (200, and 422 when there are parameters), a `smoke.mjs` row for a new route.

### Edge cases to try against every changed input

| Input | What it catches |
|---|---|
| empty, only spaces, only `%00`/`\t` | text treated as present; a NUL byte truncating a SQL parameter (`q=%00` once matched every product) |
| 101+ characters, a 70-character path id | missing `max` |
| `%`, `_`, `\` | unescaped `LIKE` wildcards |
| `page=10001`, `page=1e3`, `limit=1.5`, `-1`, `abc`, `1e400` | missing `int`/`max`; offsets past `Number.MAX_SAFE_INTEGER` |
| the same parameter twice (`page=1&page=-5`) | `queryObject` must keep the first |
| more than 5 search words | `searchTerms` keeps the 5 longest |
| `minPrice` above `maxPrice` | the refine on `maxPrice` |
| `POST`/`DELETE` on a GET route | 405 problem with `Allow`, not Next's empty 405 |
| unknown id, `../`, `%2e%2e`, unicode | 404 with the specific code, no path handling |

### Client code and browser state (`"use client"`, `src/lib`)

- **Nothing from the browser is trusted.** `localStorage`, the URL and form fields can hold anything. Persisted state goes through a sanitizer like `sanitizeCart` (whole quantities 1–99, valid prices, no duplicate ids) and the reducer clamps (`clampQty`).
- **Prices are the server's.** The browser cart's prices can be edited; anything that charges money (Phase 3 checkout) must price on the server and ignore client prices (openapi.yaml: "clients never send prices").
- **No server code in the client.** A `"use client"` module never imports `src/server/` or `node:sqlite`; shared helpers live in `src/lib/`.
- **Number handling:** a value read from JSON can be a string; `"5" + 0` concatenates. Check `Number.isInteger`/`Number.isFinite` before arithmetic.

### Pages, routing and headers

- **New developer page** (anything showing files, schema, tests or internals)? Add it to `DEV_TOOL_PATHS` in `src/lib/dev-tools.ts` **and** the `matcher` in `src/proxy.ts` (a test checks they match), and to `scripts/smoke.mjs` with 404 healthy and 200 missing.
- **Headers stay as strict:** no new `unsafe-*` in the CSP, no `preload` in HSTS, `frame-ancestors 'none'` kept. A new image host goes in both `images.remotePatterns` and the CSP.
- **Raw HTML:** `dangerouslySetInnerHTML` in app code (stories aside) needs a stated reason and escaped input.
- **Pages call `src/server/` directly**, never `fetch` their own `/api`.
- UI changes also go through `farmart-design-system` (375px, DESIGN.md).
- **A changed image baseline** (`e2e/__screenshots__/*.png` in the diff) is a UI change someone approved: open each one and check it shows what was intended. Baselines re-approved to make a red test green, without looking, hide regressions (the cart drawer's shadow band was in the first baselines until someone looked).
- **A UI bug fixed** gets a `regression:` test in `e2e/` that fails without the fix.

### Serving local files

- A route that reads a file from a path in the URL (like `/e2e/shots/[...path]`) must resolve it under one folder, refuse `..`, separators and NUL bytes inside a part, and allow only the expected extension (`shotFile` in `src/app/e2e/_components/load-e2e.ts`). Probe it with `..%2F`, `%2e%2e`, an absolute path and a wrong extension.

### Data and schema

- `src/data` is the source; a schema change bumps `SCHEMA_VERSION`, updates `scripts/seed/seed.ts` (`TABLES`, `KEY`, `findSeedProblems`) and `mermaid.html`. Details: `farmart-backend-feature` › Workflow B.

### Tooling, hooks and dependencies

- **Production dependencies:** `npm audit --omit=dev` stays at 0. A new package needs a reason; `npm audit fix --force` is never the fix.
- **Third-party skills and hooks run code on this machine.** A new or updated one (`npx skills add/update`, a hook in `.claude/settings.json`, a Python tool in `pyproject.toml`) gets its files read before it's kept; versions stay pinned (`skills-lock.json`, `uv.lock`).
- **The command guard:** a change to `block-dangerous-commands.mjs` comes with deny *and* allow test cases. Nothing in the diff works around it (`fs.rmSync`, `Remove-Item -Recurse`, `shutil.rmtree`, `--no-verify`).
- **Secrets:** no `.env*`, tokens or `.claude/settings.local.json` in the diff.

### Docs drift (a finding when the change makes them wrong)

`openapi.yaml` (✓ and limits), `AGENTS.md`, `PLAN.md` checkboxes, `src/app/on-boarding/_components/features.ts` (how a feature gets its data), `farmart-onboard/references/seed-data.md`, `src/server/db/mermaid.html`, and the skills whose steps the change alters (`farmart-backend-feature/references/templates.md`).

## 4. Probe the running app

Static reading misses runtime behaviour. With the dev server up (`npm run dev`, or the browser pane's `next-dev`):

```bash
curl -s -i "http://localhost:3000/api/<route>?<hostile input from the table above>"
curl -s -i -X POST "http://localhost:3000/api/<route>"
```

Check the status, `Content-Type: application/problem+json` on errors, `X-Request-Id`, and that no stack trace or file path comes back. For client state, write a hostile value into `localStorage` in the browser pane (as `sanitizeCart` was tested), reload, and read the result; **remove it afterwards**. Production behaviour (hidden dev pages, error pages without details) needs `npm run build` and `npm run smoke`.

## 5. Report

Rank by severity, most severe first: data loss or money > security > wrong results > crashes on bad input > missing tests > cleanup. For each finding:

- `file:line`, one sentence on the defect;
- the **failure scenario**: the exact input or state and what goes wrong (proved by a probe when possible: "`q=%00` returned all 16 products");
- the fix you'd make, in one line.

Keep proven findings apart from suspicions. Say what you checked and found clean, so the person knows the coverage. When the `ReportFindings` tool is available (`/code-review`), report through it.

**Accepted risks: don't re-report them unless the change makes them worse** (PLAN.md › Status plans the first three):
- The browser cart's prices can be edited (until Phase 3's server-priced checkout).
- CSP `script-src 'unsafe-inline'` (until nonces come in Phase 5).
- No rate limiting (needed with `/api/auth/*` in Phase 2).
- The command guard can't see a delete made from inside a program.
- 7 Redocly warnings, one of them the deliberately unlisted 405 response.

## 6. After the person decides

Fix only what they agreed to. Each fix gets a test that fails without it. Then rerun step 2 for what you touched, and report each finding's outcome (fixed, skipped, or no change needed); with `/code-review`, call `ReportFindings` again with `outcome` set. Commit through `farmart-verify`, and only when asked.
