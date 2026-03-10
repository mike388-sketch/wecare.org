import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    admissionNumber: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    studentIdNumber: { type: String, required: true, trim: true },
    upiNumber: { type: String, required: true, trim: true },
    stream: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    medicalIssues: [{ type: String, trim: true }],
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    studentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    parentEmail: { type: String, trim: true, lowercase: true },
    studentEmail: { type: String, trim: true, lowercase: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
