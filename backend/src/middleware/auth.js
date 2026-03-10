import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeRole } from "../utils/roles.js";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await User.findById(payload.sub).select("_id fullName email role");
  if (!user) {
    throw new AppError("User not found", 401);
  }

  req.user = {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: normalizeRole(user.role)
  };

  next();
});

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
}
