"use client";
import "./globals.css";

// Last line of defence: used when the root layout itself crashes.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Lumen LMS hit a problem</h1>
          <p className="mt-2 text-gray-600">Please try again. If it keeps happening, come back in a few minutes.</p>
          <button type="button" onClick={reset} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
