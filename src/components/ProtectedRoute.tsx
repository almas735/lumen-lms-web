"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`/login?redirect=${encodeURIComponent(pathname)}`); return; }
    if (allowedRoles && !allowedRoles.includes(user.role)) router.replace("/dashboard");
  }, [user, loading, router, pathname, allowedRoles]);

  if (loading || !user) return <p>Loading...</p>;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
}
