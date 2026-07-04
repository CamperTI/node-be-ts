import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const status = err.status || 500;
  logger.error(`[errorHandler] ${err.message}`, { stack: err.stack });
  res
    .status(status)
    .json({ success: false, message: err.message || "Internal Server Error" });
};
