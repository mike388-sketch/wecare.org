import mongoose from "mongoose";

const healthRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    recordDate: { type: Date, default: Date.now },
    symptoms: [{ type: String, trim: true }],
    diagnosis: { type: String, trim: true },
    notes: { type: String, trim: true },
    actionTaken: { type: String, trim: true },
    followUpDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);
