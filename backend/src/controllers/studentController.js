import mongoose from "mongoose";
import { Student } from "../models/Student.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";

function ensureStudentAccessOrThrow(student, user) {
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  if (user.role === "health_provider") {
    return;
  }

  if (user.role === "parent" && student.parentUser?.toString() === user.id) {
    return;
  }

  if (user.role === "student" && student.studentUser?.toString() === user.id) {
    return;
  }

  throw new AppError("Forbidden", 403);
}

export const createStudent = asyncHandler(async (req, res) => {
  const {
    admissionNumber,
    fullName,
    studentIdNumber,
    upiNumber,
    stream,
    dateOfBirth,
    medicalIssues,
    parentAccount,
    studentAccount
  } = req.body;

  if (parentAccount.email.toLowerCase() === studentAccount.email.toLowerCase()) {
    throw new AppError("Parent and student emails must be different", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingStudent = await Student.findOne({ admissionNumber }).session(session);
    if (existingStudent) {
      throw new AppError("admissionNumber already exists", 409);
    }

    const emails = [parentAccount.email.toLowerCase(), studentAccount.email.toLowerCase()];
    const existingUsers = await User.find({ email: { $in: emails } }).session(session);
    if (existingUsers.length > 0) {
      throw new AppError("Parent or student email already exists", 409);
    }

    const parentPasswordHash = await User.hashPassword(parentAccount.password);
    const studentPasswordHash = await User.hashPassword(studentAccount.password);

    const [parentUser] = await User.create(
      [
        {
          fullName: parentAccount.fullName,
          email: parentAccount.email,
          phoneNumber: parentAccount.phoneNumber,
          nationalId: parentAccount.nationalId,
          passwordHash: parentPasswordHash,
          role: "parent"
        }
      ],
      { session }
    );

    const [studentUser] = await User.create(
      [
        {
          fullName: studentAccount.fullName,
          email: studentAccount.email,
          phoneNumber: studentAccount.phoneNumber,
          passwordHash: studentPasswordHash,
          role: "student"
        }
      ],
      { session }
    );

    const [student] = await Student.create(
      [
        {
          admissionNumber,
          fullName,
          studentIdNumber,
          upiNumber,
          stream,
          dateOfBirth,
          medicalIssues,
          parentUser: parentUser._id,
          studentUser: studentUser._id,
          parentEmail: parentUser.email,
          studentEmail: studentUser.email,
          createdBy: req.user.id
        }
      ],
      { session }
    );

    await Notification.create(
      [
        {
          user: parentUser._id,
          student: student._id,
          title: "Child Registered in WeCare Hub",
          message: `${student.fullName} has been registered on WeCare Hub. You can now log in and monitor health records.`,
          type: "success"
        }
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(student);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const listStudents = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === "health_provider") {
    // healthcare provider can view all students
  } else if (req.user.role === "parent") {
    query.parentUser = req.user.id;
  } else if (req.user.role === "student") {
    query.studentUser = req.user.id;
  } else {
    throw new AppError("Forbidden", 403);
  }

  const students = await Student.find(query).sort({ createdAt: -1 });
  res.status(200).json(students);
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  ensureStudentAccessOrThrow(student, req.user);
  res.status(200).json(student);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const existing = await Student.findById(req.params.id);
  ensureStudentAccessOrThrow(existing, req.user);

  if (req.user.role !== "health_provider") {
    throw new AppError("Forbidden", 403);
  }

  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  res.status(200).json(student);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  if (req.user.role !== "health_provider") {
    throw new AppError("Forbidden", 403);
  }

  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    throw new AppError("Student not found", 404);
  }
  res.status(204).send();
});
