"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Course { id: string; slug: string; title: string; summary: string; level: string; thumbnailUrl: string | null; instructor: { fullName: string }; }
interface Meta { page: number; pageSize: number; total: number; totalPages: number; }

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [search, level]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (level) qs.set("level", level);
      qs.set("page", String(page));
      fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api/courses?" + qs.toString())
        .then(function (r) { return r.json(); })
        .then(function (d) { setCourses(d.data); setMeta(d.meta); })
        .finally(function () { setLoading(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [search, level, page]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Course Catalog</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input placeholder="Search courses" value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-3">No courses match your search.</p>
          <button onClick={() => { setSearch(""); setLevel(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Clear filters</button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((c) => (
          <Link key={c.id} href={"/courses/" + c.slug} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <img
              src={c.thumbnailUrl || "https://placehold.co/400x240?text=Lumen"}
              alt={c.title}
              className="w-full h-32 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x240?text=Lumen"; }}
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{c.summary}</p>
              <span className="inline-block text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{c.level}</span>
              <span className="text-xs text-gray-500 ml-2">{c.instructor.fullName}</span>
            </div>
          </Link>
        ))}
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex gap-3 items-center justify-center">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-600">Page {meta.page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40">Next</button>
        </div>
      )}
    </main>
  );
}
