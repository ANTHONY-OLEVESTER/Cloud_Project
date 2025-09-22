const DEFAULT_API = "http://localhost:8000/api";
const PRODUCTION_API = "https://cloudproject-production-55e3.up.railway.app/api";

// Use environment variable, fallback to production URL if in production mode, otherwise localhost
// Updated for GitHub Pages deployment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_API;
  }

  return DEFAULT_API;
};

const API_BASE_URL = getApiUrl().replace(/\/$/, "");

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${API_BASE_URL}/`;
  return new URL(normalizedPath, base).toString();
}

async function request(path, options = {}) {
  const token = window.localStorage?.getItem("cloud_guard_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token && !("Authorization" in headers)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - clear token and redirect to login (but not for auth endpoints)
    if (response.status === 401 && !path.includes('/auth/')) {
      window.localStorage.removeItem("cloud_guard_token");
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        const basePath = import.meta.env.PROD ? '/Cloud_Project' : '';
        window.location.href = `${basePath}/login`;
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.detail ?? "Request failed");
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
