const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const CONNECTION_MESSAGE = "We are having trouble connecting. Please check your connection and try again.";

type RefreshResult = "ok" | "denied" | "offline";
let refreshPromise: Promise<RefreshResult> | null = null;

// When the API cannot be reached at all, return a normal-looking 503 response instead of throwing,
// so every page can show a sentence and a retry instead of crashing or hanging.
function connectionProblem(): Response {
  return new Response(JSON.stringify({ error: { code: "NETWORK_ERROR", message: CONNECTION_MESSAGE } }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

async function doRefresh(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = fetch(API_URL + "/api/auth/refresh", { method: "POST", credentials: "include" })
      .then(function (res): RefreshResult { return res.ok ? "ok" : "denied"; })
      .catch(function (): RefreshResult { return "offline"; })
      .finally(function () { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = function (): Promise<Response> {
    return fetch(API_URL + path, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) } })
      .catch(function () { return connectionProblem(); });
  };

  let res = await doFetch();
  const isAuthEndpoint = path === "/api/auth/refresh" || path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/me";
  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await doRefresh();
    if (refreshed === "ok") {
      res = await doFetch();
    } else if (refreshed === "offline") {
      res = connectionProblem();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:expired"));
    }
  }
  return res;
}
