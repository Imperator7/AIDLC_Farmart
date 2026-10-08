import type { Metadata } from "next";
import Link from "next/link";
import { commands, devTools, features } from "./_components/features";
import { loadOnboarding } from "./_components/load-status";
import OnboardingView from "./_components/onboarding-view";

export const metadata: Metadata = {
  title: "On-boarding - Farmart",
  description: "Set up Farmart, see how data flows from src/data to the browser, and how every feature gets its data.",
  robots: { index: false },
};

// Live status (database, tests, spec) on every request. This page doesn't need a seeded database, so it works on a fresh clone.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const status = await loadOnboarding();

  return (
    <div className="min-h-dvh bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-bold">
            F
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-bold text-gray-900">Farmart on-boarding</h1>
            <p className="hidden truncate text-xs text-gray-500 sm:block">Setup, data pipeline and feature flows, read live from this machine.</p>
          </div>
          <nav className="ml-auto flex shrink-0 gap-4 text-xs font-semibold text-gray-600">
            <Link href="/test-report" className="hidden hover:text-amber-700 sm:inline">
              Test report
            </Link>
            <Link href="/docs" className="hidden hover:text-amber-700 sm:inline">
              API docs
            </Link>
            <Link href="/" className="hover:text-amber-700">
              ← Back to store
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <OnboardingView status={status} features={features} devTools={devTools} commands={commands} />
      </main>
    </div>
  );
}
