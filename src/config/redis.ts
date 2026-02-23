import Redis from "ioredis";
import config from "./config";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true, // don't connect until first command
  enableOfflineQueue: false, // fail fast instead of queuing when Redis is down
  maxRetriesPerRequest: 1,
});

if (config.redisEnabled) {
  redis.connect().catch((err) => {
    console.warn("[Redis] Could not connect, caching disabled:", err.message);
  });
}

export default redis;
