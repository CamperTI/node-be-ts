import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export const requestTimeout = (timeoutMs: number) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`[requestTimeout] Request exceeded ${timeoutMs}ms`);
        res.status(503).json({ success: false, message: "Request timed out" });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
};
