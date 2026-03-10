import {
  clearSession,
  getToken,
  getUser,
  guardDashboardPage,
  parseList,
  request,
  roleLabel,
  setNotice,
  setSession,
  severityTag,
  toDateLabel
} from "./api.js";

guardDashboardPage();

const state = {
  user: getUser(),
  students: [],
  records: [],
  notifications: [],
  health: null
};

const userChip = document.getElementById("userChip");
const globalNotice = document.getElementById("globalNotice");
const providerSection = document.getElementById("providerSection");
const roleHeading = document.getElementById("roleHeading");

const statStudents = document.getElementById("statStudents");
const statRisk = document.getElementById("statRisk");
const statRecords = document.getElementById("statRecords");
const statAlerts = document.getElementById("statAlerts");

const apiStatus = document.getElementById("apiStatus");
const dbStatus = document.getElementById("dbStatus");
const scopeStatus = document.getElementById("scopeStatus");

const studentRows = document.getElementById("studentRows");
const recordList = document.getElementById("recordList");
const noticeList = document.getElementById("noticeList");
const trendBars = document.getElementById("trendBars");

const studentForm = document.getElementById("studentForm");
const recordForm = document.getElementById("recordForm");
const recordStudent = document.getElementById("recordStudent");
const editStudentCard = document.getElementById("editStudentCard");
const editStudentForm = document.getElementById("editStudentForm");
const editStudentId = document.getElementById("editStudentId");
const editStudentLabel = document.getElementById("editStudentLabel");
const cancelEditStudent = document.getElementById("cancelEditStudent");
const studentFormCard = studentForm ? studentForm.closest("article") : null;
const studentStepIndicators = studentFormCard
  ? [...studentFormCard.querySelectorAll("[data-step-indicator]")]
  : [];
const studentSteps = studentForm ? [...studentForm.querySelectorAll(".form-step")] : [];
const studentPasswordPairs = [
  { passwordId: "studentPassword", confirmId: "studentPasswordConfirm", label: "Student password" },
  { passwordId: "parentPassword", confirmId: "parentPasswordConfirm", label: "Parent password" }
];
let currentStudentStep = 1;
const noneTokens = ["none", "no", "n/a", "na", "nil"];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showGlobal(message, type = "ok") {
  if (!globalNotice) {
    return;
  }
  setNotice(globalNotice, message, type);
}

function normalizeMedicalIssues(rawValue) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return [];
  }

  return parseList(rawValue).filter((item) => {
    const normalized = item.trim().toLowerCase();
    return normalized && !noneTokens.includes(normalized);
  });
}

function getStepFields(stepElement) {
  return [...stepElement.querySelectorAll("input, select, textarea")];
}

function enableAllStudentFields() {
  studentSteps.forEach((stepElement) => {
    getStepFields(stepElement).forEach((field) => {
      field.disabled = false;
    });
  });
}

function syncStudentPasswordPairs() {
  studentPasswordPairs.forEach(({ passwordId, confirmId, label }) => {
    const passwordEl = document.getElementById(passwordId);
    const confirmEl = document.getElementById(confirmId);
    if (!passwordEl || !confirmEl) {
      return;
    }

    if (!confirmEl.value) {
      confirmEl.setCustomValidity("");
      return;
    }

    const matches = passwordEl.value === confirmEl.value;
    confirmEl.setCustomValidity(matches ? "" : `${label} does not match`);
  });
}

function setStudentStep(step) {
  if (!studentSteps.length) {
    return;
  }

  currentStudentStep = step;
  studentSteps.forEach((stepElement) => {
    const isActive = Number(stepElement.dataset.step) === step;
    stepElement.hidden = !isActive;
    stepElement.setAttribute("aria-hidden", String(!isActive));
    getStepFields(stepElement).forEach((field) => {
      field.disabled = !isActive;
    });
  });

  studentStepIndicators.forEach((indicator) => {
    const indicatorStep = Number(indicator.dataset.stepIndicator);
    indicator.classList.toggle("active", indicatorStep === step);
    indicator.classList.toggle("complete", indicatorStep < step);
  });
}

function toggleProviderOnlyElements() {
  const isProvider = state.user?.role === "health_provider";
  document.querySelectorAll(".provider-only").forEach((element) => {
    element.classList.toggle("hide", !isProvider);
  });
}

