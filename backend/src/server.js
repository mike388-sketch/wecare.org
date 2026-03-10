import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";

const DB_RETRY_BASE_MS = 5000;
const DB_RETRY_MAX_MS = 30000;

function getRetryDelay(attempt) {
  return Math.min(DB_RETRY_MAX_MS, DB_RETRY_BASE_MS * attempt);
}

async function connectDbWithRetry(attempt = 1) {
  try {
    await connectDb();
  } catch (error) {
    const retryDelay = getRetryDelay(attempt);
    console.error(
      `MongoDB connection failed (attempt ${attempt}). Retrying in ${Math.round(retryDelay / 1000)}s.`
    );
    console.error(error);

    setTimeout(() => {
      void connectDbWithRetry(attempt + 1);
    }, retryDelay);
  }
}

function startServer() {
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
    void connectDbWithRetry();
  });
}

startServer();