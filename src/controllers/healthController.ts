import { Request, Response } from "express";
import logger from "../config/logger";
import redis from "../config/redis";
import { getBrowserStatus } from "../config/puppeteer";

export const getHealth = async (_req: Request, res: Response) => {
  let redisStatus: "ok" | "error" = "error";
  try {
    await redis.ping();
    redisStatus = "ok";
  } catch {
    logger.warn("[health] Redis ping failed");
  }

  const browserStatus = getBrowserStatus();
  const healthy = redisStatus === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies: {
      redis: redisStatus,
      browser: browserStatus,
    },
  });
};
