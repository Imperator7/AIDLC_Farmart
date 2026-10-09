// Tests for block-dangerous-commands.mjs. Run: node --test .claude/hooks/block-dangerous-commands.test.mjs
// (the directory form skips it: node --test ignores dot-folders like .claude).
// The commands live in this file (not on the command line) so the guard doesn't react to the test run itself.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const hook = path.join(path.dirname(fileURLToPath(import.meta.url)), "block-dangerous-commands.mjs");

/** Runs the hook on raw stdin; returns its decision: "deny" or "allow". */
function run(stdin) {
  const r = spawnSync(process.execPath, [hook], { input: stdin, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.permissionDecision : "allow";
}

/** What the hook decides for a command. */
const decide = (command, tool = "Bash") => run(JSON.stringify({ tool_name: tool, tool_input: { command } }));

const bash = {
  deny: [
    "rm -rf node_modules",
    "rm -fr .data",
    "rm -r -f build",
    "rm -Rf x",
    "rm --recursive --force x",
    "sudo rm -rf /",
    "cd x && rm -rf y",
    "find . | xargs rm -rf",
    "/bin/rm -rf x",
    '"C:/Program Files/Git/usr/bin/rm.exe" -rf x',
    "RM.EXE -rf x",
    "git push -f",
    "git push --force origin main",
    "git push origin main --force-with-lease",
    "git push origin +main",
    "git -C repo push -f",
    "git push -uf origin x",
    "GIT.exe push --force",
    // Quoted text the shell still runs.
    'bash -c "rm -rf x"',
    "sh -c 'cd a && rm -rf b'",
    'eval "rm -rf x"',
    'echo "$(rm -rf x)"',
    "echo `rm -rf x`",
    'powershell -Command "git push --force"',
    'powershell -Command "Remove-Item -Recurse x"',
    'cmd /c "rmdir /s /q build"',
    // Recursive delete without force is blocked too.
    "rm -r dir",
    "rm -R dir",
    "rm --recursive dir",
    "cd a && rm -r b",
    "find . | xargs rm -r",
    "rm -ri dir",
    'bash -c "rm -r dir"',
    // Subshells, groups and keywords.
    "(rm -rf x)",
    "{ rm -rf x; }",
    "(cd a; rm -r b)",
    "if true; then rm -r x; fi",
    "! rm -r x",
    // An escaped quote is a literal character, not the start of a quoted string.
    "echo it\\'s; rm -rf x",
    'echo \\"a; rm -r x',
    // Wrapper options that take a value.
    "find . | xargs -n 1 rm -rf",
    "xargs -I {} rm -r {}",
    "sudo -u root rm -rf /",
    "timeout 5 rm -r x",
    "env -u HOME rm -rf x",
    "nice -n 10 rm -r x",
    // Deletes that aren't spelled rm -r.
    "find build -delete",
    "find . -name x -exec rm -rf {} +",
    "find . -type d -execdir rm -r {} \\;",
    "rm -rf \\\n  build",
  ],
  allow: [
    "rm file.txt",
    "rm -f stale.log",
    "rm -i a",
    "ls -r",
    "rmdir empty-dir",
    "find . -name '*.ts'",
    "find . -exec grep -l x {} +",
    "git push",
    "git push -u origin feat/x",
    "git push --follow-tags",
    "npm run graph",
    "timeout 5 npm test",
    // Quoted text that is only data: the false alarms this file guards against.
    'echo "rm -r x"',
    'git commit -m "fix: rm -r && cleanup"',
    "git commit -m 'docs: never git push --force; use rm -rf carefully'",
    'git commit -m "don\'t (rm -rf) anything"',
    "grep -n 'rm -rf' AGENTS.md",
    "for c in 'rm -r dir' 'cd a && rm -r b'; do echo \"$c\"; done",
    'echo "it\'s fine"',
  ],
};

const powershell = {
  deny: [
    "git push --force origin x",
    "rm -r C:\\temp\\x",
    "Remove-Item -Recurse -Force src",
    "Remove-Item src -r",
    "Remove-Item -Path x -Recurse:$true",
    "Get-ChildItem x | Remove-Item -Recurse",
    "ri -rec x",
    "rmdir x -Recurse",
    "del -Recurse x",
    "rm -Recurse -Force .next",
    "if ($true) { Remove-Item -Recurse x }",
  ],
  allow: [
    "Remove-Item a.txt",
    "Remove-Item -Force a.txt",
    "rm -Force a.txt",
    "Get-ChildItem -Recurse src",
    'Write-Output "Remove-Item -Recurse x"',
    "git push origin main",
  ],
};

for (const [tool, cases] of [["Bash", bash], ["PowerShell", powershell]])
  for (const [want, commands] of Object.entries(cases))
    for (const command of commands)
      test(`${tool} ${want}: ${command}`, () => {
        assert.equal(decide(command, tool), want);
      });

test("fails closed when the tool call can't be read", () => {
  assert.equal(run("not json"), "deny");
  assert.equal(run(""), "deny");
});
