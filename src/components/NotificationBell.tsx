"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api";

interface Notification {
  id: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(function () {
    apiFetch("/api/notifications/unread-count")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) setUnread(d.unreadCount); })
      .catch(function () { /* the next poll will try again */ });
  }, []);

  const loadList = useCallback(function () {
    setLoading(true);
    setError("");
    apiFetch("/api/notifications")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("failed")); })
      .then(function (d) { setItems(d.data); setUnread(d.unreadCount); })
      .catch(function () { setError("Could not load notifications."); })
      .finally(function () { setLoading(false); });
  }, []);

  useEffect(function () {
    loadCount();
    const timer = setInterval(loadCount, 60000);
    return function () { clearInterval(timer); };
  }, [loadCount]);

  useEffect(function () {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return function () {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function openItem(n: Notification) {
    if (!n.readAt) {
      await apiFetch("/api/notifications/" + n.id + "/read", { method: "POST" });
      setItems(items.map(function (x) { return x.id === n.id ? Object.assign({}, x, { readAt: new Date().toISOString() }) : x; }));
      setUnread(Math.max(0, unread - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    await apiFetch("/api/notifications/read-all", { method: "POST" });
    setItems(items.map(function (x) { return x.readAt ? x : Object.assign({}, x, { readAt: new Date().toISOString() }); }));
    setUnread(0);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-label={"Notifications, " + unread + " unread"}
        className="relative rounded-lg p-2 text-gray-700 hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div id="notification-panel" className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <button type="button" onClick={markAll} disabled={unread === 0} className="text-xs text-blue-600 hover:underline disabled:no-underline disabled:opacity-40">
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>}
            {!loading && error && <p className="px-4 py-6 text-sm text-red-600">{error}</p>}
            {!loading && !error && items.length === 0 && <p className="px-4 py-6 text-sm text-gray-500">You have no notifications yet.</p>}
            {!loading && !error && items.map(function (n) {
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={function () { openItem(n); }}
                  className={"block w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 " + (n.readAt ? "" : "bg-blue-50")}
                >
                  <span className={"block text-sm " + (n.readAt ? "text-gray-600" : "font-medium text-gray-900")}>
                    {!n.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600" aria-hidden="true"></span>}
                    {!n.readAt && <span className="sr-only">Unread. </span>}
                    {n.message}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
