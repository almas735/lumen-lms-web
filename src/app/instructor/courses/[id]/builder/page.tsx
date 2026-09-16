"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../lib/api";

interface Lesson { id: string; title: string; position: number; }
interface ModuleT { id: string; title: string; position: number; lessons: Lesson[]; }
interface Course { id: string; title: string; }

function BuilderContent() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleT[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitles, setNewLessonTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    apiFetch("/api/courses/" + courseId + "/outline")
      .then(function (r) { return r.json(); })
      .then(function (d) { setCourse(d.course); setModules(d.modules); })
      .finally(function () { setLoading(false); });
  }
  useEffect(load, [courseId]);

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    setError("");
    const res = await apiFetch("/api/courses/" + courseId + "/modules", { method: "POST", body: JSON.stringify({ title: newModuleTitle }) });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ? d.error.message : "Could not add module");
      return;
    }
    setNewModuleTitle("");
    load();
  }

  async function renameModule(id: string, title: string) {
    await apiFetch("/api/modules/" + id, { method: "PATCH", body: JSON.stringify({ title: title }) });
    load();
  }

  async function deleteModule(id: string, title: string, lessonCount: number) {
    const ok = confirm('Delete module "' + title + '"? This will also delete ' + lessonCount + ' lesson(s). This cannot be undone.');
    if (!ok) return;
    await apiFetch("/api/modules/" + id, { method: "DELETE" });
    load();
  }

  async function moveModule(index: number, direction: number) {
    const newOrder = modules.slice();
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    const tmp = newOrder[index];
    newOrder[index] = newOrder[target];
    newOrder[target] = tmp;
    const orderedIds = newOrder.map(function (m) { return m.id; });
    setModules(newOrder);
    await apiFetch("/api/courses/" + courseId + "/modules/order", { method: "PUT", body: JSON.stringify({ orderedIds: orderedIds }) });
    load();
  }

  async function addLesson(moduleId: string, e: React.FormEvent) {
    e.preventDefault();
    const title = newLessonTitles[moduleId];
    if (!title || !title.trim()) return;
    setError("");
    const res = await apiFetch("/api/modules/" + moduleId + "/lessons", { method: "POST", body: JSON.stringify({ title: title }) });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ? d.error.message : "Could not add lesson");
      return;
    }
    setNewLessonTitles(function (prev) {
      const next = Object.assign({}, prev);
      next[moduleId] = "";
      return next;
    });
    load();
  }

  async function deleteLesson(id: string, title: string) {
    const ok = confirm('Delete lesson "' + title + '"? This cannot be undone.');
    if (!ok) return;
    await apiFetch("/api/lessons/" + id, { method: "DELETE" });
    load();
  }

  async function moveLesson(moduleId: string, lessons: Lesson[], index: number, direction: number) {
    const newOrder = lessons.slice();
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    const tmp = newOrder[index];
    newOrder[index] = newOrder[target];
    newOrder[target] = tmp;
    const orderedIds = newOrder.map(function (l) { return l.id; });
    await apiFetch("/api/modules/" + moduleId + "/lessons/order", { method: "PUT", body: JSON.stringify({ orderedIds: orderedIds }) });
    load();
  }

  if (loading) return <p className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;
  if (!course) return <p className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Course not found.</p>;

  const totalLessons = modules.reduce(function (sum, m) { return sum + m.lessons.length; }, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        <Link href="/instructor/courses" className="text-sm text-blue-600 hover:underline">Back to My Courses</Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">{modules.length} module(s) - {totalLessons} lesson(s)</p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {modules.length === 0 && <p className="text-gray-500 mb-4">No modules yet. Add your first one below.</p>}

      <div className="space-y-4">
        {modules.map(function (mod, mIndex) {
          return (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  defaultValue={mod.title}
                  onBlur={function (e) {
                    if (e.target.value.trim() && e.target.value !== mod.title) renameModule(mod.id, e.target.value.trim());
                  }}
                  className="font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none flex-1 mr-2"
                />
                <div className="flex gap-1">
                  <button onClick={function () { moveModule(mIndex, -1); }} disabled={mIndex === 0} title="Move up"
                    className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30">Up</button>
                  <button onClick={function () { moveModule(mIndex, 1); }} disabled={mIndex === modules.length - 1} title="Move down"
                    className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30">Down</button>
                  <button onClick={function () { deleteModule(mod.id, mod.title, mod.lessons.length); }}
                    className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                </div>
              </div>

              {mod.lessons.length === 0 && <p className="text-sm text-gray-400 mb-2">No lessons yet.</p>}

              <ul className="space-y-1 mb-3">
                {mod.lessons.map(function (lesson, lIndex) {
                  return (
                    <li key={lesson.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <Link href={"/instructor/courses/" + courseId + "/lessons/" + lesson.id + "/edit"} className="text-sm text-blue-600 underline hover:text-blue-800">
                        {lesson.title}
                      </Link>
                      <div className="flex gap-1">
                        <button onClick={function () { moveLesson(mod.id, mod.lessons, lIndex, -1); }} disabled={lIndex === 0}
                          className="px-1.5 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Up</button>
                        <button onClick={function () { moveLesson(mod.id, mod.lessons, lIndex, 1); }} disabled={lIndex === mod.lessons.length - 1}
                          className="px-1.5 py-0.5 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Down</button>
                        <button onClick={function () { deleteLesson(lesson.id, lesson.title); }}
                          className="px-1.5 py-0.5 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <form onSubmit={function (e) { addLesson(mod.id, e); }} className="flex gap-2">
                <input
                  value={newLessonTitles[mod.id] || ""}
                  onChange={function (e) {
                    setNewLessonTitles(function (prev) {
                      const next = Object.assign({}, prev);
                      next[mod.id] = e.target.value;
                      return next;
                    });
                  }}
                  placeholder="New lesson title"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
                <button type="submit" className="rounded-lg bg-gray-800 text-white px-3 py-1 text-sm hover:bg-gray-900">Add lesson</button>
            </form>
          </div>
        );
      })}
    </div>

    <form onSubmit={addModule} className="flex gap-2 mt-6">
      <input
        value={newModuleTitle}
        onChange={function (e) { setNewModuleTitle(e.target.value); }}
        placeholder="New module title"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">Add module</button>
    </form>
  </main>
  );
}

export default function BuilderPage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><BuilderContent /></ProtectedRoute>;
}
