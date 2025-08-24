import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  redisEnabled: boolean;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // redisEnabled: process.env.REDIS_ENABLED !== 'false', // Default true, set REDIS_ENABLED=false to disable
  redisEnabled: false,
};

export default config;
