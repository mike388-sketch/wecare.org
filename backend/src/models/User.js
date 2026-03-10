import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const roles = ["health_provider", "parent", "student", "admin", "doctor", "nurse", "teacher"];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    role: {
      type: String,
      enum: roles,
      default: "parent"
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
};

export const User = mongoose.model("User", userSchema);


