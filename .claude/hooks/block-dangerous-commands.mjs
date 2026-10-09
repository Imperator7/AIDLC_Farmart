// PreToolUse hook (Bash and PowerShell): blocks recursive deletes and force pushes. Reads the tool call as JSON on
// stdin and answers with a "deny" decision and the reason; anything else passes through untouched. Configured in
// .claude/settings.json; tests in .claude/hooks/block-dangerous-commands.test.mjs.
//
// Recursive deletes it knows: `rm -r`/`-rf` (any flag spelling), `find -delete` and `find -exec rm -r`,
// PowerShell `Remove-Item -Recurse` (and its aliases `ri`, `rm`, `rmdir`, `rd`, `del`, `erase`), and cmd
// `rmdir /s`, `rd /s`, `del /s`. It reads shell text, so it can't see a delete made from inside another program
// (`node -e`, a Python script); AGENTS.md forbids those workarounds.
import { readFileSync } from "node:fs";

/** The escape character of each shell: inside it, the next character is literal. */
const ESCAPE = { bash: "\\", powershell: "`", cmd: "^" };

/**
 * Splits a shell line into simple commands, each a list of words. `;`, `&`, `|`, newlines, `(`, `)`, `{` and `}`
 * only separate commands outside quotes, so `git commit -m "a && rm -r b"` is one harmless command while
 * `(rm -rf x)` and `{ rm -rf x; }` are found. Escaped characters are literal (`it\'s` doesn't open a quote).
 * Text the shell *runs* even though it's quoted is checked as well: `$(…)`, backticks in bash, and the script of
 * `bash -c "…"`, `sh -c`, `cmd /c`, `eval "…"`, `powershell -Command "…"`.
 */
