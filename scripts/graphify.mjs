// Runs the project's own graphify (pinned in pyproject.toml/uv.lock, installed into .venv/ by `npm run graph:setup`),
// so nothing depends on a global install or a machine-specific path.
//   node scripts/graphify.mjs setup            create/refresh .venv with uv (uv sync)
//   node scripts/graphify.mjs <graphify args>  e.g. update . | explain "getDb()" | path "A" "B" | query "…"
// Used by package.json (npm run graph, graph:setup, graphify) and the Claude Code hooks in .claude/settings.json.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exe = process.platform === "win32" ? path.join(root, ".venv", "Scripts", "graphify.exe") : path.join(root, ".venv", "bin", "graphify");
const args = process.argv.slice(2);

/** Runs a command in the project root; returns its exit code, or null when the program isn't installed. */
function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: "inherit", ...opts });
  return r.error ? null : r.status;
}

if (args[0] === "setup") {
  // uv on PATH (winget/standalone install), else uv installed with pip (`python -m uv`). Probe each one first: a
  // Python without the uv module exits 1 too, and must not stop the search for one that has it.
  for (const [cmd, pre] of [["uv", []], ["python", ["-m", "uv"]], ["py", ["-m", "uv"]], ["python3", ["-m", "uv"]]]) {
    if (run(cmd, [...pre, "--version"], { stdio: "ignore" }) !== 0) continue;
    process.exit(run(cmd, [...pre, "sync"]) ?? 1);
  }
  console.error("graphify setup needs uv. Install it (`pip install uv` or `winget install astral-sh.uv`), then run `npm run graph:setup` again.");
  process.exit(1);
}

if (!existsSync(exe)) {
  // A hook must never break a session that hasn't set graphify up: stay silent and let the tool call through.
  if (args[0] === "hook-guard") process.exit(0);
  console.error("graphify isn't set up in this project yet. Run `npm run graph:setup` (needs Python 3.10-3.13 and uv).");
  process.exit(1);
}

if (args[0] === "hook-guard") {
  // The hook runs before every Bash, Grep, Read and Glob call, and starting Python costs about 0.6 s. Skip it when
  // graphify would stay silent anyway; these checks are looser than graphify's own (cli.py `_run_hook_guard`), so
  // they never drop a nudge it would have given.
  const stdin = readFileSync(0, "utf8");
  if (!existsSync(path.join(root, "graphify-out", "graph.json")) && !process.env.GRAPHIFY_OUT) process.exit(0);
  if (!mightNudge(args[1], stdin)) process.exit(0);
  process.exit(run(exe, args, { stdio: ["pipe", "inherit", "inherit"], input: stdin }) ?? 0);
}

/** False when graphify's hook-guard certainly prints nothing for this tool call. */
function mightNudge(kind, stdin) {
  let input;
  try {
    input = JSON.parse(stdin)?.tool_input ?? {};
  } catch {
    return false; // graphify ignores unreadable input too
  }
  if (kind === "search") {
    // The Grep tool always counts; a Bash command only when it runs a search tool (grep, rg, find, …).
    if (!input.command) return !!input.pattern;
    return /(^|[^\w-])(grep|egrep|fgrep|zgrep|rg|ripgrep|find|fd|ack|ag)(\.exe)?($|[^\w-])/i.test(String(input.command));
  }
  if (kind === "read") {
    // Only reads of source and text files are nudged (graphify's _HOOK_SOURCE_EXTS).
    const exts = /\.(py|js|cjs|ts|tsx|jsx|astro|vue|svelte|go|rs|java|rb|c|h|cpp|hpp|cc|cs|kt|swift|php|scala|lua|sh|md|rst|txt|mdx)$/i;
    return [input.file_path, input.pattern, input.path].some((v) => v && exts.test(String(v).split(/[\\/]/).pop()));
  }
  return true;
}

// Everything else is interactive, so it inherits the terminal.
process.exit(run(exe, args) ?? 1);
