function isOptionalStringArray(value) {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasStudentAccount(value) {
  return (
    value &&
    typeof value === "object" &&
    hasText(value.fullName) &&
    hasText(value.email) &&
    hasText(value.phoneNumber) &&
    typeof value.password === "string" &&
    value.password.length >= 8 &&
    typeof value.confirmPassword === "string"
  );
}

function hasParentAccount(value) {
  return (
    value &&
    typeof value === "object" &&
    hasText(value.fullName) &&
    hasText(value.email) &&
    hasText(value.nationalId) &&
    hasText(value.phoneNumber) &&
    typeof value.password === "string" &&
    value.password.length >= 8 &&
    typeof value.confirmPassword === "string"
  );
}

export function validateCreateStudent(body) {
  const errors = [];

  if (!hasText(body.admissionNumber)) {
    errors.push("admissionNumber is required");
  }

  if (!hasText(body.fullName)) {
    errors.push("fullName is required");
  }

  if (!hasText(body.studentIdNumber)) {
    errors.push("studentIdNumber is required");
  }

  if (!hasText(body.upiNumber)) {
    errors.push("upiNumber is required");
  }

  if (!hasText(body.stream)) {
    errors.push("stream is required");
  }

  if (!hasText(body.dateOfBirth)) {
    errors.push("dateOfBirth is required");
  }

  if (!hasParentAccount(body.parentAccount)) {
    errors.push("parentAccount with fullName, email, nationalId, phoneNumber, and password(8+) is required");
  } else if (body.parentAccount.password !== body.parentAccount.confirmPassword) {
    errors.push("parentAccount passwords do not match");
  }

  if (!hasStudentAccount(body.studentAccount)) {
    errors.push("studentAccount with fullName, email, phoneNumber, and password(8+) is required");
  } else if (body.studentAccount.password !== body.studentAccount.confirmPassword) {
    errors.push("studentAccount passwords do not match");
  }

  if (!isOptionalStringArray(body.medicalIssues)) {
    errors.push("medicalIssues must be an array of strings");
  }

  return errors;
}

export function validateUpdateStudent(body) {
  const errors = [];

  if (body.admissionNumber !== undefined && typeof body.admissionNumber !== "string") {
    errors.push("admissionNumber must be a string");
  }

  if (body.fullName !== undefined && typeof body.fullName !== "string") {
    errors.push("fullName must be a string");
  }

  if (body.studentIdNumber !== undefined && typeof body.studentIdNumber !== "string") {
    errors.push("studentIdNumber must be a string");
  }

  if (body.upiNumber !== undefined && typeof body.upiNumber !== "string") {
    errors.push("upiNumber must be a string");
  }

  if (body.stream !== undefined && typeof body.stream !== "string") {
    errors.push("stream must be a string");
  }

  if (body.dateOfBirth !== undefined && typeof body.dateOfBirth !== "string") {
    errors.push("dateOfBirth must be a string");
  }

  if (!isOptionalStringArray(body.medicalIssues)) {
    errors.push("medicalIssues must be an array of strings");
  }

  return errors;
}
