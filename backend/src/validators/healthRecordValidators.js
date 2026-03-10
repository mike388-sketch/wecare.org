export function validateCreateHealthRecord(body) {
  const errors = [];

  if (!body.student || typeof body.student !== "string") {
    errors.push("student is required and must be an object id string");
  }

  if (body.symptoms !== undefined && (!Array.isArray(body.symptoms) || body.symptoms.some((s) => typeof s !== "string"))) {
    errors.push("symptoms must be an array of strings");
  }

  const stringFields = ["diagnosis", "notes", "actionTaken"];
  for (const field of stringFields) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      errors.push(`${field} must be a string`);
    }
  }

  if (body.followUpDate !== undefined && Number.isNaN(Date.parse(body.followUpDate))) {
    errors.push("followUpDate must be a valid date");
  }

  return errors;
}
