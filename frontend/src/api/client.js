const BASE_URL = import.meta.env.VITE_BASE_URL || "https://solve.ivy.homes";
const API_KEY = import.meta.env.VITE_API_KEY;

const SESSION_KEY = "ivy_session"; // { token, email, expiresAt }

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.token || Date.now() >= session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession({ token, email, expires_in }) {
  const session = { token, email, expiresAt: Date.now() + expires_in * 1000 };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || `Login failed (${res.status})`);
  // NOTE: confirm the real field name in the response — using access_token
  // per prior testing, but verify against an actual 200 response.
  const token = body.access_token ?? body.token;
  return saveSession({
    token,
    email: body.user?.email || email,
    expires_in: body.expires_in,
  });
}

export async function logout() {
  const session = getSession();
  if (session) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
          Authorization: `Bearer ${session.token}`,
        },
      });
    } catch {
      // best-effort; still clear locally
    }
  }
  clearSession();
}

// Generic authenticated GET/POST/DELETE against the API, with the API key
// sent as an X-API-Key header (confirmed via testing — docs say query param,
// docs are wrong; log this as a findings.json entry under category "auth").
export async function apiFetch(pathAndQuery, options = {}) {
  const session = getSession();
  const url = `${BASE_URL}${pathAndQuery}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(body.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// --- Domain helpers ---

export function fetchListings(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  ).toString();
  return apiFetch(`/v1/listings${qs ? `?${qs}` : ""}`);
}

export function fetchListing(id) {
  return apiFetch(`/v1/listings/${id}`);
}

export function fetchSimilarListings(id) {
  return apiFetch(`/v1/listings/${id}/similar`);
}

export function fetchRentals(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  ).toString();
  return apiFetch(`/v1/rentals${qs ? `?${qs}` : ""}`);
}

export function fetchProjects(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  ).toString();
  return apiFetch(`/v1/projects${qs ? `?${qs}` : ""}`);
}

export function fetchFavourites() {
  return apiFetch(`/v1/saved`);
}

export function addFavourite(id) {
  return apiFetch(`/v1/saved`, {
    method: "POST",
    body: JSON.stringify({ listing_id: id }),
  });
}

export function removeFavourite(id) {
  return apiFetch(`/v1/saved/${id}`, { method: "DELETE" });
}

export function fetchAnalyticsSummary() {
  return apiFetch(`/v1/analytics/summary`);
}
