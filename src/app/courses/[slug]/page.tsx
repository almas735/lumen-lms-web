"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import MarkdownContent from "../../../components/MarkdownContent";
import { apiFetch } from "../../../lib/api";

interface Course { id: string; title: string; description: string; level: string; thumbnailUrl: string | null; instructor: { id: string; fullName: string }; }

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [enrollState, setEnrollState] = useState("idle");
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    apiFetch("/api/courses/" + slug)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { setCourse(d ? d.course : null); });
  }, [slug]);

  useEffect(() => {
    if (course) { document.title = course.title + " | Lumen LMS"; }
  }, [course]);

  if (course === undefined) return <p className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;
  if (course === null) { notFound(); }

  const c = course as Course;
  const isOwner = user ? user.id === c.instructor.id : false;
  const isStudent = user ? user.role === "STUDENT" : false;

  async function handleEnroll() {
    if (!user) {
      router.push("/login?redirect=/courses/" + slug);
      return;
    }
    setEnrollState("enrolling");
    setEnrollError("");
    const res = await apiFetch("/api/courses/" + c.id + "/enroll", { method: "POST" });
    const data = await res.json();
    if (res.status === 409) {
      setEnrollState("already");
      return;
    }
    if (!res.ok) {
      setEnrollError(data.error ? data.error.message : "Could not enroll");
      setEnrollState("error");
      return;
    }
    setEnrollState("enrolled");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {c.thumbnailUrl && (
        <img
          src={c.thumbnailUrl}
          alt={c.title}
          className="w-full max-h-64 object-cover rounded-xl mb-6"
          onError={function (e) { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 mb-2">{c.level}</span>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{c.title}</h1>
      <p className="text-gray-500 mb-6">by {c.instructor.fullName}</p>
      <div className="prose prose-sm max-w-none text-gray-700 mb-6">
        <MarkdownContent content={c.description} />
      </div>

      {isOwner && (
        <p><Link href="/instructor/courses" className="text-blue-600 hover:underline text-sm">Manage this course</Link></p>
      )}

      {!isOwner && (isStudent || !user) && (
        <div>
          {(enrollState === "idle" || enrollState === "enrolling") && (
            <button onClick={handleEnroll} disabled={enrollState === "enrolling"}
              className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
              {enrollState === "enrolling" ? "Enrolling..." : "Enroll"}
            </button>
          )}
          {enrollState === "enrolled" && (
            <div>
              <p className="text-green-700 font-medium mb-2">You are enrolled.</p>
              <Link href="/my-learning" className="text-blue-600 hover:underline text-sm">Go to My Learning</Link>
            </div>
          )}
          {enrollState === "already" && (
            <div>
              <p className="text-gray-700 font-medium mb-2">You are already enrolled.</p>
              <Link href="/my-learning" className="text-blue-600 hover:underline text-sm">Go to My Learning</Link>
            </div>
          )}
          {enrollState === "error" && <p className="text-red-600 text-sm">{enrollError}</p>}
        </div>
      )}
    </main>
  );
}
