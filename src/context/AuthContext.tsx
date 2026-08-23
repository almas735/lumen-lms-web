"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

interface User { id: string; email: string; fullName: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN"; avatarUrl: string | null; }
interface FieldDetail { field: string; message: string; }
interface AuthResult { ok: boolean; error?: string; details?: FieldDetail[]; }
interface AuthContextValue {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: { fullName: string; email: string; password: string; role: "STUDENT" | "INSTRUCTOR" }) => Promise<AuthResult>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(function (res) { return res.ok ? res.json().then(function (d) { return d.user; }) : null; })
      .then(function (u) { setUser(u); })
      .catch(function () { setUser(null); })
      .finally(function () { setLoading(false); });
  }, []);

  useEffect(() => {
    function handleExpired() {
      setUser(null);
      router.push("/login?expired=1");
    }
    window.addEventListener("auth:expired", handleExpired);
    return function () { window.removeEventListener("auth:expired", handleExpired); };
  }, [router]);

  async function login(email: string, password: string): Promise<AuthResult> {
    const res = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email: email, password: password }) });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ? data.error.message : "Login failed", details: data.error ? data.error.details : undefined };
    }
    setUser(data.user);
    return { ok: true };
  }

  async function register(input: { fullName: string; email: string; password: string; role: "STUDENT" | "INSTRUCTOR" }): Promise<AuthResult> {
    const res = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ? data.error.message : "Registration failed", details: data.error ? data.error.details : undefined };
    }
    setUser(data.user);
    return { ok: true };
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return <AuthContext.Provider value={{ user: user, loading: loading, login: login, register: register, logout: logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