function getStudentIssues(student) {
  const legacyIssues = [...(student.allergies || []), ...(student.chronicConditions || [])];
  const issues = student.medicalIssues?.length ? student.medicalIssues : legacyIssues;
  return issues.filter((item) => {
    const normalized = String(item || "").trim().toLowerCase();
    return normalized && !noneTokens.includes(normalized);
  });
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showEditStudent(student) {
  if (!editStudentCard || !editStudentForm || !editStudentId) {
    return;
  }

  editStudentId.value = student._id;
  if (editStudentLabel) {
    editStudentLabel.textContent = `Editing: ${student.fullName} (${student.admissionNumber})`;
  }

  document.getElementById("editStudentFullName").value = student.fullName || "";
  document.getElementById("editAdmissionNumber").value = student.admissionNumber || "";
  document.getElementById("editStudentIdNumber").value = student.studentIdNumber || "";
  document.getElementById("editUpiNumber").value = student.upiNumber || "";
  document.getElementById("editStream").value = student.stream || student.className || "";
  document.getElementById("editDateOfBirth").value = formatDateForInput(student.dateOfBirth);

  const issues = getStudentIssues(student);
  document.getElementById("editMedicalIssues").value = issues.length ? issues.join(", ") : "None";

  editStudentCard.classList.remove("hide");
  editStudentCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideEditStudent() {
  if (!editStudentCard || !editStudentForm || !editStudentId) {
    return;
  }

  editStudentForm.reset();
  editStudentId.value = "";
  if (editStudentLabel) {
    editStudentLabel.textContent = "Select Edit on a student to update details.";
  }
  editStudentCard.classList.add("hide");
}

function roleScopeDescription(role) {
  if (role === "health_provider") {
    return "Full school-wide scope: records, onboarding, and incident management.";
  }
  if (role === "parent") {
    return "Parent scope: access your linked child records and notifications.";
  }
  if (role === "student") {
    return "Student scope: view personal health records and notifications.";
  }
  return "Limited scope";
}

function applyRoleTheme(role) {
  const body = document.body;
  if (!body) {
    return;
  }

  body.classList.remove("role-health_provider", "role-parent", "role-student");
  if (role) {
    body.classList.add(`role-${role}`);
  }

  if (roleHeading) {
    roleHeading.textContent = role ? `${roleLabel(role)} Workspace` : "Dashboard";
  }
}

function applyRoleLinks(role) {
  const links = document.querySelectorAll(".sidebar-nav [data-roles]");
  if (!links.length) {
    return;
  }

  links.forEach((link) => {
    const roles = (link.dataset.roles || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const allowed = role ? roles.includes(role) : false;
    link.classList.toggle("hide", !allowed);

    if (!allowed) {
      return;
    }

    if (role === "health_provider" && link.dataset.labelProvider) {
      link.textContent = link.dataset.labelProvider;
    } else if (role === "parent" && link.dataset.labelParent) {
      link.textContent = link.dataset.labelParent;
    } else if (role === "student" && link.dataset.labelStudent) {
      link.textContent = link.dataset.labelStudent;
    }
  });
}

function wireTopActions() {
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!refreshBtn || !logoutBtn) {
    return;
  }

  refreshBtn.addEventListener("click", () => {
    void loadDashboard();
  });

  logoutBtn.addEventListener("click", () => {
    clearSession();
    window.location.replace("/index.html");
  });
}

function wireStudentStepControls() {
  if (!studentForm || !studentSteps.length) {
    return;
  }

  studentForm.addEventListener("click", (event) => {
    const nextBtn = event.target.closest("[data-step-next]");
    const backBtn = event.target.closest("[data-step-back]");

    if (nextBtn) {
      syncStudentPasswordPairs();
      if (!studentForm.reportValidity()) {
        return;
      }
      setStudentStep(Math.min(currentStudentStep + 1, studentSteps.length));
    }

    if (backBtn) {
      setStudentStep(Math.max(currentStudentStep - 1, 1));
    }
  });

  studentPasswordPairs.forEach(({ passwordId, confirmId }) => {
    const passwordEl = document.getElementById(passwordId);
    const confirmEl = document.getElementById(confirmId);
    if (!passwordEl || !confirmEl) {
      return;
    }

    const handler = () => syncStudentPasswordPairs();
    passwordEl.addEventListener("input", handler);
    confirmEl.addEventListener("input", handler);
  });

  setStudentStep(1);
}

function renderHeader() {
  const user = state.user;
  if (!userChip || !scopeStatus) {
    return;
  }
  if (!user) {
    userChip.textContent = "Unknown user";
    scopeStatus.textContent = "Access scope unavailable.";
    scopeStatus.classList.add("hide");
    applyRoleTheme(null);
    if (providerSection) {
      providerSection.classList.add("hide");
    }
    toggleProviderOnlyElements();
    return;
  }
  userChip.textContent = escapeHtml(user.fullName);
  scopeStatus.textContent = "";
  scopeStatus.classList.add("hide");
  if (roleHeading) {
    roleHeading.textContent = user.fullName;
  }
  applyRoleTheme(user.role);
  applyRoleLinks(user.role);
  if (providerSection) {
    providerSection.classList.toggle("hide", user.role !== "health_provider");
  }
  toggleProviderOnlyElements();
}

function renderStats() {
  if (!statStudents || !statRisk || !statRecords || !statAlerts) {
    return;
  }

  const riskCount = state.students.filter((student) => severityTag(student) !== "low").length;
  const last30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentCount = state.records.filter((record) => {
    const date = new Date(record.recordDate).getTime();
    return Number.isFinite(date) && date >= last30;
  }).length;
  const unread = state.notifications.filter((item) => !item.isRead).length;

  statStudents.textContent = String(state.students.length);
  statRisk.textContent = String(riskCount);
  statRecords.textContent = String(recentCount);
  statAlerts.textContent = String(unread);
}

function renderSystemHealth() {
  if (!apiStatus || !dbStatus) {
    return;
  }

  if (!state.health) {
    apiStatus.textContent = "Unavailable";
    dbStatus.textContent = "Unavailable";
    return;
  }

  apiStatus.textContent = state.health.status === "ok" ? "Operational" : "Issue detected";
  dbStatus.textContent = state.health.database || "unknown";
}

function renderStudents() {
  if (!studentRows) {
    return;
  }

  const isProvider = state.user?.role === "health_provider";
  const colSpan = isProvider ? 6 : 5;

  if (!state.students.length) {
    studentRows.innerHTML = `<tr><td colspan="${colSpan}">No students available for this account.</td></tr>`;
    return;
  }

  studentRows.innerHTML = state.students
    .map((student) => {
      const risk = severityTag(student);
      const stream = student.stream || student.className || "";
      const cleanedIssues = getStudentIssues(student);
      const issuesLabel = cleanedIssues.length ? cleanedIssues.join(", ") : "None";
      const actionCell = `
        <td class="provider-only">
          <div class="table-actions">
            <button class="btn btn-secondary" type="button" data-student-action="edit" data-student-id="${escapeHtml(
              student._id
            )}">Edit</button>
            <button class="btn btn-danger" type="button" data-student-action="delete" data-student-id="${escapeHtml(
              student._id
            )}">Delete</button>
          </div>
        </td>`;
      return `
      <tr>
        <td>${escapeHtml(student.admissionNumber)}</td>
        <td>${escapeHtml(student.fullName)}</td>
        <td>${escapeHtml(stream)}</td>
        <td>${escapeHtml(issuesLabel)}</td>
        <td><span class="badge ${risk}">${risk.toUpperCase()}</span></td>
        ${actionCell}
      </tr>`;
    })
    .join("");

  toggleProviderOnlyElements();
}

function renderRecords() {
  if (!recordList) {
    return;
  }

  if (!state.records.length) {
    recordList.innerHTML = '<div class="record-item">No health incidents have been recorded yet.</div>';
    return;
  }

  recordList.innerHTML = state.records
    .slice(0, 10)
    .map((record) => {
      const studentName =
        record.student && typeof record.student === "object" && record.student.fullName
          ? record.student.fullName
          : "Unknown student";
      const diagnosis = record.diagnosis || "Not specified";
      const symptoms = (record.symptoms || []).join(", ") || "No symptoms listed";

      return `
        <article class="record-item">
          <strong>${escapeHtml(studentName)}</strong>
          <div>${escapeHtml(diagnosis)}</div>
          <div class="record-meta">Symptoms: ${escapeHtml(symptoms)}</div>
          <div class="record-meta">Recorded: ${escapeHtml(toDateLabel(record.recordDate))}</div>
        </article>
      `;
    })
    .join("");
}

function wireNoticeActions() {
  if (!noticeList) {
    return;
  }

  noticeList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-notice-id]");
    if (!button) {
      return;
    }

    const id = button.getAttribute("data-notice-id");

    try {
      await request(`/notifications/${id}/read`, { method: "PATCH" });
      state.notifications = state.notifications.map((item) =>
        item._id === id ? { ...item, isRead: true } : item
      );
      renderNotifications();
      renderStats();
    } catch (error) {
      showGlobal(error.message, "error");
    }
  });
}

