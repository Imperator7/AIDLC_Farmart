@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

graphify is installed **in the project**, not globally: pinned in `pyproject.toml`/`uv.lock`, installed into `.venv/` by `npm run graph:setup`. Wherever a rule or a hook message says `graphify …`, run it as `npm run --silent graphify -- …` (it calls `.venv` through `scripts/graphify.mjs`). If `graphify-out/` is missing, run `npm run graph` first.

Rules:
- For codebase questions, first run `npm run --silent graphify -- query "<question>"` when graphify-out/graph.json exists. Use `npm run --silent graphify -- path "<A>" "<B>"` for relationships and `npm run --silent graphify -- explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output. Prefer `explain` and `path` with real symbol names (`"listProducts()"`); `query` matches words, not meaning.
- The graph can't see links made through strings: `fetch("/api/…")` from client components, URLs in `flow-graph.ts`, routes in `openapi.yaml`. For how the frontend reaches the backend, use `src/app/on-boarding/_components/features.ts`.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `npm run graph` to keep the graph current (AST-only, no API cost, about 10 s).
- `.graphifyignore` keeps third-party skills out of the graph; their bundled scripts otherwise outnumber the app.
