const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(API_URL + "/api/auth/refresh", { method: "POST", credentials: "include" })
      .then(function (res) { return res.ok; })
      .finally(function () { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = function () {
    return fetch(API_URL + path, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  };

  let res = await doFetch();
  const isAuthEndpoint = path === "/api/auth/refresh" || path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/me";
  if (res.status === 401 && !isAuthEndpoint) {
    const refreshed = await doRefresh();
    if (refreshed) {
      res = await doFetch();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:expired"));
    }
  }
  return res;
}
