import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateObjectIdParam } from "../middleware/validate.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id })
      .populate("student", "fullName admissionNumber")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  })
);

router.patch(
  "/:id/read",
  validateObjectIdParam("id"),
  asyncHandler(async (req, res) => {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json(updated);
  })
);

export default router;
