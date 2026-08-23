"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../lib/api";

interface Course { id: string; title: string; summary: string; description: string; level: string; thumbnailUrl: string | null; }

function EditCourseContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("BEGINNER");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/api/instructor/courses")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        const list: Course[] = d.data;
        let found: Course | undefined;
        for (let i = 0; i < list.length; i++) {
          if (list[i].id === id) { found = list[i]; break; }
        }
        if (found) {
          setCourse(found);
          setTitle(found.title);
          setSummary(found.summary);
          setDescription(found.description || "");
          setLevel(found.level);
          setThumbnailUrl(found.thumbnailUrl || "");
        }
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");
    setSaving(true);
    const body: any = { title: title, summary: summary, description: description, level: level, thumbnailUrl: thumbnailUrl.trim() ? thumbnailUrl.trim() : null };
    const res = await apiFetch("/api/courses/" + id, { method: "PATCH", body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (data.error && data.error.details && data.error.details.length) {
        const mapped: Record<string, string> = {};
        for (const d of data.error.details) { mapped[d.field] = d.message; }
        setFieldErrors(mapped);
      } else {
        setFormError(data.error ? data.error.message : "Something went wrong");
      }
      return;
    }
    router.push("/instructor/courses");
  }

  async function handleDelete() {
    const ok = confirm('Delete "' + title + '"? This cannot be undone.');
    if (!ok) return;
    await apiFetch("/api/courses/" + id, { method: "DELETE" });
    router.push("/instructor/courses");
  }

  if (!course) return <p className="max-w-lg mx-auto px-4 py-10 text-gray-500">Loading...</p>;

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit course</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.title && <p className="text-red-600 text-sm mt-1">{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <input value={summary} onChange={(e) => setSummary(e.target.value)} required maxLength={300}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.summary && <p className="text-red-600 text-sm mt-1">{fieldErrors.summary}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(Markdown supported)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.description && <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {fieldErrors.thumbnailUrl && <p className="text-red-600 text-sm mt-1">{fieldErrors.thumbnailUrl}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-blue-600 text-white py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
        <button onClick={handleDelete} className="w-full mt-3 rounded-lg border border-red-200 text-red-600 py-2.5 font-medium hover:bg-red-50">Delete course</button>
      </div>
    </main>
  );
}

export default function EditCoursePage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><EditCourseContent /></ProtectedRoute>;
}
