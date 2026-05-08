import { Queue } from 'bullmq';
import { redisConnectionOptions } from './redis';
import { QUEUE_NAME_EMAIL_DELIVERY, QUEUE_DEFAULT_JOB_OPTIONS } from '@mailer/shared';

export const EMAIL_QUEUE_NAME = QUEUE_NAME_EMAIL_DELIVERY;

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    ...QUEUE_DEFAULT_JOB_OPTIONS,
  },
});
