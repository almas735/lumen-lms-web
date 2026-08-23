"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import MarkdownContent from "../../../components/MarkdownContent";

interface Course { id: string; title: string; description: string; level: string; thumbnailUrl: string | null; instructor: { id: string; fullName: string }; }

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);

  useEffect(() => {
    fetch("http://localhost:4000/api/courses/" + slug, { credentials: "include" })
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {c.thumbnailUrl && (
        <img
          src={c.thumbnailUrl}
          alt={c.title}
          className="w-full max-h-64 object-cover rounded-xl mb-6"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 mb-2">{c.level}</span>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{c.title}</h1>
      <p className="text-gray-500 mb-6">by {c.instructor.fullName}</p>
      <div className="prose prose-sm max-w-none text-gray-700 mb-6">
        <MarkdownContent content={c.description} />
      </div>
      <button disabled title="Coming soon" className="rounded-lg bg-gray-300 text-gray-600 px-5 py-2.5 font-medium cursor-not-allowed">Enroll (Coming soon)</button>
      {isOwner && <p className="mt-4"><Link href="/instructor/courses" className="text-blue-600 hover:underline text-sm">Manage this course</Link></p>}
    </main>
  );
}
