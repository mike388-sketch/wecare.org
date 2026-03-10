import { Router } from "express";
import { createHealthRecord, listHealthRecords } from "../controllers/healthRecordController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { validateCreateHealthRecord } from "../validators/healthRecordValidators.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("health_provider"), validateBody(validateCreateHealthRecord), createHealthRecord);
router.get("/", listHealthRecords);

export default router;
