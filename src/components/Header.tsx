"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const linkClass = "text-sm text-gray-700 hover:text-blue-600";

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3" aria-label="Main">
        <Link href="/" className="font-bold text-gray-900">Lumen LMS</Link>
        <Link href="/courses" className={linkClass}>Courses</Link>
        {user && user.role === "STUDENT" && <Link href="/my-learning" className={linkClass}>My Learning</Link>}
        {user && user.role === "INSTRUCTOR" && <Link href="/instructor/courses" className={linkClass}>My Courses</Link>}
        {user && user.role === "ADMIN" && <Link href="/admin/users" className={linkClass}>Users</Link>}
        <div className="ml-auto flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link href="/login" className={linkClass}>Log in</Link>
              <Link href="/register" className={linkClass}>Register</Link>
            </>
          )}
          {user && (
            <>
              <NotificationBell />
              <Link href="/dashboard" className={linkClass}>{user.fullName}</Link>
              <button type="button" onClick={handleLogout} className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">Log out</button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
