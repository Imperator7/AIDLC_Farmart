import Link from "next/link";
import { loadDesign } from "@/lib/design-md";
import { pages, sections } from "./_components/registry";
import SidebarNav from "./_components/sidebar-nav";

export default async function DesignLayout({ children }: LayoutProps<"/design">) {
  const { tokens } = await loadDesign();

  // Every DESIGN.md component must be documented on exactly one page, and vice versa.
  const documented = pages.flatMap((p) => p.keys ?? []);
  const missing = Object.keys(tokens.components).filter((k) => !documented.includes(k));
  const unknown = documented.filter((k) => !tokens.components[k]);

  const items = pages.map((p) => ({ href: `/design/${p.slug}`, title: p.title, section: p.section }));

  return (
    <div className="flex-1 bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link href="/design" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold">
            F
          </Link>
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{tokens.name} Design System</p>
            <p className="truncate text-xs text-gray-500">
              Generated from <code className="font-mono">DESIGN.md</code> · spec <code className="font-mono">{tokens.version}</code>. Edit that file, not these pages.
            </p>
          </div>
          <Link href="/overview" className="ml-auto shrink-0 text-xs font-semibold text-gray-600 hover:text-amber-600">
            UI overview
          </Link>
          <Link href="/" className="shrink-0 text-xs font-semibold text-gray-600 hover:text-amber-600">
            ← Back to store
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-8">
        <aside className="sticky top-6 hidden h-fit w-52 shrink-0 lg:block">
          <SidebarNav items={items} sections={sections} />
        </aside>

        <main className="min-w-0 flex-1">
          <details className="mb-6 rounded-md border border-gray-200 lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800">Browse the design system</summary>
            <div className="border-t border-gray-100 p-3">
              <SidebarNav items={items} sections={sections} />
            </div>
          </details>

          {(missing.length > 0 || unknown.length > 0) && (
            <p className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              DESIGN.md and the design pages are out of sync.
              {missing.length > 0 && ` Not on any page: ${missing.join(", ")}.`}
              {unknown.length > 0 && ` Not in DESIGN.md: ${unknown.join(", ")}.`}
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
