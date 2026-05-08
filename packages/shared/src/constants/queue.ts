export const QUEUE_NAME_EMAIL_DELIVERY = 'email-delivery';

export const QUEUE_DEFAULT_JOB_OPTIONS = {
  attempts: 4,
  backoff: {
    type: 'exponential',
    delay: 30000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
