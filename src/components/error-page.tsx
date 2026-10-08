"use client";

import { BrandLogo } from "./header";
import { AlertIcon } from "./icons";
import { Button } from "./ui";

/**
 * error-page: shown by src/app/error.tsx when a page fails on the server. Customers get a way forward and a
 * reference to quote; the real error stays in the server log (Next only sends its digest in production).
 */
export function ErrorPanel({ reference, devDetail, onRetry }: { reference?: string; devDetail?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-md bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <AlertIcon size={22} />
      </span>
      <h1 className="mt-4 text-lg font-bold text-gray-900">We couldn&apos;t load this page</h1>
      <p className="mt-1 max-w-sm text-sm text-gray-600">Something went wrong on our side, not yours. Please try again in a moment.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onRetry ?? (() => window.location.reload())}>Try again</Button>
        <Button variant="ghost" href="/">
          Go to the home page
        </Button>
      </div>
      {reference && (
        <p className="mt-6 text-xs text-gray-500">
          Reference: <span className="font-mono">{reference}</span>
        </p>
      )}
      {devDetail && (
        <div className="mt-6 w-full max-w-lg rounded-md bg-gray-100 p-3 text-left text-xs text-gray-700">
          <p className="font-semibold text-gray-900">Development only</p>
          <p className="mt-1 font-mono break-words">{devDetail}</p>
        </div>
      )}
    </div>
  );
}

/** The whole screen: a logo-only bar (the full header needs the database, which may be what failed) over the panel. */
export default function ErrorPage(props: Parameters<typeof ErrorPanel>[0]) {
  return (
    <div className="flex flex-1 flex-col bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <BrandLogo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <ErrorPanel {...props} />
      </main>
    </div>
  );
}
