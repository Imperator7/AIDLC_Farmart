import type { Metadata } from "next";
import Link from "next/link";
import { allProducts } from "@/data/home";
import { pages } from "../design/_components/registry";
import FlowCanvas from "./_components/flow-canvas";
import { buildFlow, type ScreenNode } from "./_components/flow-graph";
import { getProjectStats } from "./_components/project-stats";

export const metadata: Metadata = {
  title: "UI overview - Farmart",
  description: "Project numbers, every page and overlay in Farmart, and how they link to each other.",
};

export default async function OverviewPage() {
  const counts = { productCount: allProducts.length, designPageCount: pages.length };
  const screens = buildFlow(counts).nodes.filter((n): n is ScreenNode => n.type === "screen");
  const stats = await getProjectStats({
    overlays: screens.filter((n) => n.data.kind === "overlay").length,
    planned: screens.filter((n) => n.data.kind === "planned").map((n) => n.data.title),
  });
  const { nodes, edges } = buildFlow({ ...counts, stats });

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="border-b border-gray-200">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold">
            F
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold text-gray-900">Farmart UI overview</h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              Project numbers on the left, every screen as it really looks on the right. Click a screen for details, or Open to go there.
            </p>
          </div>
          <nav className="ml-auto flex shrink-0 gap-4 text-xs font-semibold text-gray-600">
            <Link href="/design" className="hidden hover:text-amber-600 sm:inline">
              Design system
            </Link>
            <Link href="/" className="hover:text-amber-600">
              ← Back to store
            </Link>
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <FlowCanvas initialNodes={nodes} initialEdges={edges} />
      </main>
    </div>
  );
}
