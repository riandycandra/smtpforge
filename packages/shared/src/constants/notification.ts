export const NOTIFICATION_TYPE = {
  TEAMS: 'teams',
  TELEGRAM: 'telegram',
  SLACK: 'slack',
  EMAIL: 'email',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

export const WORKER_STATUS = {
  UP: 'up',
  DOWN: 'down',
  UNKNOWN: 'unknown',
} as const;

export type WorkerStatus = typeof WORKER_STATUS[keyof typeof WORKER_STATUS];
