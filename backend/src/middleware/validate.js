import { AppError } from "../utils/appError.js";

export function validateBody(validator) {
  return (req, _res, next) => {
    const errors = validator(req.body);
    if (errors.length > 0) {
      return next(new AppError(errors.join("; "), 400));
    }
    return next();
  };
}

export function validateObjectIdParam(paramName) {
  return (req, _res, next) => {
    const value = req.params[paramName];
    if (!/^[a-f\d]{24}$/i.test(value)) {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }
    return next();
  };
}