function commands(line, shell = "bash", depth = 0) {
  const esc = ESCAPE[shell];
  const found = [];
  let words = [];
  let word = "";
  let quote = null;
  const endWord = () => {
    if (word) words.push(word);
    word = "";
  };
  const endCommand = () => {
    endWord();
    if (words.length) found.push(words);
    words = [];
  };
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === esc && quote !== "'" && i + 1 < line.length) {
      const next = line[++i];
      // A trailing escape before a newline continues the line; anything else is a literal character.
      if (next === "\r" && line[i + 1] === "\n") i++;
      else if (next !== "\n") word += next;
    } else if (quote) {
      if (c === quote) quote = null;
      else word += c;
    } else if (c === '"' || c === "'") quote = c;
    else if (/[;&|\n(){}]/.test(c)) endCommand();
    else if (/\s/.test(c)) endWord();
    else word += c;
  }
  endCommand();
  if (depth > 3) return found;
  // Command substitution runs inside double quotes too.
  const nested = [...line.matchAll(/\$\(([^()]*)\)/g)].map((m) => [m[1], shell]);
  if (shell === "bash") nested.push(...[...line.matchAll(/`([^`]*)`/g)].map((m) => [m[1], "bash"]));
  // Shells and eval run their string argument as a script.
  for (const ws of found) {
    const [cmd, ...rest] = program(ws);
    const name = baseName(cmd);
    const after = (flag) => rest.filter((_, k) => flag.test(rest[k - 1] ?? ""));
    if (/^(bash|sh|zsh|dash)$/.test(name)) nested.push(...after(/^-c$/).map((s) => [s, "bash"]));
    if (name === "cmd") nested.push(...after(/^\/c$/i).map((s) => [s, "cmd"]));
    if (/^(powershell|pwsh)$/.test(name)) nested.push(...after(/^-(c|command)$/i).map((s) => [s, "powershell"]));
    if (name === "eval") nested.push([rest.join(" "), shell]);
  }
  for (const [script, sh] of nested) found.push(...commands(script, sh, depth + 1));
  return found;
}

/** `/usr/bin/RM.exe` → `rm`: the program name without directory, `.exe` or case. */
function baseName(word = "") {
  return word.replace(/\\/g, "/").split("/").pop().toLowerCase().replace(/\.exe$/, "");
}

/**
 * Words that run the command after them, with the options of each that take a value (`xargs -n 1`, `sudo -u root`),
 * and how many plain arguments come before the command (`timeout 5 rm …`).
 */
const WRAPPERS = {
  sudo: { valued: /^-[ugCDhprtTU]$/ },
  doas: { valued: /^-[uC]$/ },
  env: { valued: /^(-[uC]|--unset|--chdir)$/ },
  xargs: { valued: /^(-[nLPsIEda]|--(max-args|max-lines|max-procs|max-chars|replace|eof|delimiter|arg-file))$/ },
  nice: { valued: /^(-n|--adjustment)$/ },
  ionice: { valued: /^-[cnpP]$/ },
  timeout: { valued: /^(-[sk]|--signal|--kill-after)$/, positional: 1 },
  stdbuf: { valued: /^-[ioe]$/ },
  exec: { valued: /^-a$/ },
  command: {},
  nohup: {},
  time: {},
};
/** Shell keywords that can come before a command: `if rm -r x; then …`, `! rm …`, `do rm …`. */
const KEYWORDS = new Set(["!", "if", "then", "else", "elif", "do", "while", "until"]);

/** Drops keywords, `VAR=value` assignments and wrappers (with their options) so the real program comes first. */
function program(words) {
  let i = 0;
  while (i < words.length) {
    const w = words[i];
    if (KEYWORDS.has(w) || /^\w+=/.test(w)) {
      i++;
      continue;
    }
    const wrapper = WRAPPERS[baseName(w)];
    if (!wrapper) break;
    i++;
    while (i < words.length && words[i].startsWith("-")) i += wrapper.valued?.test(words[i]) ? 2 : 1;
    i += wrapper.positional ?? 0;
  }
  return words.slice(i);
}

/** Whether a PowerShell parameter (`-Recurse`, `-rec`, `-r:$true`) names `param`; PowerShell accepts any prefix. */
const psParam = (arg, param) => {
  const name = /^-([a-z]+)(:.*)?$/i.exec(arg)?.[1]?.toLowerCase();
  return !!name && param.startsWith(name);
};

/** What a command deletes recursively: "rf" (recursive and forced), "r" (recursive), or null. */
function recursiveDelete(words) {
  const [cmd, ...args] = program(words);
  const name = baseName(cmd);
  let recursive = false;
  let force = false;
  if (name === "find") {
    if (args.includes("-delete")) return "r";
    // `find … -exec rm -rf {} +`: the words after -exec, up to `;` or `+`, are a command of their own.
    for (let k = 0; k < args.length; k++) {
      if (!/^-(exec|execdir|ok|okdir)$/.test(args[k])) continue;
      const end = args.findIndex((a, j) => j > k && (a === ";" || a === "+"));
      const found = recursiveDelete(args.slice(k + 1, end === -1 ? undefined : end));
      if (found) return found;
    }
    return null;
  }
  if (name === "rm") {
    for (const a of args) {
      if (a === "--") break;
      if (a === "--recursive") recursive = true;
      else if (a === "--force") force = true;
      // GNU short flags in any order and grouping (-rf, -fr, -r -f, -Rfv) …
      else if (/^-[fiIrRdv]+$/.test(a)) {
        recursive ||= /[rR]/.test(a);
        force ||= a.includes("f");
      }
      // … or PowerShell, where rm is Remove-Item (-Recurse, -Force).
      else {
        recursive ||= psParam(a, "recurse");
        force ||= psParam(a, "force");
      }
    }
  } else if (["remove-item", "ri", "rmdir", "rd", "del", "erase"].includes(name)) {
    for (const a of args) {
      // PowerShell parameters, or cmd's /s (subfolders) and /q (no prompt).
      recursive ||= psParam(a, "recurse") || /^\/s$/i.test(a);
      force ||= psParam(a, "force") || /^\/q$/i.test(a);
    }
  } else return null;
  if (!recursive) return null;
  return force ? "rf" : "r";
}

function isForcePush(words) {
  const [cmd, ...rest] = program(words);
  if (baseName(cmd) !== "git") return false;
  // Skip git's own options (`git -C dir -c k=v push ...`) to find the subcommand.
  let i = 0;
  while (i < rest.length && rest[i].startsWith("-")) i += /^(-C|-c|--git-dir|--work-tree|--namespace)$/.test(rest[i]) ? 2 : 1;
  if (rest[i] !== "push") return false;
  return rest.slice(i + 1).some((a) => /^--force(-with-lease|-if-includes)?(=|$)/.test(a) || /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || /^\+[^\s]/.test(a));
}

const REASONS = {
  rf: "Blocked by .claude/settings.json: a recursive force delete (`rm -rf`, `Remove-Item -Recurse -Force`, …) is not allowed. Delete specific files, or ask the person to run it themselves.",
  r: "Blocked by .claude/settings.json: a recursive delete (`rm -r`, `find -delete`, `Remove-Item -Recurse`, `rmdir /s`, …) is not allowed. Delete specific files, or ask the person to delete the folder themselves.",
  push: "Blocked by .claude/settings.json: force push (`git push -f` / `--force` / `+branch`) is not allowed; it rewrites shared history. Push normally, or ask the person to run it themselves.",
  unreadable: "Blocked by .claude/settings.json: the command guard couldn't read this tool call, so it can't tell whether it deletes recursively or force-pushes. Retry the command.",
};

/** The reason to deny this tool call, or null to let it through. */
function check(raw) {
  const input = JSON.parse(raw);
  const shell = /powershell/i.test(String(input.tool_name ?? "")) ? "powershell" : "bash";
  const found = commands(String(input.tool_input?.command ?? ""), shell);
  const deletes = found.map(recursiveDelete);
  if (deletes.includes("rf")) return REASONS.rf;
  if (deletes.includes("r")) return REASONS.r;
  if (found.some(isForcePush)) return REASONS.push;
  return null;
}

let reason;
try {
  reason = check(readFileSync(0, "utf8"));
} catch {
  // Fail closed: a crash would exit non-zero, which Claude Code treats as "no decision" and runs the command.
  reason = REASONS.unreadable;
}
if (reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
}
process.exit(0);
