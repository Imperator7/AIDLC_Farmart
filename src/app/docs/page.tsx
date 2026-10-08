import type { Metadata } from "next";
import Link from "next/link";
import SwaggerDocs from "./_components/swagger-docs";

export const metadata: Metadata = {
  title: "API docs - Farmart",
  description: "The Farmart REST API contract (OpenAPI 3.1): every path, request, response and error shape.",
};

export default function DocsPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold">
            F
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold text-gray-900">Farmart API docs</h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              Contract from <code>openapi.yaml</code>. Catalog, content and search are implemented (marked ✓); the rest is a draft.
            </p>
          </div>
          <nav className="ml-auto flex shrink-0 gap-4 text-xs font-semibold text-gray-600">
            <a href="/docs/openapi.json" className="hidden hover:text-amber-600 sm:inline">
              openapi.json
            </a>
            <a href="/database-er-diagram" className="hidden hover:text-amber-600 sm:inline">
              ER diagram
            </a>
            <Link href="/overview" className="hidden hover:text-amber-600 sm:inline">
              UI overview
            </Link>
            <Link href="/" className="hover:text-amber-600">
              ← Back to store
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl">
        <SwaggerDocs url="/docs/openapi.json" />
      </main>
    </div>
  );
}
