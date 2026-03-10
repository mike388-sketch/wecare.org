import { Router } from "express";
import {
  createStudent,
  listStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateBody, validateObjectIdParam } from "../middleware/validate.js";
import { validateCreateStudent, validateUpdateStudent } from "../validators/studentValidators.js";

const router = Router();

router.use(authenticate);

router.post("/", authorize("health_provider"), validateBody(validateCreateStudent), createStudent);
router.get("/", listStudents);
router.get("/:id", validateObjectIdParam("id"), getStudentById);
router.patch(
  "/:id",
  authorize("health_provider"),
  validateObjectIdParam("id"),
  validateBody(validateUpdateStudent),
  updateStudent
);
router.delete("/:id", authorize("health_provider"), validateObjectIdParam("id"), deleteStudent);

export default router;
