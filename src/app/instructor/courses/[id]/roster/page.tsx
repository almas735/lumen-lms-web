"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../lib/api";

interface RosterRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  progressPercent: number;
  lastActiveAt: string | null;
  enrolledAt: string;
}

function RosterContent() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/courses/" + courseId + "/roster")
      .then(function (r) { return r.json(); })
      .then(function (d) { setRows(d.data); })
      .finally(function () { setLoading(false); });
  }, [courseId]);

  const totalEnrolled = rows.length;
  const avgProgress = totalEnrolled > 0 ? Math.round(rows.reduce(function (s, r) { return s + r.progressPercent; }, 0) / totalEnrolled) : 0;
  const completedCount = rows.filter(function (r) { return r.status === "COMPLETED"; }).length;

  function isInactive(lastActiveAt: string | null) {
    if (!lastActiveAt) return true;
    const days = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 14;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
        <Link href="/instructor/courses" className="text-sm text-blue-600 hover:underline">Back to My Courses</Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalEnrolled}</div>
          <div className="text-xs text-gray-500">Total enrolled</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{avgProgress}%</div>
          <div className="text-xs text-gray-500">Average progress</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && rows.length === 0 && <p className="text-gray-500">No students enrolled yet.</p>}

      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Enrolled</th>
                <th className="text-left px-4 py-3 font-medium">Progress</th>
                <th className="text-left px-4 py-3 font-medium">Last active</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(function (r) {
                return (
                  <tr key={r.studentId}>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{r.studentName}</div>
                      <div className="text-xs text-gray-500">{r.studentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(r.enrolledAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-600">{r.progressPercent}%</td>
                    <td className="px-4 py-3">
                      <span className={isInactive(r.lastActiveAt) ? "text-amber-600" : "text-gray-600"}>
                        {r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleDateString() : "Never"}
                        {isInactive(r.lastActiveAt) ? " (inactive)" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function RosterPage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><RosterContent /></ProtectedRoute>;
}
