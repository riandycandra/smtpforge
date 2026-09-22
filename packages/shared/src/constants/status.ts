export const EMAIL_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  RETRYING: 'retrying',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];

export const SMTP_HEALTH_STATUS = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  UNTESTED: 'untested',
} as const;

export type SmtpHealthStatus = typeof SMTP_HEALTH_STATUS[keyof typeof SMTP_HEALTH_STATUS];
