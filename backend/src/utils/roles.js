const LEGACY_TO_NEW_ROLE = {
  admin: "health_provider",
  doctor: "health_provider",
  nurse: "health_provider",
  teacher: "health_provider"
};

export function normalizeRole(role) {
  if (!role) {
    return role;
  }

  return LEGACY_TO_NEW_ROLE[role] || role;
}

export function isPublicSignupRole(role) {
  return role === "health_provider";
}
