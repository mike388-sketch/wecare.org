import { Router } from "express";
import authRoutes from "./authRoutes.js";
import studentRoutes from "./studentRoutes.js";
import healthRecordRoutes from "./healthRecordRoutes.js";
import userRoutes from "./userRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/health-records", healthRecordRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);

export default router;
