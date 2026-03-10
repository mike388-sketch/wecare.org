import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function buildTransport() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = buildTransport();
  if (!transporter) {
    throw new Error("Email service is not configured");
  }

  const fromAddress = env.smtpFrom || env.smtpUser;
  const subject = "Reset your WECARE Hub password";
  const greeting = name ? `Hello ${name},` : "Hello,";
  const text = `${greeting}\n\nWe received a request to reset your WECARE Hub password.\n\nReset link: ${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nThanks,\nWECARE Hub`;

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text
  });
}
