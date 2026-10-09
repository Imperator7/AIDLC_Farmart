// Stop hook: when Claude finishes a turn with uncommitted code changes, ESLint checks the changed files. Errors send
// Claude back to fix them (decision "block"); a clean result, or no code changes, lets the turn end. It only lints,
// in a few seconds; the tests run before each commit (.githooks/pre-commit). Configured in .claude/settings.json.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
// Already sent back once for this stop: let it end, so a lint error Claude can't fix never loops forever.
if (input.stop_hook_active) process.exit(0);

const git = (...args) => spawnSync("git", args, { encoding: "utf8" }).stdout ?? "";
const changed = [...new Set([...git("diff", "--name-only", "HEAD").split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")])]
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f) && existsSync(f));
if (!changed.length) process.exit(0);

const lint = spawnSync(process.execPath, ["node_modules/eslint/bin/eslint.js", "--no-warn-ignored", "--max-warnings=0", ...changed], { encoding: "utf8" });
if (lint.status === 0) process.exit(0);

const output = `${lint.stdout}${lint.stderr}`.trim().split("\n").slice(-40).join("\n");
process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason: `ESLint found problems in the files you changed. Fix them (try \`npm run lint:fix\` first), then finish:\n${output}`,
  }),
);
process.exit(0);
