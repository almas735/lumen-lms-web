"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";

interface Notice { id: string; message: string; link: string | null; readAt: string | null; createdAt: string; }
interface Recommendation { id: string; title: string; slug: string; summary: string; level: string; }
interface StudentData {
  role: "STUDENT";
  hasEnrollments: boolean;
  stats: { coursesInProgress: number; coursesCompleted: number; lessonsLast7Days: number; quizzesPassed: number };
  continueLearning: { courseTitle: string; courseSlug: string; lessonId: string; lessonTitle: string; completedLessons: number; totalLessons: number } | null;
  activity: { date: string; studied: boolean }[];
  recommendations: Recommendation[];
  notifications: Notice[];
  unreadCount: number;
}
interface InstructorData {
  role: "INSTRUCTOR";
  stats: { coursesPublished: number; totalStudents: number; averageCompletion: number; quizPassRate: number | null };
  perCourse: { id: string; title: string; status: string; enrolledCount: number; averageProgress: number; completionCount: number }[];
  enrollmentsLast30Days: { date: string; count: number }[];
  inactiveStudents: { studentName: string; courseId: string; courseTitle: string; lastActiveAt: string }[];
  needsAttention: { id: string; title: string }[];
}
interface AdminData { role: "ADMIN"; userCount: number }
type DashboardData = StudentData | InstructorData | AdminData;

function utcDate(d: string, options: Intl.DateTimeFormatOptions) {
  return new Date(d + "T00:00:00Z").toLocaleDateString(undefined, Object.assign({ timeZone: "UTC" }, options));
}

