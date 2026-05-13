import Redis from 'ioredis';
import { env } from './env';

export const redisConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null, // Required by BullMQ
};

export const redisClient = new Redis(redisConnectionOptions);

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});
