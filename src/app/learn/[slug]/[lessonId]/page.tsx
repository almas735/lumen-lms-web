"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import MarkdownContent from "../../../../components/MarkdownContent";
import { apiFetch } from "../../../../lib/api";

interface LessonOutline { id: string; title: string; position: number; progress: string; }
interface ModuleOutline { id: string; title: string; position: number; lessons: LessonOutline[]; }
interface Lesson { id: string; title: string; contentMd: string; videoUrl: string | null; }

function LearnContent() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const slug = params.slug;
  const lessonId = params.lessonId;
  const router = useRouter();

  const [modules, setModules] = useState<ModuleOutline[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const flatLessons: { moduleId: string; lesson: LessonOutline }[] = [];
  modules.forEach(function (m) {
    m.lessons.forEach(function (l) { flatLessons.push({ moduleId: m.id, lesson: l }); });
  });
  const currentIndex = flatLessons.findIndex(function (x) { return x.lesson.id === lessonId; });
  const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;
  const currentProgress = currentIndex >= 0 ? flatLessons[currentIndex].lesson.progress : "NOT_STARTED";

  function loadOutline() {
    apiFetch("/api/courses/" + slug + "/outline")
      .then(function (r) { return r.json(); })
      .then(function (d) { setModules(d.modules); });
  }

  function loadLesson() {
    setLoading(true);
    apiFetch("/api/lessons/" + lessonId)
      .then(function (r) { return r.json(); })
      .then(function (d) { setLesson(d.lesson); })
      .finally(function () { setLoading(false); });
  }

  useEffect(loadOutline, [slug]);
  useEffect(loadLesson, [lessonId]);

  async function toggleComplete(completed: boolean) {
    setMarking(true);
    await apiFetch("/api/lessons/" + lessonId + "/progress", { method: "POST", body: JSON.stringify({ completed: completed }) });
    setMarking(false);
    loadOutline();
    if (completed && next) {
      router.push("/learn/" + slug + "/" + next.lesson.id);
    }
  }

  if (loading || !lesson) return <p className="max-w-5xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
      <aside className="md:w-64 flex-shrink-0">
        <Link href="/my-learning" className="text-sm text-blue-600 hover:underline mb-3 inline-block">Back to My Learning</Link>
        <div className="space-y-4">
          {modules.map(function (m) {
            return (
              <div key={m.id}>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{m.title}</div>
                <ul className="space-y-1">
                  {m.lessons.map(function (l) {
                    const isCurrent = l.id === lessonId;
                    return (
                      <li key={l.id}>
                        <Link href={"/learn/" + slug + "/" + l.id}
                          className={"block text-sm rounded-lg px-3 py-1.5 " + (isCurrent ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50")}>
                          {l.progress === "COMPLETED" ? "(done) " : ""}{l.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
        {lesson.videoUrl && (
          <div className="mb-4 aspect-video">
            <iframe src={lesson.videoUrl} className="w-full h-full rounded-lg" allowFullScreen></iframe>
          </div>
        )}
        <div className="prose prose-sm max-w-none text-gray-700 mb-8">
          <MarkdownContent content={lesson.contentMd} />
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <button disabled={!prev} onClick={function () { if (prev) router.push("/learn/" + slug + "/" + prev.lesson.id); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30">
            Previous
          </button>

          {currentProgress === "COMPLETED" ? (
            <button onClick={function () { toggleComplete(false); }} disabled={marking}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Mark as not complete
            </button>
          ) : (
            <button onClick={function () { toggleComplete(true); }} disabled={marking}
              className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
              {marking ? "Saving..." : "Mark as complete"}
            </button>
          )}

          <button disabled={!next} onClick={function () { if (next) router.push("/learn/" + slug + "/" + next.lesson.id); }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-30">
            Next
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LearnPage() {
  return <ProtectedRoute><LearnContent /></ProtectedRoute>;
}
