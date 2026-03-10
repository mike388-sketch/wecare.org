import mongoose from "mongoose";

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join("; ");

    return res.status(400).json({ message });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${error.path}` });
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ message });
}
