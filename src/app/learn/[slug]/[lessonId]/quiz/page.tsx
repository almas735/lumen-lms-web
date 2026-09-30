"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../../../components/ProtectedRoute";
import { apiFetch } from "../../../../../lib/api";

interface Option { id: string; text: string; isCorrect?: boolean; explanation?: string; }
interface Question { id: string; text: string; options: Option[]; selectedOptionId?: string | null; isCorrect?: boolean; }
interface Quiz { id: string; title: string; passingScorePercent: number; questions: Question[]; }

function QuizTakeContent() {
  const params = useParams<{ slug: string; lessonId: string }>();
  const slug = params.slug;
  const lessonId = params.lessonId;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [notFoundQuiz, setNotFoundQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function loadQuiz() {
    setLoading(true);
    setResult(null);
    setAnswers({});
    apiFetch("/api/lessons/" + lessonId + "/quiz")
      .then(function (r) {
        if (r.status === 404) { setNotFoundQuiz(true); return null; }
        return r.json();
      })
      .then(function (d) { if (d) setQuiz(d.quiz); })
      .finally(function () { setLoading(false); });
  }
  useEffect(loadQuiz, [lessonId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setSubmitting(true);
    setError("");
    const payload = {
      answers: quiz.questions.map(function (q) { return { questionId: q.id, selectedOptionId: answers[q.id] || "" }; }),
    };
    const res = await apiFetch("/api/quizzes/" + quiz.id + "/attempts", { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ? data.error.message : "Could not submit quiz");
      return;
    }
    setResult(data);
  }

  if (notFoundQuiz) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-gray-500 mb-4">This lesson does not have a quiz.</p>
        <Link href={"/learn/" + slug + "/" + lessonId} className="text-blue-600 hover:underline text-sm">Back to lesson</Link>
      </main>
    );
  }

  if (loading || !quiz) return <p className="max-w-2xl mx-auto px-4 py-10 text-gray-500">Loading...</p>;

  if (result) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className={"rounded-xl border p-6 mb-6 " + (result.attempt.passed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200")}>
          <h1 className="text-2xl font-bold mb-1">{result.attempt.passed ? "You passed!" : "Not quite yet"}</h1>
          <p className="text-gray-700">Score: {result.attempt.scorePercent}% (need {result.attempt.passingScorePercent}% to pass)</p>
        </div>
        {result.courseCompleted && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
            <p className="font-bold text-green-800 text-lg mb-1">You have completed the whole course!</p>
            <Link href="/my-learning" className="text-sm text-blue-600 hover:underline">Back to My Learning</Link>
          </div>
        )}
        </div>

        <div className="space-y-4 mb-6">
          {result.questions.map(function (q: any) {
            return (
              <div key={q.id} className={"rounded-xl border p-4 " + (q.isCorrect ? "border-green-200" : "border-red-200")}>
                <p className="font-medium text-gray-900 mb-2">{q.text}</p>
                {q.options.map(function (o: any) {
                  const wasSelected = o.id === q.selectedOptionId;
                  return (
                    <div key={o.id} className={"text-sm px-3 py-1.5 rounded-lg mb-1 " + (o.isCorrect ? "bg-green-50 text-green-800" : wasSelected ? "bg-red-50 text-red-800" : "text-gray-600")}>
                      {o.text}{wasSelected ? " (your answer)" : ""}{o.isCorrect ? " (correct)" : ""}
                      {o.explanation && <div className="text-xs text-gray-500 mt-0.5">{o.explanation}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          {!result.attempt.passed && (
            <button onClick={loadQuiz} className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700">Retake quiz</button>
          )}
          <Link href={"/learn/" + slug + "/" + lessonId} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">
            Back to lesson
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href={"/learn/" + slug + "/" + lessonId} className="text-sm text-blue-600 hover:underline mb-4 inline-block">Back to lesson</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{quiz.title}</h1>
      <p className="text-sm text-gray-500 mb-6">Passing score: {quiz.passingScorePercent}%</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions.map(function (q, qi) {
          return (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="font-medium text-gray-900 mb-3">{qi + 1}. {q.text}</p>
              <div className="space-y-2">
                {q.options.map(function (o) {
                  return (
                    <label key={o.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="radio" name={q.id} required checked={answers[q.id] === o.id}
                        onChange={function () { setAnswers(Object.assign({}, answers, { [q.id]: o.id })); }} />
                      {o.text}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 text-white px-5 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit quiz"}
        </button>
      </form>
    </main>
  );
}

export default function QuizTakePage() {
  return <ProtectedRoute><QuizTakeContent /></ProtectedRoute>;
}
