import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

/**
 * Reads DESIGN.md (the single source of truth for the design system) and
 * splits it into the YAML tokens and the prose an agent/human reads.
 */

type TypeStyle = {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing: number | string;
  textTransform?: string;
};

export type DesignTokens = {
  version: string;
  name: string;
  description: string;
  colors: Record<string, string>;
  typography: Record<string, TypeStyle>;
  rounded: Record<string, string>;
  spacing: Record<string, string>;
  components: Record<string, Record<string, string>>;
};

export type ColorDoc = { key: string; value: string; tailwind?: string; label?: string; doc?: string };

function section(body: string, title: string) {
  const start = body.indexOf(`\n## ${title}`);
  if (start === -1) return "";
  const rest = body.slice(start + title.length + 4);
  const end = rest.search(/\n## /);
  return end === -1 ? rest : rest.slice(0, end);
}

function tableRows(md: string) {
  return md
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[-\s|]+\|$/.test(l))
    .slice(1) // header row
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));
}

function bullets(md: string) {
  return md
    .split("\n")
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2));
}

export async function loadDesign() {
  const raw = await readFile(path.join(process.cwd(), "DESIGN.md"), "utf8");
  const [, frontMatter, ...bodyParts] = raw.split(/^---\s*$/m);
  const body = "\n" + bodyParts.join("---");
  const tokens = parse(frontMatter) as DesignTokens;

  // Tailwind class hints live in YAML comments ("# Tailwind amber-400 — ...").
  const tailwindHints: Record<string, string> = {};
  for (const m of frontMatter.matchAll(/^ {2}([a-z0-9-]+): "[^"]+"\s*#\s*(?:Tailwind\s+)?([a-z]+-\d+)/gm)) {
    tailwindHints[m[1]] = m[2];
  }

  // Colors prose: "### Group" headings with "- **Label** ({colors.key} — #hex): doc" bullets.
  const colorGroups: { title: string; colors: ColorDoc[] }[] = [];
  const documented = new Set<string>();
  for (const line of section(body, "Colors").split("\n")) {
    if (line.startsWith("### ")) colorGroups.push({ title: line.slice(4).trim(), colors: [] });
    else if (line.startsWith("- **") && colorGroups.length) {
      const doc = line.slice(line.indexOf("):") + 2).trim();
      for (const m of line.matchAll(/\*\*([^*]+)\*\* \(\{colors\.([a-z0-9-]+)\}/g)) {
        const key = m[2];
        documented.add(key);
        colorGroups.at(-1)!.colors.push({ key, label: m[1], value: tokens.colors[key], tailwind: tailwindHints[key], doc });
      }
    }
  }
  const undocumented = Object.keys(tokens.colors).filter((k) => !documented.has(k));
  if (undocumented.length) {
    colorGroups.push({
      title: "On-colors & Overlays",
      colors: undocumented.map((key) => ({ key, value: tokens.colors[key], tailwind: tailwindHints[key] })),
    });
  }

  // Typography table: | `role` | size | weight | used for |
  const typeUsage: Record<string, string> = {};
  for (const [role, , , usedFor] of tableRows(section(body, "Typography"))) {
    typeUsage[role.replace(/`/g, "")] = usedFor;
  }

  // Components prose: **`key`**: description (until blank line).
  const componentDocs: Record<string, string> = {};
  for (const m of section(body, "Components").matchAll(/\*\*`([a-z0-9-]+)`\*\*:\s*([\s\S]+?)(?=\n\n|$)/g)) {
    componentDocs[m[1]] = m[2].replace(/\s+/g, " ").trim();
  }

  const overview = section(body, "Overview");
  const keyIdx = overview.indexOf("**Key Characteristics:**");

  return {
    tokens,
    colorGroups,
    typeUsage,
    componentDocs,
    overview: overview
      .slice(0, keyIdx === -1 ? undefined : keyIdx)
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean),
    keyCharacteristics: keyIdx === -1 ? [] : bullets(overview.slice(keyIdx)),
    elevation: tableRows(section(body, "Elevation")),
    breakpoints: tableRows(section(body, "Responsive Behavior")),
    knownGaps: bullets(section(body, "Known Gaps")),
    /** Raw markdown of the Overlays pattern section, rendered as blocks on /design/overlays. */
    overlaysMd: section(body, "Overlays"),
  };
}