function renderNotifications() {
  if (!noticeList) {
    return;
  }

  if (!state.notifications.length) {
    noticeList.innerHTML = '<div class="notice-item">No notifications available.</div>';
    return;
  }

  noticeList.innerHTML = state.notifications
    .slice(0, 12)
    .map((note) => {
      const badge = note.isRead ? "Read" : "Unread";
      const action = note.isRead
        ? ""
        : `<button class="btn btn-secondary" data-notice-id="${escapeHtml(note._id)}" type="button">Mark Read</button>`;
      const student = note.student?.fullName ? `Student: ${note.student.fullName}` : "General";

      return `
        <article class="notice-item">
          <strong>${escapeHtml(note.title || "Notification")}</strong>
          <div>${escapeHtml(note.message || "")}</div>
          <div class="notice-meta">${escapeHtml(student)} | ${escapeHtml(toDateLabel(note.createdAt))} | ${badge}</div>
          <div style="margin-top: 8px;">${action}</div>
        </article>
      `;
    })
    .join("");
}

function renderTrends() {
  if (!trendBars) {
    return;
  }

  if (!state.records.length) {
    trendBars.innerHTML = '<div class="record-item">Trend data appears when incidents are recorded.</div>';
    return;
  }

  const counts = new Map();
  state.records.forEach((record) => {
    const key = (record.diagnosis || "Undiagnosed").trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = top[0]?.[1] || 1;

  trendBars.innerHTML = top
    .map(([label, value]) => {
      const width = Math.max(8, Math.round((value / max) * 100));
      return `
        <div class="bar-item">
          <span>${escapeHtml(label)}</span>
          <div class="bar"><span style="width: ${width}%;"></span></div>
          <strong>${value}</strong>
        </div>
      `;
    })
    .join("");
}

function populateStudentSelect() {
  if (!recordStudent) {
    return;
  }

  recordStudent.innerHTML = "";

  if (!state.students.length) {
    const option = document.createElement("option");
    option.textContent = "No students available";
    option.value = "";
    recordStudent.appendChild(option);
    return;
  }

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student._id;
    option.textContent = `${student.fullName} (${student.admissionNumber})`;
    recordStudent.appendChild(option);
  });
}

