const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "tillo_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  // In a deployed build with no backend address, "/api/..." would hit the website itself and get the
  // page's HTML back, which looks like a random failure. Fail loudly with a clear reason instead.
  if (!API_URL && import.meta.env.PROD) {
    const err = new Error("api_url_missing");
    err.status = 0;
    err.data = { error: "api_url_missing" };
    throw err;
  }
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (rare — 502s from proxies)
  }

  if (res.status === 401 && ["invalid_session", "access_expired"].includes(data?.error) && token) {
    // Session ended (logged out elsewhere, or the access period finished)
    clearToken();
    const reason = data.error === "access_expired" ? "expired" : "session";
    if (!window.location.pathname.startsWith("/login")) window.location.assign(`/login?reason=${reason}`);
  }

  if (!res.ok) {
    const err = new Error(data?.error || `http_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}