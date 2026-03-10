import { Router } from "express";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("health_provider"),
  asyncHandler(async (_req, res) => {
    const users = await User.find().select("fullName email phoneNumber role createdAt").sort({ createdAt: -1 });
    res.status(200).json(users);
  })
);

export default router;
