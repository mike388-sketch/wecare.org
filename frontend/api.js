function normalizeApiRoot(value) {
  if (!value) {
    return "";
  }
  const trimmed = value.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function readMetaApiRoot() {
  if (typeof document === "undefined") {
    return "";
  }
  const meta = document.querySelector('meta[name="wecare-api-root"]');
  return meta?.content || "";
}

export function getApiRoot() {
  if (typeof window !== "undefined" && window.WECARE_API_ROOT) {
    return normalizeApiRoot(window.WECARE_API_ROOT);
  }

  const metaValue = readMetaApiRoot();
  if (metaValue) {
    return normalizeApiRoot(metaValue);
  }

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${host}:5000/api`;
}

const API_ROOT = getApiRoot();
const TOKEN_KEY = "wecare_token";
const USER_KEY = "wecare_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function setSession(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new Error("You are not logged in.");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (_error) {
    throw new Error(`Unable to reach backend at ${API_ROOT}. Ensure backend is running.`);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload;
}

export function parseList(value) {
  if (!value || !value.trim()) {
    return [];
  }
  return value
    .split(/[,\\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toDateLabel(dateString) {
  if (!dateString) {
    return "N/A";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

export function roleLabel(role) {
  if (!role) {
    return "Unknown";
  }

  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function guardAuthPage() {
  if (getToken()) {
    window.location.replace("/dashboard.html");
  }
}

export function guardDashboardPage() {
  if (!getToken()) {
    window.location.replace("/login.html");
  }
}

export function setNotice(element, message, type = "ok") {
  element.className = `notice show ${type}`;
  element.textContent = message;
}

export function severityTag(student) {
  const combined = [
    ...(student.medicalIssues || []),
    ...(student.allergies || []),
    ...(student.chronicConditions || [])
  ];
  const issues = combined.filter((item) => {
    const normalized = String(item || "").trim().toLowerCase();
    return normalized && !["none", "no", "n/a", "na", "nil"].includes(normalized);
  });
  const riskScore = issues.length;
  if (riskScore >= 3) {
    return "high";
  }
  if (riskScore >= 1) {
    return "medium";
  }
  return "low";
}
