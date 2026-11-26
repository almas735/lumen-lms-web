import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-sm font-semibold text-blue-700">404</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">We could not find that page</h1>
      <p className="mt-2 text-gray-600">The link may be old, or the course may have been removed.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/courses" className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
          Browse courses
        </Link>
        <Link href="/" className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
          Home
        </Link>
      </div>
    </main>
  );
}
