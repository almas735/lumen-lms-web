"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";

interface U { id: string; email: string; fullName: string; role: string; createdAt: string; }

function AdminUsersContent() {
  const [users, setUsers] = useState<U[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  function load() {
    const qs = search ? "?search=" + encodeURIComponent(search) : "";
    apiFetch("/api/admin/users" + qs).then(function (r) { return r.json(); }).then(function (d) { setUsers(d.data); });
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function changeRole(id: string, role: string) {
    await apiFetch("/api/admin/users/" + id + "/role", { method: "PATCH", body: JSON.stringify({ role: role }) });
    load();
  }

  async function deleteUser(id: string, name: string) {
    const ok = confirm("Delete " + name + "? This cannot be undone.");
    if (!ok) return;
    setError("");
    const res = await apiFetch("/api/admin/users/" + id, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ? data.error.message : "Could not delete this user");
      return;
    }
    load();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Users</h1>
      <input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-900">{u.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm">
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteUser(u.id, u.fullName)} className="text-red-600 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-gray-500 py-8">No users found.</p>}
      </div>
    </main>
  );
}

export default function AdminUsersPage() {
  return <ProtectedRoute allowedRoles={["ADMIN"]}><AdminUsersContent /></ProtectedRoute>;
}
