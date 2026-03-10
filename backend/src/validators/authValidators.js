const ALLOWED_ROLES = ["health_provider", "parent", "student"];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateRegister(body) {
  const errors = [];

  if (!body.fullName || typeof body.fullName !== "string") {
    errors.push("fullName is required");
  }

  if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.push("A valid email is required");
  }

  if (!body.phoneNumber || typeof body.phoneNumber !== "string") {
    errors.push("phoneNumber is required");
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 8) {
    errors.push("password must be at least 8 characters");
  }

  if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
    errors.push("role is invalid");
  }

  return errors;
}

export function validateLogin(body) {
  const errors = [];

  if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.push("A valid email is required");
  }

  if (!body.password || typeof body.password !== "string") {
    errors.push("password is required");
  }

  return errors;
}

export function validateForgotPassword(body) {
  const errors = [];

  if (!body.email || typeof body.email !== "string" || !isValidEmail(body.email)) {
    errors.push("A valid email is required");
  }

  return errors;
}

export function validateResetPassword(body) {
  const errors = [];

  if (!body.token || typeof body.token !== "string") {
    errors.push("reset token is required");
  }

  if (!body.password || typeof body.password !== "string" || body.password.length < 8) {
    errors.push("password must be at least 8 characters");
  }

  if (!body.confirmPassword || body.confirmPassword !== body.password) {
    errors.push("confirmPassword must match password");
  }

  return errors;
}
