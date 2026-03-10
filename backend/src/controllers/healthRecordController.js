import { HealthRecord } from "../models/HealthRecord.js";
import { Student } from "../models/Student.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";

export const createHealthRecord = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.body.student).select("_id");
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const payload = {
    ...req.body,
    createdBy: req.user.id
  };

  const record = await HealthRecord.create(payload);
  res.status(201).json(record);
});

export const listHealthRecords = asyncHandler(async (req, res) => {
  const query = {};

  if (req.query.studentId) {
    query.student = req.query.studentId;
  }

  if (req.user.role === "health_provider") {
    // healthcare provider can view all records
  } else if (req.user.role === "parent") {
    const students = await Student.find({ parentUser: req.user.id }).select("_id");
    const ids = students.map((item) => item._id.toString());
    if (query.student && !ids.includes(String(query.student))) {
      throw new AppError("Forbidden", 403);
    }
    query.student = query.student || { $in: ids };
  } else if (req.user.role === "student") {
    const ownStudent = await Student.findOne({ studentUser: req.user.id }).select("_id");
    if (!ownStudent) {
      return res.status(200).json([]);
    }

    if (query.student && String(query.student) !== ownStudent._id.toString()) {
      throw new AppError("Forbidden", 403);
    }

    query.student = ownStudent._id;
  } else {
    throw new AppError("Forbidden", 403);
  }

  const records = await HealthRecord.find(query)
    .populate("student", "fullName admissionNumber stream")
    .populate("createdBy", "fullName email role")
    .sort({ recordDate: -1 });

  res.status(200).json(records);
});
