"use client";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user ? user.fullName : ""}</h1>
        <p className="text-gray-500 mb-6">Signed in as <span className="font-medium text-gray-700">{user ? user.role : ""}</span></p>
        <div className="flex flex-wrap gap-3">
          {user && user.role === "INSTRUCTOR" && <a href="/instructor/courses" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">My courses</a>}
          {user && user.role === "ADMIN" && <a href="/admin/users" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">Manage users</a>}
          <a href="/courses" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Browse catalog</a>
          <button onClick={handleLogout} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ml-auto">Log out</button>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
