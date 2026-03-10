import { request, setSession } from "./api.js";

const noticeEl = document.getElementById("notice");

function setMessage(text, type = "ok") {
  noticeEl.className = `notice show ${type}`;
  noticeEl.textContent = text;
}

async function run() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const error = params.get("error");

  if (error) {
    setMessage(error, "error");
    return;
  }

  if (!token) {
    setMessage("OAuth token is missing.", "error");
    return;
  }

  try {
    setSession(token, null);
    const me = await request("/auth/me");
    setSession(token, me.user);
    setMessage("Login complete. Redirecting to dashboard...");
    window.setTimeout(() => {
      window.location.replace("/dashboard.html");
    }, 300);
  } catch (err) {
    setMessage(err.message, "error");
  }
}

void run();