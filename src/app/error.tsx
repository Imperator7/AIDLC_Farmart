"use client"; // Error boundaries must be Client Components

import ErrorPage from "@/components/error-page";

/**
 * Catches errors from every page (everything under the root layout) and shows the error-page component instead of
 * Next's default screen. In production `error.message` is a generic text and only `digest` identifies the error in
 * the server log; the real message is shown in development only.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <title>Something went wrong - Farmart</title>
      <ErrorPage reference={error.digest} devDetail={process.env.NODE_ENV === "development" ? error.message : undefined} onRetry={retry} />
    </>
  );
}
