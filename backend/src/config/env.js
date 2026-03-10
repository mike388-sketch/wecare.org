import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGODB_URI", "JWT_SECRET"];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  backendUrl: process.env.BACKEND_URL || `http://localhost:${Number(process.env.PORT) || 5000}`,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  sessionSecret: process.env.SESSION_SECRET || "wecare_dev_session_secret_change_me",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5500",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID || "",
  microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleTeamId: process.env.APPLE_TEAM_ID || "",
  appleKeyId: process.env.APPLE_KEY_ID || "",
  applePrivateKey: process.env.APPLE_PRIVATE_KEY || ""
};
