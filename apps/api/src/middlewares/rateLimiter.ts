import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { Request, Response } from 'express';
import { sendError } from '../utils/response';

// Global reasonable default for unmatched keys (e.g. 1000 reqs per hour)
const DEFAULT_RATE_LIMIT = 1000;

export const appRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  standardHeaders: true,
  legacyHeaders: false,
  
  // Use Redis store to support horizontal scaling
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      return (await (redisClient.call as any)(...args)) as any;
    },
    prefix: 'rl:app:',
  }),

  // Key generator uses the authenticated app key ID
  keyGenerator: (req: Request) => {
    return req.appAuth?.id || req.ip || 'unknown';
  },

  // Dynamic limit based on API Key configuration
  limit: async (req: Request | any) => {
    if (req.appAuth && req.appAuth.rate_limit_per_hour !== null) {
      return req.appAuth.rate_limit_per_hour;
    }
    return DEFAULT_RATE_LIMIT;
  },

  handler: (req: Request, res: Response) => {
    return sendError(res, 'Rate limit exceeded. Please try again later.', [], 429);
  },
});