async function submitStudentForm(event) {
  event.preventDefault();

  if (!studentForm) {
    return;
  }

  const previousStep = currentStudentStep;
  if (studentSteps.length) {
    enableAllStudentFields();
  }
  syncStudentPasswordPairs();

  const invalidField = studentForm.querySelector(":invalid");
  if (invalidField) {
    invalidField.reportValidity();
    const stepElement = invalidField.closest(".form-step");
    if (stepElement) {
      setStudentStep(Number(stepElement.dataset.step));
    } else if (studentSteps.length) {
      setStudentStep(previousStep);
    }
    return;
  }

  if (studentSteps.length) {
    setStudentStep(previousStep);
  }

  const studentFullName = document.getElementById("studentFullName").value.trim();
  const medicalIssues = normalizeMedicalIssues(document.getElementById("medicalIssues").value);

  const payload = {
    admissionNumber: document.getElementById("admissionNumber").value.trim(),
    fullName: studentFullName,
    studentIdNumber: document.getElementById("studentIdNumber").value.trim(),
    upiNumber: document.getElementById("upiNumber").value.trim(),
    stream: document.getElementById("stream").value.trim(),
    dateOfBirth: document.getElementById("dateOfBirth").value || undefined,
    medicalIssues,
    parentAccount: {
      fullName: document.getElementById("parentName").value.trim(),
      email: document.getElementById("parentEmail").value.trim(),
      nationalId: document.getElementById("parentNationalId").value.trim(),
      password: document.getElementById("parentPassword").value,
      confirmPassword: document.getElementById("parentPasswordConfirm").value,
      phoneNumber: document.getElementById("parentPhone").value.trim()
    },
    studentAccount: {
      fullName: studentFullName,
      email: document.getElementById("studentEmail").value.trim(),
      password: document.getElementById("studentPassword").value,
      confirmPassword: document.getElementById("studentPasswordConfirm").value,
      phoneNumber: document.getElementById("studentPhone").value.trim()
    }
  };

  try {
    await request("/students", { method: "POST", body: payload });
    showGlobal("Student profile and linked accounts created.", "ok");
    if (studentSteps.length) {
      enableAllStudentFields();
    }
    studentForm.reset();
    syncStudentPasswordPairs();
    if (studentSteps.length) {
      setStudentStep(1);
    }
    await loadDashboard();
  } catch (error) {
    showGlobal(error.message, "error");
  }
}

