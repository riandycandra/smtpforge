import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis';

export const EMAIL_QUEUE_NAME = 'email_delivery_queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 4,
    backoff: {
      type: 'exponential',
      delay: 30000, // 30s, then 5m (roughly exponential if calculated or managed via custom strategy, but standard exponential uses 2^n * delay)
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
