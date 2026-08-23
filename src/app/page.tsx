import Header from "../components/Header";

export default async function Home() {
  const response = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api/health", { cache: "no-store" });
  const data = await response.json();
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Lumen LMS</h1>
        <p className="text-lg text-gray-600 mb-6">Learning Management System</p>
        <p className="inline-block rounded-full px-4 py-1 text-sm font-medium bg-gray-100 text-gray-700 mb-8">
          API Status: {data.status === "ok" ? "Connected" : "Disconnected"}
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/courses" className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700">Browse courses</a>
          <a href="/register" className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Sign up</a>
        </div>
      </main>
    </>
  );
}
