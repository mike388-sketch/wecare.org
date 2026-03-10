import { getApiRoot, guardAuthPage, request, setNotice, setSession } from "./api.js";

guardAuthPage();

const noticeEl = document.getElementById("notice");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

function showError(message) {
  if (!noticeEl) {
    return;
  }
  setNotice(noticeEl, message, "error");
}

function showSuccess(message) {
  if (!noticeEl) {
    return;
  }
  setNotice(noticeEl, message, "ok");
}

async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "")
  };

  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: payload,
      auth: false
    });

    setSession(result.token, result.user);
    showSuccess("Login successful. Redirecting...");
    window.setTimeout(() => {
      window.location.replace("/dashboard.html");
    }, 350);
  } catch (error) {
    showError(error.message);
  }
}

async function handleSignup(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phoneNumber = document.getElementById("phoneNumber").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    showError("Passwords do not match.");
    return;
  }

  try {
    const result = await request("/auth/register", {
      method: "POST",
      body: {
        fullName,
        email,
        phoneNumber,
        password,
        role: "health_provider"
      },
      auth: false
    });

    setSession(result.token, result.user);
    showSuccess("Account created. Redirecting to dashboard...");
    window.setTimeout(() => {
      window.location.replace("/dashboard.html");
    }, 350);
  } catch (error) {
    showError(error.message);
  }
}

async function loadOauthProviders() {
  const target = document.getElementById("oauthProviders");
  if (!target) {
    return;
  }

  try {
    const providers = await request("/auth/oauth/providers", { auth: false });
    const entries = Object.entries(providers).filter(([, enabled]) => Boolean(enabled));

    if (!entries.length) {
      target.innerHTML = '<span class="helper">No OAuth provider configured yet.</span>';
      return;
    }

    const providerLabels = {
      google: "Google",
      github: "GitHub",
      microsoft: "Microsoft",
      apple: "Apple"
    };

    target.innerHTML = "";
    entries.forEach(([name]) => {
      const link = document.createElement("a");
      link.href = `${getApiRoot()}/auth/oauth/${name}`;
      link.className = "oauth-btn";
      link.textContent = `Continue with ${providerLabels[name] || name}`;
      target.appendChild(link);
    });
  } catch (_error) {
    target.innerHTML = '<span class="helper">Unable to load OAuth providers.</span>';
  }
}

function showQueryErrorIfAny() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("error");
  if (message) {
    showError(message);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
  void loadOauthProviders();
  showQueryErrorIfAny();
}

if (signupForm) {
  signupForm.addEventListener("submit", handleSignup);
}