async function submitEditStudentForm(event) {
  event.preventDefault();

  if (!editStudentForm || !editStudentId) {
    return;
  }

  const studentId = editStudentId.value;
  if (!studentId) {
    showGlobal("Select a student to edit first.", "error");
    return;
  }

  const payload = {
    admissionNumber: document.getElementById("editAdmissionNumber").value.trim(),
    fullName: document.getElementById("editStudentFullName").value.trim(),
    studentIdNumber: document.getElementById("editStudentIdNumber").value.trim(),
    upiNumber: document.getElementById("editUpiNumber").value.trim(),
    stream: document.getElementById("editStream").value.trim(),
    dateOfBirth: document.getElementById("editDateOfBirth").value || undefined,
    medicalIssues: normalizeMedicalIssues(document.getElementById("editMedicalIssues").value)
  };

  try {
    await request(`/students/${studentId}`, { method: "PATCH", body: payload });
    showGlobal("Student profile updated.", "ok");
    hideEditStudent();
    await loadDashboard();
  } catch (error) {
    showGlobal(error.message, "error");
  }
}

async function submitRecordForm(event) {
  event.preventDefault();

  const payload = {
    student: recordStudent.value,
    symptoms: parseList(document.getElementById("symptoms").value),
    diagnosis: document.getElementById("diagnosis").value.trim() || undefined,
    actionTaken: document.getElementById("actionTaken").value.trim() || undefined,
    notes: document.getElementById("notes").value.trim() || undefined,
    followUpDate: document.getElementById("followUpDate").value || undefined
  };

  if (!payload.student) {
    showGlobal("Select a student before submitting an incident.", "error");
    return;
  }

  try {
    await request("/health-records", { method: "POST", body: payload });
    showGlobal("Health incident submitted successfully.", "ok");
    recordForm.reset();
    await loadDashboard();
  } catch (error) {
    showGlobal(error.message, "error");
  }
}

function wireProviderForms() {
  if (studentForm) {
    wireStudentStepControls();
    studentForm.addEventListener("submit", (event) => {
      void submitStudentForm(event);
    });
  }

  if (recordForm) {
    recordForm.addEventListener("submit", (event) => {
      void submitRecordForm(event);
    });
  }
}

function wireStudentActions() {
  if (studentRows) {
    studentRows.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-student-action]");
      if (!button) {
        return;
      }

      const action = button.getAttribute("data-student-action");
      const studentId = button.getAttribute("data-student-id");
      const student = state.students.find((item) => item._id === studentId);

      if (!student) {
        showGlobal("Student not found in the current list.", "error");
        return;
      }

      if (action === "edit") {
        showEditStudent(student);
        return;
      }

      if (action === "delete") {
        const ok = window.confirm(
          `Delete ${student.fullName} (${student.admissionNumber})? This cannot be undone.`
        );
        if (!ok) {
          return;
        }

        try {
          await request(`/students/${studentId}`, { method: "DELETE" });
          showGlobal("Student deleted.", "ok");
          hideEditStudent();
          await loadDashboard();
        } catch (error) {
          showGlobal(error.message, "error");
        }
      }
    });
  }

  if (cancelEditStudent) {
    cancelEditStudent.addEventListener("click", () => {
      hideEditStudent();
    });
  }

  if (editStudentForm) {
    editStudentForm.addEventListener("submit", (event) => {
      void submitEditStudentForm(event);
    });
  }
}

async function loadUser() {
  const me = await request("/auth/me");
  state.user = me.user;
  setSession(getToken(), state.user);
}

async function loadDashboard() {
  try {
    await loadUser();

    const [students, records, notifications, health] = await Promise.all([
      request("/students"),
      request("/health-records"),
      request("/notifications"),
      request("/health", { auth: false })
    ]);

    state.students = students;
    state.records = records;
    state.notifications = notifications;
    state.health = health;

    renderHeader();
    renderStats();
    renderSystemHealth();
    renderStudents();
    renderRecords();
    renderNotifications();
    renderTrends();

    if (state.user.role === "health_provider") {
      populateStudentSelect();
    }
  } catch (error) {
    if (error.message.includes("logged in") || error.message.includes("Invalid") || error.message.includes("Authentication")) {
      clearSession();
      window.location.replace("/index.html");
      return;
    }

    showGlobal(error.message, "error");
  }
}

wireTopActions();
wireNoticeActions();
wireProviderForms();
wireStudentActions();
void loadDashboard();
