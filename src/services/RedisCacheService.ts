import redis from '../config/redis';
import { ICacheService } from './ICacheService';
import config from '../config/config';

export class RedisCacheService implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    if (!config.redisEnabled) return null;
    try {
      const cached = await redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (err) {
      console.error(`[RedisCacheService][get] Redis not available:`, err);
      return null;
    }
  }
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!config.redisEnabled) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
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
