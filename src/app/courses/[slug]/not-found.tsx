import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h1>
      <p className="text-gray-600 mb-4">This course does not exist, or is not published.</p>
      <Link href="/courses" className="text-blue-600 hover:underline">Back to catalog</Link>
    </main>
  );
}
