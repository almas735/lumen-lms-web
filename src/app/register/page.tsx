"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSubmitting(true);
    const result = await register({ fullName: fullName, email: email, password: password, role: role });
    setSubmitting(false);
    if (!result.ok) {
      if (result.details && result.details.length) {
        const mapped: Record<string, string> = {};
        for (const d of result.details) { mapped[d.field] = d.message; }
        setFieldErrors(mapped);
      } else {
        setFormError(result.error || "Something went wrong");
      }
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.fullName && <p className="text-red-600 text-sm mt-1">{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.email && <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.password && <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>}
            <ul className="mt-1.5 space-y-0.5 text-xs">
              <li className={hasMinLength ? "text-green-600" : "text-gray-400"}>{hasMinLength ? "OK" : "-"} At least 8 characters</li>
              <li className={hasLetter ? "text-green-600" : "text-gray-400"}>{hasLetter ? "OK" : "-"} Contains a letter</li>
              <li className={hasNumber ? "text-green-600" : "text-gray-400"}>{hasNumber ? "OK" : "-"} Contains a number</li>
            </ul>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as "STUDENT" | "INSTRUCTOR")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a></p>
      </div>
    </main>
  );
}
