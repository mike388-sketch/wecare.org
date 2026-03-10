import crypto from "crypto";
import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAuthToken } from "../utils/token.js";
import { isPublicSignupRole, normalizeRole } from "../utils/roles.js";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "../utils/email.js";

function toPublicUser(userDoc) {
  return {
    id: userDoc._id.toString(),
    fullName: userDoc.fullName,
    email: userDoc.email,
    phoneNumber: userDoc.phoneNumber || "",
    role: normalizeRole(userDoc.role)
  };
}

function buildFrontendUrl(path, params = {}) {
  const url = new URL(path, env.frontendUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password, role } = req.body;

  if (!isPublicSignupRole(role)) {
    throw new AppError(
      "Parent and student accounts are created by the healthcare provider during student registration.",
      403
    );
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    phoneNumber,
    passwordHash,
    role: "health_provider"
  });

  const token = signAuthToken(user._id.toString(), normalizeRole(user.role));

  res.status(201).json({
    token,
    user: toPublicUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const normalizedRole = normalizeRole(user.role);
  const token = signAuthToken(user._id.toString(), normalizedRole);

  res.status(200).json({
    token,
    user: toPublicUser(user)
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("_id fullName email");

  if (!user) {
    return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.resetPasswordToken = tokenHash;
  user.resetPasswordExpires = new Date(Date.now() + env.resetTokenMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = buildFrontendUrl("/reset-password.html", { token: rawToken });

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      resetUrl
    });
  } catch (_error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Password reset email service is not configured.", 500);
  }

  return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() }
  }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json({ message: "Password updated. You can log in now." });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

export const oauthSuccess = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.redirect(buildFrontendUrl("/login.html", { error: "oauth_failed" }));
  }

  const normalizedRole = normalizeRole(req.user.role);
  const token = signAuthToken(req.user._id.toString(), normalizedRole);
  return res.redirect(buildFrontendUrl("/oauth-callback.html", { token }));
});

export const oauthNotConfigured = (providerName) => (_req, res) => {
  return res.redirect(
    buildFrontendUrl("/login.html", {
      error: `${providerName} OAuth is not configured yet.`
    })
  );
};
