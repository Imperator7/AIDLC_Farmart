import type { Metadata } from "next";
import Link from "next/link";
import { loadReport } from "./_components/load-report";
import ReportView, { ReportEmpty } from "./_components/report-view";

export const metadata: Metadata = {
  title: "Test report - Farmart",
  description: "Results of the unit, integration and component tests, and backend coverage.",
  robots: { index: false },
};

// Read the files on every request, so a new `npm run test:report` shows up on reload without a rebuild.
export const dynamic = "force-dynamic";

export default async function TestReportPage() {
  const report = await loadReport();

  return (
    <div className="min-h-dvh bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold">
            F
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold text-gray-900">Farmart test report</h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              From the last <code>npm run test:report</code>. Run it again and reload to update.
            </p>
          </div>
          <nav className="ml-auto flex shrink-0 gap-4 text-xs font-semibold text-gray-600">
            <Link href="/docs" className="hidden hover:text-amber-700 sm:inline">
              API docs
            </Link>
            <Link href="/overview" className="hidden hover:text-amber-700 sm:inline">
              UI overview
            </Link>
            <Link href="/" className="hover:text-amber-700">
              ← Back to store
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{report ? <ReportView report={report} /> : <ReportEmpty />}</main>
    </div>
  );
}
