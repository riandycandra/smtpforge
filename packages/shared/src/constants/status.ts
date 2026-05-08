export const EMAIL_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  RETRYING: 'retrying',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];
