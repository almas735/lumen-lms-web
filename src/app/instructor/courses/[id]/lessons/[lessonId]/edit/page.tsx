"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../../../lib/api";
import MarkdownContent from "../../../../../../../components/MarkdownContent";

interface Lesson { id: string; title: string; contentMd: string; videoUrl: string | null; durationMinutes: number; }

function LessonEditContent() {
  const params = useParams<{ id: string; lessonId: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const dirtyRef = useRef(false);

  useEffect(() => {
    apiFetch("/api/lessons/" + lessonId)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        setLesson(d.lesson);
        setTitle(d.lesson.title);
        setContentMd(d.lesson.contentMd || "");
        setVideoUrl(d.lesson.videoUrl || "");
        setDurationMinutes(d.lesson.durationMinutes || 0);
      });
  }, [lessonId]);

  async function save() {
    setSaving(true);
    setError("");
    const body: any = { title: title, contentMd: contentMd, durationMinutes: durationMinutes };
    body.videoUrl = videoUrl.trim() ? videoUrl.trim() : null;
    const res = await apiFetch("/api/lessons/" + lessonId, { method: "PATCH", body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ? d.error.message : "Could not save");
      return;
    }
    dirtyRef.current = false;
    setSavedAt(new Date().toLocaleTimeString());
  }

  function markDirty() {
    dirtyRef.current = true;
  }

  useEffect(() => {
    const interval = setInterval(function () {
      if (dirtyRef.current) save();
    }, 30000);
    return function () { clearInterval(interval); };
  }, [title, contentMd, videoUrl, durationMinutes]);

  async function handleManualSave(e: React.FormEvent) {
    e.preventDefault();
    await save();
  }

  if (!lesson) return <p className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit lesson</h1>
        <Link href={"/instructor/courses/" + courseId + "/builder"} className="text-sm text-blue-600 hover:underline">Back to course builder</Link>
      </div>
      <form onSubmit={handleManualSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input value={title} onChange={function (e) { setTitle(e.target.value); markDirty(); }} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Content (Markdown)</label>
            <button type="button" onClick={function () { setShowPreview(!showPreview); }} className="text-xs text-blue-600 hover:underline">
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
          </div>
          <textarea value={contentMd} onChange={function (e) { setContentMd(e.target.value); markDirty(); }} rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
          {showPreview && (
            <div className="mt-3 border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none">
              <MarkdownContent content={contentMd} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
          <input value={videoUrl} onChange={function (e) { setVideoUrl(e.target.value); markDirty(); }} placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated minutes</label>
          <input type="number" min={0} value={durationMinutes}
            onChange={function (e) { setDurationMinutes(parseInt(e.target.value, 10) || 0); markDirty(); }}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          {savedAt && <span className="text-xs text-gray-500">Saved at {savedAt}</span>}
        </div>
      </form>
    </main>
  );
}

export default function LessonEditPage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><LessonEditContent /></ProtectedRoute>;
}
