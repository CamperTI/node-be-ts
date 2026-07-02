import redis from "../config/redis";
import { ICacheService } from "./ICacheService";
import config from "../config/config";
import logger from "../config/logger";

export class RedisCacheService implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    if (!config.redisEnabled) return null;
    try {
      const value = await redis.get<T>(key);
      logger.debug(`[cache] get "${key}" → ${value !== null ? "HIT" : "MISS"}`);
      return value;
    } catch (err) {
      logger.error(`[cache] get "${key}" failed`, { err });
      return null;
    }
  }
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!config.redisEnabled) return;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      logger.debug(`[cache] set "${key}" ttl=${ttlSeconds}s`);
    } catch (err) {
      logger.error(`[cache] set "${key}" failed`, { err });
    }
  }
  async del(key: string): Promise<void> {
    if (!config.redisEnabled) return;
    try {
      await redis.del(key);
      logger.debug(`[cache] del "${key}"`);
    } catch (err) {
      logger.error(`[cache] del "${key}" failed`, { err });
    }
  }
}

export const cacheService = new RedisCacheService();
