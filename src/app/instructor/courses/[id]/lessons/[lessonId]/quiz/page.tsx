"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../../../lib/api";

interface OptionForm { text: string; isCorrect: boolean; explanation: string; }
interface QuestionForm { text: string; options: OptionForm[]; }

function QuizBuilderContent() {
  const params = useParams<{ id: string; lessonId: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;
  const router = useRouter();

  const [title, setTitle] = useState("Lesson Quiz");
  const [passingScorePercent, setPassingScorePercent] = useState(70);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { text: "", options: [{ text: "", isCorrect: true, explanation: "" }, { text: "", isCorrect: false, explanation: "" }] },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/lessons/" + lessonId + "/quiz")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.quiz) {
          setTitle(d.quiz.title);
          setPassingScorePercent(d.quiz.passingScorePercent);
          setQuestions(d.quiz.questions.map(function (q: any) {
            return { text: q.text, options: q.options.map(function (o: any) { return { text: o.text, isCorrect: o.isCorrect, explanation: o.explanation || "" }; }) };
          }));
        }
      })
      .finally(function () { setLoading(false); });
  }, [lessonId]);

  function addQuestion() {
    setQuestions(questions.concat([{ text: "", options: [{ text: "", isCorrect: true, explanation: "" }, { text: "", isCorrect: false, explanation: "" }] }]));
  }
  function removeQuestion(qi: number) {
    setQuestions(questions.filter(function (_, i) { return i !== qi; }));
  }
  function updateQuestionText(qi: number, text: string) {
    setQuestions(questions.map(function (q, i) { return i === qi ? Object.assign({}, q, { text: text }) : q; }));
  }
  function addOption(qi: number) {
    setQuestions(questions.map(function (q, i) {
      if (i !== qi) return q;
      return Object.assign({}, q, { options: q.options.concat([{ text: "", isCorrect: false, explanation: "" }]) });
    }));
  }
  function removeOption(qi: number, oi: number) {
    setQuestions(questions.map(function (q, i) {
      if (i !== qi) return q;
      return Object.assign({}, q, { options: q.options.filter(function (_, j) { return j !== oi; }) });
    }));
  }
  function updateOption(qi: number, oi: number, field: string, value: any) {
    setQuestions(questions.map(function (q, i) {
      if (i !== qi) return q;
      const newOptions = q.options.map(function (o, j) {
        if (j !== oi) return o;
        const copy = Object.assign({}, o);
        (copy as any)[field] = value;
        return copy;
      });
      return Object.assign({}, q, { options: newOptions });
    }));
  }
  function setCorrect(qi: number, oi: number) {
    setQuestions(questions.map(function (q, i) {
      if (i !== qi) return q;
      const newOptions = q.options.map(function (o, j) { return Object.assign({}, o, { isCorrect: j === oi }); });
      return Object.assign({}, q, { options: newOptions });
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await apiFetch("/api/lessons/" + lessonId + "/quiz", {
      method: "PUT",
      body: JSON.stringify({ title: title, passingScorePercent: passingScorePercent, questions: questions }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ? d.error.message : "Could not save quiz");
      return;
    }
    router.push("/instructor/courses/" + courseId + "/builder");
  }

  if (loading) return <p className="max-w-3xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lesson Quiz</h1>
        <Link href={"/instructor/courses/" + courseId + "/builder"} className="text-sm text-blue-600 hover:underline">Back to course builder</Link>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz title</label>
            <input value={title} onChange={function (e) { setTitle(e.target.value); }} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passing score (%)</label>
            <input type="number" min={0} max={100} value={passingScorePercent}
              onChange={function (e) { setPassingScorePercent(parseInt(e.target.value, 10) || 0); }}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>

        {questions.map(function (q, qi) {
          return (
            <div key={qi} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Question {qi + 1}</label>
                {questions.length > 1 && (
                  <button type="button" onClick={function () { removeQuestion(qi); }} className="text-xs text-red-600 hover:underline">Remove question</button>
                )}
              </div>
              <input value={q.text} onChange={function (e) { updateQuestionText(qi, e.target.value); }} required
                placeholder="Question text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4" />

              <div className="space-y-3">
                {q.options.map(function (o, oi) {
                  return (
                    <div key={oi} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                      <input type="radio" checked={o.isCorrect} onChange={function () { setCorrect(qi, oi); }} className="mt-2" title="Correct answer" />
                      <div className="flex-1 space-y-2">
                        <input value={o.text} onChange={function (e) { updateOption(qi, oi, "text", e.target.value); }} required
                          placeholder="Option text" className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm" />
                        <input value={o.explanation} onChange={function (e) { updateOption(qi, oi, "explanation", e.target.value); }}
                          placeholder="Explanation (optional, shown after submit)" className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs" />
                      </div>
                      {q.options.length > 2 && (
                        <button type="button" onClick={function () { removeOption(qi, oi); }} className="text-xs text-red-600 hover:underline mt-2">Remove</button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={function () { addOption(qi); }} className="mt-3 text-xs text-blue-600 hover:underline">+ Add option</button>
            </div>
          );
        })}

        <button type="button" onClick={addQuestion} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          + Add question
        </button>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save quiz"}
        </button>
      </form>
    </main>
  );
}

export default function QuizBuilderPage() {
  return <ProtectedRoute allowedRoles={["INSTRUCTOR"]}><QuizBuilderContent /></ProtectedRoute>;
}
