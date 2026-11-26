"use client";
import { useEffect } from "react";
import Link from "next/link";

// Catches crashes while a page renders. The header stays visible and the user gets a way out.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page crashed:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">
        This page ran into a problem. Nothing you did elsewhere was lost. You can try again, or go back to the home page.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
          Try again
        </button>
        <Link href="/" className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