function StatCard(props: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-2xl font-bold text-gray-900">{props.value}</div>
      <div className="text-xs text-gray-500">{props.label}</div>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Recommendations(props: { items: Recommendation[] }) {
  if (props.items.length === 0) return null;
  return (
    <Section title="Recommended for you">
      <div className="grid gap-3 md:grid-cols-3">
        {props.items.map(function (c) {
          return (
            <Link key={c.id} href={"/courses/" + c.slug} className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md">
              <span className="text-xs font-medium text-blue-700">{c.level}</span>
              <div className="mt-1 font-semibold text-gray-900">{c.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{c.summary}</p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

function StudentView(props: { data: StudentData; name: string }) {
  const d = props.data;
  if (!d.hasEnrollments) {
    return (
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Welcome to Lumen, {props.name}!</h2>
          <p className="mt-1 text-gray-600">You have not enrolled in a course yet. Browse the catalog and pick your first one.</p>
          <Link href="/courses" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">Browse the catalog</Link>
        </div>
        <Recommendations items={d.recommendations} />
      </div>
    );
  }
  const cl = d.continueLearning;
  const pct = cl && cl.totalLessons > 0 ? Math.round((cl.completedLessons / cl.totalLessons) * 100) : 0;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Courses in progress" value={d.stats.coursesInProgress} />
        <StatCard label="Courses completed" value={d.stats.coursesCompleted} />
        <StatCard label="Lessons this week" value={d.stats.lessonsLast7Days} />
        <StatCard label="Quizzes passed" value={d.stats.quizzesPassed} />
      </div>

      <Section title="Continue learning">
        {cl ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="font-semibold text-gray-900">{cl.courseTitle}</div>
            <div className="text-sm text-gray-600">Next up: {cl.lessonTitle}</div>
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: pct + "%" }}></div>
            </div>
            <div className="mt-1 text-xs text-gray-500">{cl.completedLessons} of {cl.totalLessons} lessons</div>
            <Link href={"/learn/" + cl.courseSlug + "/" + cl.lessonId} className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">Continue</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-600">
            You are all caught up. <Link href="/courses" className="text-blue-600 hover:underline">Find another course</Link>
          </div>
        )}
      </Section>

      <Section title="Your week">
        <ul className="flex gap-2" aria-label="Study activity for the last 7 days">
          {d.activity.map(function (a) {
            const day = utcDate(a.date, { weekday: "short" });
            return (
              <li key={a.date} className="text-center">
                <div className={"flex h-10 w-10 items-center justify-center rounded-lg text-sm " + (a.studied ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500")}>
                  {a.studied ? "\u2713" : ""}
                </div>
                <div className="mt-1 text-xs text-gray-500" aria-hidden="true">{day}</div>
                <span className="sr-only">{day}: {a.studied ? "studied" : "no activity"}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Recommendations items={d.recommendations} />

      <Section title="Recent notifications">
        {d.notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {d.notifications.map(function (n) {
              const text = (
                <span className={"block px-4 py-3 text-sm " + (n.readAt ? "text-gray-600" : "bg-blue-50 font-medium text-gray-900")}>
                  {!n.readAt && <span className="sr-only">Unread. </span>}
                  {n.message}
                </span>
              );
              return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-gray-50">{text}</Link> : text}</li>;
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function EnrollmentChart(props: { days: { date: string; count: number }[] }) {
  const days = props.days;
  const max = Math.max(1, ...days.map(function (d) { return d.count; }));
  const total = days.reduce(function (s, d) { return s + d.count; }, 0);
  const busiest = days.reduce(function (b, d) { return d.count > b.count ? d : b; }, days[0]);
  const summary = total === 0
    ? "No new enrollments in the last 30 days."
    : total + " new enrollments in the last 30 days. Busiest day: " + utcDate(busiest.date, { day: "numeric", month: "short" }) + " with " + busiest.count + ".";
  const active = days.filter(function (d) { return d.count > 0; });
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm text-gray-600">{summary}</p>
      <div role="img" aria-label={summary} className="flex h-32 items-end gap-1">
        {days.map(function (d) {
          return (
            <div
              key={d.date}
              title={utcDate(d.date, { day: "numeric", month: "short" }) + ": " + d.count}
              className={"flex-1 rounded-t " + (d.count > 0 ? "bg-blue-500" : "bg-gray-200")}
              style={{ height: d.count === 0 ? "2px" : Math.max(6, Math.round((d.count / max) * 100)) + "%" }}
            ></div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
        <span>{utcDate(days[0].date, { day: "numeric", month: "short" })}</span>
        <span>{utcDate(days[days.length - 1].date, { day: "numeric", month: "short" })}</span>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-blue-600">View as a table</summary>
        {active.length === 0 ? (
          <p className="mt-2 text-gray-500">No enrollments to list.</p>
        ) : (
          <table className="mt-2 w-full text-left">
            <thead><tr><th className="py-1 font-medium text-gray-600">Date</th><th className="py-1 font-medium text-gray-600">New enrollments</th></tr></thead>
            <tbody>
              {active.map(function (d) {
                return <tr key={d.date}><td className="py-1">{utcDate(d.date, { day: "numeric", month: "short", year: "numeric" })}</td><td className="py-1">{d.count}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </details>
    </div>
  );
}

function InstructorView(props: { data: InstructorData }) {
  const d = props.data;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Courses published" value={d.stats.coursesPublished} />
        <StatCard label="Total students" value={d.stats.totalStudents} />
        <StatCard label="Average completion" value={d.stats.averageCompletion + "%"} />
        <StatCard label="Quiz pass rate" value={d.stats.quizPassRate === null ? "No attempts yet" : d.stats.quizPassRate + "%"} />
      </div>

      <Section title="Your courses">
        {d.perCourse.length === 0 ? (
          <p className="text-sm text-gray-500">You have no courses yet. <Link href="/instructor/courses/new" className="text-blue-600 hover:underline">Create your first course</Link></p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                  <th className="px-4 py-3 font-medium">Avg progress</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.perCourse.map(function (c) {
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3"><Link href={"/instructor/courses/" + c.id + "/roster"} className="text-blue-600 hover:underline">{c.title}</Link></td>
                      <td className="px-4 py-3 text-gray-600">{c.status}</td>
                      <td className="px-4 py-3 text-gray-600">{c.enrolledCount}</td>
                      <td className="px-4 py-3 text-gray-600">{c.averageProgress}%</td>
                      <td className="px-4 py-3 text-gray-600">{c.completionCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="New enrollments, last 30 days">
        <EnrollmentChart days={d.enrollmentsLast30Days} />
      </Section>

      <Section title="Students inactive for 14+ days">
        {d.inactiveStudents.length === 0 ? (
          <p className="text-sm text-gray-500">Everyone has been active recently.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {d.inactiveStudents.map(function (s, i) {
              return (
                <li key={s.courseId + i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span className="text-gray-900">{s.studentName} <span className="text-gray-500">in</span> <Link href={"/instructor/courses/" + s.courseId + "/roster"} className="text-blue-600 hover:underline">{s.courseTitle}</Link></span>
                  <span className="text-amber-700">Last active {new Date(s.lastActiveAt).toLocaleDateString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Needs your attention">
        {d.needsAttention.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing needs attention right now.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {d.needsAttention.map(function (c) {
              return (
                <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-gray-900">{c.title} <span className="text-gray-500">is a draft with no lessons</span></span>
                  <Link href={"/instructor/courses/" + c.id + "/builder"} className="text-blue-600 hover:underline">Add content</Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

function AdminView(props: { data: AdminData }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard label="Users" value={props.data.userCount} />
      <Link href="/admin/users" className="flex items-center justify-center rounded-xl bg-blue-600 p-4 font-medium text-white hover:bg-blue-700">Manage users</Link>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError("");
    apiFetch("/api/dashboard")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("failed")); })
      .then(function (d) { setData(d); })
      .catch(function () { setError("Could not load your dashboard."); })
      .finally(function () { setLoading(false); });
  }
  useEffect(load, []);

  const firstName = user ? user.fullName.split(" ")[0] : "";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
      <p className="mb-6 text-sm text-gray-500">Signed in as {user ? user.role : ""}</p>
      {loading && <p className="text-gray-500">Loading your dashboard...</p>}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error} <button type="button" onClick={load} className="ml-2 underline">Try again</button>
        </div>
      )}
      {!loading && !error && data && data.role === "STUDENT" && <StudentView data={data} name={firstName} />}
      {!loading && !error && data && data.role === "INSTRUCTOR" && <InstructorView data={data} />}
      {!loading && !error && data && data.role === "ADMIN" && <AdminView data={data} />}
    </main>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
