---
name: farmart-docs
description: The living reference of the Farmart codebase - what exists right now and where it is - pages and their data sources, every /api route and its status against openapi.yaml, src/server functions, SQLite tables, components, scripts and tests, plus the procedure that keeps this reference in sync with the source. Use when someone asks "where is X?", "what does the app have?", "which endpoints are built?", "what reads from SQLite vs src/data?", before planning a feature, or when asked to refresh, resync or update the project documentation. Not for the how-to workflows themselves (farmart-backend-feature, farmart-design-system, farmart-onboard, farmart-verify, farmart-code-review).
---

# Farmart docs: the codebase as it is now

This skill describes **what is in the repo today**. The workflow skills say *how* to change it; this one says *what* is there. `AGENTS.md` holds the rules; don't repeat them here.

- The inventory lives in [references/codebase-map.md](references/codebase-map.md). Read it for any "where is / what exists" question, then confirm in the source before acting on it (it can be up to one sync behind).
- Its header records the commit and the working-tree fingerprint it was last synced against. If `git rev-parse HEAD` differs, or `git status --porcelain` shows changes under the watched paths, the map may be stale: run **Sync** below first.

## Sync: recheck the source and update the map

Run this when asked to refresh the docs, and on every tick of the docs loop (`/loop 5m` with the prompt in "The loop" below).

1. **Detect changes.** Read the `Synced against` line at the top of `references/codebase-map.md`. Then:
   ```bash
   git rev-parse HEAD
   ```
   ```bash
   git status --porcelain -- src scripts e2e openapi.yaml package.json DESIGN.md PLAN.md .claude/skills ":!.claude/skills/farmart-docs"
   ```
   (This skill's own folder is excluded, so the map's edits never count as a source change.)
   ```bash
   git diff --stat <synced-commit> -- src scripts e2e openapi.yaml package.json
   ```
   If HEAD equals the recorded commit **and** the porcelain output equals the recorded fingerprint, stop: nothing to do. Say "docs up to date" in one line.
2. **Re-derive only the sections the changed paths touch** (table below). Use the listed command; graphify first for relationships (`npm run --silent graphify -- explain "<symbol>"`), raw reads only for the lines you need.
3. **Edit `references/codebase-map.md`** with the Edit tool (never PowerShell `Set-Content`: it garbles UTF-8 on this machine). Keep its format: one line per item, `path` then a short purpose. Remove items that no longer exist; never invent purposes, read the file's header comment or exports instead.
4. **Update the header**: new `Synced against` commit, date (YYYY-MM-DD) and the porcelain fingerprint (the changed paths, comma-separated, or `clean`).
5. If this `SKILL.md` itself became wrong (a new top-level folder, a renamed skill), fix it too. Don't touch other skills, `AGENTS.md` or source code from the loop; if they drift, report it in one line instead.
6. Docs-only change: no lint or tests needed. Don't commit; commits are the person's call (`farmart-verify`).

| Changed path | Section to refresh | How to re-derive |
|---|---|---|
| `src/app/**/page.tsx`, `src/app/**/route.ts` | Pages, API routes | list files; for pages check imports from `@/server` vs `@/data` |
| `openapi.yaml` | API routes (status) | `summary:` lines; `✓` means built and contract-tested |
| `src/server/**` | Server modules, Database | `export` lines; `schema.ts` for tables and `SCHEMA_VERSION` |
| `src/lib/**`, `src/proxy.ts` | Shared libs, Developer pages | `export` lines; `DEV_TOOL_PATHS` |
| `src/components/**` | Components | exported function names per file; stories present or not |
| `src/data/**` | Seed data | exported names; counts come from `farmart-onboard/references/seed-data.md` |
| `scripts/**`, `package.json` | Scripts and commands | `scripts` block |
| `e2e/**`, `src/server/__tests__/**`, `scripts/seed/__tests__/**` | Tests | file list |
| `PLAN.md` | Plan status | epic headings and their ✅/🟡 marks |
| `.claude/skills/**` | Skills | `name:` of each skill folder |

## The loop

Started with the `loop` skill, every 5 minutes:

```
/loop 5m Load the farmart-docs skill and run its Sync procedure. Only edit .claude/skills/farmart-docs/; if nothing changed, reply "docs up to date" and do nothing else.
```

The loop lives in the Claude Code session that started it and stops when that session ends. Ticks are cheap when nothing changed (three git commands); the map is only rewritten where the source moved.
