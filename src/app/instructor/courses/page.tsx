"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";

interface Course { id: string; title: string; status: string; level: string; }

function MyCoursesContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const qs = filter ? "?status=" + filter : "";
    apiFetch("/api/instructor/courses" + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { setCourses(d.data); })
      .finally(function () { setLoading(false); });
  }
  useEffect(load, [filter]);

  async function doAction(id: string, action: string, label: string) {
    const ok = confirm("Are you sure you want to " + label + " this course?");
    if (!ok) return;
    await apiFetch("/api/courses/" + id + "/" + action, { method: "POST" });
    load();
  }

  const statusStyle: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PUBLISHED: "bg-green-50 text-green-700",
    ARCHIVED: "bg-amber-50 text-amber-700",
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        <Link href="/instructor/courses/new" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">New course</Link>
      </div>
      <div className="flex gap-2 mb-6">
        {["", "DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={"rounded-full px-3 py-1 text-sm font-medium " + (filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
            {s || "All"}
          </button>
        ))}
      </div>
      {loading && <p className="text-gray-500">Loading your courses...</p>}
      {!loading && courses.length === 0 && (
        <p className="text-gray-500">No courses yet. <Link href="/instructor/courses/new" className="text-blue-600 hover:underline">Create your first course</Link></p>
      )}
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <Link href={"/instructor/courses/" + c.id + "/edit"} className="font-semibold text-gray-900 hover:text-blue-600">{c.title}</Link>
              <div className="flex gap-2 mt-1">
                <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + statusStyle[c.status]}>{c.status}</span>
                <span className="text-xs text-gray-500">{c.level}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {c.status === "DRAFT" && <button onClick={() => doAction(c.id, "publish", "publish")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Publish</button>}
              {c.status === "PUBLISHED" && <button onClick={() => doAction(c.id, "unpublish", "unpublish")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Unpublish</button>}
              {c.status !== "ARCHIVED" && <button onClick={() => doAction(c.id, "archive", "archive")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Archive</button>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function MyCoursesPage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><MyCoursesContent /></ProtectedRoute>;
}
