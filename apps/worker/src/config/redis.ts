import Redis from 'ioredis';
import { env } from './env';

export const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisConnectionOptions);

redisClient.on('error', (err) => {
  console.error('Redis connection error in Worker:', err);
});
