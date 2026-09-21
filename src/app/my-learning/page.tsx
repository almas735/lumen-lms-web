"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { apiFetch } from "../../lib/api";

interface EnrollmentRow {
  enrollmentId: string;
  status: string;
  course: { id: string; title: string; slug: string; thumbnailUrl: string | null };
  totalLessons: number;
  completedLessons: number;
  completedAt: string | null;
}

function MyLearningContent() {
  const router = useRouter();
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState("");

  useEffect(() => {
    apiFetch("/api/student/enrollments")
      .then(function (r) { return r.json(); })
      .then(function (d) { setRows(d.data); })
      .finally(function () { setLoading(false); });
  }, []);

  async function openCourse(slug: string) {
    setOpening(slug);
    const res = await apiFetch("/api/courses/" + slug + "/outline");
    if (!res.ok) { setOpening(""); return; }
    const data = await res.json();
    const allLessons: { id: string; progress: string }[] = [];
    data.modules.forEach(function (m: any) { m.lessons.forEach(function (l: any) { allLessons.push(l); }); });
    const next = allLessons.find(function (l) { return l.progress !== "COMPLETED"; }) || allLessons[0];
    if (next) {
      router.push("/learn/" + slug + "/" + next.id);
    } else {
      setOpening("");
    }
  }

  const active = rows.filter(function (r) { return r.status === "ACTIVE"; });
  const completed = rows.filter(function (r) { return r.status === "COMPLETED"; });

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Learning</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && rows.length === 0 && (
        <p className="text-gray-500">You have not enrolled in any courses yet. <Link href="/courses" className="text-blue-600 hover:underline">Browse the catalog</Link></p>
      )}

      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">In progress</h2>
          <div className="space-y-3">
            {active.map(function (r) {
              const pct = r.totalLessons > 0 ? Math.round((r.completedLessons / r.totalLessons) * 100) : 0;
              return (
                <button key={r.enrollmentId} onClick={function () { openCourse(r.course.slug); }} disabled={opening === r.course.slug}
                  className="w-full text-left block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow disabled:opacity-60">
                  <div className="font-semibold text-gray-900 mb-1">{opening === r.course.slug ? "Opening..." : r.course.title}</div>
                  <div className="text-sm text-gray-500 mb-2">{r.completedLessons} of {r.totalLessons} lessons</div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: pct + "%" }}></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Completed</h2>
          <div className="space-y-3">
            {completed.map(function (r) {
              return (
                <button key={r.enrollmentId} onClick={function () { openCourse(r.course.slug); }} disabled={opening === r.course.slug}
                  className="w-full text-left block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow disabled:opacity-60">
                  <div className="font-semibold text-gray-900">{opening === r.course.slug ? "Opening..." : r.course.title}</div>
                  <div className="text-sm text-green-700">Completed {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

export default function MyLearningPage() {
  return <ProtectedRoute allowedRoles={["STUDENT"]}><MyLearningContent /></ProtectedRoute>;
}
