import redis from '../config/redis';
import { ICacheService } from './ICacheService';
import config from '../config/config';

export class RedisCacheService implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    if (!config.redisEnabled) return null;
    try {
      return await redis.get<T>(key);
    } catch (err) {
      console.error(`[RedisCacheService][get] Redis not available:`, err);
      return null;
    }
  }
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!config.redisEnabled) return;
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      console.error(`[RedisCacheService][set] Redis not available:`, err);
    }
  }
  async del(key: string): Promise<void> {
    if (!config.redisEnabled) return;
    try {
      await redis.del(key);
    } catch (err) {
      console.error(`[RedisCacheService][del] Redis not available:`, err);
    }
  }
}
