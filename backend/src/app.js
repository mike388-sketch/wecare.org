import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import session from "express-session";
import mongoose from "mongoose";
import routes from "./routes/index.js";
import passport from "./config/passport.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandlers.js";

const app = express();
const allowedOrigins = [env.frontendUrl, "http://localhost:5500", "http://127.0.0.1:5500"];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.nodeEnv === "production",
      sameSite: "lax"
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "WECARE backend is running",
    healthCheck: "/api/health"
  });
});

app.get("/api/health", (_req, res) => {
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const database = dbStateMap[mongoose.connection.readyState] || "unknown";

  res.status(200).json({ status: "ok", database });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;