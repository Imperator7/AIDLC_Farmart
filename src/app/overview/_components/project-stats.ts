import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { allProducts, brands, categories } from "@/data/home";
import { loadDesign } from "@/lib/design-md";
import pkg from "../../../../package.json";
import { pages as designPages } from "../../design/_components/registry";
import type { ProjectStats } from "./project-summary";

/**
 * Numbers for the /overview "Project overview" section.
 * Everything is counted from the source (data, DESIGN.md, stories, package.json), so it never goes stale.
 * Runs at build time: /overview is statically rendered.
 */
export async function getProjectStats({ overlays, planned }: { overlays: number; planned: string[] }): Promise<ProjectStats> {
  const { tokens, knownGaps } = await loadDesign();

  const src = path.join(process.cwd(), "src");
  const storyFiles = (await readdir(src, { recursive: true })).filter((f) => f.endsWith(".stories.tsx"));
  const storySources = await Promise.all(storyFiles.map((f) => readFile(path.join(src, f), "utf8")));
  const stories = storySources.reduce((n, s) => n + (s.match(/^export const \w+: Story\b/gm)?.length ?? 0), 0);

  const routes: ProjectStats["routes"] = [
    { route: "/", title: "Home", area: "Store", pages: 1, href: "/" },
    { route: "/products/[id]", title: "Product detail", area: "Store", pages: allProducts.length, href: `/products/${allProducts[0].id}` },
    { route: "/search", title: "Search results", area: "Store", pages: 1, href: "/search" },
    { route: "/design", title: "Design system", area: "Dev tool", pages: 1, href: "/design" },
    { route: "/design/[slug]", title: "Design page", area: "Dev tool", pages: designPages.length, href: `/design/${designPages[0].slug}` },
    { route: "/overview", title: "UI overview", area: "Dev tool", pages: 1, href: "/overview" },
    { route: "/docs", title: "API docs", area: "Dev tool", pages: 1, href: "/docs" },
    { route: "/database-er-diagram", title: "Database ER diagram", area: "Dev tool", pages: 1, href: "/database-er-diagram" },
    { route: "/test-report", title: "Test report", area: "Dev tool", pages: 1, href: "/test-report" },
    { route: "/e2e", title: "E2E report", area: "Dev tool", pages: 1, href: "/e2e" },
    { route: "/on-boarding", title: "On-boarding", area: "Dev tool", pages: 1, href: "/on-boarding" },
  ];

  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  const version = (name: string) => deps[name]?.replace(/^[\^~]/, "") ?? "?";

  return {
    routes,
    pagesTotal: routes.reduce((n, r) => n + r.pages, 0),
    storePages: routes.filter((r) => r.area === "Store").reduce((n, r) => n + r.pages, 0),
    products: allProducts.length,
    categories: categories.length,
    brands: brands.length,
    overlays,
    planned,
    components: Object.keys(tokens.components).length,
    colors: Object.keys(tokens.colors).length,
    knownGaps: knownGaps.length,
    stories,
    storyFiles: storyFiles.length,
    stack: [
      { name: "Next.js", version: version("next") },
      { name: "React", version: version("react") },
      { name: "TypeScript", version: version("typescript") },
      { name: "Tailwind CSS", version: version("tailwindcss") },
      { name: "React Flow", version: version("@xyflow/react") },
      { name: "Storybook", version: version("storybook") },
    ],
  };
}
